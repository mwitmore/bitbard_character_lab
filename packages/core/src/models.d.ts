import { type EmbeddingModelSettings, type ImageModelSettings, ModelClass, ModelProviderName, type Models, type ModelSettings } from "./types.ts";
export declare const models: Models;
export declare function getModelSettings(provider: ModelProviderName, type: ModelClass): ModelSettings | undefined;
export declare function getImageModelSettings(provider: ModelProviderName): ImageModelSettings | undefined;
export declare function getEmbeddingModelSettings(provider: ModelProviderName): EmbeddingModelSettings | undefined;
export declare function getEndpoint(provider: ModelProviderName): any;
//# sourceMappingURL=models.d.ts.map