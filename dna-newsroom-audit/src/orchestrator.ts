import {
  AnalysisResult, AuditConfig, DiscoveredUrl, Finding,
  UrlAnalysis, ClassifiedPage
} from './models/types';
import { fetchUrl, fetchBatch } from './modules/fetcher';
import { parseHTML, detectNonCrawlableNavigation, getEvidenceSnippet } from './modules/parser';
import {
  analyzeRobotsTxt, analyzeSitemap, detectCatchAll,
  analyzeLinkability, analyzePagination, analyzeListingRoute,
  analyzeListingRoutes, analyzeUrl, detectSpaIssues,
  analyzeStructuredData, analyzeCanonicalRatio
} from './modules/analyzer';
import { classifyPage, detectSiteMode, buildInventory } from './modules/classifier';
import { analyzeGeoGaps } from './modules/gap-analyzer';
import { generateRecommendations } from './modules/recommendations';
import { generateExecutiveSummary } from './modules/reporter';
import { extractDomain, getBaseUrl, normalizeUrl, deduplicateUrls, isInternalUrl } from './utils/url';

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

export async function runAudit(
  url: string,
  config: AuditConfig,
  onProgress?: (message: string) => void
): Promise<AnalysisResult> {
  const domain = extractDomain(url);
  const baseUrl = getBaseUrl(url);
  const homeUrl = baseUrl + '/';
  const allFindings: Finding[] = [];
  
  const log = (msg: string) => onProgress?.(msg);
  
  log(`Starting audit for ${domain}...`);
  
  // ============================================
  // PHASE 1: Critical Endpoints
  // ============================================
  log('Fetching critical endpoints...');
  
  const [robotsResult, homeResult] = await Promise.all([
    fetchUrl(`${baseUrl}/robots.txt`, { timeout: config.timeout }),
    fetchUrl(homeUrl, { timeout: config.timeout })
  ]);
  
  // Analyze robots.txt
  const robotsTxt = analyzeRobotsTxt(robotsResult);
  allFindings.push(...robotsTxt.findings);
  
  // Fetch sitemap variants
  log('Checking sitemap variants...');
  const sitemapResults = await fetchBatch(
    SITEMAP_VARIANTS.map(v => `${baseUrl}${v}`),
    { timeout: config.timeout, concurrency: 3 }
  );
  const sitemap = analyzeSitemap(sitemapResults);
  allFindings.push(...sitemap.findings);
  
  // Find first valid sitemap for catch-all detection
  const validSitemapResult = sitemapResults.find(r => 
    r.status === 200 && !r.body.toLowerCase().includes('<!doctype')
  );
  
  // Catch-all detection
  const catchAllDetection = detectCatchAll(robotsResult, validSitemapResult || null, homeResult);
  allFindings.push(...catchAllDetection.findings);

  // ============================================
  // PHASE 2: Homepage Analysis
  // ============================================
  log('Analyzing homepage...');
  
  const homeParsed = parseHTML(homeResult.body, homeUrl);
  const homepageLinkability = analyzeLinkability(homeParsed, 'newsroom');
  allFindings.push(...homepageLinkability.findings);
  
  const nonCrawlableNavigation = detectNonCrawlableNavigation(homeParsed.anchors);
  
  const pagination = analyzePagination(homeResult.body, homeParsed.anchors);
  allFindings.push(...pagination.findings);
  
  // ============================================
  // PHASE 3: Listing Routes
  // ============================================
  log('Probing listing routes...');
  
  const listingResults = await fetchBatch(
    LISTING_ROUTES.map(r => `${baseUrl}${r}`),
    { timeout: config.timeout, concurrency: 3 }
  );
  
  const listingRouteAnalyses = listingResults.map(r => analyzeListingRoute(r, baseUrl));
  const listingRoutes = analyzeListingRoutes(listingRouteAnalyses);
  allFindings.push(...listingRoutes.findings);
  
  // ============================================
  // PHASE 4: URL Discovery
  // ============================================
  log('Discovering URLs...');
  
  const discoveredUrls: DiscoveredUrl[] = [];
  
  // From homepage
  discoveredUrls.push({ url: homeUrl, source: 'crawled' });
  for (const anchor of homeParsed.anchors) {
    if (anchor.isInternal && anchor.href && !anchor.isHashOnly && !anchor.isJavascript) {
      try {
        const fullUrl = new URL(anchor.href, homeUrl).href;
        discoveredUrls.push({ url: normalizeUrl(fullUrl), source: 'crawled', linkedFrom: homeUrl });
      } catch {}
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
  const probeResults = await fetchBatch(
    PROBE_ROUTES.map(r => `${baseUrl}${r}`),
    { timeout: config.timeout, concurrency: 3 }
  );
  
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
      if (url && isInternalUrl(url, baseUrl)) {
        discoveredUrls.push({ url: normalizeUrl(url), source: 'sitemap' });
      }
    }
  }
  
  // Deduplicate and limit
  const uniqueUrls = deduplicateUrls(discoveredUrls.map(d => d.url)).slice(0, config.maxUrls);
  log(`Discovered ${uniqueUrls.length} unique URLs`);

  // ============================================
  // PHASE 5: Per-URL Analysis
  // ============================================
  log('Analyzing discovered URLs...');
  
  const urlResults = await fetchBatch(uniqueUrls, {
    timeout: config.timeout,
    concurrency: config.concurrency
  }, (completed, total) => {
    log(`Fetched ${completed}/${total} URLs`);
  });
  
  const urlAnalyses: UrlAnalysis[] = [];
  for (const result of urlResults) {
    if (result.status > 0) {
      const analysis = analyzeUrl(result, baseUrl, homeUrl);
      urlAnalyses.push(analysis);
      allFindings.push(...analysis.findings);
    }
  }
  
  // ============================================
  // PHASE 6: SPA Detection
  // ============================================
  log('Detecting SPA issues...');
  
  const spaDetection = detectSpaIssues(urlAnalyses);
  allFindings.push(...spaDetection.findings);
  
  // ============================================
  // PHASE 7: Canonical Analysis
  // ============================================
  const { ratio: canonicalHomeRatio, findings: canonicalFindings } = analyzeCanonicalRatio(urlAnalyses);
  allFindings.push(...canonicalFindings);
  
  // ============================================
  // PHASE 8: Structured Data
  // ============================================
  log('Analyzing structured data...');
  
  const articleUrls = urlAnalyses
    .filter(a => a.url.includes('/blog') || a.url.includes('/post') || a.url.includes('/news') || a.url.includes('/article'))
    .map(a => a.url);
  
  const structuredData = analyzeStructuredData(urlAnalyses, articleUrls, homeUrl);
  allFindings.push(...structuredData.findings);
  
  // ============================================
  // PHASE 9: Classification & Inventory
  // ============================================
  log('Building content inventory...');
  
  const classifiedPages: ClassifiedPage[] = urlAnalyses.map(a => classifyPage(a, domain));
  const siteMode = detectSiteMode(classifiedPages);
  
  const inventory = buildInventory(classifiedPages, {
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
  
  const geoGaps = analyzeGeoGaps(inventory, siteMode);
  allFindings.push(...geoGaps.findings);
  
  // ============================================
  // PHASE 11: Recommendations
  // ============================================
  log('Generating recommendations...');
  
  const recommendations = generateRecommendations(allFindings, domain);
  
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
  const result: AnalysisResult = {
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
    summary: null as any // Will be set below
  };
  
  result.summary = generateExecutiveSummary(result);
  
  log(`Audit complete for ${domain}`);
  return result;
}
