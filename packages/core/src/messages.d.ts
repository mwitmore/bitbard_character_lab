import type { IAgentRuntime, Actor, Memory, UUID } from "./types.ts";
/**
 * Get details for a list of actors.
 */
export declare function getActorDetails({ runtime, roomId, }: {
    runtime: IAgentRuntime;
    roomId: UUID;
}): Promise<Actor[]>;
/**
 * Format actors into a string
 * @param actors - list of actors
 * @returns string
 */
export declare function formatActors({ actors }: {
    actors: Actor[];
}): string;
/**
 * Format messages into a string
 * @param messages - list of messages
 * @param actors - list of actors
 * @returns string
 */
export declare const formatMessages: ({ messages, actors, }: {
    messages: Memory[];
    actors: Actor[];
}) => string;
export declare const formatTimestamp: (messageDate: number) => string;
//# sourceMappingURL=messages.d.ts.map