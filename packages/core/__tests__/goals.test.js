import { getGoals, formatGoalsAsString, updateGoal, createGoal, } from "../src/goals.ts";
import { GoalStatus, } from "../src/types.ts";
import { CacheManager, MemoryCacheAdapter } from "../src/cache.ts";
import { describe, expect, vi, beforeEach } from "vitest";
// Mock the database adapter
export const mockDatabaseAdapter = {
    getGoals: vi.fn(),
    updateGoal: vi.fn(),
    createGoal: vi.fn(),
};
const services = new Map();
// Mock the runtime
export const mockRuntime = {
    databaseAdapter: mockDatabaseAdapter,
    cacheManager: new CacheManager(new MemoryCacheAdapter()),
    agentId: "qweqew-qweqwe-qweqwe-qweqwe-qweeqw",
    serverUrl: "",
    token: null,
    messageManager: {
        addEmbeddingToMemory: (_memory) => {
            throw new Error("Function not implemented.");
        },
        getMemories: (_opts) => {
            throw new Error("Function not implemented.");
        },
        getCachedEmbeddings: (_content) => {
            throw new Error("Function not implemented.");
        },
        getMemoryById: (_id) => {
            throw new Error("Function not implemented.");
        },
        getMemoriesByRoomIds: (_params) => {
            throw new Error("Function not implemented.");
        },
        searchMemoriesByEmbedding: (_embedding, _opts) => {
            throw new Error("Function not implemented.");
        },
        createMemory: (_memory, _unique) => {
            throw new Error("Function not implemented.");
        },
        removeMemory: (_memoryId) => {
            throw new Error("Function not implemented.");
        },
        removeAllMemories: (_roomId) => {
            throw new Error("Function not implemented.");
        },
        countMemories: (_roomId, _unique) => {
            throw new Error("Function not implemented.");
        },
    },
    descriptionManager: {
        addEmbeddingToMemory: (_memory) => {
            throw new Error("Function not implemented.");
        },
        getMemories: (_opts) => {
            throw new Error("Function not implemented.");
        },
        getCachedEmbeddings: (_content) => {
            throw new Error("Function not implemented.");
        },
        getMemoryById: (_id) => {
            throw new Error("Function not implemented.");
        },
        getMemoriesByRoomIds: (_params) => {
            throw new Error("Function not implemented.");
        },
        searchMemoriesByEmbedding: (_embedding, _opts) => {
            throw new Error("Function not implemented.");
        },
        createMemory: (_memory, _unique) => {
            throw new Error("Function not implemented.");
        },
        removeMemory: (_memoryId) => {
            throw new Error("Function not implemented.");
        },
        removeAllMemories: (_roomId) => {
            throw new Error("Function not implemented.");
        },
        countMemories: (_roomId, _unique) => {
            throw new Error("Function not implemented.");
        },
    },
    loreManager: {
        addEmbeddingToMemory: (_memory) => {
            throw new Error("Function not implemented.");
        },
        getMemories: (_opts) => {
            throw new Error("Function not implemented.");
        },
        getCachedEmbeddings: (_content) => {
            throw new Error("Function not implemented.");
        },
        getMemoryById: (_id) => {
            throw new Error("Function not implemented.");
        },
        getMemoriesByRoomIds: (_params) => {
            throw new Error("Function not implemented.");
        },
        searchMemoriesByEmbedding: (_embedding, _opts) => {
            throw new Error("Function not implemented.");
        },
        createMemory: (_memory, _unique) => {
            throw new Error("Function not implemented.");
        },
        removeMemory: (_memoryId) => {
            throw new Error("Function not implemented.");
        },
        removeAllMemories: (_roomId) => {
            throw new Error("Function not implemented.");
        },
        countMemories: (_roomId, _unique) => {
            throw new Error("Function not implemented.");
        },
    },
    ensureRoomExists: (_roomId) => {
        throw new Error("Function not implemented.");
    },
    composeState: (_message, _additionalKeys) => {
        throw new Error("Function not implemented.");
    },
    updateRecentMessageState: (_state) => {
        throw new Error("Function not implemented.");
    },
    getService: (serviceType) => services.get(serviceType) || null,
    plugins: [],
    initialize: () => {
        throw new Error("Function not implemented.");
    },
};
// Sample data
const sampleGoal = {
    id: "goal-id",
    roomId: "room-id",
    userId: "user-id",
    name: "Test Goal",
    objectives: [
        { description: "Objective 1", completed: false },
        { description: "Objective 2", completed: true },
    ],
    status: GoalStatus.IN_PROGRESS,
};
describe("getGoals", () => {
    let runtime;
    beforeEach(() => {
        runtime = {
            agentId: "test-agent-id",
            databaseAdapter: {
                getGoals: vi.fn().mockResolvedValue([]),
            },
        };
    });
    it("retrieves goals successfully", async () => {
        mockDatabaseAdapter.getGoals.mockResolvedValue([sampleGoal]);
        const result = await getGoals({
            runtime: mockRuntime,
            roomId: "room-id",
        });
        expect(result).toEqual([sampleGoal]);
    });
    it("handles errors when retrieving goals", async () => {
        mockDatabaseAdapter.getGoals.mockRejectedValue(new Error("Failed to retrieve goals"));
        await expect(getGoals({
            runtime: mockRuntime,
            roomId: "room-id",
        })).rejects.toThrow("Failed to retrieve goals");
    });
    it("should handle empty goals list", async () => {
        const mockRuntime = {
            agentId: "test-agent-id",
            databaseAdapter: {
                getGoals: vi.fn().mockResolvedValue([]),
            },
        };
        const roomId = "test-room";
        await getGoals({ runtime: mockRuntime, roomId });
        expect(mockRuntime.databaseAdapter.getGoals).toHaveBeenCalledWith({
            agentId: "test-agent-id",
            roomId,
            onlyInProgress: true,
            count: 5,
        });
    });
});
describe("formatGoalsAsString", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("formats goals correctly", () => {
        const formatted = formatGoalsAsString({ goals: [sampleGoal] });
        expect(formatted).toContain("Goal: Test Goal");
        expect(formatted).toContain("- [ ] Objective 1  (IN PROGRESS)");
        expect(formatted).toContain("- [x] Objective 2  (DONE)");
    });
    it("handles empty goals array", () => {
        const formatted = formatGoalsAsString({ goals: [] });
        expect(formatted).toBe("");
    });
    it("should format goals as string correctly", () => {
        const goals = [
            {
                id: "1",
                name: "Goal 1",
                status: GoalStatus.IN_PROGRESS,
                objectives: [
                    {
                        id: "obj1",
                        description: "Objective 1",
                        completed: true,
                    },
                    {
                        id: "obj2",
                        description: "Objective 2",
                        completed: false,
                    },
                ],
                roomId: "test-room",
                userId: "test-user",
            },
            {
                id: "2",
                name: "Goal 2",
                status: GoalStatus.DONE,
                objectives: [
                    {
                        id: "obj3",
                        description: "Objective 3",
                        completed: true,
                    },
                ],
                roomId: "test-room",
                userId: "test-user",
            },
        ];
        const formattedGoals = formatGoalsAsString({ goals });
        expect(formattedGoals).toContain("Goal: Goal 1");
        expect(formattedGoals).toContain("id: 1");
        expect(formattedGoals).toContain("- [x] Objective 1  (DONE)");
        expect(formattedGoals).toContain("- [ ] Objective 2  (IN PROGRESS)");
        expect(formattedGoals).toContain("Goal: Goal 2");
        expect(formattedGoals).toContain("id: 2");
        expect(formattedGoals).toContain("- [x] Objective 3  (DONE)");
    });
});
describe("updateGoal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("updates a goal successfully", async () => {
        mockDatabaseAdapter.updateGoal.mockResolvedValue(undefined);
        await expect(updateGoal({ runtime: mockRuntime, goal: sampleGoal })).resolves.not.toThrow();
        expect(mockDatabaseAdapter.updateGoal).toHaveBeenCalledWith(sampleGoal);
    });
    it("handles errors when updating a goal", async () => {
        mockDatabaseAdapter.updateGoal.mockRejectedValue(new Error("Failed to update goal"));
        await expect(updateGoal({ runtime: mockRuntime, goal: sampleGoal })).rejects.toThrow("Failed to update goal");
    });
    it("should update goal status correctly", async () => {
        const goalId = "test-goal";
        const mockRuntime = {
            databaseAdapter: { updateGoal: vi.fn() },
            agentId: "test-agent-id",
        };
        const updatedGoal = {
            id: goalId,
            name: "Test Goal",
            objectives: [
                {
                    description: "Objective 1",
                    completed: false,
                },
                {
                    description: "Objective 2",
                    completed: true,
                },
            ],
            roomId: "room-id",
            userId: "user-id",
            status: GoalStatus.DONE,
        };
        await updateGoal({
            runtime: mockRuntime,
            goal: updatedGoal,
        });
        expect(mockRuntime.databaseAdapter.updateGoal).toHaveBeenCalledWith(updatedGoal);
    });
    it("should handle failed goal update", async () => {
        const goalId = "test-goal";
        const mockRuntime = {
            databaseAdapter: { updateGoal: vi.fn() },
            agentId: "test-agent-id",
        };
        const updatedGoal = {
            id: goalId,
            name: "Test Goal",
            objectives: [
                {
                    description: "Objective 1",
                    completed: false,
                },
                {
                    description: "Objective 2",
                    completed: true,
                },
            ],
            roomId: "room-id",
            userId: "user-id",
            status: GoalStatus.FAILED,
        };
        await updateGoal({
            runtime: mockRuntime,
            goal: updatedGoal,
        });
        expect(mockRuntime.databaseAdapter.updateGoal).toHaveBeenCalledWith(updatedGoal);
    });
    it("should handle in-progress goal update", async () => {
        const goalId = "test-goal";
        const mockRuntime = {
            databaseAdapter: { updateGoal: vi.fn() },
            agentId: "test-agent-id",
        };
        const updatedGoal = {
            id: goalId,
            name: "Test Goal",
            objectives: [
                {
                    description: "Objective 1",
                    completed: false,
                },
                {
                    description: "Objective 2",
                    completed: true,
                },
            ],
            roomId: "room-id",
            userId: "user-id",
            status: GoalStatus.IN_PROGRESS,
        };
        await updateGoal({
            runtime: mockRuntime,
            goal: updatedGoal,
        });
        expect(mockRuntime.databaseAdapter.updateGoal).toHaveBeenCalledWith(updatedGoal);
    });
    it("should handle goal priority updates", async () => {
        const goalId = "test-goal";
        const mockRuntime = {
            databaseAdapter: { updateGoal: vi.fn() },
            agentId: "test-agent-id",
        };
        const updatedGoal = {
            id: goalId,
            name: "Test Goal",
            objectives: [
                {
                    description: "Objective 1",
                    completed: false,
                },
                {
                    description: "Objective 2",
                    completed: true,
                },
            ],
            roomId: "room-id",
            userId: "user-id",
            status: GoalStatus.IN_PROGRESS,
        };
        await updateGoal({
            runtime: mockRuntime,
            goal: updatedGoal,
        });
        expect(mockRuntime.databaseAdapter.updateGoal).toHaveBeenCalledWith(updatedGoal);
    });
});
describe("createGoal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("creates a goal successfully", async () => {
        mockDatabaseAdapter.createGoal.mockResolvedValue(undefined);
        await expect(createGoal({ runtime: mockRuntime, goal: sampleGoal })).resolves.not.toThrow();
        expect(mockDatabaseAdapter.createGoal).toHaveBeenCalledWith(sampleGoal);
    });
    it("handles errors when creating a goal", async () => {
        mockDatabaseAdapter.createGoal.mockRejectedValue(new Error("Failed to create goal"));
        await expect(createGoal({ runtime: mockRuntime, goal: sampleGoal })).rejects.toThrow("Failed to create goal");
    });
    it("should create new goal with correct properties", async () => {
        const newGoal = {
            name: "New Goal",
            roomId: "room-id",
            userId: "user-id",
            status: GoalStatus.IN_PROGRESS,
            objectives: [],
        };
        const mockRuntime = {
            databaseAdapter: { createGoal: vi.fn() },
            agentId: "test-agent-id",
        };
        await createGoal({
            runtime: mockRuntime,
            goal: newGoal,
        });
        expect(mockRuntime.databaseAdapter.createGoal).toHaveBeenCalledWith(expect.objectContaining({
            name: "New Goal",
            roomId: "room-id",
            userId: "user-id",
            status: GoalStatus.IN_PROGRESS,
            objectives: [],
        }));
    });
    it("should create a new goal", async () => {
        const mockRuntime = {
            databaseAdapter: { createGoal: vi.fn() },
            agentId: "test-agent-id",
        };
        const newGoal = {
            id: "new-goal",
            name: "New Goal",
            objectives: [],
            roomId: "test-room",
            userId: "test-user",
            status: GoalStatus.IN_PROGRESS,
        };
        await createGoal({
            runtime: mockRuntime,
            goal: newGoal,
        });
        expect(mockRuntime.databaseAdapter.createGoal).toHaveBeenCalledWith(newGoal);
    });
});
//# sourceMappingURL=goals.test.js.map