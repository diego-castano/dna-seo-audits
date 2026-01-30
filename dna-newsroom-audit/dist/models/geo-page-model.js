"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GEO_PAGE_MODEL = void 0;
exports.getRequirementsForMode = getRequirementsForMode;
exports.getEffectivePriority = getEffectivePriority;
exports.GEO_PAGE_MODEL = [
    // ============================================
    // TRUST & ENTITY PAGES
    // ============================================
    {
        type: 'trust',
        slug: '/about',
        alternativeSlugs: ['/about-us', '/company', '/who-we-are'],
        priority: 'P1',
        rationale: 'Establishes E-E-A-T signals for AI indexing and brand trust',
        requiredFor: ['newsroom', 'agency', 'hybrid'],
        suggestedSchema: ['Organization', 'WebSite'],
        minimumOutline: ['Company Overview', 'Mission & Vision', 'History', 'Team Overview'],
        internalLinkingFrom: ['/', '/contact', '/services'],
        weight: { newsroom: 1.0, agency: 1.0, hybrid: 1.0 }
    },
    {
        type: 'trust',
        slug: '/contact',
        alternativeSlugs: ['/contact-us', '/get-in-touch'],
        priority: 'P1',
        rationale: 'Trust signal, local SEO, conversion point',
        requiredFor: ['newsroom', 'agency', 'hybrid'],
        suggestedSchema: ['Organization', 'ContactPoint'],
        minimumOutline: ['Contact Form', 'Email', 'Phone', 'Address', 'Social Links'],
        internalLinkingFrom: ['/', '/about', '/services'],
        weight: { newsroom: 0.8, agency: 1.2, hybrid: 1.0 }
    },
    {
        type: 'trust',
        slug: '/team',
        alternativeSlugs: ['/leadership', '/our-team', '/people'],
        priority: 'P2',
        rationale: 'E-E-A-T signals, authorship credibility',
        requiredFor: ['newsroom', 'agency', 'hybrid'],
        suggestedSchema: ['Organization', 'Person'],
        minimumOutline: ['Leadership', 'Team Members', 'Roles & Expertise'],
        internalLinkingFrom: ['/about', '/'],
        weight: { newsroom: 1.2, agency: 0.8, hybrid: 1.0 }
    },
    {
        type: 'trust',
        slug: '/editorial-policy',
        alternativeSlugs: ['/editorial-standards', '/editorial-guidelines'],
        priority: 'P1',
        rationale: 'Critical for newsroom credibility and GEO citation',
        requiredFor: ['newsroom', 'hybrid'],
        suggestedSchema: ['WebPage', 'Organization'],
        minimumOutline: ['Editorial Standards', 'Fact-Checking Process', 'Corrections Policy', 'Independence Statement'],
        internalLinkingFrom: ['/', '/about', '/contact'],
        weight: { newsroom: 1.5, agency: 0.2, hybrid: 1.2 }
    },
    // ============================================
    // LEGAL PAGES
    // ============================================
    {
        type: 'legal',
        slug: '/privacy',
        alternativeSlugs: ['/privacy-policy', '/data-privacy'],
        priority: 'P1',
        rationale: 'Legal requirement, trust signal',
        requiredFor: ['newsroom', 'agency', 'hybrid'],
        suggestedSchema: ['WebPage'],
        minimumOutline: ['Data Collection', 'Data Usage', 'Third Parties', 'User Rights', 'Contact'],
        internalLinkingFrom: ['/', '/contact'],
        weight: { newsroom: 0.8, agency: 0.8, hybrid: 0.8 }
    },
    {
        type: 'legal',
        slug: '/terms',
        alternativeSlugs: ['/terms-of-service', '/terms-and-conditions', '/tos'],
        priority: 'P1',
        rationale: 'Legal requirement, trust signal',
        requiredFor: ['newsroom', 'agency', 'hybrid'],
        suggestedSchema: ['WebPage'],
        minimumOutline: ['Terms of Use', 'User Responsibilities', 'Limitations', 'Governing Law'],
        internalLinkingFrom: ['/', '/contact'],
        weight: { newsroom: 0.8, agency: 0.8, hybrid: 0.8 }
    },
    // ============================================
    // PROCESS & SERVICES PAGES
    // ============================================
    {
        type: 'service',
        slug: '/how-it-works',
        alternativeSlugs: ['/process', '/our-process'],
        priority: 'P1',
        rationale: 'Process clarity for conversion and trust',
        requiredFor: ['agency', 'hybrid'],
        suggestedSchema: ['WebPage', 'HowTo'],
        minimumOutline: ['Process Overview', 'Step 1: Discovery', 'Step 2: Strategy', 'Step 3: Execution', 'Results'],
        internalLinkingFrom: ['/', '/services', '/contact'],
        weight: { newsroom: 0.3, agency: 1.5, hybrid: 1.0 }
    },
    {
        type: 'service',
        slug: '/services',
        alternativeSlugs: ['/what-we-do', '/solutions'],
        priority: 'P1',
        rationale: 'Core offering visibility, conversion',
        requiredFor: ['agency', 'hybrid'],
        suggestedSchema: ['Service', 'ItemList'],
        minimumOutline: ['Services Overview', 'Service 1', 'Service 2', 'Service 3', 'Why Choose Us'],
        internalLinkingFrom: ['/', '/about', '/contact'],
        weight: { newsroom: 0.2, agency: 1.5, hybrid: 1.0 }
    },
    {
        type: 'service',
        slug: '/case-studies',
        alternativeSlugs: ['/results', '/success-stories', '/portfolio'],
        priority: 'P1',
        rationale: 'Social proof, E-E-A-T, conversion',
        requiredFor: ['agency', 'hybrid'],
        suggestedSchema: ['Article', 'Review'],
        minimumOutline: ['Case Study Overview', 'Challenge', 'Solution', 'Results', 'Testimonial'],
        internalLinkingFrom: ['/', '/services', '/about'],
        weight: { newsroom: 0.3, agency: 1.4, hybrid: 1.0 }
    },
    {
        type: 'service',
        slug: '/pricing',
        alternativeSlugs: ['/packages', '/plans'],
        priority: 'P2',
        rationale: 'Conversion, transparency',
        requiredFor: ['agency'],
        suggestedSchema: ['Offer', 'PriceSpecification'],
        minimumOutline: ['Pricing Overview', 'Package 1', 'Package 2', 'Package 3', 'FAQ'],
        internalLinkingFrom: ['/services', '/contact'],
        weight: { newsroom: 0.1, agency: 1.2, hybrid: 0.6 }
    },
    // ============================================
    // FAQ PAGES
    // ============================================
    {
        type: 'faq',
        slug: '/faq',
        alternativeSlugs: ['/faqs', '/frequently-asked-questions', '/help'],
        priority: 'P1',
        rationale: 'Featured snippets, voice search, GEO answers',
        requiredFor: ['newsroom', 'agency', 'hybrid'],
        suggestedSchema: ['FAQPage'],
        minimumOutline: ['General Questions', 'Service Questions', 'Process Questions', 'Pricing Questions'],
        internalLinkingFrom: ['/', '/about', '/services', '/contact'],
        weight: { newsroom: 1.0, agency: 1.3, hybrid: 1.1 }
    },
    // ============================================
    // CONTENT HUBS (NEWSROOM)
    // ============================================
    {
        type: 'hub',
        slug: '/topics',
        alternativeSlugs: ['/categories', '/sections'],
        priority: 'P1',
        rationale: 'Topic authority, internal linking hub',
        requiredFor: ['newsroom', 'hybrid'],
        suggestedSchema: ['CollectionPage', 'ItemList'],
        minimumOutline: ['Topic 1', 'Topic 2', 'Topic 3', 'Browse All'],
        internalLinkingFrom: ['/', '/blog', '/news'],
        weight: { newsroom: 1.4, agency: 0.2, hybrid: 1.0 }
    },
    {
        type: 'author',
        slug: '/authors',
        alternativeSlugs: ['/contributors', '/writers', '/team'],
        priority: 'P1',
        rationale: 'E-E-A-T, authorship credibility',
        requiredFor: ['newsroom', 'hybrid'],
        suggestedSchema: ['ProfilePage', 'Person'],
        minimumOutline: ['Author Name', 'Bio', 'Expertise', 'Articles by Author'],
        internalLinkingFrom: ['/', '/about', '/blog'],
        weight: { newsroom: 1.3, agency: 0.2, hybrid: 0.9 }
    },
    {
        type: 'hub',
        slug: '/archive',
        alternativeSlugs: ['/archives', '/all-posts'],
        priority: 'P2',
        rationale: 'Historical content access, crawlability',
        requiredFor: ['newsroom'],
        suggestedSchema: ['CollectionPage'],
        minimumOutline: ['By Year', 'By Month', 'By Topic'],
        internalLinkingFrom: ['/blog', '/news'],
        weight: { newsroom: 1.0, agency: 0.1, hybrid: 0.6 }
    },
    // ============================================
    // RSS FEEDS
    // ============================================
    {
        type: 'other',
        slug: '/rss.xml',
        alternativeSlugs: ['/feed.xml', '/rss', '/feed', '/atom.xml'],
        priority: 'P1',
        rationale: 'Syndication, news aggregators, GEO discovery',
        requiredFor: ['newsroom', 'hybrid'],
        suggestedSchema: [],
        minimumOutline: [],
        internalLinkingFrom: [],
        weight: { newsroom: 1.4, agency: 0.1, hybrid: 1.0 }
    }
];
// ============================================
// HELPER FUNCTIONS
// ============================================
function getRequirementsForMode(mode) {
    return exports.GEO_PAGE_MODEL
        .filter(req => req.requiredFor.includes(mode))
        .sort((a, b) => {
        // Sort by weighted priority
        const priorityOrder = { P0: 0, P1: 1, P2: 2 };
        const aPriority = priorityOrder[a.priority] - a.weight[mode];
        const bPriority = priorityOrder[b.priority] - b.weight[mode];
        return aPriority - bPriority;
    });
}
function getEffectivePriority(req, mode) {
    const weight = req.weight[mode];
    if (weight >= 1.3 && req.priority === 'P2')
        return 'P1';
    if (weight <= 0.3 && req.priority === 'P1')
        return 'P2';
    return req.priority;
}
//# sourceMappingURL=geo-page-model.js.map