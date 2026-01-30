import { BodySignature, ParsedHTML, AnchorInfo, JsonLdSchema, NonCrawlableIssue } from '../models/types';
export declare function detectBodySignature(body: string): BodySignature;
export declare function parseHTML(html: string, baseUrl: string): ParsedHTML;
export declare function extractAnchors(html: string, baseUrl: string): AnchorInfo[];
export declare function detectNonCrawlableNavigation(anchors: AnchorInfo[]): NonCrawlableIssue[];
export declare function extractJsonLd(html: string): JsonLdSchema[];
export declare function normalizeHTML(html: string): string;
export declare function computeHash(content: string): string;
export declare function calculateSimilarity(html1: string, html2: string, hash1: string, hash2: string): {
    isExactMatch: boolean;
    isHighSimilarity: boolean;
    score: number;
    reasons: string[];
};
export declare function parseXMLSitemap(xml: string): {
    urls: string[];
    isSitemapIndex: boolean;
};
export declare function getEvidenceSnippet(content: string, lines?: number): string;
//# sourceMappingURL=parser.d.ts.map