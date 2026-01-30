import {
  GeoGap, GeoGapAnalysis, GapStatus, Finding, SiteMode,
  ContentInventory, ClassifiedPage
} from '../models/types';
import { GEO_PAGE_MODEL, getRequirementsForMode, getEffectivePriority } from '../models/geo-page-model';
import { getPathname } from '../utils/url';

export function analyzeGeoGaps(
  inventory: ContentInventory,
  siteMode: SiteMode
): GeoGapAnalysis {
  const findings: Finding[] = [];
  const gaps: GeoGap[] = [];
  
  const requirements = getRequirementsForMode(siteMode);
  
  for (const req of requirements) {
    const allSlugs = [req.slug, ...(req.alternativeSlugs || [])];
    
    // Find matching page in inventory
    let matchingPage: ClassifiedPage | undefined;
    for (const page of inventory.pages) {
      const pathname = getPathname(page.url);
      if (allSlugs.some(slug => pathname === slug || pathname === slug + '/')) {
        matchingPage = page;
        break;
      }
    }
    
    let status: GapStatus;
    let enhancementReasons: string[] = [];
    
    if (!matchingPage) {
      status = 'MISSING';
    } else if (matchingPage.needsEnhancement) {
      status = 'EXISTS_NEEDS_ENHANCEMENT';
      enhancementReasons = matchingPage.enhancementReasons;
    } else {
      status = 'EXISTS_OK';
    }
    
    const effectivePriority = getEffectivePriority(req, siteMode);
    
    gaps.push({
      requirement: req,
      status,
      existingUrl: matchingPage?.url,
      enhancementReasons,
      effectivePriority
    });
  }
  
  // Generate findings
  const missingGaps = gaps.filter(g => g.status === 'MISSING');
  const enhancementGaps = gaps.filter(g => g.status === 'EXISTS_NEEDS_ENHANCEMENT');
  
  const missingP0P1 = missingGaps.filter(g => g.effectivePriority !== 'P2');
  if (missingP0P1.length > 0) {
    findings.push({
      id: 'geo-missing-critical',
      category: 'GEO Gaps',
      severity: 'WARN',
      priority: 'P1',
      title: `${missingP0P1.length} critical GEO pages missing`,
      description: 'Important pages for AI indexing and trust are not present',
      whyFlagged: `Missing: ${missingP0P1.map(g => g.requirement.slug).join(', ')}`,
      whatCrawlersSee: 'These pages do not exist or were not discovered',
      affectedUrls: missingP0P1.map(g => g.requirement.slug)
    });
  }

  if (enhancementGaps.length > 0) {
    findings.push({
      id: 'geo-needs-enhancement',
      category: 'GEO Gaps',
      severity: 'WARN',
      priority: 'P1',
      title: `${enhancementGaps.length} GEO pages need enhancement`,
      description: 'Pages exist but lack proper metadata, schema, or content',
      whyFlagged: enhancementGaps.map(g => 
        `${g.requirement.slug}: ${g.enhancementReasons?.join(', ')}`
      ).join('; '),
      whatCrawlersSee: 'Pages exist but are not optimized for AI indexing',
      affectedUrls: enhancementGaps.map(g => g.existingUrl).filter(Boolean) as string[]
    });
  }
  
  return {
    siteMode,
    gaps,
    missingCount: missingGaps.length,
    needsEnhancementCount: enhancementGaps.length,
    findings
  };
}

export function generateGapMatrix(gaps: GeoGap[]): string[][] {
  const headers = [
    'Type', 'Suggested Slug', 'Status', 'Priority',
    'Rationale', 'Minimum Outline', 'Suggested Schema', 'Link From'
  ];
  
  const rows: string[][] = [headers];
  
  for (const gap of gaps) {
    if (gap.status === 'EXISTS_OK') continue;
    
    rows.push([
      gap.requirement.type,
      gap.requirement.slug,
      gap.status === 'MISSING' ? 'MISSING' : 'NEEDS ENHANCEMENT',
      gap.effectivePriority,
      gap.requirement.rationale,
      gap.requirement.minimumOutline.join(', '),
      gap.requirement.suggestedSchema.join(', '),
      gap.requirement.internalLinkingFrom.join(', ')
    ]);
  }
  
  return rows;
}
