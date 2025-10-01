/**
 * CSV export service
 */

import { createObjectCsvWriter } from 'csv-writer';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { ProcessedUserRecord } from '../types';

/**
 * CsvService handles exporting data to CSV format
 */
export class CsvService {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * Generate timestamp for filename
   */
  private generateTimestamp(): string {
    return new Date().toISOString().replace(/[-:]/g, '').slice(0, 12);
  }

  /**
   * Export data to CSV
   */
  async exportToCSV(data: ProcessedUserRecord[]): Promise<string> {
    const timestamp = this.generateTimestamp();
    const outputPath = `${this.outputDir}/AllEntraIDUsers_${timestamp}.csv`;

    console.log('💾 Exporting to CSV...');

    try {
      // Ensure output directory exists
      await mkdir(dirname(outputPath), { recursive: true });

      // Sort by display name
      data.sort((a, b) => (a['Display name'] || '').localeCompare(b['Display name'] || ''));

      const csvWriter = createObjectCsvWriter({
        path: outputPath,
        header: Object.keys(data[0] || {}).map((key) => ({ id: key, title: key })),
      });

      await csvWriter.writeRecords(data);

      console.log(`✅ Microsoft Entra ID users exported to ${outputPath}`);
      console.log(`   Total users exported: ${data.length}\n`);

      return outputPath;
    } catch (error) {
      const err = error as Error;
      console.error('❌ Failed to export CSV:', err.message);
      throw error;
    }
  }
}
