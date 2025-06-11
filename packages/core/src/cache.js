import path from "path";
import fs from "fs/promises";
export class MemoryCacheAdapter {
    constructor(initalData) {
        this.data = initalData ?? new Map();
    }
    async get(key) {
        return this.data.get(key);
    }
    async set(key, value) {
        this.data.set(key, value);
    }
    async delete(key) {
        this.data.delete(key);
    }
}
export class FsCacheAdapter {
    constructor(dataDir) {
        this.dataDir = dataDir;
    }
    async get(key) {
        try {
            return await fs.readFile(path.join(this.dataDir, key), "utf8");
        }
        catch {
            // console.error(error);
            return undefined;
        }
    }
    async set(key, value) {
        try {
            const filePath = path.join(this.dataDir, key);
            // Ensure the directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, value, "utf8");
        }
        catch (error) {
            console.error(error);
        }
    }
    async delete(key) {
        try {
            const filePath = path.join(this.dataDir, key);
            await fs.unlink(filePath);
        }
        catch {
            // console.error(error);
        }
    }
}
export class DbCacheAdapter {
    constructor(db, agentId) {
        this.db = db;
        this.agentId = agentId;
    }
    async get(key) {
        return this.db.getCache({ agentId: this.agentId, key });
    }
    async set(key, value) {
        await this.db.setCache({ agentId: this.agentId, key, value });
    }
    async delete(key) {
        await this.db.deleteCache({ agentId: this.agentId, key });
    }
}
export class CacheManager {
    constructor(adapter) {
        this.adapter = adapter;
    }
    async get(key) {
        const data = await this.adapter.get(key);
        if (data) {
            const { value, expires } = JSON.parse(data);
            if (!expires || expires > Date.now()) {
                return value;
            }
            this.adapter.delete(key).catch(() => { });
        }
        return undefined;
    }
    async set(key, value, opts) {
        return this.adapter.set(key, JSON.stringify({ value, expires: opts?.expires ?? 0 }));
    }
    async delete(key) {
        return this.adapter.delete(key);
    }
}
//# sourceMappingURL=cache.js.map