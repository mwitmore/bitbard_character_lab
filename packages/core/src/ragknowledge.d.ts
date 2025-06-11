import { type IAgentRuntime, type IRAGKnowledgeManager, type RAGKnowledgeItem, type UUID } from "./types.ts";
/**
 * Manage knowledge in the database.
 */
export declare class RAGKnowledgeManager implements IRAGKnowledgeManager {
    /**
     * The AgentRuntime instance associated with this manager.
     */
    runtime: IAgentRuntime;
    /**
     * The name of the database table this manager operates on.
     */
    tableName: string;
    /**
     * The root directory where RAG knowledge files are located (internal)
     */
    knowledgeRoot: string;
    /**
     * Constructs a new KnowledgeManager instance.
     * @param opts Options for the manager.
     * @param opts.tableName The name of the table this manager will operate on.
     * @param opts.runtime The AgentRuntime instance associated with this manager.
     */
    constructor(opts: {
        tableName: string;
        runtime: IAgentRuntime;
        knowledgeRoot: string;
    });
    private readonly defaultRAGMatchThreshold;
    private readonly defaultRAGMatchCount;
    /**
     * Common English stop words to filter out from query analysis
     */
    private readonly stopWords;
    /**
     * Filters out stop words and returns meaningful terms
     */
    private getQueryTerms;
    /**
     * Preprocesses text content for better RAG performance.
     * @param content The text content to preprocess.
     * @returns The preprocessed text.
     */
    private preprocess;
    private hasProximityMatch;
    getKnowledge(params: {
        query?: string;
        id?: UUID;
        conversationContext?: string;
        limit?: number;
        agentId?: UUID;
    }): Promise<RAGKnowledgeItem[]>;
    createKnowledge(item: RAGKnowledgeItem): Promise<void>;
    searchKnowledge(params: {
        agentId: UUID;
        embedding: Float32Array | number[];
        match_threshold?: number;
        match_count?: number;
        searchText?: string;
    }): Promise<RAGKnowledgeItem[]>;
    removeKnowledge(id: UUID): Promise<void>;
    clearKnowledge(shared?: boolean): Promise<void>;
    /**
     * Lists all knowledge entries for an agent without semantic search or reranking.
     * Used primarily for administrative tasks like cleanup.
     *
     * @param agentId The agent ID to fetch knowledge entries for
     * @returns Array of RAGKnowledgeItem entries
     */
    listAllKnowledge(agentId: UUID): Promise<RAGKnowledgeItem[]>;
    cleanupDeletedKnowledgeFiles(): Promise<void>;
    generateScopedId(path: string, isShared: boolean): UUID;
    processFile(file: {
        path: string;
        content: string;
        type: "pdf" | "md" | "txt";
        isShared?: boolean;
    }): Promise<void>;
}
//# sourceMappingURL=ragknowledge.d.ts.map