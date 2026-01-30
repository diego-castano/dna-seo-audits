#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const orchestrator_1 = require("./orchestrator");
const reporter_1 = require("./modules/reporter");
const program = new commander_1.Command();
program
    .name('dna-newsroom-audit')
    .description('DNA Newsroom SEO/GEO Technical Audit Runner - Analyze sites for indexability and AI readiness')
    .version('1.0.0')
    .argument('[urls...]', 'URLs to audit')
    .option('-u, --urls <urls...>', 'URLs to audit')
    .option('-m, --max-urls <number>', 'Maximum URLs to analyze per domain', '50')
    .option('-t, --timeout <number>', 'Request timeout in ms', '30000')
    .option('-c, --concurrency <number>', 'Concurrent requests', '5')
    .option('-o, --output <dir>', 'Output directory', './audit-reports')
    .option('-f, --formats <formats>', 'Output formats (json,html,csv)', 'json,html')
    .option('--ua-check', 'Enable UA variance check')
    .option('--ua-profiles <profiles>', 'UA profiles to test', 'default,googlebot')
    .option('-v, --verbose', 'Verbose output')
    .action(async (urlArgs, options) => {
    const urls = [...(urlArgs || []), ...(options.urls || [])];
    if (urls.length === 0) {
        console.log(chalk_1.default.red('Error: No URLs provided'));
        console.log(chalk_1.default.gray('Usage: dna-newsroom-audit https://example.com'));
        process.exit(1);
    }
    const config = {
        urls,
        maxUrls: parseInt(options.maxUrls),
        timeout: parseInt(options.timeout),
        concurrency: parseInt(options.concurrency),
        outputDir: options.output,
        formats: options.formats.split(','),
        uaCheck: options.uaCheck || false,
        uaProfiles: options.uaProfiles?.split(',') || ['default', 'googlebot'],
        verbose: options.verbose || false
    };
    console.log(chalk_1.default.cyan('\n🚀 DNA Newsroom SEO/GEO Audit Runner\n'));
    console.log(chalk_1.default.gray(`Auditing ${urls.length} domain(s)...`));
    console.log(chalk_1.default.gray(`Max URLs: ${config.maxUrls} | Timeout: ${config.timeout}ms | Concurrency: ${config.concurrency}\n`));
    const results = [];
    for (const url of urls) {
        const spinner = (0, ora_1.default)(`Auditing ${url}`).start();
        try {
            const result = await (0, orchestrator_1.runAudit)(url, config, (msg) => {
                if (config.verbose) {
                    spinner.text = msg;
                }
            });
            results.push(result);
            const status = result.summary.overallStatus;
            const statusColor = status === 'CRITICAL' ? 'red' :
                status === 'FAIL' ? 'yellow' :
                    status === 'WARN' ? 'yellow' : 'green';
            spinner.succeed(chalk_1.default[statusColor](`${url} - ${status}`));
            // Print summary bullets
            console.log(chalk_1.default.gray('  Summary:'));
            for (const bullet of result.summary.bullets.slice(0, 5)) {
                console.log(chalk_1.default.gray(`    ${bullet}`));
            }
            console.log('');
        }
        catch (error) {
            spinner.fail(chalk_1.default.red(`${url} - Error: ${error}`));
        }
    }
    // Write reports
    if (results.length > 0) {
        const reportSpinner = (0, ora_1.default)('Writing reports...').start();
        try {
            (0, reporter_1.writeReports)(results, config.outputDir, config.formats);
            reportSpinner.succeed(chalk_1.default.green(`Reports written to ${config.outputDir}/`));
            console.log(chalk_1.default.gray('\nGenerated files:'));
            for (const format of config.formats) {
                console.log(chalk_1.default.gray(`  - report.${format}`));
            }
        }
        catch (error) {
            reportSpinner.fail(chalk_1.default.red(`Failed to write reports: ${error}`));
        }
    }
    // Final summary
    console.log(chalk_1.default.cyan('\n📊 Audit Complete\n'));
    for (const result of results) {
        const s = result.summary;
        console.log(chalk_1.default.white(`${result.domain}:`));
        console.log(chalk_1.default.gray(`  Status: ${s.overallStatus} | Critical: ${s.criticalCount} | Fail: ${s.failCount} | Warn: ${s.warnCount}`));
        console.log(chalk_1.default.gray(`  Inventory: ${result.inventory.pages.length} pages (${s.inventoryConfidence} confidence)`));
        console.log(chalk_1.default.gray(`  GEO Gaps: ${result.geoGaps.missingCount} missing, ${result.geoGaps.needsEnhancementCount} need enhancement`));
        console.log('');
    }
});
program.parse();
//# sourceMappingURL=index.js.map