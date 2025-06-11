import type { CacheOptions, ICacheManager, IDatabaseCacheAdapter, UUID } from "./types";
export interface ICacheAdapter {
    get(key: string): Promise<string | undefined>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
}
export declare class MemoryCacheAdapter implements ICacheAdapter {
    data: Map<string, string>;
    constructor(initalData?: Map<string, string>);
    get(key: string): Promise<string | undefined>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
}
export declare class FsCacheAdapter implements ICacheAdapter {
    private dataDir;
    constructor(dataDir: string);
    get(key: string): Promise<string | undefined>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
}
export declare class DbCacheAdapter implements ICacheAdapter {
    private db;
    private agentId;
    constructor(db: IDatabaseCacheAdapter, agentId: UUID);
    get(key: string): Promise<string | undefined>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
}
export declare class CacheManager<CacheAdapter extends ICacheAdapter = ICacheAdapter> implements ICacheManager {
    adapter: CacheAdapter;
    constructor(adapter: CacheAdapter);
    get<T = unknown>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, opts?: CacheOptions): Promise<void>;
    delete(key: string): Promise<void>;
}
//# sourceMappingURL=cache.d.ts.map