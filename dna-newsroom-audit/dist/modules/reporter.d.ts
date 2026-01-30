import { AnalysisResult, ExecutiveSummary } from '../models/types';
export declare function generateJSON(results: AnalysisResult[]): string;
export declare function generateCSV(results: AnalysisResult[]): string;
export declare function generateExecutiveSummary(result: AnalysisResult): ExecutiveSummary;
export declare function generateHTML(results: AnalysisResult[]): string;
export declare function writeReports(results: AnalysisResult[], outputDir: string, formats: ('json' | 'html' | 'csv')[]): void;
//# sourceMappingURL=reporter.d.ts.map