import type { IAgentRuntime, Goal, UUID } from "./types.ts";
export declare const getGoals: ({ runtime, roomId, userId, onlyInProgress, count, }: {
    runtime: IAgentRuntime;
    roomId: UUID;
    userId?: UUID;
    onlyInProgress?: boolean;
    count?: number;
}) => Promise<Goal[]>;
export declare const formatGoalsAsString: ({ goals }: {
    goals: Goal[];
}) => string;
export declare const updateGoal: ({ runtime, goal, }: {
    runtime: IAgentRuntime;
    goal: Goal;
}) => Promise<void>;
export declare const createGoal: ({ runtime, goal, }: {
    runtime: IAgentRuntime;
    goal: Goal;
}) => Promise<void>;
//# sourceMappingURL=goals.d.ts.map