import { PageType, SiteMode, ClassifiedPage, ContentInventory, InventoryMetrics, UrlAnalysis } from '../models/types';
export declare function classifyUrl(url: string, domain: string): {
    type: PageType;
    confidence: number;
    signals: string[];
};
export declare function classifyPage(analysis: UrlAnalysis, domain: string): ClassifiedPage;
export declare function detectSiteMode(pages: ClassifiedPage[]): SiteMode;
export declare function buildInventory(pages: ClassifiedPage[], metrics: Partial<InventoryMetrics>): ContentInventory;
//# sourceMappingURL=classifier.d.ts.map