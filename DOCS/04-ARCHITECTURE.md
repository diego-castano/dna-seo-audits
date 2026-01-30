# DNA Newsroom SEO/GEO Audit Runner - Architecture

## System Overview

DNA Newsroom Audit Runner is a modular TypeScript application that performs comprehensive SEO/GEO analysis without external dependencies or headless browsers. It uses HTTP fetching + HTML parsing to detect issues visible to search engine crawlers.

## Design Principles

1. **No External Tools**: Self-contained, no SEMrush/Mangools/etc.
2. **No JavaScript Execution**: HTTP + raw HTML only (no Puppeteer)
3. **Crawler Perspective**: Analyze what search engines actually see
4. **Modular Architecture**: Each concern isolated in dedicated module
5. **Graceful Degradation**: Partial results on errors
6. **Evidence-Based**: Include snippets of what was detected

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI (index.ts)                           │
│  - Parse arguments (Commander)                                   │
│  - Validate inputs                                               │
│  - Display progress (Ora spinners)                               │
│  - Format output (Chalk colors)                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Orchestrator (orchestrator.ts)                 │
│  - Coordinate audit phases                                       │
│  - Manage state across phases                                    │
│  - Aggregate results                                             │
│  - Handle errors gracefully                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Fetcher    │────▶│   Parser     │────▶│   Analyzer   │
│              │     │              │     │              │
│ - HTTP GET   │     │ - Cheerio    │     │ - SEO rules  │
│ - Retry      │     │ - XML parse  │     │ - Thresholds │
│ - Gzip       │     │ - Extract    │     │ - Scoring    │
│ - Redirects  │     │ - Normalize  │     │ - Evidence   │
└──────────────┘     └──────────────┘     └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Classifier  │     │ Gap Analyzer │     │ Recommender  │
│              │     │              │     │              │
│ - URL regex  │     │ - GEO model  │     │ - Templates  │
│ - Site mode  │     │ - Priority   │     │ - Validation │
│ - Confidence │     │ - Matrix     │     │ - Commands   │
└──────────────┘     └──────────────┘     └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                     ┌──────────────┐
                     │   Reporter   │
                     │              │
                     │ - JSON       │
                     │ - HTML       │
                     │ - CSV        │
                     └──────────────┘
```

## Module Details

### 1. CLI Module (`src/index.ts`)

**Responsibility**: Entry point, argument parsing, user interaction

**Key Functions**:
- `main()`: Entry point, orchestrates CLI flow
- Argument parsing with Commander
- Progress display with Ora spinners
- Colored output with Chalk

**Dependencies**:
- commander: CLI framework
- ora: Spinner animations
- chalk: Terminal colors

**Example**:
```typescript
program
  .argument('<urls...>', 'URLs to audit')
  .option('--max-urls <n>', 'Max URLs per domain', '50')
  .option('--formats <list>', 'Output formats', 'json,html')
  .action(async (urls, options) => {
    const results = await runAudit(urls, options);
    await generateReports(results, options);
  });
```

### 2. Orchestrator Module (`src/orchestrator.ts`)

**Responsibility**: Coordinate audit phases, manage state

**Key Functions**:
- `runAudit(domains, config)`: Main orchestration
- Phase execution in sequence
- State management across phases
- Error handling and partial results

**Audit Phases**:
1. Fetch critical endpoints (robots, sitemap, home)
2. Analyze homepage linkability
3. Probe listing routes
4. Discover URLs (crawl + probe + sitemap)
5. Analyze per-URL indexability
6. Detect SPA shell duplication
7. Analyze canonical ratios
8. Check structured data
9. Classify pages
10. Build inventory
11. Analyze GEO gaps
12. Generate recommendations
13. Generate reports

**State Object**:
```typescript
interface AuditState {
  domain: string;
  robotsTxt: FetchResult;
  sitemap: FetchResult;
  homepage: FetchResult;
  discoveredUrls: DiscoveredUrl[];
  urlAnalysis: UrlAnalysis[];
  shellClusters: ShellCluster[];
  inventory: Inventory;
  gaps: Gap[];
  recommendations: Recommendation[];
}
```

### 3. Fetcher Module (`src/modules/fetcher.ts`)

**Responsibility**: HTTP requests with retry, redirect tracking, gzip

**Key Functions**:
- `fetchUrl(url, options)`: Single URL fetch with retry
- `fetchBatch(urls, options)`: Concurrent batch fetching
- `fetchWithMultipleUAs(url, profiles)`: UA variance detection

**Features**:
- Exponential backoff retry (3 attempts)
- Redirect chain tracking
- Automatic gzip decompression
- Rate limiting with p-limit
- Custom User-Agent support

**User-Agent Profiles**:
```typescript
const UA_PROFILES = {
  default: 'DNANewsroomBot/1.0',
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; ...)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; ...)'
};
```

**Return Type**:
```typescript
interface FetchResult {
  url: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  body: string;
  redirectCount: number;
  redirectChain: string[];
  error?: string;
}
```

### 4. Parser Module (`src/modules/parser.ts`)

**Responsibility**: HTML/XML parsing, element extraction, normalization

**Key Functions**:
- `detectBodySignature(body)`: Detect HTML vs XML vs text
- `parseHTML(html)`: Extract all metadata and elements
- `extractAnchors($, baseUrl)`: Parse links with context
- `detectNonCrawlableNavigation($)`: Find JS-only navigation
- `extractJsonLd($)`: Parse structured data
- `normalizeHTML(html)`: Remove noise for comparison
- `computeHash(html)`: SHA-256 hash for deduplication
- `calculateSimilarity(html1, html2)`: Heuristic similarity

**Body Signature Detection**:
```typescript
function detectBodySignature(body: string): 'html' | 'xml' | 'text' {
  if (body.trim().startsWith('<?xml') || 
      body.includes('<urlset') || 
      body.includes('<sitemapindex>')) {
    return 'xml';
  }
  if (body.includes('<!DOCTYPE html') || 
      body.includes('<html') ||
      body.includes('<script') ||
      body.includes('<link rel="stylesheet"')) {
    return 'html';
  }
  return 'text';
}
```

**Anchor Classification**:
```typescript
interface Anchor {
  href: string;
  text: string;
  context: 'nav' | 'main' | 'footer' | 'sidebar';
  isInternal: boolean;
  isEmpty: boolean;
  isHashOnly: boolean;
  isJavascript: boolean;
  isPlaceholder: boolean;
}
```

**HTML Normalization** (for shell detection):
- Remove whitespace
- Remove version querystrings (`?v=123`)
- Remove nonces, timestamps
- Remove build IDs
- Keep structure and script sources

### 5. Analyzer Module (`src/modules/analyzer.ts`)

**Responsibility**: SEO/GEO analysis, issue detection, scoring

**Key Functions**:
- `analyzeRobotsTxt(result)`: Dual detection (Content-Type + body)
- `analyzeSitemap(results)`: XML validation, URL extraction
- `detectCatchAllFallback(robots, sitemap, home)`: Hash comparison
- `analyzeLinkability(anchors, pageType)`: Threshold checks
- `detectShellDuplication(urlAnalyses)`: Cluster detection
- `analyzeSoft 404(analysis)`: Empty content heuristics
- `analyzeStructuredData(jsonLd)`: Schema validation

**Dual Detection Logic**:
```typescript
function analyzeRobotsTxt(result: FetchResult): Finding {
  const contentType = result.headers['content-type'] || '';
  const signature = detectBodySignature(result.body);
  
  // CRITICAL if body is HTML regardless of Content-Type
  if (signature === 'html') {
    return {
      severity: 'CRITICAL',
      message: 'robots.txt returns HTML (SPA fallback)',
      evidence: result.body.split('\n').slice(0, 10).join('\n'),
      whyFlagged: 'Body contains <!DOCTYPE html> or <html> tag'
    };
  }
  
  // Valid if Content-Type is text/plain AND body contains directives
  if (contentType.includes('text/plain') && 
      result.body.includes('User-agent:')) {
    return { severity: 'PASS', message: 'robots.txt valid' };
  }
  
  return { severity: 'WARN', message: 'robots.txt suspicious' };
}
```

**Shell Duplication Detection**:
```typescript
function detectShellDuplication(analyses: UrlAnalysis[]): ShellCluster[] {
  const hashGroups = groupBy(analyses, a => a.htmlHash);
  
  return Object.entries(hashGroups)
    .filter(([hash, urls]) => urls.length >= 3)
    .map(([hash, urls]) => ({
      hash,
      urls: urls.map(u => u.url),
      percentage: (urls.length / analyses.length) * 100,
      severity: urls.length / analyses.length > 0.5 ? 'CRITICAL' : 'WARN'
    }));
}
```

**Linkability Thresholds**:
```typescript
const THRESHOLDS = {
  newsroom: { internal: 20, warn: 'Low internal linking for newsroom' },
  home: { internal: 5, warn: 'Low internal linking for homepage' },
  article: { internal: 5, warn: 'Low internal linking for article' }
};
```

### 6. Classifier Module (`src/modules/classifier.ts`)

**Responsibility**: URL classification, site mode detection, inventory

**Key Functions**:
- `classifyUrl(url, signals)`: Classify by pattern + signals
- `detectSiteMode(inventory)`: Auto-detect newsroom/agency/hybrid
- `calculateInventoryConfidence(state)`: Quantified confidence
- `buildInventory(urlAnalyses)`: Group by type with counts

**Classification Patterns**:
```typescript
const GENERIC_PATTERNS = {
  home: [/^\/$/, /^\/index/, /^\/home$/],
  article: [/\/blog\/[^\/]+$/, /\/post\/\d+/, /\/articles\/[^\/]+$/],
  listing: [/\/blog\/?$/, /\/news\/?$/, /\/articles\/?$/],
  taxonomy: [/\/category\//, /\/tag\//, /\/topic\//],
  author: [/\/author\//, /\/by\//, /\/writers\//],
  trust: [/\/about/, /\/contact/, /\/team/, /\/privacy/, /\/terms/],
  service: [/\/services/, /\/solutions/, /\/products/],
  legal: [/\/privacy/, /\/terms/, /\/legal/],
  faq: [/\/faq/, /\/help/, /\/support/],
  hub: [/\/resources/, /\/guides/, /\/learn/]
};

const SITE_SPECIFIC_PATTERNS = {
  'newsroom.dna.online': {
    article: [/\/blog-posts\/view\/\d+\/.+/],
    listing: [/\/blog-posts$/, /\/companies\/view-home/]
  },
  'newsroom.upscrolled.com': {
    article: [/\/blog-posts\/view\/\d+\/.+/],
    listing: [/\/blog-posts$/]
  }
};
```

**Site Mode Detection**:
```typescript
function detectSiteMode(inventory: Inventory): 'newsroom' | 'agency' | 'hybrid' {
  const articleCount = inventory.byType.article?.length || 0;
  const serviceCount = inventory.byType.service?.length || 0;
  
  if (articleCount > 10 && serviceCount < 3) return 'newsroom';
  if (serviceCount > 3 && articleCount < 5) return 'agency';
  return 'hybrid';
}
```

**Inventory Confidence**:
```typescript
interface InventoryConfidence {
  level: 'LOW' | 'MED' | 'HIGH';
  reasons: string[];
  metrics: {
    discoveredUrlCount: number;
    internalAnchorCountHome: number;
    listingPagesFoundCount: number;
    paginationFound: boolean;
    shellClusterRatio: number;
    sitemapValid: boolean;
  };
}
```

### 7. Gap Analyzer Module (`src/modules/gap-analyzer.ts`)

**Responsibility**: GEO gap detection, prioritization, matrix generation

**Key Functions**:
- `analyzeGaps(inventory, siteMode)`: Compare against GEO model
- `prioritizeGaps(gaps)`: Assign P0/P1/P2
- `generateGapMatrix(gaps)`: Full matrix with recommendations

**GEO Page Model**:
```typescript
interface GeoPageModel {
  type: string;
  slug: string;
  priority: 'P0' | 'P1' | 'P2';
  requiredFor: 'newsroom' | 'agency' | 'both';
  schema: string[];
  rationale: string;
  minOutline: string[];
  internalLinkingPlan: string;
  weight: {
    newsroom: number;
    agency: number;
    hybrid: number;
  };
}
```

**Gap Detection**:
```typescript
function analyzeGaps(inventory: Inventory, siteMode: string): Gap[] {
  const gaps: Gap[] = [];
  
  for (const modelPage of GEO_PAGE_MODEL) {
    // Skip if not required for this site mode
    if (modelPage.requiredFor !== 'both' && 
        modelPage.requiredFor !== siteMode) {
      continue;
    }
    
    const existing = inventory.pages.find(p => 
      p.url.includes(modelPage.slug)
    );
    
    if (!existing) {
      gaps.push({
        type: 'MISSING',
        page: modelPage,
        priority: modelPage.priority
      });
    } else if (needsEnhancement(existing)) {
      gaps.push({
        type: 'NEEDS_ENHANCEMENT',
        page: modelPage,
        existing: existing,
        priority: modelPage.priority
      });
    }
  }
  
  return gaps;
}
```

**Enhancement Detection**:
```typescript
function needsEnhancement(page: InventoryPage): boolean {
  return (
    !page.title ||
    !page.ogPresent ||
    !page.canonical ||
    page.jsonldCount === 0 ||
    page.internalAnchors < 3 ||
    page.isShellCluster
  );
}
```

### 8. Recommendations Module (`src/modules/recommendations.ts`)

**Responsibility**: Generate actionable fix recommendations

**Key Functions**:
- `generateRecommendations(findings, gaps)`: Create recommendations
- Template-based recommendations with validation commands

**Recommendation Structure**:
```typescript
interface Recommendation {
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  rootCause: string;
  fixOptionA: string;  // Minimum fix
  fixOptionB: string;  // Ideal fix
  validationCommand: string;  // curl command
  targetTeam: 'dev' | 'content' | 'both';
  relatedFindings: string[];
}
```

**Example Recommendation**:
```typescript
{
  priority: 'P0',
  title: 'Fix robots.txt serving HTML',
  rootCause: 'SPA catch-all rewrite is serving app shell for /robots.txt',
  fixOptionA: 'Exclude /robots.txt from rewrite rules in CDN/origin config',
  fixOptionB: 'Serve static robots.txt from origin, add sitemap directive',
  validationCommand: 'curl -s https://site.com/robots.txt | head -5',
  targetTeam: 'dev',
  relatedFindings: ['robots-txt-html', 'catch-all-fallback']
}
```

### 9. Reporter Module (`src/modules/reporter.ts`)

**Responsibility**: Generate reports in multiple formats

**Key Functions**:
- `generateJsonReport(results)`: Complete dataset
- `generateHtmlReport(results)`: Visual report
- `generateCsvReport(results)`: Spreadsheet export
- `generateExecutiveSummary(results)`: High-level bullets

**HTML Report Features**:
- Self-contained (inline CSS/JS)
- Responsive design
- Sticky table headers
- Severity badges (color-coded)
- Collapsible sections
- Domain tabs for multi-site
- Evidence snippets
- Validation commands

**HTML Template Structure**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>/* Inline CSS */</style>
</head>
<body>
  <header>
    <h1>SEO/GEO Audit Report</h1>
    <div class="meta">Date, domains, etc.</div>
  </header>
  
  <section class="executive-summary">
    <!-- Top-level findings -->
  </section>
  
  <div class="domain-tabs">
    <!-- Tab per domain -->
  </div>
  
  <div class="domain-content">
    <section class="technical-seo">
      <!-- robots, sitemap, catch-all -->
    </section>
    
    <section class="crawlability">
      <!-- linkability, navigation -->
    </section>
    
    <section class="indexability">
      <!-- per-URL issues -->
    </section>
    
    <section class="spa-detection">
      <!-- shell duplication, soft 404s -->
    </section>
    
    <section class="structured-data">
      <!-- JSON-LD, schemas -->
    </section>
    
    <section class="inventory">
      <!-- page classification, confidence -->
    </section>
    
    <section class="gaps">
      <!-- GEO gap matrix -->
    </section>
    
    <section class="recommendations">
      <!-- actionable fixes -->
    </section>
  </div>
  
  <script>/* Inline JS for tabs, collapsible */</script>
</body>
</html>
```

## Data Flow

### Phase 1-3: Discovery
```
URLs → Fetcher → Parser → Analyzer
                    ↓
              Anchors extracted
                    ↓
         Listing routes probed
                    ↓
         URL discovery (crawl + probe + sitemap)
```

### Phase 4-8: Analysis
```
Discovered URLs → Fetcher (batch) → Parser (per URL)
                                        ↓
                                   Analyzer (per URL)
                                        ↓
                              Shell duplication detection
                                        ↓
                              Canonical ratio calculation
                                        ↓
                              Structured data analysis
```

### Phase 9-11: Inventory & Gaps
```
URL analyses → Classifier → Inventory
                               ↓
                        Site mode detection
                               ↓
                        Gap Analyzer → Gaps
                               ↓
                        Recommendations
```

### Phase 12-13: Reporting
```
All findings → Reporter → JSON + HTML + CSV
```

## Error Handling

### Graceful Degradation
- Network errors: Retry 3x with exponential backoff
- Timeout: Continue with partial results
- Parse errors: Log and skip URL
- Missing data: Use defaults, mark as unknown

### Partial Results
If critical endpoints fail:
- robots.txt fails → WARN, continue audit
- sitemap fails → WARN, rely on crawling
- homepage fails → CRITICAL, abort audit

## Performance Considerations

### Concurrency Control
- Default: 5 concurrent requests
- Configurable via --concurrency
- Uses p-limit for rate limiting

### Memory Management
- Stream large responses
- Limit URL discovery to --max-urls
- Clear processed data after each phase

### Execution Time
- 50 URLs: ~30-60 seconds
- 100 URLs: ~60-120 seconds
- Bottleneck: Network I/O

## Testing Strategy

### Integration Tests
- Test against real sites (newsroom.dna.online, newsroom.upscrolled.com)
- Validate all detections work correctly
- Verify report generation

### Unit Tests (Future)
- Test individual functions in isolation
- Mock HTTP responses
- Test edge cases

## Extension Points

### Adding New Checks
1. Add function to analyzer.ts
2. Call from orchestrator.ts in appropriate phase
3. Add finding to results
4. Update reporter.ts to display finding

### Adding Site-Specific Patterns
1. Update SITE_SPECIFIC_PATTERNS in classifier.ts
2. Add domain as key
3. Define regex patterns for page types

### Adding New Report Formats
1. Add function to reporter.ts
2. Implement format generation
3. Add to --formats option in CLI

## Dependencies

### Runtime
- cheerio: HTML parsing
- fast-xml-parser: XML parsing
- commander: CLI framework
- chalk: Terminal colors
- ora: Progress spinners
- p-limit: Concurrency control

### Development
- typescript: Type safety
- @types/node: Node.js types
- ts-node: TypeScript execution

## Next Steps

- Review `05-FINDINGS-GUIDE.md` for detailed fix instructions
- Review `.kiro/specs/audit-for-sites/` for complete specifications
- Check `dna-newsroom-audit/src/` for implementation details
