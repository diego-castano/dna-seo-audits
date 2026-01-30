import { FetchResult, Finding, RobotsTxtAnalysis, SitemapAnalysis, CatchAllAnalysis, LinkabilityAnalysis, PaginationAnalysis, ListingRoutesAnalysis, ListingRoute, UrlAnalysis, SpaDetectionResult, StructuredDataAnalysis, ParsedHTML } from '../models/types';
export declare function analyzeRobotsTxt(result: FetchResult): RobotsTxtAnalysis;
export declare function analyzeSitemap(results: FetchResult[]): SitemapAnalysis;
export declare function detectCatchAll(robotsResult: FetchResult, sitemapResult: FetchResult | null, homeResult: FetchResult): CatchAllAnalysis;
export declare function analyzeLinkability(parsed: ParsedHTML, pageType?: 'newsroom' | 'home' | 'article'): LinkabilityAnalysis;
export declare function analyzePagination(html: string, anchors: {
    href: string;
}[]): PaginationAnalysis;
export declare function analyzeListingRoute(result: FetchResult, baseUrl: string): ListingRoute;
export declare function analyzeListingRoutes(routes: ListingRoute[]): ListingRoutesAnalysis;
export declare function analyzeUrl(result: FetchResult, baseUrl: string, homeUrl: string): UrlAnalysis;
export declare function detectSpaIssues(urlAnalyses: UrlAnalysis[]): SpaDetectionResult;
export declare function analyzeStructuredData(urlAnalyses: UrlAnalysis[], articleUrls: string[], homeUrl: string): StructuredDataAnalysis;
export declare function analyzeCanonicalRatio(urlAnalyses: UrlAnalysis[]): {
    ratio: number;
    findings: Finding[];
};
//# sourceMappingURL=analyzer.d.ts.map