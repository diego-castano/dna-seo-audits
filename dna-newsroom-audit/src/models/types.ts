// ============================================
// CORE TYPES
// ============================================

export type Severity = 'PASS' | 'WARN' | 'FAIL' | 'CRITICAL';
export type Priority = 'P0' | 'P1' | 'P2';
export type SiteMode = 'newsroom' | 'agency' | 'hybrid';
export type PageType = 'home' | 'listing' | 'article' | 'taxonomy' | 'author' | 'trust' | 'service' | 'legal' | 'faq' | 'hub' | 'other';

// ============================================
// FETCHER TYPES
// ============================================

export interface FetchResult {
  url: string;
  finalUrl: string;
  status: number;
  redirectCount: number;
  redirectChain: string[];
  headers: Record<string, string>;
  body: string;
  contentType: string;
  contentLength: number;
  contentEncoding: string;
  cacheControl: string;
  xRobotsTag: string;
  responseTime: number;
  error?: string;
  wasDecompressed: boolean;
}

export interface FetcherConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  userAgent: string;
  concurrency: number;
  rateLimit: number;
}

export const UA_PROFILES = {
  default: 'DNANewsroomBot/1.0 (+https://dna-newsroom.audit)',
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
} as const;


// ============================================
// PARSER TYPES
// ============================================

export interface BodySignature {
  isHTML: boolean;
  isXML: boolean;
  isPlainText: boolean;
  hasAppShellSignals: boolean;
  appShellSignals: string[];
  textRatio: number;
}

export interface OgTags {
  title: string;
  description: string;
  image: string;
  type: string;
}

export interface HreflangEntry {
  lang: string;
  url: string;
}

export interface AnchorInfo {
  href: string;
  text: string;
  rel: string;
  isInternal: boolean;
  isExternal: boolean;
  isEmpty: boolean;
  isHashOnly: boolean;
  isJavascript: boolean;
  isPlaceholder: boolean;
  isButtonWithoutHref: boolean;
  context: 'nav' | 'content' | 'footer' | 'unknown';
}

export interface JsonLdSchema {
  type: string;
  types: string[];
  raw: object;
  isComplete: boolean;
}

export interface ParsedHTML {
  title: string;
  h1: string[];
  metaDescription: string;
  metaRobots: string;
  canonical: string;
  ogTags: OgTags;
  hreflang: HreflangEntry[];
  anchors: AnchorInfo[];
  jsonLd: JsonLdSchema[];
  bodyTextLength: number;
  bodyTextRatio: number;
  scriptCount: number;
  scriptSources: string[];
  normalizedHash: string;
  rawHash: string;
}

export interface NonCrawlableIssue {
  type: 'placeholder' | 'empty' | 'hashOnly' | 'javascript' | 'buttonNoHref' | 'loadMoreNoHref';
  evidence: string;
  context: string;
  count: number;
}


// ============================================
// ANALYZER TYPES
// ============================================

export interface Finding {
  id: string;
  category: string;
  severity: Severity;
  priority: Priority;
  title: string;
  description: string;
  whyFlagged: string;
  whatCrawlersSee: string;
  evidence?: string;
  affectedUrls?: string[];
}

export interface RobotsTxtAnalysis {
  url: string;
  status: number;
  isValid: boolean;
  hasUserAgent: boolean;
  hasSitemapDirective: boolean;
  sitemapUrls: string[];
  isHTML: boolean;
  hasAppShellSignals: boolean;
  evidenceSnippet: string;
  findings: Finding[];
}

export interface SitemapAnalysis {
  variants: SitemapVariant[];
  validSitemapFound: boolean;
  totalUrlCount: number;
  findings: Finding[];
}

export interface SitemapVariant {
  url: string;
  status: number;
  isValid: boolean;
  isHTML: boolean;
  isGzipped: boolean;
  urlCount: number;
  evidenceSnippet: string;
}

export interface CatchAllAnalysis {
  detected: boolean;
  robotsMatchesHome: boolean;
  sitemapMatchesHome: boolean;
  similarityScore: number;
  signals: string[];
  findings: Finding[];
}

export interface LinkabilityAnalysis {
  totalAnchors: number;
  internalAnchors: number;
  externalAnchors: number;
  emptyAnchors: number;
  hashOnlyAnchors: number;
  javascriptAnchors: number;
  placeholderAnchors: number;
  nonCrawlableIssues: NonCrawlableIssue[];
  findings: Finding[];
}

export interface PaginationAnalysis {
  found: boolean;
  patterns: string[];
  hasRelNextPrev: boolean;
  findings: Finding[];
}


export interface ListingRoute {
  url: string;
  status: number;
  exists: boolean;
  title: string;
  canonical: string;
  hasNoindex: boolean;
  internalAnchorCount: number;
  isShell: boolean;
}

export interface ListingRoutesAnalysis {
  routes: ListingRoute[];
  validListingsFound: number;
  findings: Finding[];
}

export interface DiscoveredUrl {
  url: string;
  source: 'crawled' | 'probed' | 'sitemap';
  linkedFrom?: string;
}

export interface UrlAnalysis {
  url: string;
  finalUrl: string;
  status: number;
  redirectCount: number;
  hasNoindex: boolean;
  xRobotsTag: string;
  metaRobots: string;
  canonical: string;
  canonicalPointsToHome: boolean;
  title: string;
  metaDescription: string;
  ogTags: OgTags;
  jsonLdCount: number;
  jsonLdTypes: string[];
  internalAnchorCount: number;
  bodyTextLength: number;
  normalizedHash: string;
  cacheControl: string;
  contentLength: number;
  isShell: boolean;
  shellClusterId?: number;
  findings: Finding[];
}

export interface ShellCluster {
  id: number;
  hash: string;
  urls: string[];
  count: number;
  sampleHtml: string;
  signals: string[];
}

export interface SpaDetectionResult {
  shellClusters: ShellCluster[];
  largestClusterSize: number;
  shellClusterRatio: number;
  softFourOhFours: string[];
  findings: Finding[];
}

export interface StructuredDataAnalysis {
  pagesWithJsonLd: number;
  pagesWithoutJsonLd: number;
  schemaTypesFound: string[];
  hasOrganizationSchema: boolean;
  hasWebSiteSchema: boolean;
  hasBreadcrumbSchema: boolean;
  postsWithoutArticleSchema: string[];
  findings: Finding[];
}


// ============================================
// CLASSIFIER & INVENTORY TYPES
// ============================================

export interface ClassifiedPage {
  url: string;
  type: PageType;
  confidence: number;
  signals: string[];
  needsEnhancement: boolean;
  enhancementReasons: string[];
  analysis?: UrlAnalysis;
}

export interface InventoryMetrics {
  discoveredUrlCount: number;
  internalAnchorCountHome: number;
  listingPagesFoundCount: number;
  paginationFound: boolean;
  shellClusterRatio: number;
  sitemapValid: boolean;
  urlsFoundByCrawling: number;
  urlsFoundByProbing: number;
  urlsFoundBySitemap: number;
}

export interface ContentInventory {
  pages: ClassifiedPage[];
  byType: Record<PageType, ClassifiedPage[]>;
  counts: Record<PageType, number>;
  confidence: 'LOW' | 'MED' | 'HIGH';
  confidenceReasons: string[];
  metrics: InventoryMetrics;
  coverageEstimate: string;
}

// ============================================
// GEO GAP TYPES
// ============================================

export interface GeoPageRequirement {
  type: string;
  slug: string;
  alternativeSlugs?: string[];
  priority: Priority;
  rationale: string;
  requiredFor: SiteMode[];
  suggestedSchema: string[];
  minimumOutline: string[];
  internalLinkingFrom: string[];
  weight: Record<SiteMode, number>;
}

export type GapStatus = 'MISSING' | 'EXISTS_NEEDS_ENHANCEMENT' | 'EXISTS_OK';

export interface GeoGap {
  requirement: GeoPageRequirement;
  status: GapStatus;
  existingUrl?: string;
  enhancementReasons?: string[];
  effectivePriority: Priority;
}

export interface GeoGapAnalysis {
  siteMode: SiteMode;
  gaps: GeoGap[];
  missingCount: number;
  needsEnhancementCount: number;
  findings: Finding[];
}


// ============================================
// RECOMMENDATION TYPES
// ============================================

export interface Recommendation {
  id: string;
  findingId: string;
  priority: Priority;
  rootCause: string;
  fixOptionA: {
    label: string;
    action: string;
    effort: 'low' | 'medium' | 'high';
  };
  fixOptionB: {
    label: string;
    action: string;
    effort: 'low' | 'medium' | 'high';
  };
  validation: {
    command: string;
    expectedResult: string;
  };
  targetTeam: 'dev' | 'content' | 'both';
}

// ============================================
// UA VARIANCE TYPES
// ============================================

export interface UAComparisonEntry {
  ua: string;
  status: number;
  contentLength: number;
  contentType: string;
  bodySignature: BodySignature;
  hash: string;
}

export interface UAVarianceAnalysis {
  endpoint: string;
  comparisons: UAComparisonEntry[];
  hasDifferences: boolean;
  differenceDetails: string[];
  findings: Finding[];
}

// ============================================
// REPORT TYPES
// ============================================

export interface ExecutiveSummary {
  domain: string;
  siteMode: SiteMode;
  overallStatus: Severity;
  inventoryConfidence: 'LOW' | 'MED' | 'HIGH';
  inventoryConfidenceReasons: string[];
  coverageEstimate: string;
  topBlockers: Finding[];
  passCount: number;
  warnCount: number;
  failCount: number;
  criticalCount: number;
  bullets: string[];
}

export interface AnalysisResult {
  domain: string;
  timestamp: string;
  siteMode: SiteMode;
  robotsTxt: RobotsTxtAnalysis;
  sitemap: SitemapAnalysis;
  catchAllDetection: CatchAllAnalysis;
  homepageLinkability: LinkabilityAnalysis;
  nonCrawlableNavigation: NonCrawlableIssue[];
  pagination: PaginationAnalysis;
  listingRoutes: ListingRoutesAnalysis;
  discoveredUrls: DiscoveredUrl[];
  orphanPages: string[];
  urlAnalyses: UrlAnalysis[];
  canonicalHomeRatio: number;
  spaDetection: SpaDetectionResult;
  structuredData: StructuredDataAnalysis;
  inventory: ContentInventory;
  geoGaps: GeoGapAnalysis;
  recommendations: Recommendation[];
  uaVariance?: UAVarianceAnalysis[];
  summary: ExecutiveSummary;
  allFindings: Finding[];
}

export interface AuditConfig {
  urls: string[];
  maxUrls: number;
  timeout: number;
  concurrency: number;
  outputDir: string;
  formats: ('json' | 'html' | 'csv')[];
  uaCheck: boolean;
  uaProfiles: string[];
  verbose: boolean;
}
