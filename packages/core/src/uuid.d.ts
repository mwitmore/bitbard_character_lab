import type { UUID } from "./types.ts";
import { z } from "zod";
export declare const uuidSchema: z.ZodType<UUID>;
export declare function validateUuid(value: unknown): UUID | null;
export declare function stringToUuid(target: string | number): UUID;
//# sourceMappingURL=uuid.d.ts.map