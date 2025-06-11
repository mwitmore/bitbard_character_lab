import type { AgentRuntime } from "./runtime.ts";
import type { KnowledgeItem, Memory } from "./types.ts";
declare function get(runtime: AgentRuntime, message: Memory): Promise<KnowledgeItem[]>;
declare function set(runtime: AgentRuntime, item: KnowledgeItem, chunkSize?: number, bleed?: number): Promise<void>;
export declare function preprocess(content: string): string;
declare const _default: {
    get: typeof get;
    set: typeof set;
    preprocess: typeof preprocess;
};
export default _default;
//# sourceMappingURL=knowledge.d.ts.map