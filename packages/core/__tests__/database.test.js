/* eslint-disable no-dupe-class-members */
import { DatabaseAdapter } from "../src/database.ts";
import { GoalStatus, } from "../src/types.ts";
class MockDatabaseAdapter extends DatabaseAdapter {
    constructor() {
        super(...arguments);
        this.db = {};
    }
    getMemoryById(_id) {
        throw new Error("Method not implemented.");
    }
    async getMemoriesByIds(memoryIds, _tableName) {
        return memoryIds.map((id) => ({
            id: id,
            content: { text: "Test Memory" },
            roomId: "room-id",
            userId: "user-id",
            agentId: "agent-id",
        }));
    }
    log(_params) {
        throw new Error("Method not implemented.");
    }
    getActorDetails(_params) {
        throw new Error("Method not implemented.");
    }
    searchMemoriesByEmbedding(_embedding, _params) {
        throw new Error("Method not implemented.");
    }
    createMemory(_memory, _tableName, _unique) {
        throw new Error("Method not implemented.");
    }
    removeMemory(_memoryId, _tableName) {
        throw new Error("Method not implemented.");
    }
    removeAllMemories(_roomId, _tableName) {
        throw new Error("Method not implemented.");
    }
    countMemories(_roomId, _unique, _tableName) {
        throw new Error("Method not implemented.");
    }
    getGoals(_params) {
        throw new Error("Method not implemented.");
    }
    updateGoal(_goal) {
        throw new Error("Method not implemented.");
    }
    createGoal(_goal) {
        throw new Error("Method not implemented.");
    }
    removeGoal(_goalId) {
        throw new Error("Method not implemented.");
    }
    removeAllGoals(_roomId) {
        throw new Error("Method not implemented.");
    }
    getRoom(_roomId) {
        throw new Error("Method not implemented.");
    }
    createRoom(_roomId) {
        throw new Error("Method not implemented.");
    }
    removeRoom(_roomId) {
        throw new Error("Method not implemented.");
    }
    getRoomsForParticipant(_userId) {
        throw new Error("Method not implemented.");
    }
    getRoomsForParticipants(_userIds) {
        throw new Error("Method not implemented.");
    }
    addParticipant(_userId, _roomId) {
        throw new Error("Method not implemented.");
    }
    removeParticipant(_userId, _roomId) {
        throw new Error("Method not implemented.");
    }
    getParticipantsForAccount(_userId) {
        throw new Error("Method not implemented.");
    }
    getParticipantsForRoom(_roomId) {
        throw new Error("Method not implemented.");
    }
    getParticipantUserState(_roomId, _userId) {
        throw new Error("Method not implemented.");
    }
    setParticipantUserState(_roomId, _userId, _state) {
        throw new Error("Method not implemented.");
    }
    createRelationship(_params) {
        throw new Error("Method not implemented.");
    }
    getRelationship(_params) {
        throw new Error("Method not implemented.");
    }
    getRelationships(_params) {
        throw new Error("Method not implemented.");
    }
    // Mock method for getting memories by room IDs
    async getMemoriesByRoomIds(params) {
        return [
            {
                id: "memory-id",
                content: "Test Memory",
                roomId: params.roomIds[0],
                userId: "user-id",
                agentId: params.agentId ?? "agent-id",
            },
        ];
    }
    // Mock method for getting cached embeddings
    async getCachedEmbeddings(_params) {
        return [
            {
                embedding: [0.1, 0.2, 0.3],
                levenshtein_distance: 0.4,
            },
        ];
    }
    // Mock method for searching memories
    async searchMemories(params) {
        return [
            {
                id: "memory-id",
                content: "Test Memory",
                roomId: params.roomId,
                userId: "user-id",
                agentId: "agent-id",
            },
        ];
    }
    // Mock method for getting account by ID
    async getAccountById(userId) {
        return {
            id: userId,
            username: "testuser",
            name: "Test Account",
        };
    }
    // Other methods stay the same...
    async createAccount(_account) {
        return true;
    }
    async getMemories(params) {
        return [
            {
                id: "memory-id",
                content: "Test Memory",
                roomId: params.roomId,
                userId: "user-id",
                agentId: "agent-id",
            },
        ];
    }
    async getActors(_params) {
        return [
            {
                id: "actor-id",
                name: "Test Actor",
                username: "testactor",
                roomId: "room-id", // Ensure roomId is provided
            },
        ];
    }
    async updateGoalStatus(_params) {
        return Promise.resolve();
    }
    async getGoalById(goalId) {
        return {
            id: goalId,
            status: GoalStatus.IN_PROGRESS,
            roomId: "room-id",
            userId: "user-id",
            name: "Test Goal",
            objectives: [],
        };
    }
}
// Now, let’s fix the test suite.
describe("DatabaseAdapter Tests", () => {
    let adapter;
    const roomId = "room-id";
    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
    });
    it("should return memories by room ID", async () => {
        const memories = await adapter.getMemoriesByRoomIds({
            roomIds: [
                "room-id",
            ],
            tableName: "test_table",
        });
        expect(memories).toHaveLength(1);
        expect(memories[0].roomId).toBe("room-id");
    });
    it("should return cached embeddings", async () => {
        const embeddings = await adapter.getCachedEmbeddings({
            query_table_name: "test_table",
            query_threshold: 0.5,
            query_input: "test query",
            query_field_name: "field",
            query_field_sub_name: "subfield",
            query_match_count: 5,
        });
        expect(embeddings).toHaveLength(1);
        expect(embeddings[0].embedding).toEqual([0.1, 0.2, 0.3]);
    });
    it("should search memories based on embedding", async () => {
        const memories = await adapter.searchMemories({
            tableName: "test_table",
            roomId: "room-id",
            embedding: [0.1, 0.2, 0.3],
            match_threshold: 0.5,
            match_count: 3,
            unique: true,
        });
        expect(memories).toHaveLength(1);
        expect(memories[0].roomId).toBe("room-id");
    });
    it("should get an account by user ID", async () => {
        const account = await adapter.getAccountById("test-user-id");
        expect(account).not.toBeNull();
        expect(account.username).toBe("testuser");
    });
    it("should create a new account", async () => {
        const newAccount = {
            id: "new-user-id",
            username: "newuser",
            name: "New Account",
        };
        const result = await adapter.createAccount(newAccount);
        expect(result).toBe(true);
    });
    it("should update the goal status", async () => {
        const goalId = "goal-id";
        await expect(adapter.updateGoalStatus({ goalId, status: GoalStatus.IN_PROGRESS })).resolves.toBeUndefined();
    });
    it("should return actors by room ID", async () => {
        const actors = await adapter.getActors({ roomId });
        expect(actors).toHaveLength(1);
    });
    it("should get a goal by ID", async () => {
        const goalId = "goal-id";
        const goal = await adapter.getGoalById(goalId);
        expect(goal).not.toBeNull();
        expect(goal?.status).toBe(GoalStatus.IN_PROGRESS);
    });
});
//# sourceMappingURL=database.test.js.map