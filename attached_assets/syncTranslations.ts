import { TransmateConfig } from "@shared/schema";
import { readTranslationFile, writeTranslationFile } from "../utils/fileSystem";
import { log, debug } from "../utils/logger";
import path from "path";
import fs from "fs";
import { fetchCSV, readCSV, readExcel } from "../utils/externalSources";

/**
 * Syncs translations from external sources (CSV/XLS)
 * 
 * @param source - URL or local path to translation source
 * @param format - Source format (csv, xls, xlsx)
 * @param merge - Merge strategy (override, keep-existing)
 * @param dryRun - Preview changes without applying them
 * @param config - The Transmate configuration
 * @returns A summary message
 */
export async function syncTranslations(
  source?: string,
  format: string = "csv",
  merge: string = "override",
  dryRun: boolean = false,
  config: TransmateConfig
): Promise<string> {
  // Check for source in params or config
  if (!source) {
    if (config.externalSync?.url) {
      source = config.externalSync.url;
      log(`Using source URL from config: ${source}`);
    } else {
      throw new Error("No external source URL provided. Please provide a source URL with --source option.");
    }
  }

  // Check format
  format = format.toLowerCase();
  if (!["csv", "xls", "xlsx"].includes(format)) {
    throw new Error(`Unsupported format: ${format}. Supported formats are: csv, xls, xlsx`);
  }

  // Check merge strategy
  merge = merge.toLowerCase();
  if (!["override", "keep-existing"].includes(merge)) {
    throw new Error(`Unsupported merge strategy: ${merge}. Supported strategies are: override, keep-existing`);
  }

  log(`Syncing translations from ${source} (${format})`);

  try {
    // Load external source data
    let translations: Record<string, Record<string, string>>;

    if (source.startsWith("http")) {
      if (format === "csv") {
        const csvContent = await fetchCSV(source);
        translations = parseCSVTranslations(csvContent);
      } else {
        throw new Error(`Remote ${format} files are not supported yet. Please download the file and use a local path.`);
      }
    } else {
      // Local file
      if (!fs.existsSync(source)) {
        throw new Error(`File not found: ${source}`);
      }

      if (format === "csv") {
        const csvContent = await readCSV(source);
        translations = parseCSVTranslations(csvContent);
      } else {
        translations = await readExcel(source);
      }
    }

    // Check if we have any translations
    if (!translations || Object.keys(translations).length === 0) {
      throw new Error("No translations found in the external source");
    }

    // Get all languages in the source
    const languages = Object.keys(translations);
    
    if (!languages.includes(config.defaultLanguage)) {
      throw new Error(`Default language "${config.defaultLanguage}" not found in the external source`);
    }

    // Process each language
    const stats: Record<string, { added: number, updated: number, skipped: number }> = {};

    for (const language of languages) {
      stats[language] = { added: 0, updated: 0, skipped: 0 };

      if (!config.languages.includes(language)) {
        log(`Warning: Language "${language}" from external source is not configured in your project`);
        continue;
      }

      const filePath = config.translationFilePath.replace('{language}', language);
      
      // Create directory if needed
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir) && !dryRun) {
        fs.mkdirSync(dir, { recursive: true });
        debug(`Created directory: ${dir}`);
      }

      // Read existing translations or create empty object
      let existingTranslations: Record<string, any> = {};
      try {
        existingTranslations = await readTranslationFile(filePath);
      } catch (err) {
        if (err.code === 'ENOENT') {
          debug(`Translation file not found: ${filePath}, creating new`);
        } else {
          throw err;
        }
      }

      // Merge translations
      const sourceTranslations = translations[language];
      const mergedTranslations = { ...existingTranslations };

      for (const [key, value] of Object.entries(sourceTranslations)) {
        const parts = key.split('.');
        let current = mergedTranslations;
        
        // Navigate to the nested location for the key
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }

        const lastPart = parts[parts.length - 1];
        const exists = current[lastPart] !== undefined;

        if (!exists || merge === "override") {
          current[lastPart] = value;
          if (exists) {
            stats[language].updated++;
          } else {
            stats[language].added++;
          }
        } else {
          stats[language].skipped++;
        }
      }

      // Save the file if not in dry run mode
      if (!dryRun && (stats[language].added > 0 || stats[language].updated > 0)) {
        await writeTranslationFile(filePath, mergedTranslations);
        debug(`Updated ${language} translations file`);
      }

      log(`${language}: added ${stats[language].added}, updated ${stats[language].updated}, skipped ${stats[language].skipped}`);
    }

    // Generate summary
    const totalAdded = Object.values(stats).reduce((sum, stat) => sum + stat.added, 0);
    const totalUpdated = Object.values(stats).reduce((sum, stat) => sum + stat.updated, 0);
    const totalSkipped = Object.values(stats).reduce((sum, stat) => sum + stat.skipped, 0);

    if (dryRun) {
      return `Dry run completed. Would add ${totalAdded} keys, update ${totalUpdated} keys, and skip ${totalSkipped} keys.`;
    } else {
      return `✓ Sync completed. Added ${totalAdded} keys, updated ${totalUpdated} keys, and skipped ${totalSkipped} keys.`;
    }

  } catch (err) {
    throw new Error(`Failed to sync translations: ${err.message}`);
  }
}

/**
 * Parses CSV content into a translations object
 * 
 * @param csvContent - The CSV content
 * @returns Parsed translations
 */
function parseCSVTranslations(csvContent: string[][]): Record<string, Record<string, string>> {
  if (csvContent.length < 2) {
    throw new Error("CSV file must have at least a header row and one data row");
  }

  const headers = csvContent[0];
  const keyIndex = headers.findIndex(h => h.toLowerCase() === "key");
  
  if (keyIndex === -1) {
    throw new Error('CSV file must have a "key" column');
  }

  const result: Record<string, Record<string, string>> = {};

  // Initialize result with language keys from headers
  for (let i = 0; i < headers.length; i++) {
    if (i !== keyIndex && headers[i]) {
      result[headers[i]] = {};
    }
  }

  // Populate translations
  for (let rowIndex = 1; rowIndex < csvContent.length; rowIndex++) {
    const row = csvContent[rowIndex];
    if (row.length <= keyIndex || !row[keyIndex]) continue;
    
    const key = row[keyIndex];
    
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      if (colIndex !== keyIndex && headers[colIndex] && row[colIndex]) {
        result[headers[colIndex]][key] = row[colIndex];
      }
    }
  }

  return result;
}
