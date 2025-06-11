import { MemoryManager } from "../src/memory";
import { CacheManager, MemoryCacheAdapter } from "../src/cache";
import { describe, expect, it, vi, beforeEach } from "vitest";
describe("MemoryManager", () => {
    let memoryManager;
    let mockDatabaseAdapter;
    let mockRuntime;
    beforeEach(() => {
        mockDatabaseAdapter = {
            getMemories: vi.fn(),
            createMemory: vi.fn(),
            removeMemory: vi.fn(),
            removeAllMemories: vi.fn(),
            countMemories: vi.fn(),
            getCachedEmbeddings: vi.fn(),
            searchMemories: vi.fn(),
            getMemoriesByRoomIds: vi.fn(),
            getMemoryById: vi.fn(),
        };
        mockRuntime = {
            databaseAdapter: mockDatabaseAdapter,
            cacheManager: new CacheManager(new MemoryCacheAdapter()),
            agentId: "test-agent-id",
        };
        memoryManager = new MemoryManager({
            tableName: "test_memories",
            runtime: mockRuntime,
        });
    });
    describe("addEmbeddingToMemory", () => {
        it("should preserve existing embedding if present", async () => {
            const existingEmbedding = [0.1, 0.2, 0.3];
            const memory = {
                id: "test-id",
                userId: "user-id",
                agentId: "agent-id",
                roomId: "room-id",
                content: { text: "test content" },
                embedding: existingEmbedding,
            };
            const result = await memoryManager.addEmbeddingToMemory(memory);
            expect(result.embedding).toBe(existingEmbedding);
        });
        it("should throw error for empty content", async () => {
            const memory = {
                id: "test-id",
                userId: "user-id",
                agentId: "agent-id",
                roomId: "room-id",
                content: { text: "" },
            };
            await expect(memoryManager.addEmbeddingToMemory(memory)).rejects.toThrow("Cannot generate embedding: Memory content is empty");
        });
    });
    describe("searchMemoriesByEmbedding", () => {
        it("should use default threshold and count when not provided", async () => {
            const embedding = [0.1, 0.2, 0.3];
            const roomId = "test-room";
            mockDatabaseAdapter.searchMemories = vi.fn().mockResolvedValue([]);
            await memoryManager.searchMemoriesByEmbedding(embedding, {
                roomId,
            });
            expect(mockDatabaseAdapter.searchMemories).toHaveBeenCalledWith({
                embedding,
                match_threshold: 0.1,
                match_count: 10,
                roomId,
                tableName: "test_memories",
                agentId: "test-agent-id",
                unique: false,
            });
        });
        it("should respect custom threshold and count", async () => {
            const embedding = [0.1, 0.2, 0.3];
            const roomId = "test-room";
            const match_threshold = 0.5;
            const count = 5;
            mockDatabaseAdapter.searchMemories = vi.fn().mockResolvedValue([]);
            await memoryManager.searchMemoriesByEmbedding(embedding, {
                roomId,
                match_threshold,
                count,
            });
            expect(mockDatabaseAdapter.searchMemories).toHaveBeenCalledWith({
                embedding,
                match_threshold,
                match_count: count,
                roomId,
                tableName: "test_memories",
                agentId: "test-agent-id",
                unique: false,
            });
        });
    });
    describe("getMemories", () => {
        it("should handle pagination parameters", async () => {
            const roomId = "test-room";
            const start = 0;
            const end = 5;
            await memoryManager.getMemories({ roomId, start, end });
            expect(mockDatabaseAdapter.getMemories).toHaveBeenCalledWith({
                roomId,
                count: 10,
                unique: true,
                tableName: "test_memories",
                agentId: "test-agent-id",
                start: 0,
                end: 5,
            });
        });
    });
});
//# sourceMappingURL=memory.test.js.map