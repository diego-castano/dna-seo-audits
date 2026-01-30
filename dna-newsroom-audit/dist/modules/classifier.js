"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyUrl = classifyUrl;
exports.classifyPage = classifyPage;
exports.detectSiteMode = detectSiteMode;
exports.buildInventory = buildInventory;
const url_1 = require("../utils/url");
const GENERIC_PATTERNS = [
    { type: 'home', patterns: [/^\/$/, /^\/index\.html?$/], priority: 100 },
    { type: 'listing', patterns: [/\/blog\/?$/, /\/news\/?$/, /\/articles\/?$/, /\/posts\/?$/, /\/press\/?$/, /\/updates\/?$/], priority: 90 },
    { type: 'article', patterns: [/\/blog\/[^\/]+/, /\/news\/[^\/]+/, /\/post\/[^\/]+/, /\/article\/[^\/]+/, /\/\d{4}\/\d{2}\/[^\/]+/], priority: 80 },
    { type: 'taxonomy', patterns: [/\/tag\//, /\/category\//, /\/topic\//, /\/tags\//, /\/categories\//], priority: 70 },
    { type: 'author', patterns: [/\/author\//, /\/authors\//, /\/writer\//], priority: 70 },
    { type: 'trust', patterns: [/\/about\/?$/, /\/contact\/?$/, /\/team\/?$/, /\/leadership\/?$/, /\/editorial-policy\/?$/, /\/methodology\/?$/], priority: 60 },
    { type: 'service', patterns: [/\/services?\/?$/, /\/how-it-works\/?$/, /\/pricing\/?$/, /\/packages\/?$/, /\/case-studies?\/?$/], priority: 60 },
    { type: 'legal', patterns: [/\/privacy\/?$/, /\/terms\/?$/, /\/legal\/?$/, /\/cookie-policy\/?$/, /\/disclaimer\/?$/], priority: 50 },
    { type: 'faq', patterns: [/\/faq\/?$/, /\/faqs\/?$/, /\/frequently-asked/], priority: 50 },
    { type: 'hub', patterns: [/\/topics\/?$/, /\/categories\/?$/, /\/archive\/?$/], priority: 40 },
];
// Site-specific patterns
const SITE_SPECIFIC_PATTERNS = {
    'newsroom.dna.online': [
        { type: 'article', patterns: [/\/blog-posts\/view\/\d+\/.+/], priority: 95 },
        { type: 'listing', patterns: [/\/blog-posts\/?$/, /\/companies\/view-home/], priority: 95 },
    ],
    'newsroom.upscrolled.com': [
        { type: 'article', patterns: [/\/blog-posts\/view\/\d+\/.+/, /\/posts\/[^\/]+/], priority: 95 },
        { type: 'listing', patterns: [/\/blog-posts\/?$/, /\/posts\/?$/], priority: 95 },
    ]
};
// ============================================
// CLASSIFICATION FUNCTIONS
// ============================================
function classifyUrl(url, domain) {
    const pathname = (0, url_1.getPathname)(url);
    const signals = [];
    // Get site-specific patterns
    const sitePatterns = SITE_SPECIFIC_PATTERNS[domain] || [];
    const allPatterns = [...sitePatterns, ...GENERIC_PATTERNS].sort((a, b) => b.priority - a.priority);
    for (const rule of allPatterns) {
        for (const pattern of rule.patterns) {
            if (pattern.test(pathname)) {
                signals.push(`Matched pattern: ${pattern.source}`);
                return { type: rule.type, confidence: rule.priority / 100, signals };
            }
        }
    }
    return { type: 'other', confidence: 0.1, signals: ['No pattern matched'] };
}
function classifyPage(analysis, domain) {
    const { type, confidence, signals } = classifyUrl(analysis.url, domain);
    // Check if needs enhancement
    const enhancementReasons = [];
    if (analysis.title === '')
        enhancementReasons.push('Empty title');
    if (analysis.ogTags.title === '' && analysis.ogTags.description === '')
        enhancementReasons.push('Missing OG tags');
    if (analysis.canonical === '')
        enhancementReasons.push('Missing canonical');
    if (analysis.jsonLdCount === 0)
        enhancementReasons.push('No JSON-LD schema');
    if (analysis.internalAnchorCount < 3)
        enhancementReasons.push('Few internal links');
    if (analysis.shellClusterId)
        enhancementReasons.push(`Part of shell cluster #${analysis.shellClusterId}`);
    return {
        url: analysis.url,
        type,
        confidence,
        signals,
        needsEnhancement: enhancementReasons.length >= 2,
        enhancementReasons,
        analysis
    };
}
// ============================================
// SITE MODE DETECTION
// ============================================
function detectSiteMode(pages) {
    const articleCount = pages.filter(p => p.type === 'article').length;
    const listingCount = pages.filter(p => p.type === 'listing').length;
    const serviceCount = pages.filter(p => p.type === 'service').length;
    const taxonomyCount = pages.filter(p => p.type === 'taxonomy').length;
    const authorCount = pages.filter(p => p.type === 'author').length;
    const hasNewsroomSignals = articleCount > 3 || listingCount > 1 || taxonomyCount > 0 || authorCount > 0;
    const hasAgencySignals = serviceCount > 0;
    if (hasNewsroomSignals && hasAgencySignals)
        return 'hybrid';
    if (hasNewsroomSignals)
        return 'newsroom';
    return 'agency';
}
// ============================================
// INVENTORY BUILDING
// ============================================
function buildInventory(pages, metrics) {
    // Group by type
    const byType = {
        home: [], listing: [], article: [], taxonomy: [], author: [],
        trust: [], service: [], legal: [], faq: [], hub: [], other: []
    };
    for (const page of pages) {
        byType[page.type].push(page);
    }
    // Calculate counts
    const counts = {};
    for (const type of Object.keys(byType)) {
        counts[type] = byType[type].length;
    }
    // Calculate confidence
    const fullMetrics = {
        discoveredUrlCount: pages.length,
        internalAnchorCountHome: metrics.internalAnchorCountHome || 0,
        listingPagesFoundCount: counts.listing,
        paginationFound: metrics.paginationFound || false,
        shellClusterRatio: metrics.shellClusterRatio || 0,
        sitemapValid: metrics.sitemapValid || false,
        urlsFoundByCrawling: metrics.urlsFoundByCrawling || 0,
        urlsFoundByProbing: metrics.urlsFoundByProbing || 0,
        urlsFoundBySitemap: metrics.urlsFoundBySitemap || 0
    };
    const { confidence, reasons } = calculateConfidence(fullMetrics);
    // Coverage estimate
    let coverageEstimate = `${pages.length} URLs discovered`;
    if (confidence === 'LOW') {
        coverageEstimate += ', likely incomplete due to ';
        const issues = [];
        if (!fullMetrics.sitemapValid)
            issues.push('invalid sitemap');
        if (fullMetrics.internalAnchorCountHome < 10)
            issues.push('low internal linking');
        if (fullMetrics.shellClusterRatio > 0.5)
            issues.push('shell duplication');
        coverageEstimate += issues.join(' + ');
    }
    return {
        pages,
        byType,
        counts,
        confidence,
        confidenceReasons: reasons,
        metrics: fullMetrics,
        coverageEstimate
    };
}
function calculateConfidence(metrics) {
    const reasons = [];
    let score = 0;
    // Sitemap validity
    if (metrics.sitemapValid) {
        score += 3;
        reasons.push('Valid sitemap found');
    }
    else {
        reasons.push('No valid sitemap');
    }
    // Internal linking
    if (metrics.internalAnchorCountHome >= 20) {
        score += 2;
        reasons.push(`Strong internal linking (${metrics.internalAnchorCountHome} links on home)`);
    }
    else if (metrics.internalAnchorCountHome >= 10) {
        score += 1;
        reasons.push(`Moderate internal linking (${metrics.internalAnchorCountHome} links on home)`);
    }
    else {
        reasons.push(`Weak internal linking (${metrics.internalAnchorCountHome} links on home)`);
    }
    // Shell duplication
    if (metrics.shellClusterRatio < 0.2) {
        score += 2;
        reasons.push('Low shell duplication');
    }
    else if (metrics.shellClusterRatio < 0.5) {
        score += 1;
        reasons.push(`Moderate shell duplication (${Math.round(metrics.shellClusterRatio * 100)}%)`);
    }
    else {
        reasons.push(`High shell duplication (${Math.round(metrics.shellClusterRatio * 100)}%)`);
    }
    // Pagination
    if (metrics.paginationFound) {
        score += 1;
        reasons.push('Pagination detected');
    }
    // Listing pages
    if (metrics.listingPagesFoundCount > 0) {
        score += 1;
        reasons.push(`${metrics.listingPagesFoundCount} listing pages found`);
    }
    // Determine confidence level
    let confidence;
    if (score >= 7) {
        confidence = 'HIGH';
    }
    else if (score >= 4) {
        confidence = 'MED';
    }
    else {
        confidence = 'LOW';
    }
    return { confidence, reasons };
}
//# sourceMappingURL=classifier.js.map