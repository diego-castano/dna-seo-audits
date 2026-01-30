# DNA Newsroom SEO/GEO Audit Dashboard

Professional, production-ready web dashboard for visualizing SEO/GEO audit results.

## Features

- **Multi-domain support**: Switch between newsroom.dna.online and newsroom.upscrolled.com
- **Executive Summary**: KPI cards with animated counters, status banner, key findings
- **P0 Blockers**: Expandable cards with evidence snippets and detection signals
- **Crawlability Analysis**: Link graph health, listing routes, pagination detection
- **Indexability Table**: Per-URL analysis with status badges
- **SPA/JS Detection**: Shell duplication visualization, soft 404 detection
- **Structured Data**: GEO readiness checklist with pass/fail indicators
- **Content Inventory**: Page classification with confidence scoring
- **GEO Gap Analysis**: Missing pages matrix with priorities
- **SEMrush Integration**: Error/warning summaries, JS impact analysis
- **Performance Metrics**: Lighthouse scores, GTmetrix results
- **Recommendations**: Prioritized action plan with validation commands
- **Evidence Appendix**: Collapsible sections with raw evidence

## Design

- Modern, corporate SaaS aesthetic
- Soft neutral background with crisp cards
- Severity-based color coding (CRITICAL, FAIL, WARN, PASS)
- Responsive design (laptop, tablet, mobile)
- Smooth animations and transitions
- Accessible (keyboard navigation, color contrast)

## Usage

1. Open `index.html` in a browser
2. Use domain tabs to switch between sites
3. Use sidebar filters to focus on specific issues
4. Click blocker cards to expand evidence
5. Export as PDF (print) or JSON

## Data Sources

- **Audit Runner**: Technical SEO analysis (robots, sitemap, shell detection)
- **SEMrush**: Broken links, missing metadata, JS impact
- **Lighthouse**: Performance, SEO, accessibility scores
- **GTmetrix**: Load times, request counts, page size

## Files

- `index.html` - Main dashboard HTML
- `styles.css` - All CSS styles
- `app.js` - JavaScript functionality and data
- `logo.png` - DNA Newsroom logo

## Customization

Edit `app.js` to update the `auditData` object with new audit results.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
