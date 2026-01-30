"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAudit = runAudit;
const fetcher_1 = require("./modules/fetcher");
const parser_1 = require("./modules/parser");
const analyzer_1 = require("./modules/analyzer");
const classifier_1 = require("./modules/classifier");
const gap_analyzer_1 = require("./modules/gap-analyzer");
const recommendations_1 = require("./modules/recommendations");
const reporter_1 = require("./modules/reporter");
const url_1 = require("./utils/url");
const SITEMAP_VARIANTS = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
    '/sitemap.xml.gz',
    '/sitemap_index.xml.gz',
    '/sitemap.txt'
];
const LISTING_ROUTES = [
    '/blog', '/news', '/press', '/updates',
    '/articles', '/latest', '/posts'
];
const PROBE_ROUTES = [
    '/about', '/contact', '/privacy', '/terms', '/team',
    '/editorial-policy', '/services', '/how-it-works',
    '/pricing', '/case-studies', '/faq', '/rss.xml', '/feed.xml'
];
async function runAudit(url, config, onProgress) {
    const domain = (0, url_1.extractDomain)(url);
    const baseUrl = (0, url_1.getBaseUrl)(url);
    const homeUrl = baseUrl + '/';
    const allFindings = [];
    const log = (msg) => onProgress?.(msg);
    log(`Starting audit for ${domain}...`);
    // ============================================
    // PHASE 1: Critical Endpoints
    // ============================================
    log('Fetching critical endpoints...');
    const [robotsResult, homeResult] = await Promise.all([
        (0, fetcher_1.fetchUrl)(`${baseUrl}/robots.txt`, { timeout: config.timeout }),
        (0, fetcher_1.fetchUrl)(homeUrl, { timeout: config.timeout })
    ]);
    // Analyze robots.txt
    const robotsTxt = (0, analyzer_1.analyzeRobotsTxt)(robotsResult);
    allFindings.push(...robotsTxt.findings);
    // Fetch sitemap variants
    log('Checking sitemap variants...');
    const sitemapResults = await (0, fetcher_1.fetchBatch)(SITEMAP_VARIANTS.map(v => `${baseUrl}${v}`), { timeout: config.timeout, concurrency: 3 });
    const sitemap = (0, analyzer_1.analyzeSitemap)(sitemapResults);
    allFindings.push(...sitemap.findings);
    // Find first valid sitemap for catch-all detection
    const validSitemapResult = sitemapResults.find(r => r.status === 200 && !r.body.toLowerCase().includes('<!doctype'));
    // Catch-all detection
    const catchAllDetection = (0, analyzer_1.detectCatchAll)(robotsResult, validSitemapResult || null, homeResult);
    allFindings.push(...catchAllDetection.findings);
    // ============================================
    // PHASE 2: Homepage Analysis
    // ============================================
    log('Analyzing homepage...');
    const homeParsed = (0, parser_1.parseHTML)(homeResult.body, homeUrl);
    const homepageLinkability = (0, analyzer_1.analyzeLinkability)(homeParsed, 'newsroom');
    allFindings.push(...homepageLinkability.findings);
    const nonCrawlableNavigation = (0, parser_1.detectNonCrawlableNavigation)(homeParsed.anchors);
    const pagination = (0, analyzer_1.analyzePagination)(homeResult.body, homeParsed.anchors);
    allFindings.push(...pagination.findings);
    // ============================================
    // PHASE 3: Listing Routes
    // ============================================
    log('Probing listing routes...');
    const listingResults = await (0, fetcher_1.fetchBatch)(LISTING_ROUTES.map(r => `${baseUrl}${r}`), { timeout: config.timeout, concurrency: 3 });
    const listingRouteAnalyses = listingResults.map(r => (0, analyzer_1.analyzeListingRoute)(r, baseUrl));
    const listingRoutes = (0, analyzer_1.analyzeListingRoutes)(listingRouteAnalyses);
    allFindings.push(...listingRoutes.findings);
    // ============================================
    // PHASE 4: URL Discovery
    // ============================================
    log('Discovering URLs...');
    const discoveredUrls = [];
    // From homepage
    discoveredUrls.push({ url: homeUrl, source: 'crawled' });
    for (const anchor of homeParsed.anchors) {
        if (anchor.isInternal && anchor.href && !anchor.isHashOnly && !anchor.isJavascript) {
            try {
                const fullUrl = new URL(anchor.href, homeUrl).href;
                discoveredUrls.push({ url: (0, url_1.normalizeUrl)(fullUrl), source: 'crawled', linkedFrom: homeUrl });
            }
            catch { }
        }
    }
    // From listing pages
    for (const listing of listingRouteAnalyses) {
        if (listing.exists && !listing.isShell) {
            discoveredUrls.push({ url: listing.url, source: 'crawled' });
        }
    }
    // Probe common routes
    log('Probing common routes...');
    const probeResults = await (0, fetcher_1.fetchBatch)(PROBE_ROUTES.map(r => `${baseUrl}${r}`), { timeout: config.timeout, concurrency: 3 });
    for (const result of probeResults) {
        if (result.status === 200) {
            discoveredUrls.push({ url: result.url, source: 'probed' });
        }
    }
    // From sitemap
    if (sitemap.validSitemapFound && validSitemapResult) {
        const sitemapUrls = validSitemapResult.body.match(/<loc>([^<]+)<\/loc>/gi) || [];
        for (const match of sitemapUrls.slice(0, 20)) {
            const url = match.replace(/<\/?loc>/gi, '').trim();
            if (url && (0, url_1.isInternalUrl)(url, baseUrl)) {
                discoveredUrls.push({ url: (0, url_1.normalizeUrl)(url), source: 'sitemap' });
            }
        }
    }
    // Deduplicate and limit
    const uniqueUrls = (0, url_1.deduplicateUrls)(discoveredUrls.map(d => d.url)).slice(0, config.maxUrls);
    log(`Discovered ${uniqueUrls.length} unique URLs`);
    // ============================================
    // PHASE 5: Per-URL Analysis
    // ============================================
    log('Analyzing discovered URLs...');
    const urlResults = await (0, fetcher_1.fetchBatch)(uniqueUrls, {
        timeout: config.timeout,
        concurrency: config.concurrency
    }, (completed, total) => {
        log(`Fetched ${completed}/${total} URLs`);
    });
    const urlAnalyses = [];
    for (const result of urlResults) {
        if (result.status > 0) {
            const analysis = (0, analyzer_1.analyzeUrl)(result, baseUrl, homeUrl);
            urlAnalyses.push(analysis);
            allFindings.push(...analysis.findings);
        }
    }
    // ============================================
    // PHASE 6: SPA Detection
    // ============================================
    log('Detecting SPA issues...');
    const spaDetection = (0, analyzer_1.detectSpaIssues)(urlAnalyses);
    allFindings.push(...spaDetection.findings);
    // ============================================
    // PHASE 7: Canonical Analysis
    // ============================================
    const { ratio: canonicalHomeRatio, findings: canonicalFindings } = (0, analyzer_1.analyzeCanonicalRatio)(urlAnalyses);
    allFindings.push(...canonicalFindings);
    // ============================================
    // PHASE 8: Structured Data
    // ============================================
    log('Analyzing structured data...');
    const articleUrls = urlAnalyses
        .filter(a => a.url.includes('/blog') || a.url.includes('/post') || a.url.includes('/news') || a.url.includes('/article'))
        .map(a => a.url);
    const structuredData = (0, analyzer_1.analyzeStructuredData)(urlAnalyses, articleUrls, homeUrl);
    allFindings.push(...structuredData.findings);
    // ============================================
    // PHASE 9: Classification & Inventory
    // ============================================
    log('Building content inventory...');
    const classifiedPages = urlAnalyses.map(a => (0, classifier_1.classifyPage)(a, domain));
    const siteMode = (0, classifier_1.detectSiteMode)(classifiedPages);
    const inventory = (0, classifier_1.buildInventory)(classifiedPages, {
        internalAnchorCountHome: homepageLinkability.internalAnchors,
        paginationFound: pagination.found,
        shellClusterRatio: spaDetection.shellClusterRatio,
        sitemapValid: sitemap.validSitemapFound,
        urlsFoundByCrawling: discoveredUrls.filter(d => d.source === 'crawled').length,
        urlsFoundByProbing: discoveredUrls.filter(d => d.source === 'probed').length,
        urlsFoundBySitemap: discoveredUrls.filter(d => d.source === 'sitemap').length
    });
    // ============================================
    // PHASE 10: GEO Gap Analysis
    // ============================================
    log('Analyzing GEO gaps...');
    const geoGaps = (0, gap_analyzer_1.analyzeGeoGaps)(inventory, siteMode);
    allFindings.push(...geoGaps.findings);
    // ============================================
    // PHASE 11: Recommendations
    // ============================================
    log('Generating recommendations...');
    const recommendations = (0, recommendations_1.generateRecommendations)(allFindings, domain);
    // ============================================
    // PHASE 12: Orphan Detection
    // ============================================
    const linkedUrls = new Set(discoveredUrls.filter(d => d.source === 'crawled').map(d => d.url));
    const orphanPages = discoveredUrls
        .filter(d => d.source === 'probed' && !linkedUrls.has(d.url))
        .map(d => d.url);
    // ============================================
    // BUILD RESULT
    // ============================================
    const result = {
        domain,
        timestamp: new Date().toISOString(),
        siteMode,
        robotsTxt,
        sitemap,
        catchAllDetection,
        homepageLinkability,
        nonCrawlableNavigation,
        pagination,
        listingRoutes,
        discoveredUrls,
        orphanPages,
        urlAnalyses,
        canonicalHomeRatio,
        spaDetection,
        structuredData,
        inventory,
        geoGaps,
        recommendations,
        allFindings,
        summary: null // Will be set below
    };
    result.summary = (0, reporter_1.generateExecutiveSummary)(result);
    log(`Audit complete for ${domain}`);
    return result;
}
//# sourceMappingURL=orchestrator.js.map