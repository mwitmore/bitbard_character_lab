export const getGoals = async ({ runtime, roomId, userId, onlyInProgress = true, count = 5, }) => {
    return runtime.databaseAdapter.getGoals({
        agentId: runtime.agentId,
        roomId,
        userId,
        onlyInProgress,
        count,
    });
};
export const formatGoalsAsString = ({ goals }) => {
    const goalStrings = goals.map((goal) => {
        const header = `Goal: ${goal.name}\nid: ${goal.id}`;
        const objectives = "Objectives:\n" +
            goal.objectives
                .map((objective) => {
                return `- ${objective.completed ? "[x]" : "[ ]"} ${objective.description} ${objective.completed ? " (DONE)" : " (IN PROGRESS)"}`;
            })
                .join("\n");
        return `${header}\n${objectives}`;
    });
    return goalStrings.join("\n");
};
export const updateGoal = async ({ runtime, goal, }) => {
    return runtime.databaseAdapter.updateGoal(goal);
};
export const createGoal = async ({ runtime, goal, }) => {
    return runtime.databaseAdapter.createGoal(goal);
};
//# sourceMappingURL=goals.js.map