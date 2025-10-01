/**
 * SKU Friendly Name Mapping Service
 *
 * Fetches and parses Microsoft's official CSV mapping file to convert
 * technical SKU names (e.g., "ENTERPRISEPACK") to friendly display names
 * (e.g., "Office 365 E3").
 */

import * as https from 'https';

const MICROSOFT_CSV_URL =
  'https://download.microsoft.com/download/e/3/e/e3e9faf2-f28b-490a-9ada-c6089a1fc5b0/Product%20names%20and%20service%20plan%20identifiers%20for%20licensing.csv';

/**
 * SkuMappingService manages the friendly name mappings for license SKUs
 */
export class SkuMappingService {
  private mappingByStringId: Map<string, string> = new Map();
  private mappingByGuid: Map<string, string> = new Map();

  /**
   * Fetch and build the SKU friendly name mapping from Microsoft's CSV
   */
  async buildSkuFriendlyNameMap(): Promise<void> {
    console.log('📥 Downloading Microsoft SKU friendly name mapping...');

    try {
      const csvContent = await this.fetchCsv(MICROSOFT_CSV_URL);
      this.parseCsvAndBuildMap(csvContent);
      console.log(`✅ Loaded ${this.mappingByStringId.size} unique SKU friendly names\n`);
    } catch (error) {
      const err = error as Error;
      console.error('⚠️  Failed to download SKU mapping:', err.message);
      console.log('   Will fall back to technical SKU names\n');
    }
  }

  /**
   * Get friendly name by String ID (e.g., "ENTERPRISEPACK")
   */
  getFriendlyNameByStringId(stringId: string): string | undefined {
    return this.mappingByStringId.get(stringId);
  }

  /**
   * Get friendly name by GUID
   */
  getFriendlyNameByGuid(guid: string): string | undefined {
    return this.mappingByGuid.get(guid);
  }

  /**
   * Fetch CSV content from URL using Node.js https module
   */
  private fetchCsv(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          // Handle redirects
          if (res.statusCode === 301 || res.statusCode === 302) {
            if (res.headers.location) {
              this.fetchCsv(res.headers.location).then(resolve).catch(reject);
              return;
            }
          }

          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            return;
          }

          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve(data);
          });
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  /**
   * Parse CSV content and build lookup maps
   *
   * CSV Format:
   * Product_Display_Name,String_Id,GUID,Service_Plan_Name,Service_Plan_Id,Service_Plans_Included_Friendly_Names
   *
   * Example row:
   * Office 365 E3,ENTERPRISEPACK,6fd2c87f-b296-42f0-b197-1e91e994b900,MESH_AVATARS_FOR_TEAMS,dcf9d2f4-772e-4434-b757-77a453cfbc02,Avatars for Teams
   */
  private parseCsvAndBuildMap(csvContent: string): void {
    const lines = csvContent.split('\n');
    const seenStringIds = new Set<string>();
    const seenGuids = new Set<string>();

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = this.parseCsvLine(line);
      if (fields.length < 3) continue;

      const productDisplayName = fields[0].trim();
      const stringId = fields[1].trim();
      const guid = fields[2].trim().toLowerCase();

      // Only store the first occurrence of each SKU (CSV has multiple rows per SKU for service plans)
      if (!seenStringIds.has(stringId) && stringId && productDisplayName) {
        this.mappingByStringId.set(stringId, productDisplayName);
        seenStringIds.add(stringId);
      }

      if (!seenGuids.has(guid) && guid && productDisplayName) {
        this.mappingByGuid.set(guid, productDisplayName);
        seenGuids.add(guid);
      }
    }
  }

  /**
   * Parse a CSV line, handling quoted fields with commas
   */
  private parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        fields.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // Add the last field
    fields.push(currentField);

    return fields;
  }
}
