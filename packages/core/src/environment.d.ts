import { z } from "zod";
export declare const envSchema: z.ZodObject<{
    OPENAI_API_KEY: z.ZodString;
    REDPILL_API_KEY: z.ZodString;
    GROK_API_KEY: z.ZodString;
    GROQ_API_KEY: z.ZodString;
    OPENROUTER_API_KEY: z.ZodString;
    GOOGLE_GENERATIVE_AI_API_KEY: z.ZodString;
    ELEVENLABS_XI_API_KEY: z.ZodString;
}, "strip", z.ZodTypeAny, {
    OPENAI_API_KEY?: string;
    ELEVENLABS_XI_API_KEY?: string;
    REDPILL_API_KEY?: string;
    GROK_API_KEY?: string;
    GROQ_API_KEY?: string;
    OPENROUTER_API_KEY?: string;
    GOOGLE_GENERATIVE_AI_API_KEY?: string;
}, {
    OPENAI_API_KEY?: string;
    ELEVENLABS_XI_API_KEY?: string;
    REDPILL_API_KEY?: string;
    GROK_API_KEY?: string;
    GROQ_API_KEY?: string;
    OPENROUTER_API_KEY?: string;
    GOOGLE_GENERATIVE_AI_API_KEY?: string;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
export declare function validateEnv(): EnvConfig;
export declare const CharacterSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    system: z.ZodOptional<z.ZodString>;
    modelProvider: z.ZodNativeEnum<any>;
    modelEndpointOverride: z.ZodOptional<z.ZodString>;
    templates: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    bio: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    lore: z.ZodArray<z.ZodString, "many">;
    messageExamples: z.ZodArray<z.ZodArray<z.ZodObject<{
        user: z.ZodString;
        content: z.ZodIntersection<z.ZodObject<{
            text: z.ZodString;
            action: z.ZodOptional<z.ZodString>;
            source: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            inReplyTo: z.ZodOptional<z.ZodString>;
            attachments: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        }, "strip", z.ZodTypeAny, {
            text?: string;
            url?: string;
            source?: string;
            attachments?: any[];
            inReplyTo?: string;
            action?: string;
        }, {
            text?: string;
            url?: string;
            source?: string;
            attachments?: any[];
            inReplyTo?: string;
            action?: string;
        }>, z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        content?: {
            text?: string;
            url?: string;
            source?: string;
            attachments?: any[];
            inReplyTo?: string;
            action?: string;
        } & Record<string, unknown>;
        user?: string;
    }, {
        content?: {
            text?: string;
            url?: string;
            source?: string;
            attachments?: any[];
            inReplyTo?: string;
            action?: string;
        } & Record<string, unknown>;
        user?: string;
    }>, "many">, "many">;
    postExamples: z.ZodArray<z.ZodString, "many">;
    topics: z.ZodArray<z.ZodString, "many">;
    adjectives: z.ZodArray<z.ZodString, "many">;
    knowledge: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        path: z.ZodString;
        shared: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        path?: string;
        shared?: boolean;
    }, {
        path?: string;
        shared?: boolean;
    }>, z.ZodObject<{
        directory: z.ZodString;
        shared: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        shared?: boolean;
        directory?: string;
    }, {
        shared?: boolean;
        directory?: string;
    }>]>, "many">>;
    plugins: z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        actions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        providers: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        evaluators: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        services: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        clients: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        clients?: any[];
        description?: string;
        actions?: any[];
        providers?: any[];
        evaluators?: any[];
        services?: any[];
    }, {
        name?: string;
        clients?: any[];
        description?: string;
        actions?: any[];
        providers?: any[];
        evaluators?: any[];
        services?: any[];
    }>, "many">]>;
    settings: z.ZodOptional<z.ZodObject<{
        secrets: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        voice: z.ZodOptional<z.ZodObject<{
            model: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url?: string;
            model?: string;
        }, {
            url?: string;
            model?: string;
        }>>;
        model: z.ZodOptional<z.ZodString>;
        modelConfig: z.ZodOptional<z.ZodObject<{
            maxInputTokens: z.ZodOptional<z.ZodNumber>;
            maxOutputTokens: z.ZodOptional<z.ZodNumber>;
            temperature: z.ZodOptional<z.ZodNumber>;
            frequency_penalty: z.ZodOptional<z.ZodNumber>;
            presence_penalty: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            temperature?: number;
            maxInputTokens?: number;
            maxOutputTokens?: number;
            frequency_penalty?: number;
            presence_penalty?: number;
        }, {
            temperature?: number;
            maxInputTokens?: number;
            maxOutputTokens?: number;
            frequency_penalty?: number;
            presence_penalty?: number;
        }>>;
        embeddingModel: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string;
        secrets?: Record<string, string>;
        voice?: {
            url?: string;
            model?: string;
        };
        modelConfig?: {
            temperature?: number;
            maxInputTokens?: number;
            maxOutputTokens?: number;
            frequency_penalty?: number;
            presence_penalty?: number;
        };
        embeddingModel?: string;
    }, {
        model?: string;
        secrets?: Record<string, string>;
        voice?: {
            url?: string;
            model?: string;
        };
        modelConfig?: {
            temperature?: number;
            maxInputTokens?: number;
            maxOutputTokens?: number;
            frequency_penalty?: number;
            presence_penalty?: number;
        };
        embeddingModel?: string;
    }>>;
    clientConfig: z.ZodOptional<z.ZodObject<{
        discord: z.ZodOptional<z.ZodObject<{
            shouldIgnoreBotMessages: z.ZodOptional<z.ZodBoolean>;
            shouldIgnoreDirectMessages: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            shouldIgnoreBotMessages?: boolean;
            shouldIgnoreDirectMessages?: boolean;
        }, {
            shouldIgnoreBotMessages?: boolean;
            shouldIgnoreDirectMessages?: boolean;
        }>>;
        telegram: z.ZodOptional<z.ZodObject<{
            shouldIgnoreBotMessages: z.ZodOptional<z.ZodBoolean>;
            shouldIgnoreDirectMessages: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            shouldIgnoreBotMessages?: boolean;
            shouldIgnoreDirectMessages?: boolean;
        }, {
            shouldIgnoreBotMessages?: boolean;
            shouldIgnoreDirectMessages?: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        discord?: {
            shouldIgnoreBotMessages?: boolean;
            shouldIgnoreDirectMessages?: boolean;
        };
        telegram?: {
            shouldIgnoreBotMessages?: boolean;
            shouldIgnoreDirectMessages?: boolean;
        };
    }, {
        discord?: {
            shouldIgnoreBotMessages?: boolean;
            shouldIgnoreDirectMessages?: boolean;
        };
        telegram?: {
            shouldIgnoreBotMessages?: boolean;
            shouldIgnoreDirectMessages?: boolean;
        };
    }>>;
    style: z.ZodObject<{
        all: z.ZodArray<z.ZodString, "many">;
        chat: z.ZodArray<z.ZodString, "many">;
        post: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        post?: string[];
        all?: string[];
        chat?: string[];
    }, {
        post?: string[];
        all?: string[];
        chat?: string[];
    }>;
    twitterProfile: z.ZodOptional<z.ZodObject<{
        username: z.ZodString;
        screenName: z.ZodString;
        bio: z.ZodString;
        nicknames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        bio?: string;
        username?: string;
        screenName?: string;
        nicknames?: string[];
    }, {
        bio?: string;
        username?: string;
        screenName?: string;
        nicknames?: string[];
    }>>;
    nft: z.ZodOptional<z.ZodObject<{
        prompt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        prompt?: string;
    }, {
        prompt?: string;
    }>>;
    extends: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    [x: string]: any;
    id?: unknown;
    name?: unknown;
    system?: unknown;
    modelProvider?: unknown;
    modelEndpointOverride?: unknown;
    templates?: unknown;
    bio?: unknown;
    lore?: unknown;
    messageExamples?: unknown;
    postExamples?: unknown;
    topics?: unknown;
    adjectives?: unknown;
    knowledge?: unknown;
    plugins?: unknown;
    settings?: unknown;
    clientConfig?: unknown;
    style?: unknown;
    twitterProfile?: unknown;
    nft?: unknown;
    extends?: unknown;
}, {
    [x: string]: any;
    id?: unknown;
    name?: unknown;
    system?: unknown;
    modelProvider?: unknown;
    modelEndpointOverride?: unknown;
    templates?: unknown;
    bio?: unknown;
    lore?: unknown;
    messageExamples?: unknown;
    postExamples?: unknown;
    topics?: unknown;
    adjectives?: unknown;
    knowledge?: unknown;
    plugins?: unknown;
    settings?: unknown;
    clientConfig?: unknown;
    style?: unknown;
    twitterProfile?: unknown;
    nft?: unknown;
    extends?: unknown;
}>;
export type CharacterConfig = z.infer<typeof CharacterSchema>;
export declare function validateCharacterConfig(json: unknown): CharacterConfig;
//# sourceMappingURL=environment.d.ts.map