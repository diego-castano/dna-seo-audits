# DNA Newsroom SEO/GEO Audit Runner - Usage Guide

## Quick Start

### Installation

```bash
cd dna-newsroom-audit
npm install
npm run build
```

### Basic Audit

```bash
# Single site
npm run audit -- https://newsroom.dna.online/

# Multiple sites
npm run audit -- https://newsroom.dna.online/ https://newsroom.upscrolled.com/
```

## Command Line Options

### Complete Syntax

```bash
npm run audit -- <url1> [url2...] [options]
```

### Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--max-urls <n>` | number | 50 | Maximum URLs to analyze per domain |
| `--timeout <ms>` | number | 30000 | HTTP request timeout in milliseconds |
| `--concurrency <n>` | number | 5 | Number of concurrent requests |
| `--output <dir>` | string | ./audit-reports | Output directory for reports |
| `--formats <list>` | string | json,html | Comma-separated: json, html, csv |
| `--ua-check` | boolean | false | Enable User-Agent variance detection |
| `--verbose` | boolean | false | Show detailed progress logs |

### Examples

#### Production Audit (Recommended)
```bash
npm run audit -- https://newsroom.dna.online/ \
  --max-urls 50 \
  --timeout 30000 \
  --concurrency 5 \
  --formats json,html,csv \
  --output ./reports/$(date +%Y%m%d)
```

#### Quick Check (Fast)
```bash
npm run audit -- https://newsroom.dna.online/ \
  --max-urls 20 \
  --concurrency 10 \
  --formats html
```

#### Deep Audit (Comprehensive)
```bash
npm run audit -- https://newsroom.dna.online/ \
  --max-urls 100 \
  --timeout 60000 \
  --concurrency 3 \
  --formats json,html,csv \
  --ua-check \
  --verbose
```

#### Multi-Domain Comparison
```bash
npm run audit -- \
  https://newsroom.dna.online/ \
  https://newsroom.upscrolled.com/ \
  --formats html,csv \
  --output ./reports/comparison
```

## Understanding Output

### Output Files

After running an audit, you'll find these files in the output directory:

```
audit-reports/
├── report.json      # Complete dataset (programmatic access)
├── report.html      # Visual report (open in browser)
└── report.csv       # Per-URL data (spreadsheet analysis)
```

### report.html Structure

The HTML report contains:

1. **Executive Summary**
   - Overall status per domain
   - Top blockers with severity badges
   - Inventory confidence assessment
   - Key findings bullets

2. **Domain Tabs** (for multi-domain audits)
   - Switch between different sites
   - Compare findings side-by-side

3. **Findings Sections**
   - Technical SEO (robots.txt, sitemap)
   - Crawlability (links, navigation)
   - Indexability (per-URL issues)
   - SPA/CSR Detection (shell duplication)
   - Structured Data (JSON-LD, schemas)
   - Content Inventory (page classification)
   - GEO Gap Analysis (missing pages)
   - Recommendations (actionable fixes)

4. **Evidence Snippets**
   - "What crawlers see" for failed checks
   - First 10 lines of problematic responses

### report.json Structure

```json
{
  "domains": [
    {
      "url": "https://newsroom.dna.online/",
      "findings": {
        "technical": [...],
        "crawlability": [...],
        "indexability": [...],
        "spa": [...],
        "structured": [...],
        "inventory": {...},
        "gaps": [...],
        "recommendations": [...]
      },
      "metadata": {
        "auditDate": "2025-01-30T...",
        "urlsAnalyzed": 30,
        "executionTime": "45s"
      }
    }
  ]
}
```

### report.csv Columns

| Column | Description |
|--------|-------------|
| domain | Site being audited |
| url | Page URL |
| status | HTTP status code |
| title | Page title |
| h1 | Main heading |
| canonical | Canonical URL |
| robots | Robots meta tag |
| og_present | OpenGraph tags present (true/false) |
| jsonld_count | Number of JSON-LD scripts |
| internal_anchors | Count of internal links |
| page_type | Classification (home, article, listing, etc.) |
| issues | Comma-separated list of issues |

## Interpreting Results

### Severity Levels

| Badge | Meaning | Action Required |
|-------|---------|-----------------|
| 🔴 **CRITICAL** | P0 blocker preventing indexing | Fix immediately |
| 🟠 **FAIL** | Severe SEO impact | Fix within 1 week |
| 🟡 **WARN** | Should be addressed | Fix within 1 month |
| 🟢 **PASS** | Check passed | No action needed |

### Common Findings

#### CRITICAL: robots.txt serving HTML

**What it means**: Your robots.txt file is returning HTML instead of plain text, likely due to SPA catch-all rewrite.

**Impact**: Search engines cannot read crawl directives, may not discover sitemap.

**How to verify**:
```bash
curl -s https://newsroom.dna.online/robots.txt | head
```

**Expected**: Should show "User-agent:" directives  
**Actual**: Shows `<!DOCTYPE html>` or `<html>`

**Fix**: See Recommendations section in report.

#### CRITICAL: Shell Duplication 87%

**What it means**: 87% of your pages return identical HTML (the React app shell), with content rendered only client-side.

**Impact**: Search engines see empty pages, cannot index content.

**How to verify**:
```bash
curl -s https://newsroom.dna.online/blog-posts/view/123/article-title | grep -o '<title>.*</title>'
```

**Expected**: Should show article title  
**Actual**: Shows generic app title or empty

**Fix**: Implement SSR or pre-rendering for public pages.

#### CRITICAL: Non-Crawlable Navigation

**What it means**: Navigation links use JavaScript/buttons without `<a href>`, preventing crawler discovery.

**Impact**: Search engines cannot discover linked pages.

**How to verify**:
```bash
curl -s https://newsroom.dna.online/ | grep -c '<a href'
```

**Expected**: > 20 links on homepage  
**Actual**: < 5 links

**Fix**: Add proper `<a href>` tags to all navigation elements.

### Inventory Confidence

The system calculates inventory confidence based on:

- **HIGH**: Sitemap valid + crawlable navigation + low shell duplication
- **MED**: Some issues but partial discovery possible
- **LOW**: Multiple blockers prevent accurate inventory

**Example LOW confidence reasons**:
- robots.txt/sitemap return HTML
- Internal links not crawlable
- Shell duplication > 80%
- No pagination detected

**What to do**: Fix CRITICAL issues first, then re-run audit to improve confidence.

## Workflow Recommendations

### Initial Audit

1. Run audit with default settings
2. Review HTML report in browser
3. Focus on CRITICAL findings first
4. Share report with development team

### After Fixes

1. Implement recommended fixes
2. Verify fixes with curl commands (provided in report)
3. Re-run audit to validate improvements
4. Compare before/after reports

### Periodic Monitoring

1. Schedule weekly/monthly audits
2. Track metrics over time:
   - Shell duplication percentage
   - Inventory confidence
   - URL discovery count
   - CRITICAL finding count
3. Alert on regressions

## Troubleshooting

### Audit Hangs or Times Out

**Cause**: Site is slow or blocking requests

**Solution**:
```bash
# Increase timeout and reduce concurrency
npm run audit -- https://site.com \
  --timeout 60000 \
  --concurrency 2
```

### "Too Few URLs Discovered"

**Cause**: Non-crawlable navigation or robots.txt blocking

**Solution**:
1. Check robots.txt is valid (not HTML)
2. Verify homepage has `<a href>` links
3. Increase --max-urls if needed

### "Connection Refused" Errors

**Cause**: Rate limiting or firewall

**Solution**:
```bash
# Reduce concurrency
npm run audit -- https://site.com --concurrency 1
```

### Report Shows "Unknown" Page Types

**Cause**: Site-specific URL patterns not recognized

**Solution**: Add patterns to `src/modules/classifier.ts`:
```typescript
const SITE_SPECIFIC_PATTERNS = {
  'your-domain.com': {
    article: [/\/posts\/\d+\/.+/],
    listing: [/\/posts$/]
  }
};
```

## Advanced Usage

### Custom User-Agent

The system uses "DNANewsroomBot/1.0" by default. To test with different UAs:

```bash
# Enable UA variance check
npm run audit -- https://site.com --ua-check
```

This will fetch key pages with:
- DNANewsroomBot/1.0
- Googlebot/2.1
- Bingbot/2.0

And report any differences (cloaking detection).

### Programmatic Access

Use report.json for automated processing:

```javascript
const report = require('./audit-reports/report.json');

report.domains.forEach(domain => {
  const criticalCount = domain.findings.technical
    .filter(f => f.severity === 'CRITICAL').length;
  
  console.log(`${domain.url}: ${criticalCount} critical issues`);
});
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/seo-audit.yml
name: SEO Audit
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - run: npm run audit -- https://newsroom.dna.online/ --formats json
      - run: |
          CRITICAL=$(jq '[.domains[].findings.technical[] | select(.severity=="CRITICAL")] | length' audit-reports/report.json)
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ $CRITICAL critical SEO issues found"
            exit 1
          fi
```

## Next Steps

- Review `04-ARCHITECTURE.md` for technical details
- Review `05-FINDINGS-GUIDE.md` for detailed fix instructions
- Check `.kiro/specs/audit-for-sites/` for complete specifications
