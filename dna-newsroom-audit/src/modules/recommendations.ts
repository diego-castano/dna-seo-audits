import { Recommendation, Finding, Priority } from '../models/types';

export function generateRecommendations(findings: Finding[], domain: string): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  for (const finding of findings) {
    const rec = getRecommendationForFinding(finding, domain);
    if (rec) {
      recommendations.push(rec);
    }
  }
  
  // Sort by priority
  const priorityOrder = { P0: 0, P1: 1, P2: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations;
}

function getRecommendationForFinding(finding: Finding, domain: string): Recommendation | null {
  // Robots/Sitemap HTML issues
  if (finding.id.includes('robots-html') || finding.id.includes('sitemap-html') || finding.id === 'catch-all-detected') {
    return {
      id: `rec-${finding.id}`,
      findingId: finding.id,
      priority: 'P0',
      rootCause: 'SPA catch-all rewrite is serving the app shell for /robots.txt and /sitemap.xml',
      fixOptionA: {
        label: 'Minimum fix',
        action: 'Exclude /robots.txt and /sitemap* from the SPA catch-all rewrite in your CDN/origin routing configuration',
        effort: 'low'
      },
      fixOptionB: {
        label: 'Ideal fix',
        action: 'Serve static robots.txt and sitemap.xml files from origin. Reference sitemap URL in robots.txt. Consider generating sitemap dynamically from your CMS/database.',
        effort: 'medium'
      },
      validation: {
        command: `curl -s https://${domain}/robots.txt | head -5`,
        expectedResult: 'Should show "User-agent:" on first lines, NOT "<!DOCTYPE html>"'
      },
      targetTeam: 'dev'
    };
  }
  
  // Shell duplication
  if (finding.id.includes('shell-cluster') || finding.id.includes('spa-shell')) {
    return {
      id: `rec-${finding.id}`,
      findingId: finding.id,
      priority: 'P0',
      rootCause: 'Client-side rendering (CSR) without server-side rendering causes all pages to return the same HTML shell',
      fixOptionA: {
        label: 'Minimum fix',
        action: 'Pre-render critical pages (home, listings, top 10-20 posts) using static site generation or build-time rendering',
        effort: 'medium'
      },
      fixOptionB: {
        label: 'Ideal fix',
        action: 'Implement full SSR/SSG for all public routes. Use Next.js, Nuxt, or similar framework with server-side rendering.',
        effort: 'high'
      },
      validation: {
        command: `curl -s https://${domain}/ | grep -o '<title>.*</title>'`,
        expectedResult: 'Should show unique, content-specific title, NOT empty or generic app title'
      },
      targetTeam: 'dev'
    };
  }

  // Non-crawlable navigation
  if (finding.id.includes('linkability-non-crawlable') || finding.id.includes('linkability-placeholders')) {
    return {
      id: `rec-${finding.id}`,
      findingId: finding.id,
      priority: 'P0',
      rootCause: 'Navigation uses JavaScript-only interactions (onclick, buttons) without proper <a href> links',
      fixOptionA: {
        label: 'Minimum fix',
        action: 'Add <a href="/path"> to all article cards and pagination buttons. Ensure href contains the actual URL.',
        effort: 'medium'
      },
      fixOptionB: {
        label: 'Ideal fix',
        action: 'Server-render full navigation with semantic HTML links. Use <a> tags for all clickable navigation elements.',
        effort: 'medium'
      },
      validation: {
        command: `curl -s https://${domain}/ | grep -c '<a href'`,
        expectedResult: 'Should show > 20 for listing/newsroom pages'
      },
      targetTeam: 'dev'
    };
  }
  
  // Missing metadata
  if (finding.id.includes('empty-title') || finding.id.includes('no-og')) {
    return {
      id: `rec-${finding.id}`,
      findingId: finding.id,
      priority: 'P1',
      rootCause: 'Metadata (title, OG tags) is generated client-side only and not present in initial HTML',
      fixOptionA: {
        label: 'Minimum fix',
        action: 'Add server-side title, meta description, and OG tags per route in your routing/template configuration',
        effort: 'medium'
      },
      fixOptionB: {
        label: 'Ideal fix',
        action: 'Implement full SSR with dynamic metadata based on page content. Use framework meta management (next/head, vue-meta, etc.)',
        effort: 'high'
      },
      validation: {
        command: `curl -s https://${domain}/[page-url] | grep 'og:title'`,
        expectedResult: 'Should return <meta property="og:title" content="..."> with actual content'
      },
      targetTeam: 'dev'
    };
  }
  
  // Missing canonical
  if (finding.id.includes('no-canonical')) {
    return {
      id: `rec-${finding.id}`,
      findingId: finding.id,
      priority: 'P1',
      rootCause: 'Canonical link element is missing from page HTML',
      fixOptionA: {
        label: 'Minimum fix',
        action: 'Add <link rel="canonical" href="[self-url]"> to each page template',
        effort: 'low'
      },
      fixOptionB: {
        label: 'Ideal fix',
        action: 'Implement dynamic canonical generation based on current URL, handling query params and trailing slashes consistently',
        effort: 'medium'
      },
      validation: {
        command: `curl -s https://${domain}/[page-url] | grep 'rel="canonical"'`,
        expectedResult: 'Should return <link rel="canonical" href="..."> with the page URL'
      },
      targetTeam: 'dev'
    };
  }

  // Canonical pointing to home
  if (finding.id.includes('canonical-home-ratio')) {
    return {
      id: `rec-${finding.id}`,
      findingId: finding.id,
      priority: 'P0',
      rootCause: 'Many pages have their canonical URL incorrectly set to the homepage, causing consolidation issues',
      fixOptionA: {
        label: 'Minimum fix',
        action: 'Update canonical generation to use the current page URL instead of hardcoded homepage',
        effort: 'low'
      },
      fixOptionB: {
        label: 'Ideal fix',
        action: 'Implement proper canonical URL generation that accounts for the actual page URL, removing query params if needed',
        effort: 'medium'
      },
      validation: {
        command: `curl -s https://${domain}/[any-page] | grep 'rel="canonical"'`,
        expectedResult: 'Canonical should match the page URL, NOT the homepage'
      },
      targetTeam: 'dev'
    };
  }
  
  // Missing schema
  if (finding.id.includes('schema-posts-missing') || finding.id.includes('schema-org-missing')) {
    return {
      id: `rec-${finding.id}`,
      findingId: finding.id,
      priority: 'P1',
      rootCause: 'JSON-LD structured data is missing or incomplete',
      fixOptionA: {
        label: 'Minimum fix',
        action: 'Add JSON-LD script with Article schema to post pages, Organization schema to home/about',
        effort: 'medium'
      },
      fixOptionB: {
        label: 'Ideal fix',
        action: 'Implement comprehensive schema strategy: Article/NewsArticle for posts, Organization for site, BreadcrumbList for navigation, FAQPage for FAQ',
        effort: 'high'
      },
      validation: {
        command: `curl -s https://${domain}/[post-url] | grep 'application/ld+json'`,
        expectedResult: 'Should return JSON-LD script with @type Article or NewsArticle'
      },
      targetTeam: 'dev'
    };
  }
  
  // GEO gaps - missing pages
  if (finding.id.includes('geo-missing')) {
    return {
      id: `rec-${finding.id}`,
      findingId: finding.id,
      priority: 'P1',
      rootCause: 'Important pages for AI indexing and trust signals are missing from the site',
      fixOptionA: {
        label: 'Minimum fix',
        action: 'Create the missing pages with basic content and proper metadata',
        effort: 'medium'
      },
      fixOptionB: {
        label: 'Ideal fix',
        action: 'Create comprehensive pages following the suggested outline, with proper schema markup and internal linking',
        effort: 'high'
      },
      validation: {
        command: `curl -s -o /dev/null -w "%{http_code}" https://${domain}/[missing-slug]`,
        expectedResult: 'Should return 200'
      },
      targetTeam: 'content'
    };
  }
  
  // No valid sitemap
  if (finding.id.includes('sitemap-none-valid')) {
    return {
      id: `rec-${finding.id}`,
      findingId: finding.id,
      priority: 'P0',
      rootCause: 'No valid XML sitemap is available for search engine discovery',
      fixOptionA: {
        label: 'Minimum fix',
        action: 'Create a static sitemap.xml file listing all public URLs',
        effort: 'low'
      },
      fixOptionB: {
        label: 'Ideal fix',
        action: 'Implement dynamic sitemap generation from CMS/database, with proper lastmod dates and priority hints',
        effort: 'medium'
      },
      validation: {
        command: `curl -s https://${domain}/sitemap.xml | head -3`,
        expectedResult: 'Should show <?xml version="1.0"?> and <urlset>'
      },
      targetTeam: 'dev'
    };
  }
  
  return null;
}
