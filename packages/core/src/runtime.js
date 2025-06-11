var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _AgentRuntime_conversationLength;
import { readFile } from "fs/promises";
import { join } from "path";
import { names, uniqueNamesGenerator } from "unique-names-generator";
import { v4 as uuidv4 } from "uuid";
import { composeActionExamples, formatActionNames, formatActions, } from "./actions.ts";
import { addHeader, composeContext } from "./context.ts";
import { evaluationTemplate, formatEvaluatorExamples, formatEvaluatorNames, formatEvaluators, } from "./evaluators.ts";
import { generateText } from "./generation.ts";
import { formatGoalsAsString, getGoals } from "./goals.ts";
import { elizaLogger } from "./index.ts";
import knowledge from "./knowledge.ts";
import { MemoryManager } from "./memory.ts";
import { formatActors, formatMessages, getActorDetails } from "./messages.ts";
import { parseJsonArrayFromText } from "./parsing.ts";
import { formatPosts } from "./posts.ts";
import { getProviders } from "./providers.ts";
import { RAGKnowledgeManager } from "./ragknowledge.ts";
import settings from "./settings.ts";
import { 
// RAGKnowledgeItem,
//Media,
ModelClass, ModelProviderName, } from "./types.ts";
import { stringToUuid } from "./uuid.ts";
import { glob } from "glob";
import { existsSync } from "fs";
/**
 * Represents the runtime environment for an agent, handling message processing,
 * action registration, and interaction with external services like OpenAI and Supabase.
 */
function isDirectoryItem(item) {
    return (typeof item === "object" &&
        item !== null &&
        "directory" in item &&
        typeof item.directory === "string");
}
export class AgentRuntime {
    // verifiableInferenceAdapter?: IVerifiableInferenceAdapter;
    registerMemoryManager(manager) {
        if (!manager.tableName) {
            throw new Error("Memory manager must have a tableName");
        }
        if (this.memoryManagers.has(manager.tableName)) {
            elizaLogger.warn(`Memory manager ${manager.tableName} is already registered. Skipping registration.`);
            return;
        }
        this.memoryManagers.set(manager.tableName, manager);
    }
    getMemoryManager(tableName) {
        return this.memoryManagers.get(tableName) || null;
    }
    getService(service) {
        const serviceInstance = this.services.get(service);
        if (!serviceInstance) {
            elizaLogger.error(`Service ${service} not found`);
            return null;
        }
        return serviceInstance;
    }
    async registerService(service) {
        const serviceType = service.serviceType;
        elizaLogger.log(`${this.character.name}(${this.agentId}) - Registering service:`, serviceType);
        if (this.services.has(serviceType)) {
            elizaLogger.warn(`${this.character.name}(${this.agentId}) - Service ${serviceType} is already registered. Skipping registration.`);
            return;
        }
        // Add the service to the services map
        this.services.set(serviceType, service);
        elizaLogger.success(`${this.character.name}(${this.agentId}) - Service ${serviceType} registered successfully`);
    }
    /**
     * Creates an instance of AgentRuntime.
     * @param opts - The options for configuring the AgentRuntime.
     * @param opts.conversationLength - The number of messages to hold in the recent message cache.
     * @param opts.token - The JWT token, can be a JWT token if outside worker, or an OpenAI token if inside worker.
     * @param opts.serverUrl - The URL of the worker.
     * @param opts.actions - Optional custom actions.
     * @param opts.evaluators - Optional custom evaluators.
     * @param opts.services - Optional custom services.
     * @param opts.memoryManagers - Optional custom memory managers.
     * @param opts.providers - Optional context providers.
     * @param opts.model - The model to use for generateText.
     * @param opts.embeddingModel - The model to use for embedding.
     * @param opts.agentId - Optional ID of the agent.
     * @param opts.databaseAdapter - The database adapter used for interacting with the database.
     * @param opts.fetch - Custom fetch function to use for making requests.
     */
    constructor(opts) {
        /**
         * Default count for recent messages to be kept in memory.
         * @private
         */
        _AgentRuntime_conversationLength.set(this, 32);
        /**
         * The base URL of the server where the agent's requests are processed.
         */
        this.serverUrl = "http://localhost:7998";
        /**
         * Custom actions that the agent can perform.
         */
        this.actions = [];
        /**
         * Evaluators used to assess and guide the agent's responses.
         */
        this.evaluators = [];
        /**
         * Context providers used to provide context for message generation.
         */
        this.providers = [];
        /**
         * Database adapters used to interact with the database.
         */
        this.adapters = [];
        this.plugins = [];
        /**
         * Fetch function to use
         * Some environments may not have access to the global fetch function and need a custom fetch override.
         */
        this.fetch = fetch;
        this.services = new Map();
        this.memoryManagers = new Map();
        this.clients = [];
        // use the character id if it exists, otherwise use the agentId if it is passed in, otherwise use the character name
        this.agentId =
            opts.character?.id ??
                opts?.agentId ??
                stringToUuid(opts.character?.name ?? uuidv4());
        this.character = opts.character;
        if (!this.character) {
            throw new Error("Character input is required");
        }
        elizaLogger.info(`${this.character.name}(${this.agentId}) - Initializing AgentRuntime with options:`, {
            character: opts.character?.name,
            modelProvider: opts.modelProvider,
            characterModelProvider: opts.character?.modelProvider,
        });
        elizaLogger.debug(`[AgentRuntime] Process working directory: ${process.cwd()}`);
        // Define the root path once
        this.knowledgeRoot = join(process.cwd(), "..", "characters", "knowledge");
        elizaLogger.debug(`[AgentRuntime] Process knowledgeRoot: ${this.knowledgeRoot}`);
        __classPrivateFieldSet(this, _AgentRuntime_conversationLength, opts.conversationLength ?? __classPrivateFieldGet(this, _AgentRuntime_conversationLength, "f"), "f");
        this.databaseAdapter = opts.databaseAdapter;
        elizaLogger.success(`Agent ID: ${this.agentId}`);
        this.fetch = opts.fetch ?? this.fetch;
        this.cacheManager = opts.cacheManager;
        this.messageManager = new MemoryManager({
            runtime: this,
            tableName: "messages",
        });
        this.descriptionManager = new MemoryManager({
            runtime: this,
            tableName: "descriptions",
        });
        this.loreManager = new MemoryManager({
            runtime: this,
            tableName: "lore",
        });
        this.documentsManager = new MemoryManager({
            runtime: this,
            tableName: "documents",
        });
        this.knowledgeManager = new MemoryManager({
            runtime: this,
            tableName: "fragments",
        });
        this.ragKnowledgeManager = new RAGKnowledgeManager({
            runtime: this,
            tableName: "knowledge",
            knowledgeRoot: this.knowledgeRoot,
        });
        (opts.managers ?? []).forEach((manager) => {
            this.registerMemoryManager(manager);
        });
        (opts.services ?? []).forEach((service) => {
            this.registerService(service);
        });
        this.serverUrl = opts.serverUrl ?? this.serverUrl;
        elizaLogger.info(`${this.character.name}(${this.agentId}) - Setting Model Provider:`, {
            characterModelProvider: this.character.modelProvider,
            optsModelProvider: opts.modelProvider,
            currentModelProvider: this.modelProvider,
            finalSelection: this.character.modelProvider ??
                opts.modelProvider ??
                this.modelProvider,
        });
        this.modelProvider =
            this.character.modelProvider ??
                opts.modelProvider ??
                this.modelProvider;
        this.imageModelProvider =
            this.character.imageModelProvider ?? this.modelProvider;
        this.imageVisionModelProvider =
            this.character.imageVisionModelProvider ?? this.modelProvider;
        elizaLogger.info(`${this.character.name}(${this.agentId}) - Selected model provider:`, this.modelProvider);
        elizaLogger.info(`${this.character.name}(${this.agentId}) - Selected image model provider:`, this.imageModelProvider);
        elizaLogger.info(`${this.character.name}(${this.agentId}) - Selected image vision model provider:`, this.imageVisionModelProvider);
        // Validate model provider
        if (!Object.values(ModelProviderName).includes(this.modelProvider)) {
            elizaLogger.error("Invalid model provider:", this.modelProvider);
            elizaLogger.error("Available providers:", Object.values(ModelProviderName));
            throw new Error(`Invalid model provider: ${this.modelProvider}`);
        }
        if (!this.serverUrl) {
            elizaLogger.warn("No serverUrl provided, defaulting to localhost");
        }
        this.token = opts.token;
        this.plugins = [
            ...(opts.character?.plugins ?? []),
            ...(opts.plugins ?? []),
        ];
        this.plugins.forEach((plugin) => {
            plugin.actions?.forEach((action) => {
                this.registerAction(action);
            });
            plugin.evaluators?.forEach((evaluator) => {
                this.registerEvaluator(evaluator);
            });
            plugin.services?.forEach((service) => {
                this.registerService(service);
            });
            plugin.providers?.forEach((provider) => {
                this.registerContextProvider(provider);
            });
            plugin.adapters?.forEach((adapter) => {
                this.registerAdapter(adapter);
            });
        });
        (opts.actions ?? []).forEach((action) => {
            this.registerAction(action);
        });
        (opts.providers ?? []).forEach((provider) => {
            this.registerContextProvider(provider);
        });
        (opts.evaluators ?? []).forEach((evaluator) => {
            this.registerEvaluator(evaluator);
        });
        // this.verifiableInferenceAdapter = opts.verifiableInferenceAdapter;
    }
    async initializeDatabase() {
        // By convention, we create a user and room using the agent id.
        // Memories related to it are considered global context for the agent.
        this.ensureRoomExists(this.agentId);
        this.ensureUserExists(this.agentId, this.character.username || this.character.name, this.character.name).then(() => {
            // postgres needs the user to exist before you can add a participant
            this.ensureParticipantExists(this.agentId, this.agentId);
        });
    }
    async initialize() {
        this.initializeDatabase();
        for (const [serviceType, service] of this.services.entries()) {
            try {
                await service.initialize(this);
                this.services.set(serviceType, service);
                elizaLogger.success(`${this.character.name}(${this.agentId}) - Service ${serviceType} initialized successfully`);
            }
            catch (error) {
                elizaLogger.error(`${this.character.name}(${this.agentId}) - Failed to initialize service ${serviceType}:`, error);
                throw error;
            }
        }
        // should already be initiailized
        /*
        for (const plugin of this.plugins) {
            if (plugin.services)
                await Promise.all(
                    plugin.services?.map((service) => service.initialize(this)),
                );
        }
        */
        if (this.character &&
            this.character.knowledge &&
            this.character.knowledge.length > 0) {
            elizaLogger.info(`[RAG Check] RAG Knowledge enabled: ${this.character.settings.ragKnowledge ? true : false}`);
            elizaLogger.info(`[RAG Check] Knowledge items:`, this.character.knowledge);
            if (this.character.settings.ragKnowledge) {
                // Type guards with logging for each knowledge type
                const [directoryKnowledge, pathKnowledge, stringKnowledge] = this.character.knowledge.reduce((acc, item) => {
                    if (typeof item === "object") {
                        if (isDirectoryItem(item)) {
                            elizaLogger.debug(`[RAG Filter] Found directory item: ${JSON.stringify(item)}`);
                            acc[0].push(item);
                        }
                        else if ("path" in item) {
                            elizaLogger.debug(`[RAG Filter] Found path item: ${JSON.stringify(item)}`);
                            acc[1].push(item);
                        }
                    }
                    else if (typeof item === "string") {
                        elizaLogger.debug(`[RAG Filter] Found string item: ${item.slice(0, 100)}...`);
                        acc[2].push(item);
                    }
                    return acc;
                }, [[], [], []]);
                elizaLogger.info(`[RAG Summary] Found ${directoryKnowledge.length} directories, ${pathKnowledge.length} paths, and ${stringKnowledge.length} strings`);
                // Process each type of knowledge
                if (directoryKnowledge.length > 0) {
                    elizaLogger.info(`[RAG Process] Processing directory knowledge sources:`);
                    for (const dir of directoryKnowledge) {
                        elizaLogger.info(`  - Directory: ${dir.directory} (shared: ${!!dir.shared})`);
                        await this.processCharacterRAGDirectory(dir);
                    }
                }
                if (pathKnowledge.length > 0) {
                    elizaLogger.info(`[RAG Process] Processing individual file knowledge sources`);
                    await this.processCharacterRAGKnowledge(pathKnowledge);
                }
                if (stringKnowledge.length > 0) {
                    elizaLogger.info(`[RAG Process] Processing direct string knowledge`);
                    await this.processCharacterRAGKnowledge(stringKnowledge);
                }
            }
            else {
                // Non-RAG mode: only process string knowledge
                const stringKnowledge = this.character.knowledge.filter((item) => typeof item === "string");
                await this.processCharacterKnowledge(stringKnowledge);
            }
            // After all new knowledge is processed, clean up any deleted files
            elizaLogger.info(`[RAG Cleanup] Starting cleanup of deleted knowledge files`);
            await this.ragKnowledgeManager.cleanupDeletedKnowledgeFiles();
            elizaLogger.info(`[RAG Cleanup] Cleanup complete`);
        }
    }
    async stop() {
        elizaLogger.debug("runtime::stop - character", this.character.name);
        // stop services, they don't have a stop function
        // just initialize
        // plugins
        // have actions, providers, evaluators (no start/stop)
        // services (just initialized), clients
        // client have a start
        for (const c of this.clients) {
            elizaLogger.log("runtime::stop - requesting", c, "client stop for", this.character.name);
            c.stop(this);
        }
        // we don't need to unregister with directClient
        // don't need to worry about knowledge
    }
    /**
     * Processes character knowledge by creating document memories and fragment memories.
     * This function takes an array of knowledge items, creates a document memory for each item if it doesn't exist,
     * then chunks the content into fragments, embeds each fragment, and creates fragment memories.
     * @param knowledge An array of knowledge items containing id, path, and content.
     */
    async processCharacterKnowledge(items) {
        for (const item of items) {
            const knowledgeId = stringToUuid(item);
            const existingDocument = await this.documentsManager.getMemoryById(knowledgeId);
            if (existingDocument) {
                continue;
            }
            elizaLogger.info("Processing knowledge for ", this.character.name, " - ", item.slice(0, 100));
            await knowledge.set(this, {
                id: knowledgeId,
                content: {
                    text: item,
                },
            });
        }
    }
    /**
     * Processes character knowledge by creating document memories and fragment memories.
     * This function takes an array of knowledge items, creates a document knowledge for each item if it doesn't exist,
     * then chunks the content into fragments, embeds each fragment, and creates fragment knowledge.
     * An array of knowledge items or objects containing id, path, and content.
     */
    async processCharacterRAGKnowledge(items) {
        let hasError = false;
        for (const item of items) {
            if (!item)
                continue;
            try {
                // Check if item is marked as shared
                let isShared = false;
                let contentItem = item;
                // Only treat as shared if explicitly marked
                if (typeof item === "object" && "path" in item) {
                    isShared = item.shared === true;
                    contentItem = item.path;
                }
                else {
                    contentItem = item;
                }
                // const knowledgeId = stringToUuid(contentItem);
                const knowledgeId = this.ragKnowledgeManager.generateScopedId(contentItem, isShared);
                const fileExtension = contentItem
                    .split(".")
                    .pop()
                    ?.toLowerCase();
                // Check if it's a file or direct knowledge
                if (fileExtension &&
                    ["md", "txt", "pdf"].includes(fileExtension)) {
                    try {
                        const filePath = join(this.knowledgeRoot, contentItem);
                        // Get existing knowledge first with more detailed logging
                        elizaLogger.debug("[RAG Query]", {
                            knowledgeId,
                            agentId: this.agentId,
                            relativePath: contentItem,
                            fullPath: filePath,
                            isShared,
                            knowledgeRoot: this.knowledgeRoot,
                        });
                        // Get existing knowledge first
                        const existingKnowledge = await this.ragKnowledgeManager.getKnowledge({
                            id: knowledgeId,
                            agentId: this.agentId, // Keep agentId as it's used in OR query
                        });
                        elizaLogger.debug("[RAG Query Result]", {
                            relativePath: contentItem,
                            fullPath: filePath,
                            knowledgeId,
                            isShared,
                            exists: existingKnowledge.length > 0,
                            knowledgeCount: existingKnowledge.length,
                            firstResult: existingKnowledge[0]
                                ? {
                                    id: existingKnowledge[0].id,
                                    agentId: existingKnowledge[0].agentId,
                                    contentLength: existingKnowledge[0].content.text
                                        .length,
                                }
                                : null,
                            results: existingKnowledge.map((k) => ({
                                id: k.id,
                                agentId: k.agentId,
                                isBaseKnowledge: !k.id.includes("chunk"),
                            })),
                        });
                        // Read file content
                        const content = await readFile(filePath, "utf8");
                        if (!content) {
                            hasError = true;
                            continue;
                        }
                        if (existingKnowledge.length > 0) {
                            const existingContent = existingKnowledge[0].content.text;
                            elizaLogger.debug("[RAG Compare]", {
                                path: contentItem,
                                knowledgeId,
                                isShared,
                                existingContentLength: existingContent.length,
                                newContentLength: content.length,
                                contentSample: content.slice(0, 100),
                                existingContentSample: existingContent.slice(0, 100),
                                matches: existingContent === content,
                            });
                            if (existingContent === content) {
                                elizaLogger.info(`${isShared ? "Shared knowledge" : "Knowledge"} ${contentItem} unchanged, skipping`);
                                continue;
                            }
                            // Content changed, remove old knowledge before adding new
                            elizaLogger.info(`${isShared ? "Shared knowledge" : "Knowledge"} ${contentItem} changed, updating...`);
                            await this.ragKnowledgeManager.removeKnowledge(knowledgeId);
                            await this.ragKnowledgeManager.removeKnowledge(`${knowledgeId}-chunk-*`);
                        }
                        elizaLogger.info(`Processing ${fileExtension.toUpperCase()} file content for`, this.character.name, "-", contentItem);
                        await this.ragKnowledgeManager.processFile({
                            path: contentItem,
                            content: content,
                            type: fileExtension,
                            isShared: isShared,
                        });
                    }
                    catch (error) {
                        hasError = true;
                        elizaLogger.error(`Failed to read knowledge file ${contentItem}. Error details:`, error?.message || error || "Unknown error");
                        continue;
                    }
                }
                else {
                    // Handle direct knowledge string
                    elizaLogger.info("Processing direct knowledge for", this.character.name, "-", contentItem.slice(0, 100));
                    const existingKnowledge = await this.ragKnowledgeManager.getKnowledge({
                        id: knowledgeId,
                        agentId: this.agentId,
                    });
                    if (existingKnowledge.length > 0) {
                        elizaLogger.info(`Direct knowledge ${knowledgeId} already exists, skipping`);
                        continue;
                    }
                    await this.ragKnowledgeManager.createKnowledge({
                        id: knowledgeId,
                        agentId: this.agentId,
                        content: {
                            text: contentItem,
                            metadata: {
                                type: "direct",
                            },
                        },
                    });
                }
            }
            catch (error) {
                hasError = true;
                elizaLogger.error(`Error processing knowledge item ${item}:`, error?.message || error || "Unknown error");
                continue;
            }
        }
        if (hasError) {
            elizaLogger.warn("Some knowledge items failed to process, but continuing with available knowledge");
        }
    }
    /**
     * Processes directory-based RAG knowledge by recursively loading and processing files.
     * @param dirConfig The directory configuration containing path and shared flag
     */
    async processCharacterRAGDirectory(dirConfig) {
        if (!dirConfig.directory) {
            elizaLogger.error("[RAG Directory] No directory specified");
            return;
        }
        // Sanitize directory path to prevent traversal attacks
        const sanitizedDir = dirConfig.directory.replace(/\.\./g, "");
        const dirPath = join(this.knowledgeRoot, sanitizedDir);
        try {
            // Check if directory exists
            const dirExists = existsSync(dirPath);
            if (!dirExists) {
                elizaLogger.error(`[RAG Directory] Directory does not exist: ${sanitizedDir}`);
                return;
            }
            elizaLogger.debug(`[RAG Directory] Searching in: ${dirPath}`);
            // Use glob to find all matching files in directory
            const files = await glob("**/*.{md,txt,pdf}", {
                cwd: dirPath,
                nodir: true,
                absolute: false,
            });
            if (files.length === 0) {
                elizaLogger.warn(`No matching files found in directory: ${dirConfig.directory}`);
                return;
            }
            elizaLogger.info(`[RAG Directory] Found ${files.length} files in ${dirConfig.directory}`);
            // Process files in batches to avoid memory issues
            const BATCH_SIZE = 5;
            for (let i = 0; i < files.length; i += BATCH_SIZE) {
                const batch = files.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (file) => {
                    try {
                        const relativePath = join(sanitizedDir, file);
                        elizaLogger.debug(`[RAG Directory] Processing file ${i + 1}/${files.length}:`, {
                            file,
                            relativePath,
                            shared: dirConfig.shared,
                        });
                        await this.processCharacterRAGKnowledge([
                            {
                                path: relativePath,
                                shared: dirConfig.shared,
                            },
                        ]);
                    }
                    catch (error) {
                        elizaLogger.error(`[RAG Directory] Failed to process file: ${file}`, error instanceof Error
                            ? {
                                name: error.name,
                                message: error.message,
                                stack: error.stack,
                            }
                            : error);
                    }
                }));
                elizaLogger.debug(`[RAG Directory] Completed batch ${Math.min(i + BATCH_SIZE, files.length)}/${files.length} files`);
            }
            elizaLogger.success(`[RAG Directory] Successfully processed directory: ${sanitizedDir}`);
        }
        catch (error) {
            elizaLogger.error(`[RAG Directory] Failed to process directory: ${sanitizedDir}`, error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                }
                : error);
            throw error; // Re-throw to let caller handle it
        }
    }
    getSetting(key) {
        // check if the key is in the character.settings.secrets object
        if (this.character.settings?.secrets?.[key]) {
            return this.character.settings.secrets[key];
        }
        // if not, check if it's in the settings object
        if (this.character.settings?.[key]) {
            return this.character.settings[key];
        }
        // if not, check if it's in the settings object
        if (settings[key]) {
            return settings[key];
        }
        return null;
    }
    /**
     * Get the number of messages that are kept in the conversation buffer.
     * @returns The number of recent messages to be kept in memory.
     */
    getConversationLength() {
        return __classPrivateFieldGet(this, _AgentRuntime_conversationLength, "f");
    }
    /**
     * Register an action for the agent to perform.
     * @param action The action to register.
     */
    registerAction(action) {
        elizaLogger.success(`${this.character.name}(${this.agentId}) - Registering action: ${action.name}`);
        this.actions.push(action);
    }
    /**
     * Register an evaluator to assess and guide the agent's responses.
     * @param evaluator The evaluator to register.
     */
    registerEvaluator(evaluator) {
        this.evaluators.push(evaluator);
    }
    /**
     * Register a context provider to provide context for message generation.
     * @param provider The context provider to register.
     */
    registerContextProvider(provider) {
        this.providers.push(provider);
    }
    /**
     * Register an adapter for the agent to use.
     * @param adapter The adapter to register.
     */
    registerAdapter(adapter) {
        this.adapters.push(adapter);
    }
    /**
     * Process the actions of a message.
     * @param message The message to process.
     * @param content The content of the message to process actions from.
     */
    async processActions(message, responses, state, callback) {
        for (const response of responses) {
            if (!response.content?.action) {
                elizaLogger.warn("No action found in the response content.");
                continue;
            }
            const normalizedAction = response.content.action
                .toLowerCase()
                .replace("_", "");
            elizaLogger.success(`Normalized action: ${normalizedAction}`);
            let action = this.actions.find((a) => a.name
                .toLowerCase()
                .replace("_", "")
                .includes(normalizedAction) ||
                normalizedAction.includes(a.name.toLowerCase().replace("_", "")));
            if (!action) {
                elizaLogger.info("Attempting to find action in similes.");
                for (const _action of this.actions) {
                    const simileAction = _action.similes.find((simile) => simile
                        .toLowerCase()
                        .replace("_", "")
                        .includes(normalizedAction) ||
                        normalizedAction.includes(simile.toLowerCase().replace("_", "")));
                    if (simileAction) {
                        action = _action;
                        elizaLogger.success(`Action found in similes: ${action.name}`);
                        break;
                    }
                }
            }
            if (!action) {
                elizaLogger.error("No action found for", response.content.action);
                continue;
            }
            if (!action.handler) {
                elizaLogger.error(`Action ${action.name} has no handler.`);
                continue;
            }
            try {
                elizaLogger.info(`Executing handler for action: ${action.name}`);
                await action.handler(this, message, state, {}, callback);
            }
            catch (error) {
                elizaLogger.error(error);
            }
        }
    }
    /**
     * Evaluate the message and state using the registered evaluators.
     * @param message The message to evaluate.
     * @param state The state of the agent.
     * @param didRespond Whether the agent responded to the message.~
     * @param callback The handler callback
     * @returns The results of the evaluation.
     */
    async evaluate(message, state, didRespond, callback) {
        const evaluatorPromises = this.evaluators.map(async (evaluator) => {
            elizaLogger.log("Evaluating", evaluator.name);
            if (!evaluator.handler) {
                return null;
            }
            if (!didRespond && !evaluator.alwaysRun) {
                return null;
            }
            const result = await evaluator.validate(this, message, state);
            if (result) {
                return evaluator;
            }
            return null;
        });
        const resolvedEvaluators = await Promise.all(evaluatorPromises);
        const evaluatorsData = resolvedEvaluators.filter((evaluator) => evaluator !== null);
        // if there are no evaluators this frame, return
        if (!evaluatorsData || evaluatorsData.length === 0) {
            return [];
        }
        const context = composeContext({
            state: {
                ...state,
                evaluators: formatEvaluators(evaluatorsData),
                evaluatorNames: formatEvaluatorNames(evaluatorsData),
            },
            template: this.character.templates?.evaluationTemplate ||
                evaluationTemplate,
        });
        const result = await generateText({
            runtime: this,
            context,
            modelClass: ModelClass.SMALL,
            // verifiableInferenceAdapter: this.verifiableInferenceAdapter,
        });
        const evaluators = parseJsonArrayFromText(result);
        for (const evaluator of this.evaluators) {
            if (!evaluators?.includes(evaluator.name))
                continue;
            if (evaluator.handler)
                await evaluator.handler(this, message, state, {}, callback);
        }
        return evaluators;
    }
    /**
     * Ensure the existence of a participant in the room. If the participant does not exist, they are added to the room.
     * @param userId - The user ID to ensure the existence of.
     * @throws An error if the participant cannot be added.
     */
    async ensureParticipantExists(userId, roomId) {
        const participants = await this.databaseAdapter.getParticipantsForAccount(userId);
        if (participants?.length === 0) {
            await this.databaseAdapter.addParticipant(userId, roomId);
        }
    }
    /**
     * Ensure the existence of a user in the database. If the user does not exist, they are added to the database.
     * @param userId - The user ID to ensure the existence of.
     * @param userName - The user name to ensure the existence of.
     * @returns
     */
    async ensureUserExists(userId, userName, name, email, source) {
        const account = await this.databaseAdapter.getAccountById(userId);
        if (!account) {
            await this.databaseAdapter.createAccount({
                id: userId,
                name: name || this.character.name || "Unknown User",
                username: userName || this.character.username || "Unknown",
                // TODO: We might not need these account pieces
                email: email || this.character.email || userId,
                // When invoke ensureUserExists and saving account.details
                // Performing a complete JSON.stringify on character will cause a TypeError: Converting circular structure to JSON error in some more complex plugins.
                details: this.character ? Object.assign({}, this.character, {
                    source,
                    plugins: this.character?.plugins?.map((plugin) => plugin.name),
                }) : { summary: "" },
            });
            elizaLogger.success(`User ${userName} created successfully.`);
        }
    }
    async ensureParticipantInRoom(userId, roomId) {
        const participants = await this.databaseAdapter.getParticipantsForRoom(roomId);
        if (!participants.includes(userId)) {
            await this.databaseAdapter.addParticipant(userId, roomId);
            if (userId === this.agentId) {
                elizaLogger.log(`Agent ${this.character.name} linked to room ${roomId} successfully.`);
            }
            else {
                elizaLogger.log(`User ${userId} linked to room ${roomId} successfully.`);
            }
        }
    }
    async ensureConnection(userId, roomId, userName, userScreenName, source) {
        await Promise.all([
            this.ensureUserExists(this.agentId, this.character.username ?? "Agent", this.character.name ?? "Agent", source),
            this.ensureUserExists(userId, userName ?? "User" + userId, userScreenName ?? "User" + userId, source),
            this.ensureRoomExists(roomId),
        ]);
        await Promise.all([
            this.ensureParticipantInRoom(userId, roomId),
            this.ensureParticipantInRoom(this.agentId, roomId),
        ]);
    }
    /**
     * Ensure the existence of a room between the agent and a user. If no room exists, a new room is created and the user
     * and agent are added as participants. The room ID is returned.
     * @param userId - The user ID to create a room with.
     * @returns The room ID of the room between the agent and the user.
     * @throws An error if the room cannot be created.
     */
    async ensureRoomExists(roomId) {
        const room = await this.databaseAdapter.getRoom(roomId);
        if (!room) {
            await this.databaseAdapter.createRoom(roomId);
            elizaLogger.log(`Room ${roomId} created successfully.`);
        }
    }
    /**
     * Compose the state of the agent into an object that can be passed or used for response generation.
     * @param message The message to compose the state from.
     * @returns The state of the agent.
     */
    async composeState(message, additionalKeys = {}, ragEnabled) {
        const { userId, roomId } = message;
        const conversationLength = this.getConversationLength();
        const [actorsData, recentMessagesData, goalsData] = await Promise.all([
            getActorDetails({ runtime: this, roomId }),
            this.messageManager.getMemories({
                roomId,
                count: conversationLength,
                unique: false,
            }),
            getGoals({
                runtime: this,
                count: 10,
                onlyInProgress: false,
                roomId,
            }),
        ]);
        const goals = formatGoalsAsString({ goals: goalsData });
        const actors = formatActors({ actors: actorsData ?? [] });
        const recentMessages = formatMessages({
            messages: recentMessagesData,
            actors: actorsData,
        });
        const recentPosts = formatPosts({
            messages: recentMessagesData,
            actors: actorsData,
            conversationHeader: false,
        });
        const senderName = actorsData?.find((actor) => actor.id === userId)?.name;
        const agentName = actorsData?.find((actor) => actor.id === this.agentId)
            ?.name || this.character.name;
        let allAttachments = message.content.attachments || [];
        if (recentMessagesData && Array.isArray(recentMessagesData)) {
            const lastMessageWithAttachment = recentMessagesData.find((msg) => msg.content.attachments &&
                msg.content.attachments.length > 0);
            if (lastMessageWithAttachment) {
                const lastMessageTime = lastMessageWithAttachment?.createdAt ?? Date.now();
                const oneHourBeforeLastMessage = lastMessageTime - 60 * 60 * 1000; // 1 hour before last message
                allAttachments = recentMessagesData.reverse().flatMap((msg) => {
                    const msgTime = msg.createdAt ?? Date.now();
                    const isWithinTime = msgTime >= oneHourBeforeLastMessage;
                    const attachments = msg.content.attachments || [];
                    if (!isWithinTime) {
                        attachments.forEach((attachment) => {
                            attachment.text = "[Hidden]";
                        });
                    }
                    return attachments;
                });
            }
        }
        const formattedAttachments = allAttachments
            .map((attachment) => `ID: ${attachment.id}
Name: ${attachment.title}
URL: ${attachment.url}
Type: ${attachment.source}
Description: ${attachment.description}
Text: ${attachment.text}
  `)
            .join("\n");
        // randomly get 3 bits of lore and join them into a paragraph, divided by \n
        let lore = "";
        // Assuming this.lore is an array of lore bits
        if (this.character.lore && this.character.lore.length > 0) {
            const shuffledLore = [...this.character.lore].sort(() => Math.random() - 0.5);
            const selectedLore = shuffledLore.slice(0, 10);
            lore = selectedLore.join("\n");
        }
        const formattedCharacterPostExamples = this.character.postExamples
            .sort(() => 0.5 - Math.random())
            .map((post) => {
            const messageString = `${post}`;
            return messageString;
        })
            .slice(0, 50)
            .join("\n");
        const formattedCharacterMessageExamples = this.character.messageExamples
            .sort(() => 0.5 - Math.random())
            .slice(0, 5)
            .map((example) => {
            const exampleNames = Array.from({ length: 5 }, () => uniqueNamesGenerator({ dictionaries: [names] }));
            return example
                .map((message) => {
                let messageString = `${message.user}: ${message.content.text}`;
                exampleNames.forEach((name, index) => {
                    const placeholder = `{{user${index + 1}}}`;
                    messageString = messageString.replaceAll(placeholder, name);
                });
                return messageString;
            })
                .join("\n");
        })
            .join("\n\n");
        const getRecentInteractions = async (userA, userB) => {
            // Find all rooms where userA and userB are participants
            const rooms = await this.databaseAdapter.getRoomsForParticipants([
                userA,
                userB,
            ]);
            // Check the existing memories in the database
            return this.messageManager.getMemoriesByRoomIds({
                // filter out the current room id from rooms
                roomIds: rooms.filter((room) => room !== roomId),
                limit: 20,
            });
        };
        const recentInteractions = userId !== this.agentId
            ? await getRecentInteractions(userId, this.agentId)
            : [];
        const getRecentMessageInteractions = async (recentInteractionsData) => {
            // Format the recent messages
            const formattedInteractions = await Promise.all(recentInteractionsData.map(async (message) => {
                const isSelf = message.userId === this.agentId;
                let sender;
                if (isSelf) {
                    sender = this.character.name;
                }
                else {
                    const accountId = await this.databaseAdapter.getAccountById(message.userId);
                    sender = accountId?.username || "unknown";
                }
                return `${sender}: ${message.content.text}`;
            }));
            return formattedInteractions.join("\n");
        };
        const formattedMessageInteractions = await getRecentMessageInteractions(recentInteractions);
        const getRecentPostInteractions = async (recentInteractionsData, actors) => {
            const formattedInteractions = formatPosts({
                messages: recentInteractionsData,
                actors,
                conversationHeader: true,
            });
            return formattedInteractions;
        };
        const formattedPostInteractions = await getRecentPostInteractions(recentInteractions, actorsData);
        // if bio is a string, use it. if its an array, pick one at random
        let bio = this.character.bio || "";
        if (Array.isArray(bio)) {
            // get three random bio strings and join them with " "
            bio = bio
                .sort(() => 0.5 - Math.random())
                .slice(0, 3)
                .join(" ");
        }
        let knowledgeData = [];
        let formattedKnowledge = "";
        // If RAG is enabled, include relevant knowledge in the context
        if (ragEnabled && this.character.settings?.ragKnowledge) {
            console.log("RAG enabled, retrieving knowledge...");
            console.log("Query text:", message.content.text);
            const knowledgeItems = await this.ragKnowledgeManager.getKnowledge({
                query: message.content.text,
                agentId: this.agentId,
                limit: 5
            });
            console.log("Retrieved knowledge items:", knowledgeItems.length);
            if (knowledgeItems.length > 0) {
                console.log("Knowledge items found:");
                knowledgeItems.forEach((item, index) => {
                    console.log(`\nItem ${index + 1}:`);
                    console.log("Text:", item.content.text);
                    console.log("Score:", item.score);
                    console.log("Similarity:", item.similarity);
                });
                formattedKnowledge = "\nRelevant Knowledge:\n" + knowledgeItems.map(item => item.content.text).join("\n");
                console.log("Included knowledge in context:", formattedKnowledge);
            }
            else {
                console.log("No relevant knowledge found");
            }
        }
        else {
            console.log("RAG disabled or not configured, using default knowledge");
            knowledgeData = await knowledge.get(this, message);
            formattedKnowledge = formatKnowledge(knowledgeData);
        }
        const initialState = {
            agentId: this.agentId,
            agentName,
            bio,
            lore,
            adjective: this.character.adjectives &&
                this.character.adjectives.length > 0
                ? this.character.adjectives[Math.floor(Math.random() * this.character.adjectives.length)]
                : "",
            knowledge: formattedKnowledge,
            knowledgeData: knowledgeData,
            ragKnowledgeData: knowledgeData,
            // Recent interactions between the sender and receiver, formatted as messages
            recentMessageInteractions: formattedMessageInteractions,
            // Recent interactions between the sender and receiver, formatted as posts
            recentPostInteractions: formattedPostInteractions,
            // Raw memory[] array of interactions
            recentInteractionsData: recentInteractions,
            // randomly pick one topic
            topic: this.character.topics && this.character.topics.length > 0
                ? this.character.topics[Math.floor(Math.random() * this.character.topics.length)]
                : null,
            topics: this.character.topics && this.character.topics.length > 0
                ? `${this.character.name} is interested in ` +
                    this.character.topics
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 5)
                        .map((topic, index, array) => {
                        if (index === array.length - 2) {
                            return topic + " and ";
                        }
                        // if last topic, don't add a comma
                        if (index === array.length - 1) {
                            return topic;
                        }
                        return topic + ", ";
                    })
                        .join("")
                : "",
            characterPostExamples: formattedCharacterPostExamples &&
                formattedCharacterPostExamples.replaceAll("\n", "").length > 0
                ? addHeader(`# Example Posts for ${this.character.name}`, formattedCharacterPostExamples)
                : "",
            characterMessageExamples: formattedCharacterMessageExamples &&
                formattedCharacterMessageExamples.replaceAll("\n", "").length >
                    0
                ? addHeader(`# Example Conversations for ${this.character.name}`, formattedCharacterMessageExamples)
                : "",
            messageDirections: this.character?.style?.all?.length > 0 ||
                this.character?.style?.chat.length > 0
                ? addHeader("# Message Directions for " + this.character.name, (() => {
                    const all = this.character?.style?.all || [];
                    const chat = this.character?.style?.chat || [];
                    return [...all, ...chat].join("\n");
                })())
                : "",
            postDirections: this.character?.style?.all?.length > 0 ||
                this.character?.style?.post.length > 0
                ? addHeader("# Post Directions for " + this.character.name, (() => {
                    const all = this.character?.style?.all || [];
                    const post = this.character?.style?.post || [];
                    return [...all, ...post].join("\n");
                })())
                : "",
            // Agent runtime stuff
            senderName,
            actors: actors && actors.length > 0
                ? addHeader("# Actors", actors)
                : "",
            actorsData,
            roomId,
            goals: goals && goals.length > 0
                ? addHeader("# Goals\n{{agentName}} should prioritize accomplishing the objectives that are in progress.", goals)
                : "",
            goalsData,
            recentMessages: recentMessages && recentMessages.length > 0
                ? addHeader("# Conversation Messages", recentMessages)
                : "",
            recentPosts: recentPosts && recentPosts.length > 0
                ? addHeader("# Posts in Thread", recentPosts)
                : "",
            recentMessagesData,
            attachments: formattedAttachments && formattedAttachments.length > 0
                ? addHeader("# Attachments", formattedAttachments)
                : "",
            ...additionalKeys,
        };
        const actionPromises = this.actions.map(async (action) => {
            const result = await action.validate(this, message, initialState);
            if (result) {
                return action;
            }
            return null;
        });
        const evaluatorPromises = this.evaluators.map(async (evaluator) => {
            const result = await evaluator.validate(this, message, initialState);
            if (result) {
                return evaluator;
            }
            return null;
        });
        const [resolvedEvaluators, resolvedActions, providers] = await Promise.all([
            Promise.all(evaluatorPromises),
            Promise.all(actionPromises),
            getProviders(this, message, initialState),
        ]);
        const evaluatorsData = resolvedEvaluators.filter(Boolean);
        const actionsData = resolvedActions.filter(Boolean);
        const actionState = {
            actionNames: "Possible response actions: " + formatActionNames(actionsData),
            actions: actionsData.length > 0
                ? addHeader("# Available Actions", formatActions(actionsData))
                : "",
            actionExamples: actionsData.length > 0
                ? addHeader("# Action Examples", composeActionExamples(actionsData, 10))
                : "",
            evaluatorsData,
            evaluators: evaluatorsData.length > 0
                ? formatEvaluators(evaluatorsData)
                : "",
            evaluatorNames: evaluatorsData.length > 0
                ? formatEvaluatorNames(evaluatorsData)
                : "",
            evaluatorExamples: evaluatorsData.length > 0
                ? formatEvaluatorExamples(evaluatorsData)
                : "",
            providers: addHeader(`# Additional Information About ${this.character.name} and The World`, providers),
        };
        return { ...initialState, ...actionState };
    }
    async updateRecentMessageState(state) {
        const conversationLength = this.getConversationLength();
        const recentMessagesData = await this.messageManager.getMemories({
            roomId: state.roomId,
            count: conversationLength,
            unique: false,
        });
        const recentMessages = formatMessages({
            actors: state.actorsData ?? [],
            messages: recentMessagesData.map((memory) => {
                const newMemory = { ...memory };
                delete newMemory.embedding;
                return newMemory;
            }),
        });
        let allAttachments = [];
        if (recentMessagesData && Array.isArray(recentMessagesData)) {
            const lastMessageWithAttachment = recentMessagesData.find((msg) => msg.content.attachments &&
                msg.content.attachments.length > 0);
            if (lastMessageWithAttachment) {
                const lastMessageTime = lastMessageWithAttachment?.createdAt ?? Date.now();
                const oneHourBeforeLastMessage = lastMessageTime - 60 * 60 * 1000; // 1 hour before last message
                allAttachments = recentMessagesData
                    .filter((msg) => {
                    const msgTime = msg.createdAt ?? Date.now();
                    return msgTime >= oneHourBeforeLastMessage;
                })
                    .flatMap((msg) => msg.content.attachments || []);
            }
        }
        const formattedAttachments = allAttachments
            .map((attachment) => `ID: ${attachment.id}
Name: ${attachment.title}
URL: ${attachment.url}
Type: ${attachment.source}
Description: ${attachment.description}
Text: ${attachment.text}
    `)
            .join("\n");
        return {
            ...state,
            recentMessages: addHeader("# Conversation Messages", recentMessages),
            recentMessagesData,
            attachments: formattedAttachments,
        };
    }
}
_AgentRuntime_conversationLength = new WeakMap();
const formatKnowledge = (knowledge) => {
    // Group related content in a more natural way
    return knowledge.map(item => {
        // Get the main content text
        const text = item.content.text;
        // Clean up formatting but maintain natural text flow
        const cleanedText = text
            .trim()
            .replace(/\n{3,}/g, '\n\n'); // Replace excessive newlines
        return cleanedText;
    }).join('\n\n'); // Separate distinct pieces with double newlines
};
//# sourceMappingURL=runtime.js.map