import { AnalysisResult, ExecutiveSummary, Finding, Severity } from '../models/types';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// JSON REPORT
// ============================================

export function generateJSON(results: AnalysisResult[]): string {
  return JSON.stringify(results, null, 2);
}

// ============================================
// CSV REPORT
// ============================================

export function generateCSV(results: AnalysisResult[]): string {
  const headers = [
    'Domain', 'URL', 'Status', 'Title', 'Canonical', 'Has Noindex',
    'OG Title', 'JSON-LD Count', 'Internal Links', 'Is Shell', 'Shell Cluster'
  ];
  
  const rows: string[][] = [headers];
  
  for (const result of results) {
    for (const analysis of result.urlAnalyses) {
      rows.push([
        result.domain,
        analysis.url,
        String(analysis.status),
        escapeCsv(analysis.title),
        analysis.canonical,
        String(analysis.hasNoindex),
        escapeCsv(analysis.ogTags.title),
        String(analysis.jsonLdCount),
        String(analysis.internalAnchorCount),
        String(analysis.isShell),
        analysis.shellClusterId ? String(analysis.shellClusterId) : ''
      ]);
    }
  }
  
  return rows.map(row => row.join(',')).join('\n');
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ============================================
// EXECUTIVE SUMMARY
// ============================================

export function generateExecutiveSummary(result: AnalysisResult): ExecutiveSummary {
  const allFindings = result.allFindings;
  
  const passCount = allFindings.filter(f => f.severity === 'PASS').length;
  const warnCount = allFindings.filter(f => f.severity === 'WARN').length;
  const failCount = allFindings.filter(f => f.severity === 'FAIL').length;
  const criticalCount = allFindings.filter(f => f.severity === 'CRITICAL').length;
  
  // Determine overall status
  let overallStatus: Severity = 'PASS';
  if (warnCount > 0) overallStatus = 'WARN';
  if (failCount > 0) overallStatus = 'FAIL';
  if (criticalCount > 0) overallStatus = 'CRITICAL';
  
  // Top blockers
  const topBlockers = allFindings
    .filter(f => f.severity === 'CRITICAL' || f.severity === 'FAIL')
    .slice(0, 5);
  
  // Generate bullets
  const bullets = generateBullets(result);
  
  return {
    domain: result.domain,
    siteMode: result.siteMode,
    overallStatus,
    inventoryConfidence: result.inventory.confidence,
    inventoryConfidenceReasons: result.inventory.confidenceReasons,
    coverageEstimate: result.inventory.coverageEstimate,
    topBlockers,
    passCount,
    warnCount,
    failCount,
    criticalCount,
    bullets
  };
}

function generateBullets(result: AnalysisResult): string[] {
  const bullets: string[] = [];
  
  // Robots/Sitemap status
  if (!result.robotsTxt.isValid || result.robotsTxt.isHTML) {
    bullets.push(`🔴 robots.txt is ${result.robotsTxt.isHTML ? 'serving HTML (SPA fallback)' : 'invalid'}`);
  }
  if (!result.sitemap.validSitemapFound) {
    bullets.push(`🔴 No valid sitemap found`);
  } else {
    bullets.push(`✅ Valid sitemap with ${result.sitemap.totalUrlCount} URLs`);
  }
  
  // Catch-all detection
  if (result.catchAllDetection.detected) {
    bullets.push(`🔴 SPA catch-all fallback detected - critical SEO endpoints compromised`);
  }
  
  // Shell duplication
  if (result.spaDetection.shellClusterRatio > 0.5) {
    bullets.push(`🔴 ${Math.round(result.spaDetection.shellClusterRatio * 100)}% of pages share identical HTML (shell duplication)`);
  } else if (result.spaDetection.shellClusters.length > 0) {
    bullets.push(`🟡 ${result.spaDetection.shellClusters.length} shell clusters detected`);
  }
  
  // Crawlability
  if (result.homepageLinkability.internalAnchors < 10) {
    bullets.push(`🟡 Low internal linking on homepage (${result.homepageLinkability.internalAnchors} links)`);
  }
  if (result.nonCrawlableNavigation.length > 0) {
    const total = result.nonCrawlableNavigation.reduce((sum, i) => sum + i.count, 0);
    bullets.push(`🔴 ${total} non-crawlable navigation elements detected`);
  }
  
  // Canonical issues
  if (result.canonicalHomeRatio > 0.2) {
    bullets.push(`🔴 ${Math.round(result.canonicalHomeRatio * 100)}% of pages have canonical pointing to homepage`);
  }
  
  // Inventory
  bullets.push(`📊 Inventory: ${result.inventory.pages.length} pages discovered (confidence: ${result.inventory.confidence})`);
  
  // GEO gaps
  if (result.geoGaps.missingCount > 0) {
    bullets.push(`📝 ${result.geoGaps.missingCount} recommended GEO pages missing`);
  }
  
  return bullets.slice(0, 8);
}

// ============================================
// HTML REPORT
// ============================================

export function generateHTML(results: AnalysisResult[]): string {
  const timestamp = new Date().toISOString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DNA Newsroom SEO/GEO Audit Report</title>
  <style>
    :root {
      --pass: #22c55e;
      --warn: #eab308;
      --fail: #f97316;
      --critical: #ef4444;
      --bg: #0f172a;
      --bg-card: #1e293b;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
    header {
      text-align: center;
      padding: 2rem 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 2rem;
    }
    header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    header .meta { color: var(--text-muted); font-size: 0.875rem; }
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
    }
    .tab {
      padding: 0.5rem 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      cursor: pointer;
      color: var(--text);
    }
    .tab.active { background: var(--pass); color: white; }
    .domain-content { display: none; }
    .domain-content.active { display: block; }
    section {
      background: var(--bg-card);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--border);
    }
    section h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-pass { background: var(--pass); color: white; }
    .badge-warn { background: var(--warn); color: black; }
    .badge-fail { background: var(--fail); color: white; }
    .badge-critical { background: var(--critical); color: white; }
    .badge-p0 { background: var(--critical); color: white; }
    .badge-p1 { background: var(--warn); color: black; }
    .badge-p2 { background: var(--text-muted); color: white; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .summary-card {
      background: var(--bg);
      padding: 1rem;
      border-radius: 0.5rem;
      text-align: center;
    }
    .summary-card .value { font-size: 2rem; font-weight: bold; }
    .summary-card .label { color: var(--text-muted); font-size: 0.875rem; }
    .bullets { list-style: none; }
    .bullets li { padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
    .bullets li:last-child { border-bottom: none; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: var(--bg);
      position: sticky;
      top: 0;
      font-weight: 600;
    }
    tr:hover { background: rgba(255,255,255,0.05); }
    .evidence {
      background: var(--bg);
      padding: 1rem;
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.75rem;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .collapsible {
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .collapsible::after { content: '▼'; font-size: 0.75rem; }
    .collapsible.collapsed::after { content: '▶'; }
    .collapsible-content { display: block; margin-top: 1rem; }
    .collapsible.collapsed + .collapsible-content { display: none; }
    .finding {
      background: var(--bg);
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 0.75rem;
      border-left: 4px solid var(--border);
    }
    .finding.critical { border-left-color: var(--critical); }
    .finding.fail { border-left-color: var(--fail); }
    .finding.warn { border-left-color: var(--warn); }
    .finding h4 { margin-bottom: 0.5rem; }
    .finding p { color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.5rem; }
    .rec-box {
      background: var(--bg);
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }
    .rec-box h4 { margin-bottom: 0.75rem; }
    .rec-box .root-cause { color: var(--text-muted); margin-bottom: 0.75rem; }
    .rec-box .fix { margin-bottom: 0.5rem; }
    .rec-box .fix strong { color: var(--pass); }
    .rec-box code {
      display: block;
      background: #000;
      padding: 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      margin-top: 0.5rem;
    }
    @media (max-width: 768px) {
      .container { padding: 1rem; }
      .summary-grid { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 DNA Newsroom SEO/GEO Audit Report</h1>
      <div class="meta">Generated: ${timestamp}</div>
    </header>
    
    ${results.length > 1 ? `
    <div class="tabs">
      ${results.map((r, i) => `
        <button class="tab ${i === 0 ? 'active' : ''}" onclick="showDomain(${i})">${r.domain}</button>
      `).join('')}
    </div>
    ` : ''}
    
    ${results.map((result, i) => generateDomainHTML(result, i === 0)).join('')}
  </div>
  
  <script>
    function showDomain(index) {
      document.querySelectorAll('.domain-content').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
      document.querySelectorAll('.tab').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
    }
    document.querySelectorAll('.collapsible').forEach(el => {
      el.addEventListener('click', () => el.classList.toggle('collapsed'));
    });
  </script>
</body>
</html>`;
}

function generateDomainHTML(result: AnalysisResult, isActive: boolean): string {
  const summary = result.summary;
  
  return `
    <div class="domain-content ${isActive ? 'active' : ''}" data-domain="${result.domain}">
      <!-- Executive Summary -->
      <section>
        <h2>Executive Summary</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="value"><span class="badge badge-${summary.overallStatus.toLowerCase()}">${summary.overallStatus}</span></div>
            <div class="label">Overall Status</div>
          </div>
          <div class="summary-card">
            <div class="value">${summary.criticalCount}</div>
            <div class="label">Critical Issues</div>
          </div>
          <div class="summary-card">
            <div class="value">${summary.failCount}</div>
            <div class="label">Failures</div>
          </div>
          <div class="summary-card">
            <div class="value">${summary.warnCount}</div>
            <div class="label">Warnings</div>
          </div>
          <div class="summary-card">
            <div class="value">${result.siteMode}</div>
            <div class="label">Site Mode</div>
          </div>
          <div class="summary-card">
            <div class="value">${result.inventory.confidence}</div>
            <div class="label">Inventory Confidence</div>
          </div>
        </div>
        <ul class="bullets">
          ${summary.bullets.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </section>
      
      <!-- Technical SEO -->
      <section>
        <h2 class="collapsible">Technical SEO Blockers (P0)</h2>
        <div class="collapsible-content">
          ${generateFindingsHTML(result.allFindings.filter(f => f.category === 'Technical SEO'))}
          
          <h4>robots.txt Evidence</h4>
          <pre class="evidence">${escapeHtml(result.robotsTxt.evidenceSnippet)}</pre>
          
          ${result.sitemap.variants.length > 0 ? `
          <h4>Sitemap Variants</h4>
          <table>
            <thead><tr><th>URL</th><th>Status</th><th>Valid</th><th>URLs</th></tr></thead>
            <tbody>
              ${result.sitemap.variants.map(v => `
                <tr>
                  <td>${v.url}</td>
                  <td>${v.status}</td>
                  <td>${v.isValid ? '✅' : (v.isHTML ? '❌ HTML' : '❌')}</td>
                  <td>${v.urlCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}
        </div>
      </section>
      
      <!-- Crawlability -->
      <section>
        <h2 class="collapsible">Crawlability Analysis</h2>
        <div class="collapsible-content">
          <div class="summary-grid">
            <div class="summary-card">
              <div class="value">${result.homepageLinkability.internalAnchors}</div>
              <div class="label">Internal Links (Home)</div>
            </div>
            <div class="summary-card">
              <div class="value">${result.pagination.found ? '✅' : '❌'}</div>
              <div class="label">Pagination Found</div>
            </div>
            <div class="summary-card">
              <div class="value">${result.listingRoutes.validListingsFound}</div>
              <div class="label">Valid Listings</div>
            </div>
          </div>
          ${generateFindingsHTML(result.allFindings.filter(f => f.category === 'Crawlability'))}
        </div>
      </section>
      
      <!-- SPA Detection -->
      <section>
        <h2 class="collapsible">SPA/JS-Only Detection</h2>
        <div class="collapsible-content">
          <div class="summary-grid">
            <div class="summary-card">
              <div class="value">${result.spaDetection.shellClusters.length}</div>
              <div class="label">Shell Clusters</div>
            </div>
            <div class="summary-card">
              <div class="value">${Math.round(result.spaDetection.shellClusterRatio * 100)}%</div>
              <div class="label">Shell Ratio</div>
            </div>
            <div class="summary-card">
              <div class="value">${result.spaDetection.softFourOhFours.length}</div>
              <div class="label">Soft 404s</div>
            </div>
          </div>
          ${generateFindingsHTML(result.allFindings.filter(f => f.category === 'SPA Detection'))}
        </div>
      </section>
      
      <!-- Content Inventory -->
      <section>
        <h2 class="collapsible">Content Inventory</h2>
        <div class="collapsible-content">
          <p style="margin-bottom: 1rem; color: var(--text-muted);">${result.inventory.coverageEstimate}</p>
          <table>
            <thead><tr><th>Type</th><th>Count</th><th>Needs Enhancement</th></tr></thead>
            <tbody>
              ${Object.entries(result.inventory.counts).filter(([_, count]) => count > 0).map(([type, count]) => `
                <tr>
                  <td>${type}</td>
                  <td>${count}</td>
                  <td>${result.inventory.byType[type as keyof typeof result.inventory.byType]?.filter(p => p.needsEnhancement).length || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
      
      <!-- GEO Gaps -->
      <section>
        <h2 class="collapsible">GEO Content Gap Analysis</h2>
        <div class="collapsible-content">
          <div class="summary-grid">
            <div class="summary-card">
              <div class="value">${result.geoGaps.missingCount}</div>
              <div class="label">Missing Pages</div>
            </div>
            <div class="summary-card">
              <div class="value">${result.geoGaps.needsEnhancementCount}</div>
              <div class="label">Need Enhancement</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Page</th><th>Status</th><th>Priority</th><th>Rationale</th></tr></thead>
            <tbody>
              ${result.geoGaps.gaps.filter(g => g.status !== 'EXISTS_OK').map(g => `
                <tr>
                  <td>${g.requirement.slug}</td>
                  <td><span class="badge ${g.status === 'MISSING' ? 'badge-critical' : 'badge-warn'}">${g.status === 'MISSING' ? 'Missing' : 'Needs Work'}</span></td>
                  <td><span class="badge badge-${g.effectivePriority.toLowerCase()}">${g.effectivePriority}</span></td>
                  <td>${g.requirement.rationale}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
      
      <!-- Recommendations -->
      <section>
        <h2 class="collapsible">Recommended Fixes</h2>
        <div class="collapsible-content">
          ${result.recommendations.map(rec => `
            <div class="rec-box">
              <h4><span class="badge badge-${rec.priority.toLowerCase()}">${rec.priority}</span> ${rec.rootCause}</h4>
              <div class="fix"><strong>Option A (${rec.fixOptionA.effort}):</strong> ${rec.fixOptionA.action}</div>
              <div class="fix"><strong>Option B (${rec.fixOptionB.effort}):</strong> ${rec.fixOptionB.action}</div>
              <div class="fix"><strong>Validate:</strong><code>${rec.validation.command}</code></div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function generateFindingsHTML(findings: Finding[]): string {
  if (findings.length === 0) return '<p style="color: var(--text-muted);">No issues found</p>';
  
  return findings.map(f => `
    <div class="finding ${f.severity.toLowerCase()}">
      <h4><span class="badge badge-${f.severity.toLowerCase()}">${f.severity}</span> ${f.title}</h4>
      <p>${f.description}</p>
      <p><strong>Why flagged:</strong> ${f.whyFlagged}</p>
    </div>
  `).join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================
// FILE WRITING
// ============================================

export function writeReports(
  results: AnalysisResult[],
  outputDir: string,
  formats: ('json' | 'html' | 'csv')[]
): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  if (formats.includes('json')) {
    fs.writeFileSync(path.join(outputDir, 'report.json'), generateJSON(results));
  }
  
  if (formats.includes('html')) {
    fs.writeFileSync(path.join(outputDir, 'report.html'), generateHTML(results));
  }
  
  if (formats.includes('csv')) {
    fs.writeFileSync(path.join(outputDir, 'report.csv'), generateCSV(results));
  }
}
