#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { runAudit } from './orchestrator';
import { writeReports } from './modules/reporter';
import { AuditConfig, AnalysisResult } from './models/types';

const program = new Command();

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
      console.log(chalk.red('Error: No URLs provided'));
      console.log(chalk.gray('Usage: dna-newsroom-audit https://example.com'));
      process.exit(1);
    }
    
    const config: AuditConfig = {
      urls,
      maxUrls: parseInt(options.maxUrls),
      timeout: parseInt(options.timeout),
      concurrency: parseInt(options.concurrency),
      outputDir: options.output,
      formats: options.formats.split(',') as ('json' | 'html' | 'csv')[],
      uaCheck: options.uaCheck || false,
      uaProfiles: options.uaProfiles?.split(',') || ['default', 'googlebot'],
      verbose: options.verbose || false
    };
    
    console.log(chalk.cyan('\n🚀 DNA Newsroom SEO/GEO Audit Runner\n'));
    console.log(chalk.gray(`Auditing ${urls.length} domain(s)...`));
    console.log(chalk.gray(`Max URLs: ${config.maxUrls} | Timeout: ${config.timeout}ms | Concurrency: ${config.concurrency}\n`));
    
    const results: AnalysisResult[] = [];
    
    for (const url of urls) {
      const spinner = ora(`Auditing ${url}`).start();
      
      try {
        const result = await runAudit(url, config, (msg) => {
          if (config.verbose) {
            spinner.text = msg;
          }
        });
        
        results.push(result);
        
        const status = result.summary.overallStatus;
        const statusColor = status === 'CRITICAL' ? 'red' : 
                          status === 'FAIL' ? 'yellow' : 
                          status === 'WARN' ? 'yellow' : 'green';
        
        spinner.succeed(chalk[statusColor](`${url} - ${status}`));
        
        // Print summary bullets
        console.log(chalk.gray('  Summary:'));
        for (const bullet of result.summary.bullets.slice(0, 5)) {
          console.log(chalk.gray(`    ${bullet}`));
        }
        console.log('');
        
      } catch (error) {
        spinner.fail(chalk.red(`${url} - Error: ${error}`));
      }
    }
    
    // Write reports
    if (results.length > 0) {
      const reportSpinner = ora('Writing reports...').start();
      
      try {
        writeReports(results, config.outputDir, config.formats);
        reportSpinner.succeed(chalk.green(`Reports written to ${config.outputDir}/`));
        
        console.log(chalk.gray('\nGenerated files:'));
        for (const format of config.formats) {
          console.log(chalk.gray(`  - report.${format}`));
        }
      } catch (error) {
        reportSpinner.fail(chalk.red(`Failed to write reports: ${error}`));
      }
    }
    
    // Final summary
    console.log(chalk.cyan('\n📊 Audit Complete\n'));
    
    for (const result of results) {
      const s = result.summary;
      console.log(chalk.white(`${result.domain}:`));
      console.log(chalk.gray(`  Status: ${s.overallStatus} | Critical: ${s.criticalCount} | Fail: ${s.failCount} | Warn: ${s.warnCount}`));
      console.log(chalk.gray(`  Inventory: ${result.inventory.pages.length} pages (${s.inventoryConfidence} confidence)`));
      console.log(chalk.gray(`  GEO Gaps: ${result.geoGaps.missingCount} missing, ${result.geoGaps.needsEnhancementCount} need enhancement`));
      console.log('');
    }
  });

program.parse();
