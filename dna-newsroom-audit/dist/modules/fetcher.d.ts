import { FetchResult, FetcherConfig, UA_PROFILES, UAComparisonEntry } from '../models/types';
export declare function fetchUrl(url: string, config?: Partial<FetcherConfig>): Promise<FetchResult>;
export declare function fetchBatch(urls: string[], config?: Partial<FetcherConfig>, onProgress?: (completed: number, total: number) => void): Promise<FetchResult[]>;
export declare function fetchWithMultipleUAs(url: string, uaProfiles?: string[], config?: Partial<FetcherConfig>): Promise<UAComparisonEntry[]>;
export { UA_PROFILES };
//# sourceMappingURL=fetcher.d.ts.map