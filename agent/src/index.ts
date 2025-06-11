console.log("[DEBUG] Top of agent/src/index.ts");
console.log("=== BOOTING AGENT SRC INDEX.TS ===");

import dotenv from "dotenv";
dotenv.config();
console.log("[DEBUG] After dotenv.config()");
import { DirectClient } from "../../packages/client-direct/dist/index.js";
import {
    type Adapter,
    AgentRuntime,
    CacheManager,
    CacheStore,
    type Plugin,
    type Character,
    type ClientInstance,
    DbCacheAdapter,
    elizaLogger,
    FsCacheAdapter,
    type IAgentRuntime,
    type IDatabaseAdapter,
    type IDatabaseCacheAdapter,
    type ICacheAdapter,
    ModelProviderName,
    parseBooleanFromText,
    settings,
    stringToUuid,
    validateCharacterConfig,
} from "../../packages/core/dist/index.js";
import { defaultCharacter } from "./defaultCharacter.js";

import { bootstrapPlugin } from "../../packages/plugin-bootstrap/dist/index.js";
import JSON5 from 'json5';

import fs from "fs";
import net from "net";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

export const wait = (minTime = 1000, maxTime = 3000) => {
    const waitTime =
        Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
    return new Promise((resolve) => setTimeout(resolve, waitTime));
};

const logFetch = async (url: string, options: any) => {
    elizaLogger.debug(`Fetching ${url}`);
    // Disabled to avoid disclosure of sensitive information such as API keys
    // elizaLogger.debug(JSON.stringify(options, null, 2));
    return fetch(url, options);
};

export function parseArguments(): {
    character?: string;
    characters?: string;
} {
    try {
        const args = yargs(process.argv.slice(3))
            .option("character", {
                type: "string",
                description: "Path to the character JSON file",
            })
            .option("characters", {
                type: "string",
                description:
                    "Comma separated list of paths to character JSON files",
            })
            .parseSync();
        console.log("[DEBUG] After argument parsing", args);
        return args;
    } catch (error) {
        console.error("Error parsing arguments:", error);
        return {};
    }
}

function tryLoadFile(filePath: string): string | null {
    try {
        return fs.readFileSync(filePath, "utf8");
    } catch (e) {
        return null;
    }
}
function mergeCharacters(base: Character, child: Character): Character {
    const mergeObjects = (baseObj: any, childObj: any) => {
        const result: any = {};
        const keys = new Set([
            ...Object.keys(baseObj || {}),
            ...Object.keys(childObj || {}),
        ]);
        keys.forEach((key) => {
            if (
                typeof baseObj[key] === "object" &&
                typeof childObj[key] === "object" &&
                !Array.isArray(baseObj[key]) &&
                !Array.isArray(childObj[key])
            ) {
                result[key] = mergeObjects(baseObj[key], childObj[key]);
            } else if (
                Array.isArray(baseObj[key]) ||
                Array.isArray(childObj[key])
            ) {
                result[key] = [
                    ...(baseObj[key] || []),
                    ...(childObj[key] || []),
                ];
            } else {
                result[key] =
                    childObj[key] !== undefined ? childObj[key] : baseObj[key];
            }
        });
        return result;
    };
    return mergeObjects(base, child);
}
/* function isAllStrings(arr: unknown[]): boolean {
    return Array.isArray(arr) && arr.every((item) => typeof item === "string");
}
export async function loadCharacterFromOnchain(): Promise<Character[]> {
    const jsonText = onchainJson;

    console.log("JSON:", jsonText);
    if (!jsonText) return [];
    const loadedCharacters = [];
    try {
        const character = JSON5.parse(jsonText);
        validateCharacterConfig(character);

        // .id isn't really valid
        const characterId = character.id || character.name;
        const characterPrefix = `CHARACTER.${characterId
            .toUpperCase()
            .replace(/ /g, "_")}.`;

        const characterSettings = Object.entries(process.env)
            .filter(([key]) => key.startsWith(characterPrefix))
            .reduce((settings, [key, value]) => {
                const settingKey = key.slice(characterPrefix.length);
                settings[settingKey] = value;
                return settings;
            }, {});

        if (Object.keys(characterSettings).length > 0) {
            character.settings = character.settings || {};
            character.settings.secrets = {
                ...characterSettings,
                ...character.settings.secrets,
            };
        }

        // Handle plugins
        if (isAllStrings(character.plugins)) {
            elizaLogger.info("Plugins are: ", character.plugins);
            const importedPlugins = await Promise.all(
                character.plugins.map(async (plugin) => {
                    const importedPlugin = await import(plugin);
                    return importedPlugin.default;
                })
            );
            character.plugins = importedPlugins;
        }

        loadedCharacters.push(character);
        elizaLogger.info(
            `Successfully loaded character from: ${process.env.IQ_WALLET_ADDRESS}`
        );
        return loadedCharacters;
    } catch (e) {
        elizaLogger.error(
            `Error parsing character from ${process.env.IQ_WALLET_ADDRESS}: ${e}`
        );
        process.exit(1);
    }
} */

async function loadCharactersFromUrl(url: string): Promise<Character[]> {
    try {
        const response = await fetch(url);
        const responseJson = await response.json();

        let characters: Character[] = [];
        if (Array.isArray(responseJson)) {
            characters = await Promise.all(
                responseJson.map((character) => jsonToCharacter(url, character))
            );
        } else {
            const character = await jsonToCharacter(url, responseJson);
            characters.push(character);
        }
        return characters;
    } catch (e) {
        console.error(`Error loading character(s) from ${url}: `, e);
        process.exit(1);
    }
}

async function jsonToCharacter(
    filePath: string,
    character: any
): Promise<Character> {
    validateCharacterConfig(character);

    // .id isn't really valid
    const characterId = character.id || character.name;
    const characterPrefix = `CHARACTER.${characterId
        .toUpperCase()
        .replace(/ /g, "_")}.`;
    const characterSettings = Object.entries(process.env)
        .filter(([key]) => key.startsWith(characterPrefix))
        .reduce((settings, [key, value]) => {
            const settingKey = key.slice(characterPrefix.length);
            return { ...settings, [settingKey]: value };
        }, {});
    if (Object.keys(characterSettings).length > 0) {
        character.settings = character.settings || {};
        character.settings.secrets = {
            ...characterSettings,
            ...character.settings.secrets,
        };
    }
    // Handle plugins
    character.plugins = await handlePluginImporting(character.plugins);
    elizaLogger.info(character.name, 'loaded plugins:', "[\n    " + character.plugins.map(p => `"${p.npmName}"`).join(", \n    ") + "\n]");

    // Handle Post Processors plugins
    if (character.postProcessors?.length > 0) {
        elizaLogger.info(character.name, 'loading postProcessors', character.postProcessors);
        character.postProcessors = await handlePluginImporting(character.postProcessors);
    }

    // Handle extends
    if (character.extends) {
        elizaLogger.info(
            `Merging  ${character.name} character with parent characters`
        );
        for (const extendPath of character.extends) {
            const baseCharacter = await loadCharacter(
                path.resolve(path.dirname(filePath), extendPath)
            );
            character = mergeCharacters(baseCharacter, character);
            elizaLogger.info(
                `Merged ${character.name} with ${baseCharacter.name}`
            );
        }
    }
    console.log("[DEBUG] After character loading", character?.name);
    return character;
}

async function loadCharacter(filePath: string): Promise<Character> {
    const content = tryLoadFile(filePath);
    if (!content) {
        throw new Error(`Character file not found: ${filePath}`);
    }
    const character = JSON5.parse(content);
    return jsonToCharacter(filePath, character);
}

async function loadCharacterTryPath(characterPath: string): Promise<Character> {
    let content: string | null = null;
    let resolvedPath = "";

    // Try different path resolutions in order
    const pathsToTry = [
        characterPath, // exact path as specified
        path.resolve(process.cwd(), characterPath), // relative to cwd
        path.resolve(process.cwd(), "agent", characterPath), // Add this
        path.resolve(__dirname, characterPath), // relative to current script
        path.resolve(__dirname, "characters", path.basename(characterPath)), // relative to agent/characters
        path.resolve(__dirname, "../characters", path.basename(characterPath)), // relative to characters dir from agent
        path.resolve(
            __dirname,
            "../../characters",
            path.basename(characterPath)
        ), // relative to project root characters dir
    ];

    elizaLogger.debug(
        "Trying paths:",
        pathsToTry.map((p) => ({
            path: p,
            exists: fs.existsSync(p),
        }))
    );

    for (const tryPath of pathsToTry) {
        content = tryLoadFile(tryPath);
        if (content !== null) {
            resolvedPath = tryPath;
            break;
        }
    }

    if (content === null) {
        elizaLogger.error(
            `Error loading character from ${characterPath}: File not found in any of the expected locations`
        );
        elizaLogger.error("Tried the following paths:");
        pathsToTry.forEach((p) => elizaLogger.error(` - ${p}`));
        throw new Error(
            `Error loading character from ${characterPath}: File not found in any of the expected locations`
        );
    }
    try {
        const character: Character = await loadCharacter(resolvedPath);
        elizaLogger.success(`Successfully loaded character from: ${resolvedPath}`);
        return character;
    } catch (e) {
        console.error(`Error parsing character from ${resolvedPath}: `, e);
        throw new Error(`Error parsing character from ${resolvedPath}: ${e}`);
    }
}

function commaSeparatedStringToArray(commaSeparated: string): string[] {
    return commaSeparated?.split(",").map((value) => value.trim());
}

function hasValidRemoteUrls(): boolean {
    return !!(process.env.REMOTE_CHARACTER_URLS && process.env.REMOTE_CHARACTER_URLS.trim());
}

async function readCharactersFromStorage(
    characterPaths: string[]
): Promise<string[]> {
    try {
        const uploadDir = path.join(process.cwd(), "data", "characters");
        await fs.promises.mkdir(uploadDir, { recursive: true });
        const fileNames = await fs.promises.readdir(uploadDir);
        fileNames.forEach((fileName) => {
            characterPaths.push(path.join(uploadDir, fileName));
        });
    } catch (err) {
        elizaLogger.error(`Error reading directory: ${err.message}`);
    }

    return characterPaths;
}

export async function loadCharacters(
    charactersArg: string
): Promise<Character[]> {
    let characterPaths = commaSeparatedStringToArray(charactersArg);

    if (process.env.USE_CHARACTER_STORAGE === "true") {
        characterPaths = await readCharactersFromStorage(characterPaths);
    }

    const loadedCharacters: Character[] = [];

    if (characterPaths?.length > 0) {
        for (const characterPath of characterPaths) {
            try {
                const character: Character = await loadCharacterTryPath(
                    characterPath
                );
                loadedCharacters.push(character);
            } catch (e) {
                elizaLogger.error(`Failed to load character from ${characterPath}:`, e);
                // Continue to next character instead of exiting
            }
        }
    }

    if (hasValidRemoteUrls()) {
        elizaLogger.info("Loading characters from remote URLs");
        const characterUrls = commaSeparatedStringToArray(
            process.env.REMOTE_CHARACTER_URLS
        );
        for (const characterUrl of characterUrls) {
            try {
                const characters = await loadCharactersFromUrl(characterUrl);
                loadedCharacters.push(...characters);
            } catch (e) {
                elizaLogger.error(`Failed to load character from URL ${characterUrl}:`, e);
                // Continue to next URL instead of exiting
            }
        }
    }

    if (loadedCharacters.length === 0) {
        elizaLogger.info("No characters found, using default character");
        loadedCharacters.push(defaultCharacter);
    }

    return loadedCharacters;
}

async function handlePluginImporting(plugins: string[]) {
    if (plugins.length > 0) {
        // this logging should happen before calling, so we can include important context
        //elizaLogger.info("Plugins are: ", plugins);
        const importedPlugins = await Promise.all(
            plugins.map(async (plugin) => {
                try {
                    const importedPlugin: any = await import(plugin);
                    const functionName =
                        plugin
                            .replace("@elizaos/plugin-", "")
                            .replace("@elizaos-plugins/plugin-", "")
                            .replace(/-./g, (x) => x[1].toUpperCase()) +
                        "Plugin"; // Assumes plugin function is camelCased with Plugin suffix
                    if (!importedPlugin[functionName] && !importedPlugin.default) {
                      elizaLogger.warn(plugin, 'does not have an default export or', functionName)
                    }
                    return {...(
                        importedPlugin.default || importedPlugin[functionName]
                    ), npmName: plugin };
                } catch (importError) {
                    console.error(
                        `Failed to import plugin: ${plugin}`,
                        importError
                    );
                    return false; // Return null for failed imports
                }
            })
        )
        // remove plugins that failed to load, so agent can try to start
        return importedPlugins.filter(p => !!p);
    } else {
        return [];
    }
}

export function getTokenForProvider(
    provider: ModelProviderName,
    character: Character
): string | undefined {
    switch (provider) {
        // no key needed for llama_local, ollama, lmstudio, gaianet or bedrock
        case ModelProviderName.LLAMALOCAL:
            return "";
        case ModelProviderName.OLLAMA:
            return "";
        case ModelProviderName.LMSTUDIO:
            return "";
        case ModelProviderName.GAIANET:
            return (
                character.settings?.secrets?.GAIA_API_KEY ||
                settings.GAIA_API_KEY
            );
        case ModelProviderName.BEDROCK:
            return "";
        case ModelProviderName.OPENAI:
            return (
                character.settings?.secrets?.OPENAI_API_KEY ||
                settings.OPENAI_API_KEY
            );
        case ModelProviderName.ETERNALAI:
            return (
                character.settings?.secrets?.ETERNALAI_API_KEY ||
                settings.ETERNALAI_API_KEY
            );
        case ModelProviderName.NINETEEN_AI:
            return (
                character.settings?.secrets?.NINETEEN_AI_API_KEY ||
                settings.NINETEEN_AI_API_KEY
            );
        case ModelProviderName.LLAMACLOUD:
        case ModelProviderName.TOGETHER:
            return (
                character.settings?.secrets?.LLAMACLOUD_API_KEY ||
                settings.LLAMACLOUD_API_KEY ||
                character.settings?.secrets?.TOGETHER_API_KEY ||
                settings.TOGETHER_API_KEY ||
                character.settings?.secrets?.OPENAI_API_KEY ||
                settings.OPENAI_API_KEY
            );
        case ModelProviderName.CLAUDE_VERTEX:
        case ModelProviderName.ANTHROPIC:
            return (
                character.settings?.secrets?.ANTHROPIC_API_KEY ||
                character.settings?.secrets?.CLAUDE_API_KEY ||
                settings.ANTHROPIC_API_KEY ||
                settings.CLAUDE_API_KEY
            );
        case ModelProviderName.REDPILL:
            return (
                character.settings?.secrets?.REDPILL_API_KEY ||
                settings.REDPILL_API_KEY
            );
        case ModelProviderName.OPENROUTER:
            return (
                character.settings?.secrets?.OPENROUTER_API_KEY ||
                settings.OPENROUTER_API_KEY
            );
        case ModelProviderName.GROK:
            return (
                character.settings?.secrets?.GROK_API_KEY ||
                settings.GROK_API_KEY
            );
        case ModelProviderName.HEURIST:
            return (
                character.settings?.secrets?.HEURIST_API_KEY ||
                settings.HEURIST_API_KEY
            );
        case ModelProviderName.GROQ:
            return (
                character.settings?.secrets?.GROQ_API_KEY ||
                settings.GROQ_API_KEY
            );
        case ModelProviderName.GALADRIEL:
            return (
                character.settings?.secrets?.GALADRIEL_API_KEY ||
                settings.GALADRIEL_API_KEY
            );
        case ModelProviderName.FAL:
            return (
                character.settings?.secrets?.FAL_API_KEY || settings.FAL_API_KEY
            );
        case ModelProviderName.ALI_BAILIAN:
            return (
                character.settings?.secrets?.ALI_BAILIAN_API_KEY ||
                settings.ALI_BAILIAN_API_KEY
            );
        case ModelProviderName.VOLENGINE:
            return (
                character.settings?.secrets?.VOLENGINE_API_KEY ||
                settings.VOLENGINE_API_KEY
            );
        case ModelProviderName.NANOGPT:
            return (
                character.settings?.secrets?.NANOGPT_API_KEY ||
                settings.NANOGPT_API_KEY
            );
        case ModelProviderName.HYPERBOLIC:
            return (
                character.settings?.secrets?.HYPERBOLIC_API_KEY ||
                settings.HYPERBOLIC_API_KEY
            );

        case ModelProviderName.VENICE:
            return (
                character.settings?.secrets?.VENICE_API_KEY ||
                settings.VENICE_API_KEY
            );
        case ModelProviderName.ATOMA:
            return (
                character.settings?.secrets?.ATOMASDK_BEARER_AUTH ||
                settings.ATOMASDK_BEARER_AUTH
            );
        case ModelProviderName.NVIDIA:
            return (
                character.settings?.secrets?.NVIDIA_API_KEY ||
                settings.NVIDIA_API_KEY
            );
        case ModelProviderName.AKASH_CHAT_API:
            return (
                character.settings?.secrets?.AKASH_CHAT_API_KEY ||
                settings.AKASH_CHAT_API_KEY
            );
        case ModelProviderName.GOOGLE:
            return (
                character.settings?.secrets?.GOOGLE_GENERATIVE_AI_API_KEY ||
                settings.GOOGLE_GENERATIVE_AI_API_KEY
            );
        case ModelProviderName.MISTRAL:
            return (
                character.settings?.secrets?.MISTRAL_API_KEY ||
                settings.MISTRAL_API_KEY
            );
        case ModelProviderName.LETZAI:
            return (
                character.settings?.secrets?.LETZAI_API_KEY ||
                settings.LETZAI_API_KEY
            );
        case ModelProviderName.INFERA:
            return (
                character.settings?.secrets?.INFERA_API_KEY ||
                settings.INFERA_API_KEY
            );
        case ModelProviderName.DEEPSEEK:
            return (
                character.settings?.secrets?.DEEPSEEK_API_KEY ||
                settings.DEEPSEEK_API_KEY
            );
        case ModelProviderName.LIVEPEER:
            return (
                character.settings?.secrets?.LIVEPEER_GATEWAY_URL ||
                settings.LIVEPEER_GATEWAY_URL
            );
        case ModelProviderName.SECRETAI:
            return (
                character.settings?.secrets?.SECRET_AI_API_KEY ||
                settings.SECRET_AI_API_KEY
            );
        case ModelProviderName.NEARAI:
            try {
                const config = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.nearai/config.json'), 'utf8'));
                return JSON.stringify(config?.auth);
            } catch (e) {
                elizaLogger.warn(`Error loading NEAR AI config: ${e}`);
            }
            return (
                character.settings?.secrets?.NEARAI_API_KEY ||
                settings.NEARAI_API_KEY
            );

        default:
            const errorMessage = `Failed to get token - unsupported model provider: ${provider}`;
            elizaLogger.error(errorMessage);
            throw new Error(errorMessage);
    }
}

// also adds plugins from character file into the runtime
export async function initializeClients(
    character: Character,
    runtime: IAgentRuntime
) {
    // each client can only register once
    // and if we want two we can explicitly support it
    const clients: ClientInstance[] = [];
    // const clientTypes = clients.map((c) => c.name);
    // elizaLogger.log("initializeClients", clientTypes, "for", character.name);

    if (character.plugins?.length > 0) {
        for (const plugin of character.plugins) {
            if (plugin.clients) {
                for (const client of plugin.clients) {
                    const startedClient = await client.start(runtime);
                    elizaLogger.debug(
                        `Initializing client: ${client.name}`
                    );
                    clients.push(startedClient);
                }
            }
        }
    }

    return clients;
}

export async function createAgent(
    character: Character,
    token: string
): Promise<AgentRuntime> {
    elizaLogger.log(`Creating runtime for character ${character.name}`);
    return new AgentRuntime({
        token,
        modelProvider: character.modelProvider,
        evaluators: [],
        character,
        // character.plugins are handled when clients are added
        plugins: [
            bootstrapPlugin,
        ]
            .flat()
            .filter(Boolean),
        providers: [],
        managers: [],
        fetch: logFetch,
        // verifiableInferenceAdapter,
    });
}

// Define a type-safe adapter registry
const cacheAdapters: Record<string, (opts: {
    baseDir?: string;
    db?: IDatabaseAdapter & IDatabaseCacheAdapter;
    character: Character;
}) => ICacheAdapter> = {
    filesystem: ({ baseDir, character }) => {
        const cacheDir = path.resolve(baseDir || process.env.CACHE_DIR || process.cwd(), "cache");
        console.log("[CACHE] Creating FsCacheAdapter with dir:", cacheDir);
        return new FsCacheAdapter(cacheDir);
    },
    database: ({ db, character }) => {
        console.log("[CACHE][DEBUG] database adapter factory called. db:", db);
        if (!db) {
            throw new Error("Database adapter required for DATABASE cache store");
        }
        console.log("[CACHE] Creating DbCacheAdapter with db:", db.constructor.name);
        return new DbCacheAdapter(db, character.id);
    }
} as const;

function initializeCache(
    cacheStore: string,
    character: Character,
    baseDir?: string,
    db?: IDatabaseAdapter & IDatabaseCacheAdapter
): CacheManager {
    console.error("=== ENTERED initializeCache ===");
    // Normalize the lookup key
    const lookupKey = cacheStore.trim().toLowerCase();
    console.log("[CACHE][DEBUG] initializeCache called with:", {
        cacheStore,
        lookupKey,
        hasDb: !!db,
        dbType: db?.constructor?.name,
        baseDir,
        characterId: character.id,
        cacheAdapterKeys: Object.keys(cacheAdapters)
    });
    
    // Look up factory
    const factory = cacheAdapters[lookupKey];
    if (!factory) {
        console.warn(`[CACHE] Invalid cache store: "${lookupKey}". Available: ${Object.keys(cacheAdapters).join(", ")}`);
        console.log("[CACHE] Falling back to filesystem cache");
        return new CacheManager(cacheAdapters["filesystem"]({ baseDir, character }));
    }

    try {
        // Create adapter - only pass db if using database cache store
        console.log("[CACHE][DEBUG] Creating adapter with factory:", factory.name, "db:", db);
        const adapter = factory({ 
            baseDir, 
            ...(lookupKey === 'database' ? { db } : {}), 
            character 
        });
        console.log("[CACHE][DEBUG] Adapter created successfully:", adapter.constructor.name);
        return new CacheManager(adapter);
    } catch (err) {
        console.warn("[CACHE] Cache initialization failed, falling back to filesystem:", err.message);
        return new CacheManager(cacheAdapters["filesystem"]({ baseDir, character }));
    }
}

async function findDatabaseAdapter(runtime: IAgentRuntime): Promise<IDatabaseAdapter & IDatabaseCacheAdapter | null> {
  console.log("🔍 [DB-ADAPTER] >> findDatabaseAdapter called");
  const { character } = runtime;
  let adapter: Adapter | undefined;
  
  try {
    // COMPREHENSIVE DEBUGGING: Log everything about plugins
    console.log("🔍 [DB-ADAPTER] === COMPREHENSIVE PLUGIN ANALYSIS ===");
    console.log("🔍 [DB-ADAPTER] character.plugins type:", typeof character.plugins);
    console.log("🔍 [DB-ADAPTER] character.plugins:", JSON.stringify(character.plugins, null, 2));
    console.log("🔍 [DB-ADAPTER] Total plugins in character:", character.plugins?.length || 0);
    
    // Handle case where plugins might be undefined or not an array
    if (!character.plugins) {
      console.log("🔍 [DB-ADAPTER] No plugins found, using default SQLite");
      const sqliteAdapterPlugin = await import('@elizaos-plugins/adapter-sqlite');
      const sqliteAdapterPluginDefault = sqliteAdapterPlugin.default;
      adapter = sqliteAdapterPluginDefault.adapters[0];
      const adapterInterface = await adapter?.init(runtime);
      console.log("🔍 [DB-ADAPTER] << Returning default SQLite adapter");
      return adapterInterface;
    }

    if (!Array.isArray(character.plugins)) {
      console.error("🔍 [DB-ADAPTER] ERROR: character.plugins is not an array:", typeof character.plugins);
      throw new Error("Invalid plugins configuration: plugins must be an array");
    }

    // Analyze each plugin in detail
    const pluginAnalysis: any[] = [];
    character.plugins.forEach((plugin, index) => {
      const analysis = {
        index,
        plugin,
        type: typeof plugin,
        isString: typeof plugin === 'string',
        isObject: typeof plugin === 'object',
        hasAdaptersProperty: typeof plugin === 'object' && 'adapters' in plugin,
        adaptersValue: typeof plugin === 'object' ? plugin.adapters : undefined,
        adaptersIsArray: typeof plugin === 'object' && Array.isArray(plugin.adapters),
        adaptersLength: typeof plugin === 'object' && Array.isArray(plugin.adapters) ? plugin.adapters.length : 0,
        hasValidAdapters: typeof plugin === 'object' && Array.isArray(plugin.adapters) && plugin.adapters.length > 0
      };
      pluginAnalysis.push(analysis);
      console.log(`🔍 [DB-ADAPTER] Plugin ${index} analysis:`, JSON.stringify(analysis, null, 2));
    });

    // BULLETPROOF FILTERING: Only count plugins that are objects with non-empty adapters arrays
    const pluginsWithAdapters = character.plugins.filter((plugin) => {
      const hasValidAdapters = (
        plugin !== null &&
        typeof plugin === 'object' &&
        'adapters' in plugin &&
        Array.isArray(plugin.adapters) &&
        plugin.adapters.length > 0
      );
      console.log(`🔍 [DB-ADAPTER] Plugin filter check:`, {
        plugin: typeof plugin === 'string' ? plugin : plugin?.name || 'unnamed',
        hasValidAdapters,
        detail: {
          notNull: plugin !== null,
          isObject: typeof plugin === 'object',
          hasAdaptersProp: typeof plugin === 'object' && 'adapters' in plugin,
          isArray: typeof plugin === 'object' && Array.isArray(plugin.adapters),
          hasLength: typeof plugin === 'object' && Array.isArray(plugin.adapters) && plugin.adapters.length > 0
        }
      });
      return hasValidAdapters;
    });

    console.log("🔍 [DB-ADAPTER] Filtered plugins with valid adapters:", pluginsWithAdapters.length);
    
    // Log details of plugins with adapters
    if (pluginsWithAdapters.length > 0) {
      console.log("🔍 [DB-ADAPTER] === PLUGINS WITH VALID ADAPTERS ===");
      pluginsWithAdapters.forEach((plugin, index) => {
        console.log(`🔍 [DB-ADAPTER] Adapter Plugin ${index}:`, {
          name: plugin?.name || 'unnamed',
          npmName: plugin?.npmName || 'unknown',
          adaptersCount: plugin.adapters?.length || 0,
          adapterTypes: plugin.adapters?.map(a => a?.constructor?.name || 'unknown adapter') || []
        });
      });
    }

    // Decision logic
    if (pluginsWithAdapters.length === 0) {
      console.log("🔍 [DB-ADAPTER] No plugins with valid adapters found, using default SQLite");
      const sqliteAdapterPlugin = await import('@elizaos-plugins/adapter-sqlite');
      const sqliteAdapterPluginDefault = sqliteAdapterPlugin.default;
      adapter = sqliteAdapterPluginDefault.adapters[0];
      if (!adapter) {
        throw new Error("Internal error: No database adapter found for default adapter-sqlite");
      }
    } else if (pluginsWithAdapters.length === 1) {
      console.log("🔍 [DB-ADAPTER] Exactly one plugin with valid adapters found, using it");
      adapter = pluginsWithAdapters[0].adapters?.[0];
    } else {
      // DETAILED ERROR REPORTING
      console.error("🔍 [DB-ADAPTER] === MULTIPLE ADAPTER CONFLICT DETAILS ===");
      console.error("🔍 [DB-ADAPTER] Number of conflicting plugins:", pluginsWithAdapters.length);
      console.error("🔍 [DB-ADAPTER] Character plugins configuration:", JSON.stringify(character.plugins, null, 2));
      
      pluginsWithAdapters.forEach((plugin, index) => {
        console.error(`🔍 [DB-ADAPTER] Conflicting Plugin ${index + 1}:`, {
          name: plugin?.name || 'unnamed',
          npmName: plugin?.npmName || 'unknown',
          pluginType: typeof plugin,
          hasAdapters: !!plugin.adapters,
          adaptersCount: plugin.adapters?.length || 0,
          adapterNames: plugin.adapters?.map(a => a?.constructor?.name || 'unknown adapter') || []
        });
      });
      
      throw new Error(`🔍 MULTIPLE DATABASE ADAPTERS FOUND: Found ${pluginsWithAdapters.length} plugins with database adapters. Only one database adapter is allowed. Check your character's plugins configuration and ensure only one plugin exports database adapters.`);
    }

    // Initialize adapter
    const adapterInterface = await adapter?.init(runtime);
    console.log("🔍 [DB-ADAPTER] << findDatabaseAdapter returning successfully:", adapterInterface?.constructor?.name);
    
    if (!adapterInterface) {
      throw new Error("Failed to initialize database adapter");
    }
    
    return adapterInterface;
    
  } catch (error) {
    console.error("🔍 [DB-ADAPTER] FATAL ERROR in findDatabaseAdapter:", error);
    console.error("🔍 [DB-ADAPTER] Character plugins:", JSON.stringify(character.plugins, null, 2));
    throw error;
  }
}

async function startAgent(
    character: Character,
    directClient: DirectClient
): Promise<AgentRuntime> {
    console.log("[DEBUG] About to call startAgent for character:", character.name);
    let db: IDatabaseAdapter & IDatabaseCacheAdapter;
    try {
        character.id ??= stringToUuid(character.name);
        character.username ??= character.name;

        const token = getTokenForProvider(character.modelProvider, character);

        const runtime: AgentRuntime = await createAgent(
            character,
            token
        );

        // initialize database
        db = await findDatabaseAdapter(runtime);
        console.log("[DEBUG] DB adapter created:", db ? db.constructor?.name : null);
        runtime.databaseAdapter = db;

        // initialize cache
        console.log("[DEBUG] process.env.CACHE_STORE:", process.env.CACHE_STORE);
        const storeEnv = process.env.CACHE_STORE || (db ? "database" : "filesystem");
        console.log("[DEBUG] storeEnv:", storeEnv);
        console.log("[DEBUG] db present:", !!db, "db type:", db?.constructor?.name);
        
        // Use environment variable for cache store
        const cacheStore = storeEnv;
        console.log("[DEBUG] cacheStore selected:", cacheStore);
        
        const cache = initializeCache(
            cacheStore,
            character,
            process.env.CACHE_DIR,
            db
        );
        runtime.cacheManager = cache;

        // start services/plugins/process knowledge
        await runtime.initialize();

        // start assigned clients
        runtime.clients = await initializeClients(character, runtime);

        // add to container
        directClient.registerAgent(runtime);

        // report to console
        elizaLogger.debug(`Started ${character.name} as ${runtime.agentId}`);

        return runtime;
    } catch (e) {
        console.error(`Error starting agent: ${e}`);
        throw e;
    }
}

const directClient = new DirectClient();
console.log("[DEBUG] After DirectClient construction");

// Main execution logic
(async () => {
    try {
        const args = parseArguments();
        console.log("[DEBUG] After argument parsing", args);
        
        // Choose the character file from args or env
        const characterFile = args.character || process.env.CHARACTER_FILE;
        if (!characterFile) {
            elizaLogger.error("No character file specified. Use --character flag or set CHARACTER_FILE environment variable.");
            process.exit(1);
        }
        
        console.log("[DEBUG] Loading character from:", characterFile);
        const character = await loadCharacterTryPath(characterFile);
        console.log("[DEBUG] Character loaded:", character.name);
        
        console.log("[DEBUG] About to start agent");
        const runtime = await startAgent(character, directClient);
        
        elizaLogger.success(`Agent ${character.name} started successfully`);
        
        // Start HTTP server using DirectClient's Express app
        const port = parseInt(process.env.PORT || (process.env.SERVER_PORT === "3001" ? "3001" : "3000"), 10);
        
        // Start the Express server with the API routes
        const server = directClient.app.listen(port, '0.0.0.0', () => {
            elizaLogger.success(`REST API bound to 0.0.0.0:${port}. If running locally, access it at http://localhost:${port}.`);
            elizaLogger.info(`Run \`pnpm start:client\` to start the client and visit the outputted URL (http://localhost:5173) to chat with your agents. When running multiple agents, use client with different port \`SERVER_PORT=${port} pnpm start:client\``);
        });
        
        // Keep the process alive
        process.on('SIGINT', () => {
            elizaLogger.info('Received shutdown signal, closing server...');
            server.close(() => {
                elizaLogger.success('Server closed successfully');
                process.exit(0);
            });
        });
        
        // Keep process running
        setInterval(() => {
            // Keep alive
        }, 60000);
        
    } catch (e) {
        elizaLogger.error("[FATAL] Agent failed to start:", e);
        process.exit(1);
    }
})();
