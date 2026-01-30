# 🚀 DNA Newsroom SEO/GEO Audit Runner

Sistema de auditoría técnica SEO + GEO (AI indexing readiness) para analizar sitios web de DNA Newsroom sin dependencias externas.

## Features

- ✅ **Technical SEO Analysis**: robots.txt, sitemap.xml, catch-all detection
- ✅ **Crawlability Analysis**: Internal linking, pagination, listing routes
- ✅ **SPA/CSR Detection**: Shell duplication, soft 404s, app shell signals
- ✅ **Indexability Checks**: Status codes, redirects, noindex, canonical
- ✅ **Structured Data**: JSON-LD detection, schema validation
- ✅ **Content Inventory**: URL classification, confidence scoring
- ✅ **GEO Gap Analysis**: Missing pages, enhancement recommendations
- ✅ **Multi-domain Support**: Audit multiple sites in one run
- ✅ **Professional Reports**: JSON, HTML, CSV exports

## Installation

```bash
npm install
npm run build
```

## Usage

### Basic Usage

```bash
# Audit a single site
npm run audit -- https://example.com

# Audit multiple sites
npm run audit -- https://site1.com https://site2.com
```

### With Options

```bash
npm run audit -- https://example.com \
  --max-urls 50 \
  --timeout 30000 \
  --concurrency 5 \
  --output ./reports \
  --formats json,html,csv \
  --verbose
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--max-urls` | 50 | Maximum URLs to analyze per domain |
| `--timeout` | 30000 | Request timeout in milliseconds |
| `--concurrency` | 5 | Concurrent requests |
| `--output` | ./audit-reports | Output directory |
| `--formats` | json,html | Output formats (json,html,csv) |
| `--ua-check` | false | Enable UA variance check |
| `--verbose` | false | Verbose output |

## Output

### report.html
Self-contained HTML report with:
- Executive summary with severity badges
- Domain tabs for multi-site audits
- Collapsible sections
- Evidence snippets
- Recommendations with validation commands

### report.json
Complete dataset for programmatic access

### report.csv
Per-URL data for spreadsheet analysis

## Severity Levels

| Level | Description |
|-------|-------------|
| **CRITICAL** | P0 blocker, prevents indexing/discovery |
| **FAIL** | Severe issue, significantly impacts SEO |
| **WARN** | Issue that should be addressed |
| **PASS** | Check passed |

## What It Detects

### Technical SEO (P0)
- robots.txt serving HTML (SPA fallback)
- sitemap.xml returning HTML
- Catch-all rewrite misconfiguration
- Missing sitemap directive

### Crawlability (P0/P1)
- Non-crawlable navigation (JS-only, buttons without href)
- Template placeholders in links
- Missing pagination
- Low internal linking

### SPA/CSR Issues (P0)
- Shell duplication (multiple URLs same HTML)
- Soft 404s (200 status but empty content)
- Client-side only metadata

### Indexability (P1)
- noindex on public pages
- Canonical pointing to homepage
- Missing title/OG tags
- Redirect chains

### GEO Readiness (P1/P2)
- Missing trust pages (about, contact, privacy)
- Missing FAQ page
- Missing editorial policy (newsroom)
- Incomplete structured data

## License

MIT
