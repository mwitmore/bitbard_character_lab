export async function createRelationship({ runtime, userA, userB, }) {
    return runtime.databaseAdapter.createRelationship({
        userA,
        userB,
    });
}
export async function getRelationship({ runtime, userA, userB, }) {
    return runtime.databaseAdapter.getRelationship({
        userA,
        userB,
    });
}
export async function getRelationships({ runtime, userId, }) {
    return runtime.databaseAdapter.getRelationships({ userId });
}
export async function formatRelationships({ runtime, userId, }) {
    const relationships = await getRelationships({ runtime, userId });
    const formattedRelationships = relationships.map((relationship) => {
        const { userA, userB } = relationship;
        if (userA === userId) {
            return userB;
        }
        return userA;
    });
    return formattedRelationships;
}
//# sourceMappingURL=relationships.js.map