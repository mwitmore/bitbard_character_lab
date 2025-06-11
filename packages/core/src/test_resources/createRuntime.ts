import { AgentRuntime } from "../runtime";
import { type Character, ModelProviderName, IDatabaseAdapter, UUID, Account, Memory, Goal, GoalStatus, Actor, Participant, Relationship, RAGKnowledgeItem } from "../types";

// Mock database adapter for testing
class MockDatabaseAdapter implements IDatabaseAdapter {
    db: any = null;
    
    async init(): Promise<void> {}
    async close(): Promise<void> {}
    async query<T>(sql: string, params?: any[]): Promise<T[]> { return []; }
    async execute(sql: string, params?: any[]): Promise<void> {}
    
    // Account methods
    async getAccountById(userId: UUID): Promise<Account | null> { return null; }
    async createAccount(account: Account): Promise<boolean> { return true; }
    
    // Memory methods
    async getMemories(params: { roomId: UUID; count?: number; unique?: boolean; tableName: string; agentId: UUID; start?: number; end?: number; }): Promise<Memory[]> { return []; }
    async getMemoryById(id: UUID): Promise<Memory | null> { return null; }
    async getMemoriesByIds(ids: UUID[], tableName?: string): Promise<Memory[]> { return []; }
    async getMemoriesByRoomIds(params: { tableName: string; agentId: UUID; roomIds: UUID[]; limit?: number; }): Promise<Memory[]> { return []; }
    async getCachedEmbeddings(params: { query_table_name: string; query_threshold: number; query_input: string; query_field_name: string; query_field_sub_name: string; query_match_count: number; }): Promise<{ embedding: number[]; levenshtein_score: number; }[]> { return []; }
    async searchMemories(params: { tableName: string; agentId: UUID; roomId: UUID; embedding: number[]; match_threshold: number; match_count: number; unique: boolean; }): Promise<Memory[]> { return []; }
    async searchMemoriesByEmbedding(embedding: number[], params: { match_threshold?: number; count?: number; roomId?: UUID; agentId?: UUID; unique?: boolean; tableName: string; }): Promise<Memory[]> { return []; }
    async createMemory(memory: Memory, tableName: string, unique?: boolean): Promise<void> {}
    async removeMemory(memoryId: UUID, tableName: string): Promise<void> {}
    async removeAllMemories(roomId: UUID, tableName: string): Promise<void> {}
    async countMemories(roomId: UUID, unique?: boolean, tableName?: string): Promise<number> { return 0; }
    
    // Goal methods
    async updateGoalStatus(params: { goalId: UUID; status: GoalStatus; }): Promise<void> {}
    async getGoals(params: { agentId: UUID; roomId: UUID; userId?: UUID | null; onlyInProgress?: boolean; count?: number; }): Promise<Goal[]> { return []; }
    async updateGoal(goal: Goal): Promise<void> {}
    async createGoal(goal: Goal): Promise<void> {}
    async removeGoal(goalId: UUID): Promise<void> {}
    async removeAllGoals(roomId: UUID): Promise<void> {}
    
    // Room methods
    async getRoom(roomId: UUID): Promise<UUID | null> { return null; }
    async createRoom(roomId?: UUID): Promise<UUID> { return "test-room-id" as UUID; }
    async removeRoom(roomId: UUID): Promise<void> {}
    async getRoomsForParticipant(userId: UUID): Promise<UUID[]> { return []; }
    async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> { return []; }
    
    // Participant methods
    async addParticipant(userId: UUID, roomId: UUID): Promise<boolean> { return true; }
    async removeParticipant(userId: UUID, roomId: UUID): Promise<boolean> { return true; }
    async getParticipantsForAccount(userId: UUID): Promise<Participant[]> { return []; }
    async getParticipantsForRoom(roomId: UUID): Promise<UUID[]> { return []; }
    async getParticipantUserState(roomId: UUID, userId: UUID): Promise<"FOLLOWED" | "MUTED" | null> { return null; }
    async setParticipantUserState(roomId: UUID, userId: UUID, state: "FOLLOWED" | "MUTED" | null): Promise<void> {}
    
    // Relationship methods
    async createRelationship(params: { userA: UUID; userB: UUID; }): Promise<boolean> { return true; }
    async getRelationship(params: { userA: UUID; userB: UUID; }): Promise<Relationship | null> { return null; }
    async getRelationships(params: { userId: UUID; }): Promise<Relationship[]> { return []; }
    
    // Knowledge methods
    async getKnowledge(params: { id?: UUID; agentId: UUID; limit?: number; query?: string; conversationContext?: string; }): Promise<RAGKnowledgeItem[]> { return []; }
    async searchKnowledge(params: { agentId: UUID; embedding: Float32Array; match_threshold: number; match_count: number; searchText?: string; }): Promise<RAGKnowledgeItem[]> { return []; }
    async createKnowledge(knowledge: RAGKnowledgeItem): Promise<void> {}
    async removeKnowledge(id: UUID): Promise<void> {}
    async clearKnowledge(agentId: UUID, shared?: boolean): Promise<void> {}
    
    // Logging method
    async log(params: { body: { [key: string]: unknown; }; userId: UUID; roomId: UUID; type: string; }): Promise<void> {}
    
    // Actor method
    async getActorDetails(params: { roomId: UUID; }): Promise<Actor[]> { return []; }
}

export async function createTestRuntime(character: Character): Promise<AgentRuntime> {
    const runtime = new AgentRuntime({
        character,
        token: "test-token",
        modelProvider: ModelProviderName.OPENAI,
        databaseAdapter: new MockDatabaseAdapter()
    });
    await runtime.initialize();
    return runtime;
}
