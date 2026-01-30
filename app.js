// DNA Newsroom SEO/GEO Audit Dashboard - JavaScript

// ============================================
// DATA - Consolidated from all sources
// ============================================

const auditData = {
  'newsroom.dna.online': {
    status: 'CRITICAL',
    timestamp: '2026-01-30T03:20:42.351Z',
    siteMode: 'agency',
    summary: {
      p0Count: 12,
      p1Count: 15,
      p2Count: 44,
      totalFindings: 71,
      indexableSurface: 5,
      inventoryConfidence: 'LOW',
      pagesDiscovered: 23
    },
    semrush: {
      errors: {
        brokenInternalLinks: 250,
        fourXXErrors: 16,
        brokenJSCSS: 120,
        duplicateContent: 104,
        titleMissing: 73,
        duplicateTitles: 46,
        brokenImages: 21,
        fiveXXErrors: 13
      },
      warnings: {
        missingMetaDesc: 119,
        missingH1: 117,
        lowTextRatio: 110,
        missingAlt: 299,
        uncompressedJSCSS: 2541,
        unminifiedJSCSS: 2468,
        nonDescriptiveAnchors: 662,
        temporaryRedirects: 304
      },
      pagesAudited: 119
    },
    lighthouse: {
      performance: 59,
      seo: 67,
      accessibility: 52,
      bestPractices: 77,
      lcp: '13.4s'
    },
    gtmetrix: {
      requests: 103,
      pageSize: '4.3 MB',
      onLoad: '7.6s',
      fullyLoaded: '8.2s'
    },
    technicalSEO: {
      robotsTxt: {
        status: 'CRITICAL',
        isHTML: true,
        hasAppShellSignals: true,
        hasSitemapDirective: false
      },
      sitemap: {
        status: 'CRITICAL',
        validFound: false,
        variantsTested: 6,
        allReturnHTML: true
      },
      catchAll: {
        detected: true,
        robotsMatchesHome: true
      }
    },
    crawlability: {
      totalAnchors: 24,
      internalAnchors: 17,
      placeholderAnchors: 6,
      emptyAnchors: 5,
      crawlableRatio: 46,
      nonCrawlableIssues: [
        { type: 'placeholder', count: 6, evidence: '{{link}}, {{url}}, {{fileLink}}' },
        { type: 'empty', count: 1, evidence: 'Empty href in content area' }
      ],
      listingRoutes: [
        { url: '/press', status: 'shell' },
        { url: '/news', status: 'shell' },
        { url: '/blog', status: 'shell' },
        { url: '/articles', status: 'shell' },
        { url: '/latest', status: 'shell' },
        { url: '/posts', status: 'shell' },
        { url: '/updates', status: 'shell' }
      ],
      paginationFound: false
    },
    spaDetection: {
      shellDuplication: 87,
      shellClusterSize: 20,
      totalPages: 23,
      softFourOFourCount: 15
    },
    structuredData: {
      jsonLdCount: 0,
      organizationSchema: false,
      websiteSchema: false,
      articleSchema: false,
      breadcrumbSchema: false,
      faqSchema: false,
      rssFound: false,
      llmsTxtFound: false
    },
    inventory: {
      confidence: 'LOW',
      reasons: [
        'robots.txt and sitemap.xml return HTML',
        'Internal links not crawlable (placeholders)',
        'Shell duplication 87%',
        'No pagination detected'
      ],
      byType: {
        home: 1,
        listing: 0,
        article: 0,
        trust: 0,
        admin: 4,
        other: 18
      }
    },
    geoGaps: {
      missing: [],
      needsEnhancement: [
        { type: 'about', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'contact', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'privacy', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'terms', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'faq', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'services', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'team', priority: 'P2', reason: 'Exists but shell/no content' },
        { type: 'editorial-policy', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'pricing', priority: 'P2', reason: 'Exists but shell/no content' },
        { type: 'case-studies', priority: 'P1', reason: 'Exists but shell/no content' }
      ]
    },
    brokenLinks: [
      { from: '/blog-posts/view/4001/...', to: '/blogs/updates/2', code: 404 },
      { from: '/blog-posts/view/4010/...', to: '/company-files/download/31777/...', code: 403 },
      { from: '/blog-posts/view/4029/...', to: '/blog-posts/download-all/4029/...', code: 502 },
      { from: 'Multiple pages', to: '/microsoft/login', code: 500 }
    ],
    adminRoutes: [
      '/administrators/view-account',
      '/administrators/view-dashboard',
      '/administrators/view-login',
      '/companies/view-login',
      '/companies/logout'
    ]
  },
  'newsroom.upscrolled.com': {
    status: 'CRITICAL',
    timestamp: '2026-01-30T03:20:42.351Z',
    siteMode: 'newsroom',
    summary: {
      p0Count: 12,
      p1Count: 15,
      p2Count: 44,
      totalFindings: 71,
      indexableSurface: 5,
      inventoryConfidence: 'LOW',
      pagesDiscovered: 23
    },
    semrush: {
      errors: {
        brokenInternalLinks: 86,
        fourXXErrors: 3,
        brokenJSCSS: 143,
        duplicateContent: 129,
        titleMissing: 80,
        duplicateTitles: 49,
        brokenImages: 0,
        fiveXXErrors: 2
      },
      warnings: {
        missingMetaDesc: 141,
        missingH1: 141,
        lowTextRatio: 128,
        missingAlt: 408,
        uncompressedJSCSS: 2508,
        unminifiedJSCSS: 2479,
        nonDescriptiveAnchors: 488,
        temporaryRedirects: 287
      },
      pagesAudited: 152,
      jsImpact: {
        beforeJS: { titleMissing: 141, descMissing: 141 },
        afterJS: { titleMissing: 80, descMissing: 141 }
      },
      structuredData: {
        jsonLd: 0,
        microdata: 0,
        openGraph: 'partial',
        twitterCards: 0
      },
      llmsTxt: {
        found: true,
        hasIssues: true,
        issue: 'Formatting issues detected'
      }
    },
    lighthouse: {
      performance: 56,
      seo: 67,
      accessibility: 52,
      bestPractices: 77,
      lcp: '11.2s'
    },
    gtmetrix: {
      requests: 111,
      pageSize: '2.2 MB',
      onLoad: '5.6s',
      fullyLoaded: '6.1s'
    },
    technicalSEO: {
      robotsTxt: {
        status: 'CRITICAL',
        isHTML: true,
        hasAppShellSignals: true,
        hasSitemapDirective: false
      },
      sitemap: {
        status: 'CRITICAL',
        validFound: false,
        variantsTested: 6,
        allReturnHTML: true
      },
      catchAll: {
        detected: true,
        robotsMatchesHome: true
      }
    },
    crawlability: {
      totalAnchors: 24,
      internalAnchors: 17,
      placeholderAnchors: 6,
      emptyAnchors: 5,
      crawlableRatio: 46,
      nonCrawlableIssues: [
        { type: 'placeholder', count: 6, evidence: '{{link}}, {{url}}, {{fileLink}}, {{downloadLink}}' },
        { type: 'empty', count: 1, evidence: 'Empty href in content area' }
      ],
      listingRoutes: [
        { url: '/press', status: 'shell' },
        { url: '/news', status: 'shell' },
        { url: '/blog', status: 'shell' },
        { url: '/articles', status: 'shell' },
        { url: '/latest', status: 'shell' },
        { url: '/posts', status: 'shell' },
        { url: '/updates', status: 'shell' }
      ],
      paginationFound: false
    },
    spaDetection: {
      shellDuplication: 87,
      shellClusterSize: 20,
      totalPages: 23,
      softFourOFourCount: 15
    },
    structuredData: {
      jsonLdCount: 0,
      organizationSchema: false,
      websiteSchema: false,
      articleSchema: false,
      breadcrumbSchema: false,
      faqSchema: false,
      rssFound: false,
      llmsTxtFound: true,
      llmsTxtIssues: true
    },
    inventory: {
      confidence: 'LOW',
      reasons: [
        'robots.txt and sitemap.xml return HTML',
        'Internal links not crawlable (placeholders)',
        'Shell duplication 87%',
        'No pagination detected'
      ],
      byType: {
        home: 1,
        listing: 0,
        article: 0,
        trust: 0,
        admin: 4,
        other: 18
      }
    },
    geoGaps: {
      missing: [],
      needsEnhancement: [
        { type: 'about', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'contact', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'privacy', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'terms', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'faq', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'editorial-policy', priority: 'P1', reason: 'Exists but shell/no content' },
        { type: 'authors', priority: 'P1', reason: 'Missing or not crawlable' },
        { type: 'topics', priority: 'P1', reason: 'Missing or not crawlable' },
        { type: 'rss', priority: 'P1', reason: 'Not found or returns HTML' },
        { type: 'methodology', priority: 'P2', reason: 'Missing' }
      ]
    },
    placeholderUrls: [
      'https://newsroom.upscrolled.com/{{fileLink}}',
      'https://newsroom.upscrolled.com/{{link}}',
      'https://newsroom.upscrolled.com/{{url}}',
      'https://newsroom.upscrolled.com/blog-posts/view/5849/{{downloadLink}}',
      'https://newsroom.upscrolled.com/blog-posts/view/5873/{{fileLink}}',
      'https://newsroom.upscrolled.com/companies/{{fileLink}}'
    ],
    adminRoutes: [
      '/administrators/view-account',
      '/administrators/view-dashboard',
      '/administrators/view-login',
      '/companies/view-login',
      '/companies/logout',
      '/microsoft/login'
    ]
  }
};

// Current state
let currentDomain = 'newsroom.dna.online';
let isTechnicalView = true;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // Animate KPI counters
  animateCounters();

  // Set up intersection observer for scroll animations
  setupScrollAnimations();

  // Initialize filters
  setupFilters();

  // Set up navigation highlighting
  setupNavHighlighting();

  // Initialize tabs data
  initializeTabs();

  // Load initial domain data
  updateDomainData(currentDomain);

  // Initialize download links for current domain
  updateDownloadLinks(currentDomain);

  // Add resize listener to update header text
  window.addEventListener('resize', () => updateDomainData(currentDomain));
}

function initializeTabs() {
  const tabs = document.querySelectorAll('.domain-tab');
  tabs.forEach(tab => {
    const domain = tab.dataset.domain;
    const data = auditData[domain];
    if (!data) return;

    // Update Score Ring
    const scoreRing = tab.querySelector('.tab-score-ring');
    if (scoreRing) {
      scoreRing.textContent = `${data.summary.indexableSurface}%`;
      scoreRing.className = `tab-score-ring ${data.status.toLowerCase()}`;
    }

    // Update Meta Status
    const metaSpan = tab.querySelector('.tab-meta span:last-child');
    if (metaSpan) {
      metaSpan.textContent = `${data.status} BLOCKERS`;
    }

    // Update Counts
    const p0 = tab.querySelector('.count.p0');
    const p1 = tab.querySelector('.count.p1');
    const p2 = tab.querySelector('.count.p2');

    if (p0) p0.textContent = `P0: ${data.summary.p0Count}`;
    if (p1) p1.textContent = `P1: ${data.summary.p1Count}`;
    if (p2) p2.textContent = `P2: ${data.summary.p2Count}`;
  });
}

// ============================================
// DOMAIN SWITCHING
// ============================================

function switchDomain(domain) {
  currentDomain = domain;

  // Update tab states
  document.querySelectorAll('.domain-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.domain === domain);
  });

  // Update content
  updateDomainData(domain);

  // Update download links
  updateDownloadLinks(domain);

  // Re-animate counters
  animateCounters();

  // Re-trigger AI Insights
  if (typeof generateAIInsights === 'function') {
    generateAIInsights();
  }
}

function updateDownloadLinks(domain) {
  // Determine folder name and short name with correct paths
  const folderMap = {
    'newsroom.dna.online': {
      folder: 'newsroom.dna.online',
      short: 'DNA',
      semrushPath: 'SEMRush Issues',
      gtmetrixPath: 'GTMETRIX'
    },
    'newsroom.upscrolled.com': {
      folder: 'newsroom.upscrolled.com',
      short: 'USC',
      semrushPath: 'SEMRush',
      gtmetrixPath: 'GTMetrix'
    }
  };

  const config = folderMap[domain];
  if (!config) return;

  // Calculate other domain config
  const otherDomain = domain === 'newsroom.dna.online' ? 'newsroom.upscrolled.com' : 'newsroom.dna.online';
  const otherConfig = folderMap[otherDomain];

  // Update Quick Reports Panel chips
  const reportChips = document.querySelectorAll('.report-chip');
  if (reportChips.length >= 4) {
    reportChips[0].href = `./SEO-GEO-reports2026/${config.folder}/${config.semrushPath}/`;
    reportChips[0].innerHTML = `<span>🔍</span> SEMrush ${config.short}`;
    reportChips[0].style.opacity = '1';

    reportChips[1].href = `./SEO-GEO-reports2026/${config.folder}/${config.gtmetrixPath}/`;
    reportChips[1].innerHTML = `<span>⚡</span> GTmetrix ${config.short}`;
    reportChips[1].style.opacity = '1';

    reportChips[2].href = `./SEO-GEO-reports2026/${otherConfig.folder}/${otherConfig.semrushPath}/`;
    reportChips[2].innerHTML = `<span>🔍</span> SEMrush ${otherConfig.short}`;
    reportChips[2].style.opacity = '0.5';

    reportChips[3].href = `./SEO-GEO-reports2026/${otherConfig.folder}/${otherConfig.gtmetrixPath}/`;
    reportChips[3].innerHTML = `<span>⚡</span> GTmetrix ${otherConfig.short}`;
    reportChips[3].style.opacity = '0.5';
  }

  // Update sidebar download buttons
  const sidebarButtons = document.querySelectorAll('.sidebar .btn-download-link');
  if (sidebarButtons.length >= 4) {
    sidebarButtons[0].href = `./SEO-GEO-reports2026/${config.folder}/${config.semrushPath}/`;
    sidebarButtons[0].innerHTML = `📊 ${config.short} SEMrush Issues`;
    sidebarButtons[0].style.opacity = '1';

    sidebarButtons[1].href = `./SEO-GEO-reports2026/${config.folder}/${config.gtmetrixPath}/`;
    sidebarButtons[1].innerHTML = `⚡ ${config.short} GTmetrix Report`;
    sidebarButtons[1].style.opacity = '1';

    sidebarButtons[2].href = `./SEO-GEO-reports2026/${otherConfig.folder}/${otherConfig.semrushPath}/`;
    sidebarButtons[2].innerHTML = `📊 ${otherConfig.short} SEMrush`;
    sidebarButtons[2].style.opacity = '0.5';

    sidebarButtons[3].href = `./SEO-GEO-reports2026/${otherConfig.folder}/${otherConfig.gtmetrixPath}/`;
    sidebarButtons[3].innerHTML = `⚡ ${otherConfig.short} GTmetrix`;
    sidebarButtons[3].style.opacity = '0.5';
  }

  // Update ZIP download button
  const zipBtn = document.getElementById('download-zip-btn');
  if (zipBtn) {
    zipBtn.innerHTML = `<span>📦</span> Download ${config.short} ZIP`;
  }
}

function updateDomainData(domain) {
  const data = auditData[domain];
  if (!data) return;

  // Update status banner
  const statusBanner = document.querySelector('.status-banner');
  if (statusBanner) {
    statusBanner.className = `status-banner ${data.status.toLowerCase()}`;
  }

  // Update KPI values
  updateKPIs(data);

  // Update header text dynamically
  const headerMainTitle = document.getElementById('header-main-title');
  const headerSubTitle = document.getElementById('header-sub-title');
  if (headerMainTitle && headerSubTitle) {
    if (window.innerWidth <= 768) {
      headerMainTitle.textContent = domain;
      headerSubTitle.textContent = 'SEO/GEO Audit Report';
    } else {
      headerMainTitle.textContent = 'SEO/GEO Audit Report';
      headerSubTitle.textContent = `Technical Analysis for ${domain}`;
    }
  }
}

function updateKPIs(data) {
  // Get all KPI value elements
  const kpiValues = document.querySelectorAll('.kpi-value');
  const kpiTrends = document.querySelectorAll('.kpi-trend');

  if (kpiValues.length >= 6) {
    // P0 Blockers
    kpiValues[0].setAttribute('data-count', data.summary.p0Count);
    kpiValues[0].textContent = '0'; // Will be animated

    // Indexable Surface
    kpiValues[1].setAttribute('data-count', data.summary.indexableSurface);
    kpiValues[1].textContent = '0'; // Will be animated

    // Inventory Confidence
    kpiValues[2].textContent = data.summary.inventoryConfidence;
    if (kpiTrends[2]) {
      kpiTrends[2].textContent = `${data.summary.pagesDiscovered} pages discovered`;
    }

    // SEMrush Errors
    kpiValues[3].setAttribute('data-count', data.semrush.errors.brokenInternalLinks);
    kpiValues[3].textContent = '0'; // Will be animated

    // Lighthouse SEO
    kpiValues[4].setAttribute('data-count', data.lighthouse.seo);
    kpiValues[4].textContent = '0'; // Will be animated

    // GTmetrix Load
    kpiValues[5].textContent = data.gtmetrix.fullyLoaded;
  }

  // Update status banner text
  const statusContent = document.querySelector('.status-content h3');
  if (statusContent) {
    const statusText = statusContent.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = data.status;
    }
  }

  const statusExplanation = document.querySelector('.status-explanation');
  if (statusExplanation) {
    statusExplanation.textContent = `This site has ${data.summary.p0Count} critical P0 blockers preventing search engine discovery. Only ${data.summary.indexableSurface}% of pages are indexable. Immediate technical intervention required.`;
  }
}

// ============================================
// ANIMATIONS
// ============================================

function animateCounters() {
  const counters = document.querySelectorAll('.kpi-value[data-count]');

  counters.forEach(counter => {
    const target = parseInt(counter.dataset.count);
    const duration = 800;
    const start = 0;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (target - start) * easeOutQuart);

      counter.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    }

    requestAnimationFrame(updateCounter);
  });
}

function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
  });
}

// ============================================
// BLOCKER CARDS
// ============================================

function toggleBlocker(header) {
  const card = header.closest('.blocker-card');
  const isExpanded = card.dataset.expanded === 'true';
  card.dataset.expanded = !isExpanded;

  // Animate evidence snippet with typewriter effect
  if (!isExpanded) {
    const snippet = card.querySelector('.evidence-snippet code');
    if (snippet && !snippet.dataset.animated) {
      typewriterEffect(snippet);
      snippet.dataset.animated = 'true';
    }
  }
}

function typewriterEffect(element) {
  const text = element.textContent;
  element.textContent = '';
  let i = 0;

  function type() {
    if (i < text.length && i < 200) { // Limit to first 200 chars
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, 5);
    } else if (i < text.length) {
      element.textContent = text; // Show full text if too long
    }
  }

  type();
}

// ============================================
// FILTERS
// ============================================

function setupFilters() {
  const filterCheckboxes = document.querySelectorAll('.checkbox input');

  filterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', applyFilters);
  });
}

function applyFilters() {
  // Get active filters
  const activeFilters = {
    severity: [],
    category: [],
    source: []
  };

  document.querySelectorAll('[data-filter]:checked').forEach(cb => {
    activeFilters.severity.push(cb.dataset.filter);
  });

  document.querySelectorAll('[data-category]:checked').forEach(cb => {
    activeFilters.category.push(cb.dataset.category);
  });

  document.querySelectorAll('[data-source]:checked').forEach(cb => {
    activeFilters.source.push(cb.dataset.source);
  });

  // Apply filters to findings
  document.querySelectorAll('.finding-item, .blocker-card').forEach(item => {
    // For now, show all - would implement actual filtering logic
    item.style.display = '';
  });
}

// ============================================
// NAVIGATION
// ============================================

function setupNavHighlighting() {
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(section => {
    observer.observe(section);
  });
}

// ============================================
// VIEW TOGGLE
// ============================================

// Helpers removed: toggleTechView, exportPDF, exportJSON, shareReport.
// They are replaced by shareToWhatsApp and scrollToSection.

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    const headerHeight = document.querySelector('.global-header').offsetHeight + 20;
    window.scrollTo({
      top: el.offsetTop - headerHeight,
      behavior: 'smooth'
    });
  }
}

function shareToWhatsApp() {
  const text = `Check out the DNA Newsroom SEO Audit for ${currentDomain}! Status is CRITICAL. View Report: ${window.location.href}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

// Download full report for a domain
function downloadFullReport(domain) {
  const data = auditData[domain];
  if (!data) {
    alert('No data available for ' + domain);
    return;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${domain}-full-audit-report.json`;
  a.click();

  URL.revokeObjectURL(url);

  // Show feedback
  alert(`Downloaded full report for ${domain}`);
}

// Download section-specific report
function downloadSectionReport(sectionId) {
  const data = auditData[currentDomain];
  if (!data) {
    alert('No data available');
    return;
  }

  let sectionData = {};
  let filename = `${currentDomain}-${sectionId}`;

  switch (sectionId) {
    case 'indexation-proof':
      sectionData = {
        domain: currentDomain,
        section: 'Indexation Proof',
        description: 'URLs that exist but are not indexed by Google',
        urls: [
          { url: 'https://newsroom.dna.online/blog-posts/view/4001/easyjet-fliegt-neu-an-den-nordpol...', status: 'NOT_INDEXED' },
          { url: 'https://newsroom.dna.online/blog-posts/view/4228/bombay-sapphire-unveils...', status: 'NOT_INDEXED' },
          { url: 'https://newsroom.dna.online/blog-posts/view/4424/perfect-magazine-x-grey-gooser...', status: 'NOT_INDEXED' },
          { url: 'https://newsroom.dna.online/blog-posts/view/4422/grey-gooser-vodka-and-frances...', status: 'NOT_INDEXED' },
          { url: 'https://newsroom.upscrolled.com/blog-posts/view/5837/tiktok-users-switch...', status: 'NOT_INDEXED' },
          { url: 'https://newsroom.upscrolled.com/blog-posts/view/5830/some-tiktok-users-switching...', status: 'NOT_INDEXED' },
          { url: 'https://newsroom.upscrolled.com/blog-posts/view/5832/upscrolled-the-pro-palestine...', status: 'NOT_INDEXED' },
          { url: 'https://newsroom.upscrolled.com/blog-posts/view/5841/upscrolled-the-app-taking-on...', status: 'NOT_INDEXED' }
        ]
      };
      break;
    case 'p0-blockers':
      sectionData = {
        domain: currentDomain,
        section: 'P0 Blockers',
        technicalSEO: data.technicalSEO,
        spaDetection: data.spaDetection
      };
      break;
    case 'crawlability':
      sectionData = {
        domain: currentDomain,
        section: 'Crawlability',
        crawlability: data.crawlability
      };
      break;
    case 'semrush':
      sectionData = {
        domain: currentDomain,
        section: 'SEMrush Analysis',
        semrush: data.semrush
      };
      break;
    case 'performance':
      sectionData = {
        domain: currentDomain,
        section: 'Performance',
        lighthouse: data.lighthouse,
        gtmetrix: data.gtmetrix
      };
      break;
    default:
      sectionData = { domain: currentDomain, section: sectionId, data: data };
  }

  const blob = new Blob([JSON.stringify(sectionData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// Download ZIP of all reports for current domain
function downloadDomainZip() {
  const zipMap = {
    'newsroom.dna.online': 'newsroom.dna.online.zip',
    'newsroom.upscrolled.com': 'newsroom.upscrolled.com.zip'
  };

  const zipFile = zipMap[currentDomain];
  if (!zipFile) {
    alert('No ZIP file found for ' + currentDomain);
    return;
  }

  // Create download link for the ZIP file
  const zipPath = `./SEO-GEO-reports2026/${zipFile}`;

  const a = document.createElement('a');
  a.href = zipPath;
  a.download = zipFile;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Show success message
  console.log(`📦 Downloading ${zipFile} for ${currentDomain}`);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function copyEvidence(button) {
  const snippet = button.closest('.blocker-evidence').querySelector('code');
  navigator.clipboard.writeText(snippet.textContent).then(() => {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  });
}

function formatNumber(num) {
  return num.toLocaleString();
}

function getSeverityClass(severity) {
  return severity.toLowerCase();
}

// ============================================
// TOOLTIPS
// ============================================

const tooltips = {
  'canonical': 'A canonical URL tells search engines which version of a page is the "main" one when duplicates exist.',
  'noindex': 'A noindex directive tells search engines not to include a page in search results.',
  'soft-404': 'A soft 404 is when a page returns HTTP 200 but shows error content or is empty.',
  'ssr': 'Server-Side Rendering generates HTML on the server, making content visible to crawlers.',
  'csr': 'Client-Side Rendering generates HTML in the browser via JavaScript, often invisible to crawlers.',
  'crawl-budget': 'The number of pages a search engine will crawl on your site in a given time period.',
  'shell-duplication': 'When multiple URLs return the same HTML "shell" because content is rendered client-side.'
};

function showTooltip(term, element) {
  const tooltip = tooltips[term];
  if (!tooltip) return;

  // Create tooltip element
  const tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.textContent = tooltip;

  // Position and show
  document.body.appendChild(tip);
  const rect = element.getBoundingClientRect();
  tip.style.top = `${rect.bottom + 8}px`;
  tip.style.left = `${rect.left}px`;

  // Remove on mouseout
  element.addEventListener('mouseout', () => {
    tip.remove();
  }, { once: true });
}

// ============================================
// RECOMMENDATIONS DATA
// ============================================

const recommendations = [
  {
    id: 'rec-robots',
    priority: 'P0',
    title: 'Fix robots.txt serving HTML',
    rootCause: 'SPA catch-all rewrite is serving app shell for /robots.txt',
    fixA: {
      title: 'Exclude from rewrite (minimum)',
      description: 'Add exception in CDN/origin config to serve static robots.txt',
      effort: 'Low',
      code: `# Nginx
location = /robots.txt {
  root /var/www/static;
  add_header Content-Type text/plain;
}`
    },
    fixB: {
      title: 'Serve static file with sitemap directive (ideal)',
      description: 'Create proper robots.txt with sitemap reference',
      effort: 'Low',
      code: `User-agent: *
Allow: /

Sitemap: https://newsroom.dna.online/sitemap.xml

Disallow: /admin
Disallow: /login
Disallow: /administrators`
    },
    validation: 'curl -s https://newsroom.dna.online/robots.txt | head -5',
    expectedResult: 'Should show "User-agent:" not HTML',
    targetTeam: 'dev'
  },
  {
    id: 'rec-sitemap',
    priority: 'P0',
    title: 'Create valid XML sitemap',
    rootCause: 'All sitemap endpoints return HTML due to SPA catch-all',
    fixA: {
      title: 'Serve static sitemap.xml',
      description: 'Generate and serve a static XML sitemap',
      effort: 'Medium'
    },
    fixB: {
      title: 'Dynamic sitemap generation (ideal)',
      description: 'Create API endpoint that generates sitemap from database',
      effort: 'Medium'
    },
    validation: 'curl -s https://newsroom.dna.online/sitemap.xml | head -5',
    expectedResult: 'Should show <?xml version="1.0"',
    targetTeam: 'dev'
  },
  {
    id: 'rec-placeholders',
    priority: 'P0',
    title: 'Replace template placeholders with real URLs',
    rootCause: 'Client-side templating not resolved before HTML is served',
    fixA: {
      title: 'Server-side URL resolution',
      description: 'Resolve {{link}}, {{url}}, {{fileLink}} on server before sending HTML',
      effort: 'Medium'
    },
    fixB: {
      title: 'Full SSR implementation (ideal)',
      description: 'Implement server-side rendering for all public pages',
      effort: 'High'
    },
    validation: 'curl -s https://newsroom.dna.online/ | grep -c "{{link}}"',
    expectedResult: 'Should return 0',
    targetTeam: 'dev'
  },
  {
    id: 'rec-ssr',
    priority: 'P0',
    title: 'Implement SSR/Pre-rendering',
    rootCause: 'CSR-only architecture means crawlers see empty pages',
    fixA: {
      title: 'Pre-render critical pages',
      description: 'Use prerender.io or similar for home, listings, top posts',
      effort: 'Medium'
    },
    fixB: {
      title: 'Full SSR/SSG migration (ideal)',
      description: 'Migrate to Next.js, Nuxt, or similar SSR framework',
      effort: 'High'
    },
    validation: 'curl -s URL | grep -o "<title>.*</title>"',
    expectedResult: 'Should show unique, content-specific title',
    targetTeam: 'dev'
  }
];

console.log('DNA Newsroom SEO/GEO Audit Dashboard initialized');
console.log('Current domain:', currentDomain);
console.log('Data loaded for:', Object.keys(auditData));
