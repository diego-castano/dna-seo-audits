import {
  FetchResult, Finding, Severity, Priority,
  RobotsTxtAnalysis, SitemapAnalysis, SitemapVariant,
  CatchAllAnalysis, LinkabilityAnalysis, PaginationAnalysis,
  ListingRoutesAnalysis, ListingRoute, UrlAnalysis,
  ShellCluster, SpaDetectionResult, StructuredDataAnalysis,
  ParsedHTML, NonCrawlableIssue
} from '../models/types';
import {
  detectBodySignature, parseHTML, extractAnchors,
  detectNonCrawlableNavigation, parseXMLSitemap,
  getEvidenceSnippet, calculateSimilarity, computeHash, normalizeHTML
} from './parser';
import { isHomepage, getBaseUrl } from '../utils/url';

// ============================================
// ROBOTS.TXT ANALYZER
// ============================================

export function analyzeRobotsTxt(result: FetchResult): RobotsTxtAnalysis {
  const findings: Finding[] = [];
  const signature = detectBodySignature(result.body);
  
  const hasUserAgent = result.body.toLowerCase().includes('user-agent:');
  const hasSitemapDirective = result.body.toLowerCase().includes('sitemap:');
  
  // Extract sitemap URLs
  const sitemapUrls: string[] = [];
  const sitemapMatches = result.body.match(/sitemap:\s*(\S+)/gi) || [];
  for (const match of sitemapMatches) {
    const url = match.replace(/sitemap:\s*/i, '').trim();
    if (url) sitemapUrls.push(url);
  }
  
  const isValid = result.status === 200 && hasUserAgent && !signature.isHTML;
  
  // Generate findings
  if (result.status !== 200) {
    findings.push({
      id: 'robots-status',
      category: 'Technical SEO',
      severity: 'FAIL',
      priority: 'P0',
      title: `robots.txt returned status ${result.status}`,
      description: `Expected HTTP 200, got ${result.status}`,
      whyFlagged: `HTTP status ${result.status} indicates robots.txt is not accessible`,
      whatCrawlersSee: getEvidenceSnippet(result.body),
      affectedUrls: [result.url]
    });
  }

  if (signature.isHTML) {
    findings.push({
      id: 'robots-html',
      category: 'Technical SEO',
      severity: 'CRITICAL',
      priority: 'P0',
      title: 'robots.txt returns HTML instead of text/plain',
      description: 'The robots.txt endpoint is serving an HTML page (likely SPA fallback)',
      whyFlagged: `Body starts with HTML signature + ${signature.hasAppShellSignals ? 'contains app shell signals: ' + signature.appShellSignals.join(', ') : 'no User-agent: directive found'}`,
      whatCrawlersSee: getEvidenceSnippet(result.body),
      affectedUrls: [result.url]
    });
  }
  
  if (signature.hasAppShellSignals && !signature.isHTML) {
    findings.push({
      id: 'robots-shell-signals',
      category: 'Technical SEO',
      severity: 'CRITICAL',
      priority: 'P0',
      title: 'robots.txt contains app shell signals',
      description: `Detected: ${signature.appShellSignals.join(', ')}`,
      whyFlagged: 'App shell patterns found in robots.txt body indicate SPA fallback misconfiguration',
      whatCrawlersSee: getEvidenceSnippet(result.body),
      affectedUrls: [result.url]
    });
  }
  
  if (!hasSitemapDirective && isValid) {
    findings.push({
      id: 'robots-no-sitemap',
      category: 'Technical SEO',
      severity: 'WARN',
      priority: 'P1',
      title: 'robots.txt lacks Sitemap directive',
      description: 'No Sitemap: directive found in robots.txt',
      whyFlagged: 'Missing Sitemap directive reduces discoverability',
      whatCrawlersSee: getEvidenceSnippet(result.body),
      affectedUrls: [result.url]
    });
  }
  
  return {
    url: result.url,
    status: result.status,
    isValid,
    hasUserAgent,
    hasSitemapDirective,
    sitemapUrls,
    isHTML: signature.isHTML,
    hasAppShellSignals: signature.hasAppShellSignals,
    evidenceSnippet: getEvidenceSnippet(result.body),
    findings
  };
}

// ============================================
// SITEMAP ANALYZER
// ============================================

export function analyzeSitemap(results: FetchResult[]): SitemapAnalysis {
  const findings: Finding[] = [];
  const variants: SitemapVariant[] = [];
  let validSitemapFound = false;
  let totalUrlCount = 0;
  
  for (const result of results) {
    const signature = detectBodySignature(result.body);
    const isGzipped = result.wasDecompressed || result.url.endsWith('.gz');
    
    let urlCount = 0;
    let isValid = false;
    
    if (result.status === 200 && signature.isXML) {
      isValid = true;
      validSitemapFound = true;
      const parsed = parseXMLSitemap(result.body);
      urlCount = parsed.urls.length;
      totalUrlCount += urlCount;
    }
    
    variants.push({
      url: result.url,
      status: result.status,
      isValid,
      isHTML: signature.isHTML,
      isGzipped,
      urlCount,
      evidenceSnippet: getEvidenceSnippet(result.body)
    });
    
    if (signature.isHTML && result.status === 200) {
      findings.push({
        id: `sitemap-html-${result.url}`,
        category: 'Technical SEO',
        severity: 'CRITICAL',
        priority: 'P0',
        title: `Sitemap ${result.url} returns HTML`,
        description: 'Sitemap endpoint is serving HTML instead of XML',
        whyFlagged: `Body signature is HTML, not XML. ${signature.hasAppShellSignals ? 'App shell signals detected.' : ''}`,
        whatCrawlersSee: getEvidenceSnippet(result.body),
        affectedUrls: [result.url]
      });
    }
  }
  
  if (!validSitemapFound) {
    findings.push({
      id: 'sitemap-none-valid',
      category: 'Technical SEO',
      severity: 'CRITICAL',
      priority: 'P0',
      title: 'No valid sitemap found',
      description: 'None of the sitemap variants returned valid XML',
      whyFlagged: 'All sitemap endpoints either returned errors or HTML',
      whatCrawlersSee: variants.map(v => `${v.url}: ${v.status} ${v.isHTML ? '(HTML)' : ''}`).join('\n')
    });
  }
  
  return { variants, validSitemapFound, totalUrlCount, findings };
}

// ============================================
// CATCH-ALL FALLBACK DETECTION
// ============================================

export function detectCatchAll(
  robotsResult: FetchResult,
  sitemapResult: FetchResult | null,
  homeResult: FetchResult
): CatchAllAnalysis {
  const findings: Finding[] = [];
  const signals: string[] = [];
  
  const homeHash = computeHash(normalizeHTML(homeResult.body));
  const robotsHash = computeHash(normalizeHTML(robotsResult.body));
  const sitemapHash = sitemapResult ? computeHash(normalizeHTML(sitemapResult.body)) : '';
  
  const robotsMatchesHome = robotsHash === homeHash;
  const sitemapMatchesHome = sitemapResult ? sitemapHash === homeHash : false;
  
  if (robotsMatchesHome) {
    signals.push('robots.txt hash matches homepage');
  }
  if (sitemapMatchesHome) {
    signals.push('sitemap.xml hash matches homepage');
  }
  
  // High similarity check
  const robotsSimilarity = calculateSimilarity(
    robotsResult.body, homeResult.body, robotsHash, homeHash
  );
  const sitemapSimilarity = sitemapResult ? calculateSimilarity(
    sitemapResult.body, homeResult.body, sitemapHash, homeHash
  ) : { isExactMatch: false, isHighSimilarity: false, score: 0, reasons: [] as string[] };
  
  if (robotsSimilarity.isHighSimilarity && !robotsMatchesHome) {
    signals.push(`robots.txt highly similar to homepage: ${robotsSimilarity.reasons.join(', ')}`);
  }
  if (sitemapSimilarity.isHighSimilarity && !sitemapMatchesHome) {
    signals.push(`sitemap.xml highly similar to homepage: ${sitemapSimilarity.reasons.join(', ')}`);
  }
  
  const detected = robotsMatchesHome || sitemapMatchesHome || 
                   robotsSimilarity.isHighSimilarity || sitemapSimilarity.isHighSimilarity;
  
  if (detected) {
    findings.push({
      id: 'catch-all-detected',
      category: 'Technical SEO',
      severity: 'CRITICAL',
      priority: 'P0',
      title: 'SPA catch-all fallback detected',
      description: 'Critical SEO endpoints are being served by the SPA fallback/catch-all route',
      whyFlagged: signals.join('; '),
      whatCrawlersSee: `robots.txt and/or sitemap.xml return the same content as the homepage`,
      affectedUrls: [robotsResult.url, sitemapResult?.url].filter(Boolean) as string[]
    });
  }
  
  return {
    detected,
    robotsMatchesHome,
    sitemapMatchesHome,
    similarityScore: Math.max(robotsSimilarity.score, sitemapSimilarity.score),
    signals,
    findings
  };
}

// ============================================
// LINKABILITY ANALYZER
// ============================================

export function analyzeLinkability(
  parsed: ParsedHTML,
  pageType: 'newsroom' | 'home' | 'article' = 'home'
): LinkabilityAnalysis {
  const findings: Finding[] = [];
  const anchors = parsed.anchors;
  
  const totalAnchors = anchors.length;
  const internalAnchors = anchors.filter(a => a.isInternal).length;
  const externalAnchors = anchors.filter(a => a.isExternal).length;
  const emptyAnchors = anchors.filter(a => a.isEmpty).length;
  const hashOnlyAnchors = anchors.filter(a => a.isHashOnly).length;
  const javascriptAnchors = anchors.filter(a => a.isJavascript).length;
  const placeholderAnchors = anchors.filter(a => a.isPlaceholder).length;
  
  const nonCrawlableIssues = detectNonCrawlableNavigation(anchors);
  
  // Type-specific thresholds
  const thresholds = {
    newsroom: 20,
    home: 5,
    article: 5
  };
  const threshold = thresholds[pageType];
  
  // Check for critical issues
  if (placeholderAnchors > 0) {
    findings.push({
      id: 'linkability-placeholders',
      category: 'Crawlability',
      severity: 'CRITICAL',
      priority: 'P0',
      title: 'Template placeholders found in navigation',
      description: `${placeholderAnchors} links contain template placeholders like {{link}}`,
      whyFlagged: 'Template placeholders indicate client-side rendering without SSR',
      whatCrawlersSee: anchors.filter(a => a.isPlaceholder).slice(0, 3).map(a => a.href).join(', ')
    });
  }
  
  if (nonCrawlableIssues.length > 0) {
    const totalNonCrawlable = nonCrawlableIssues.reduce((sum, i) => sum + i.count, 0);
    if (totalNonCrawlable > 5) {
      findings.push({
        id: 'linkability-non-crawlable',
        category: 'Crawlability',
        severity: 'CRITICAL',
        priority: 'P0',
        title: 'Non-crawlable navigation detected',
        description: `${totalNonCrawlable} navigation elements are not crawlable`,
        whyFlagged: nonCrawlableIssues.map(i => `${i.type}: ${i.count}`).join(', '),
        whatCrawlersSee: nonCrawlableIssues.map(i => i.evidence).join('\n')
      });
    }
  }
  
  if (internalAnchors < threshold) {
    findings.push({
      id: 'linkability-low-internal',
      category: 'Crawlability',
      severity: 'WARN',
      priority: 'P1',
      title: `Low internal link count (${internalAnchors})`,
      description: `Expected at least ${threshold} internal links for ${pageType} page, found ${internalAnchors}`,
      whyFlagged: `Internal anchor count ${internalAnchors} < threshold ${threshold}`,
      whatCrawlersSee: `Total anchors: ${totalAnchors}, Internal: ${internalAnchors}`
    });
  }
  
  return {
    totalAnchors,
    internalAnchors,
    externalAnchors,
    emptyAnchors,
    hashOnlyAnchors,
    javascriptAnchors,
    placeholderAnchors,
    nonCrawlableIssues,
    findings
  };
}

// ============================================
// PAGINATION ANALYZER
// ============================================

export function analyzePagination(html: string, anchors: { href: string }[]): PaginationAnalysis {
  const findings: Finding[] = [];
  const patterns: string[] = [];
  
  // Check for pagination patterns in URLs
  const paginationPatterns = [
    /[?&]page=\d+/,
    /\/page\/\d+/,
    /\/p\/\d+/,
    /[?&]offset=\d+/,
    /\/older\/?$/,
    /\/next\/?$/
  ];
  
  for (const anchor of anchors) {
    for (const pattern of paginationPatterns) {
      if (pattern.test(anchor.href)) {
        patterns.push(anchor.href);
        break;
      }
    }
  }
  
  // Check for rel="next"/"prev"
  const hasRelNextPrev = html.includes('rel="next"') || html.includes('rel="prev"') ||
                         html.includes("rel='next'") || html.includes("rel='prev'");
  
  const found = patterns.length > 0 || hasRelNextPrev;
  
  if (!found) {
    findings.push({
      id: 'pagination-not-found',
      category: 'Crawlability',
      severity: 'WARN',
      priority: 'P1',
      title: 'No HTML pagination detected',
      description: 'No pagination links or rel="next/prev" found',
      whyFlagged: 'Crawlers cannot discover paginated content without HTML links',
      whatCrawlersSee: 'No ?page=, /page/, rel="next" patterns found'
    });
  }
  
  return { found, patterns: [...new Set(patterns)], hasRelNextPrev, findings };
}

// ============================================
// LISTING ROUTES ANALYZER
// ============================================

export function analyzeListingRoute(result: FetchResult, baseUrl: string): ListingRoute {
  const exists = result.status === 200;
  let title = '';
  let canonical = '';
  let hasNoindex = false;
  let internalAnchorCount = 0;
  let isShell = false;
  
  if (exists) {
    const parsed = parseHTML(result.body, baseUrl);
    title = parsed.title;
    canonical = parsed.canonical;
    hasNoindex = parsed.metaRobots.toLowerCase().includes('noindex');
    internalAnchorCount = parsed.anchors.filter(a => a.isInternal).length;
    
    // Shell detection
    const signature = detectBodySignature(result.body);
    isShell = (parsed.title === '' || parsed.bodyTextLength < 500) && signature.hasAppShellSignals;
  }
  
  return {
    url: result.url,
    status: result.status,
    exists,
    title,
    canonical,
    hasNoindex,
    internalAnchorCount,
    isShell
  };
}

export function analyzeListingRoutes(routes: ListingRoute[]): ListingRoutesAnalysis {
  const findings: Finding[] = [];
  const validListings = routes.filter(r => r.exists && !r.isShell && r.internalAnchorCount > 5);
  
  if (validListings.length === 0) {
    findings.push({
      id: 'listings-none-valid',
      category: 'Crawlability',
      severity: 'WARN',
      priority: 'P1',
      title: 'No valid listing pages found',
      description: 'Common listing routes either do not exist or have no real content',
      whyFlagged: routes.map(r => `${r.url}: ${r.exists ? (r.isShell ? 'shell' : `${r.internalAnchorCount} links`) : '404'}`).join(', '),
      whatCrawlersSee: 'No discoverable listing pages'
    });
  }
  
  const shellListings = routes.filter(r => r.exists && r.isShell);
  if (shellListings.length > 0) {
    findings.push({
      id: 'listings-shell',
      category: 'Crawlability',
      severity: 'WARN',
      priority: 'P1',
      title: 'Listing pages appear to be shells',
      description: `${shellListings.length} listing pages have shell characteristics`,
      whyFlagged: 'Empty title or low text content with app shell signals',
      whatCrawlersSee: shellListings.map(r => r.url).join(', ')
    });
  }
  
  return { routes, validListingsFound: validListings.length, findings };
}

// ============================================
// URL ANALYSIS
// ============================================

export function analyzeUrl(result: FetchResult, baseUrl: string, homeUrl: string): UrlAnalysis {
  const findings: Finding[] = [];
  const parsed = parseHTML(result.body, baseUrl);
  const signature = detectBodySignature(result.body);
  
  // Canonical analysis
  const canonicalPointsToHome = parsed.canonical !== '' && 
    (parsed.canonical === homeUrl || 
     parsed.canonical === homeUrl + '/' ||
     parsed.canonical.replace(/\/$/, '') === homeUrl.replace(/\/$/, ''));
  
  // Noindex check
  const hasNoindex = parsed.metaRobots.toLowerCase().includes('noindex') ||
                     result.xRobotsTag.toLowerCase().includes('noindex');
  
  // Shell detection
  const isShell = (parsed.title === '' || parsed.bodyTextLength < 500) && 
                  signature.hasAppShellSignals;
  
  // Generate findings
  if (result.redirectCount > 1) {
    findings.push({
      id: `url-redirect-chain-${result.url}`,
      category: 'Indexability',
      severity: 'WARN',
      priority: 'P1',
      title: `Redirect chain > 1 (${result.redirectCount} redirects)`,
      description: `URL has ${result.redirectCount} redirects`,
      whyFlagged: `Redirect chain: ${result.redirectChain.join(' → ')}`,
      whatCrawlersSee: `Final URL: ${result.finalUrl}`,
      affectedUrls: [result.url]
    });
  }
  
  if (result.status >= 400) {
    findings.push({
      id: `url-error-${result.url}`,
      category: 'Indexability',
      severity: 'FAIL',
      priority: 'P0',
      title: `HTTP ${result.status} error`,
      description: `URL returned status ${result.status}`,
      whyFlagged: `HTTP error status`,
      whatCrawlersSee: getEvidenceSnippet(result.body),
      affectedUrls: [result.url]
    });
  }
  
  if (hasNoindex && !result.url.includes('/admin') && !result.url.includes('/login')) {
    findings.push({
      id: `url-noindex-${result.url}`,
      category: 'Indexability',
      severity: 'FAIL',
      priority: 'P0',
      title: 'noindex on public page',
      description: `Page has noindex directive`,
      whyFlagged: `meta robots: "${parsed.metaRobots}", X-Robots-Tag: "${result.xRobotsTag}"`,
      whatCrawlersSee: 'Page will not be indexed',
      affectedUrls: [result.url]
    });
  }
  
  if (parsed.canonical === '' && !isHomepage(result.url)) {
    findings.push({
      id: `url-no-canonical-${result.url}`,
      category: 'Indexability',
      severity: 'WARN',
      priority: 'P1',
      title: 'Missing canonical tag',
      description: 'Page lacks canonical link element',
      whyFlagged: 'No <link rel="canonical"> found',
      whatCrawlersSee: 'Canonical not specified',
      affectedUrls: [result.url]
    });
  }
  
  if (parsed.title === '') {
    findings.push({
      id: `url-empty-title-${result.url}`,
      category: 'Indexability',
      severity: 'WARN',
      priority: 'P1',
      title: 'Empty title tag',
      description: 'Page has no title',
      whyFlagged: 'title element is empty or missing',
      whatCrawlersSee: getEvidenceSnippet(result.body, 5),
      affectedUrls: [result.url]
    });
  }
  
  if (parsed.ogTags.title === '' && parsed.ogTags.description === '') {
    findings.push({
      id: `url-no-og-${result.url}`,
      category: 'Indexability',
      severity: 'WARN',
      priority: 'P2',
      title: 'Missing OG tags',
      description: 'Page lacks Open Graph metadata',
      whyFlagged: 'og:title and og:description are empty',
      whatCrawlersSee: 'No social sharing metadata',
      affectedUrls: [result.url]
    });
  }
  
  return {
    url: result.url,
    finalUrl: result.finalUrl,
    status: result.status,
    redirectCount: result.redirectCount,
    hasNoindex,
    xRobotsTag: result.xRobotsTag,
    metaRobots: parsed.metaRobots,
    canonical: parsed.canonical,
    canonicalPointsToHome,
    title: parsed.title,
    metaDescription: parsed.metaDescription,
    ogTags: parsed.ogTags,
    jsonLdCount: parsed.jsonLd.length,
    jsonLdTypes: parsed.jsonLd.flatMap(j => j.types),
    internalAnchorCount: parsed.anchors.filter(a => a.isInternal).length,
    bodyTextLength: parsed.bodyTextLength,
    normalizedHash: parsed.normalizedHash,
    cacheControl: result.cacheControl,
    contentLength: result.contentLength,
    isShell,
    findings
  };
}

// ============================================
// SPA DETECTION
// ============================================

export function detectSpaIssues(urlAnalyses: UrlAnalysis[]): SpaDetectionResult {
  const findings: Finding[] = [];
  const shellClusters: ShellCluster[] = [];
  const softFourOhFours: string[] = [];
  
  // Group by hash
  const hashGroups = new Map<string, UrlAnalysis[]>();
  for (const analysis of urlAnalyses) {
    const existing = hashGroups.get(analysis.normalizedHash) || [];
    existing.push(analysis);
    hashGroups.set(analysis.normalizedHash, existing);
  }
  
  // Find clusters (3+ URLs with same hash)
  let clusterId = 0;
  for (const [hash, analyses] of hashGroups) {
    if (analyses.length >= 3) {
      clusterId++;
      shellClusters.push({
        id: clusterId,
        hash,
        urls: analyses.map(a => a.url),
        count: analyses.length,
        sampleHtml: '', // Would need original HTML
        signals: ['Multiple URLs share identical normalized HTML']
      });
      
      // Mark URLs with cluster ID
      for (const analysis of analyses) {
        analysis.shellClusterId = clusterId;
      }
    }
  }
  
  // Detect soft 404s
  for (const analysis of urlAnalyses) {
    if (analysis.status === 200) {
      const signals: string[] = [];
      if (analysis.title === '') signals.push('empty title');
      if (analysis.ogTags.title === '' && analysis.ogTags.description === '') signals.push('empty OG');
      if (analysis.bodyTextLength < 500) signals.push(`low text (${analysis.bodyTextLength} chars)`);
      if (analysis.shellClusterId) signals.push(`shell cluster #${analysis.shellClusterId}`);
      
      if (signals.length >= 2) {
        softFourOhFours.push(analysis.url);
        analysis.findings.push({
          id: `soft-404-${analysis.url}`,
          category: 'SPA Detection',
          severity: 'WARN',
          priority: 'P1',
          title: 'Possible soft 404 / CSR shell',
          description: 'Page returns 200 but appears to be an empty shell',
          whyFlagged: signals.join(' + '),
          whatCrawlersSee: `title: "${analysis.title}", text length: ${analysis.bodyTextLength}`,
          affectedUrls: [analysis.url]
        });
      }
    }
  }
  
  // Calculate shell cluster ratio
  const urlsInClusters = shellClusters.reduce((sum, c) => sum + c.count, 0);
  const shellClusterRatio = urlAnalyses.length > 0 ? urlsInClusters / urlAnalyses.length : 0;
  const largestClusterSize = shellClusters.length > 0 ? 
    Math.max(...shellClusters.map(c => c.count)) : 0;
  
  if (shellClusters.length > 0) {
    findings.push({
      id: 'spa-shell-clusters',
      category: 'SPA Detection',
      severity: shellClusterRatio > 0.5 ? 'CRITICAL' : 'WARN',
      priority: 'P0',
      title: `Shell duplication detected (${shellClusters.length} clusters)`,
      description: `${urlsInClusters} URLs (${Math.round(shellClusterRatio * 100)}%) share identical HTML`,
      whyFlagged: `Largest cluster has ${largestClusterSize} URLs with same normalized hash`,
      whatCrawlersSee: shellClusters.map(c => `Cluster #${c.id}: ${c.count} URLs`).join('\n')
    });
  }
  
  return { shellClusters, largestClusterSize, shellClusterRatio, softFourOhFours, findings };
}

// ============================================
// STRUCTURED DATA ANALYSIS
// ============================================

export function analyzeStructuredData(
  urlAnalyses: UrlAnalysis[],
  articleUrls: string[],
  homeUrl: string
): StructuredDataAnalysis {
  const findings: Finding[] = [];
  
  const pagesWithJsonLd = urlAnalyses.filter(a => a.jsonLdCount > 0).length;
  const pagesWithoutJsonLd = urlAnalyses.filter(a => a.jsonLdCount === 0).length;
  
  const allTypes = new Set<string>();
  for (const analysis of urlAnalyses) {
    for (const type of analysis.jsonLdTypes) {
      allTypes.add(type);
    }
  }
  
  const hasOrganizationSchema = allTypes.has('Organization');
  const hasWebSiteSchema = allTypes.has('WebSite');
  const hasBreadcrumbSchema = allTypes.has('BreadcrumbList');
  
  // Check articles without schema
  const postsWithoutArticleSchema: string[] = [];
  for (const url of articleUrls) {
    const analysis = urlAnalyses.find(a => a.url === url);
    if (analysis) {
      const hasArticleSchema = analysis.jsonLdTypes.some(t => 
        t === 'Article' || t === 'NewsArticle' || t === 'BlogPosting'
      );
      if (!hasArticleSchema) {
        postsWithoutArticleSchema.push(url);
      }
    }
  }
  
  if (postsWithoutArticleSchema.length > 0) {
    findings.push({
      id: 'schema-posts-missing',
      category: 'Structured Data',
      severity: 'WARN',
      priority: 'P1',
      title: `${postsWithoutArticleSchema.length} posts lack Article schema`,
      description: 'Article/NewsArticle schema missing on post pages',
      whyFlagged: 'Posts should have Article schema for rich results and GEO',
      whatCrawlersSee: 'No JSON-LD with @type Article/NewsArticle',
      affectedUrls: postsWithoutArticleSchema.slice(0, 10)
    });
  }
  
  if (!hasOrganizationSchema) {
    findings.push({
      id: 'schema-org-missing',
      category: 'Structured Data',
      severity: 'WARN',
      priority: 'P1',
      title: 'Organization schema missing',
      description: 'No Organization schema found on site',
      whyFlagged: 'Organization schema establishes E-E-A-T signals',
      whatCrawlersSee: 'No JSON-LD with @type Organization'
    });
  }
  
  if (!hasWebSiteSchema) {
    findings.push({
      id: 'schema-website-missing',
      category: 'Structured Data',
      severity: 'WARN',
      priority: 'P2',
      title: 'WebSite schema missing',
      description: 'No WebSite schema found on homepage',
      whyFlagged: 'WebSite schema enables sitelinks searchbox',
      whatCrawlersSee: 'No JSON-LD with @type WebSite'
    });
  }
  
  return {
    pagesWithJsonLd,
    pagesWithoutJsonLd,
    schemaTypesFound: Array.from(allTypes),
    hasOrganizationSchema,
    hasWebSiteSchema,
    hasBreadcrumbSchema,
    postsWithoutArticleSchema,
    findings
  };
}

// ============================================
// CANONICAL RATIO ANALYSIS
// ============================================

export function analyzeCanonicalRatio(urlAnalyses: UrlAnalysis[]): { ratio: number; findings: Finding[] } {
  const findings: Finding[] = [];
  const nonHomePages = urlAnalyses.filter(a => !isHomepage(a.url));
  const pointingToHome = nonHomePages.filter(a => a.canonicalPointsToHome);
  
  const ratio = nonHomePages.length > 0 ? pointingToHome.length / nonHomePages.length : 0;
  
  if (ratio > 0.2) {
    findings.push({
      id: 'canonical-home-ratio',
      category: 'Indexability',
      severity: 'CRITICAL',
      priority: 'P0',
      title: `${Math.round(ratio * 100)}% of pages have canonical pointing to home`,
      description: 'Many pages have their canonical URL set to the homepage',
      whyFlagged: `${pointingToHome.length}/${nonHomePages.length} non-home pages have canonical = homepage`,
      whatCrawlersSee: 'Search engines will consolidate these pages to homepage',
      affectedUrls: pointingToHome.slice(0, 10).map(a => a.url)
    });
  }
  
  return { ratio, findings };
}
