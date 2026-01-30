/**
 * URL Utilities for DNA Newsroom Audit
 */
export declare function normalizeUrl(url: string): string;
export declare function isInternalUrl(url: string, baseUrl: string): boolean;
export declare function extractDomain(url: string): string;
export declare function getBaseUrl(url: string): string;
export declare function resolveUrl(href: string, baseUrl: string): string;
export declare function getPathname(url: string): string;
export declare function isHomepage(url: string): boolean;
export declare function deduplicateUrls(urls: string[]): string[];
//# sourceMappingURL=url.d.ts.map