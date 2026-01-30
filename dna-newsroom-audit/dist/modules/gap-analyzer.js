"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeGeoGaps = analyzeGeoGaps;
exports.generateGapMatrix = generateGapMatrix;
const geo_page_model_1 = require("../models/geo-page-model");
const url_1 = require("../utils/url");
function analyzeGeoGaps(inventory, siteMode) {
    const findings = [];
    const gaps = [];
    const requirements = (0, geo_page_model_1.getRequirementsForMode)(siteMode);
    for (const req of requirements) {
        const allSlugs = [req.slug, ...(req.alternativeSlugs || [])];
        // Find matching page in inventory
        let matchingPage;
        for (const page of inventory.pages) {
            const pathname = (0, url_1.getPathname)(page.url);
            if (allSlugs.some(slug => pathname === slug || pathname === slug + '/')) {
                matchingPage = page;
                break;
            }
        }
        let status;
        let enhancementReasons = [];
        if (!matchingPage) {
            status = 'MISSING';
        }
        else if (matchingPage.needsEnhancement) {
            status = 'EXISTS_NEEDS_ENHANCEMENT';
            enhancementReasons = matchingPage.enhancementReasons;
        }
        else {
            status = 'EXISTS_OK';
        }
        const effectivePriority = (0, geo_page_model_1.getEffectivePriority)(req, siteMode);
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
            whyFlagged: enhancementGaps.map(g => `${g.requirement.slug}: ${g.enhancementReasons?.join(', ')}`).join('; '),
            whatCrawlersSee: 'Pages exist but are not optimized for AI indexing',
            affectedUrls: enhancementGaps.map(g => g.existingUrl).filter(Boolean)
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
function generateGapMatrix(gaps) {
    const headers = [
        'Type', 'Suggested Slug', 'Status', 'Priority',
        'Rationale', 'Minimum Outline', 'Suggested Schema', 'Link From'
    ];
    const rows = [headers];
    for (const gap of gaps) {
        if (gap.status === 'EXISTS_OK')
            continue;
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
//# sourceMappingURL=gap-analyzer.js.map