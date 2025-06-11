import type { IAgentRuntime, State, Memory } from "./types.ts";
/**
 * Formats provider outputs into a string which can be injected into the context.
 * @param runtime The AgentRuntime object.
 * @param message The incoming message object.
 * @param state The current state object.
 * @returns A string that concatenates the outputs of each provider.
 */
export declare function getProviders(runtime: IAgentRuntime, message: Memory, state?: State): Promise<string>;
//# sourceMappingURL=providers.d.ts.map