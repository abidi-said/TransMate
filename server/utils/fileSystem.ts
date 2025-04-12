import fs from "fs";
import path from "path";
import { promisify } from "util";
import { glob } from "glob";
import { parse as parseCSV } from "csv-parse/sync";
import xlsx from "xlsx";
import { TransmateConfig } from "@shared/schema";
import { log, debug, warning } from "./logger";

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

/**
 * Read a translation file
 * 
 * @param filePath - Path to the translation file
 * @returns The parsed translations
 */
export async function readTranslationFile(filePath: string): Promise<Record<string, any>> {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      debug(`Translation file not found: ${filePath}`);
      return {};
    }
    throw err;
  }
}

/**
 * Write a translation file
 * 
 * @param filePath - Path to the translation file
 * @param translations - The translations to write
 */
export async function writeTranslationFile(filePath: string, translations: Record<string, any>): Promise<void> {
  try {
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    await ensureDirectoryExists(dir);
    
    // Serialize and write the file
    const content = JSON.stringify(translations, null, 2);
    await writeFile(filePath, content, "utf-8");
    debug(`Translation file written: ${filePath}`);
  } catch (err: any) {
    throw new Error(`Failed to write translation file: ${err.message}`);
  }
}

/**
 * Ensure that a directory exists, creating it if necessary
 * 
 * @param dir - Directory path
 */
export async function ensureDirectoryExists(dir: string): Promise<void> {
  try {
    await stat(dir);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      await mkdir(dir, { recursive: true });
      debug(`Created directory: ${dir}`);
    } else {
      throw err;
    }
  }
}

/**
 * Get all translation files for given languages
 * 
 * @param pattern - File pattern with {language} placeholder
 * @param languages - Array of language codes
 * @returns Array of file paths
 */
export async function getAllTranslationFiles(pattern: string, languages: string[]): Promise<string[]> {
  const files: string[] = [];
  
  for (const language of languages) {
    const filePath = pattern.replace('{language}', language);
    files.push(filePath);
  }
  
  return files;
}

/**
 * Find all files matching a pattern
 * 
 * @param pattern - Glob pattern
 * @returns Array of matching file paths
 */
export async function findFiles(pattern: string): Promise<string[]> {
  return glob(pattern);
}

/**
 * Extract translation keys from source code files
 * 
 * @param files - Array of file paths
 * @param keyPattern - Regex pattern to extract keys
 * @returns Set of unique translation keys
 */
export async function extractKeysFromFiles(files: string[], keyPattern: string = "(?:t|i18n\\.t)\\(['\"]([^'\"]+)['\"]"): Promise<Set<string>> {
  const keys = new Set<string>();
  const regex = new RegExp(keyPattern, "g");
  
  for (const file of files) {
    try {
      const content = await readFile(file, "utf-8");
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        if (match[1]) {
          keys.add(match[1]);
        }
      }
    } catch (err: any) {
      warning(`Failed to process file ${file}: ${err.message}`);
    }
  }
  
  return keys;
}

/**
 * Read and parse a CSV file
 * 
 * @param filePath - Path to CSV file
 * @returns Parsed CSV data
 */
export async function readCSV(filePath: string): Promise<any[][]> {
  try {
    const content = await readFile(filePath, "utf-8");
    return parseCSV(content, { skip_empty_lines: true });
  } catch (err: any) {
    throw new Error(`Failed to read CSV file: ${err.message}`);
  }
}

/**
 * Read and parse an Excel file
 * 
 * @param filePath - Path to Excel file
 * @returns Parsed sheet data
 */
export async function readExcel(filePath: string): Promise<any[][]> {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet, { header: 1 });
  } catch (err: any) {
    throw new Error(`Failed to read Excel file: ${err.message}`);
  }
}

/**
 * Export translations to different formats
 * 
 * @param translations - Translation data
 * @param format - Output format (json, csv, xlsx)
 * @param outputPath - Path to write the output file
 */
export async function exportTranslations(
  translations: Record<string, Record<string, string>>,
  format: string,
  outputPath: string
): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    await ensureDirectoryExists(dir);
    
    switch (format.toLowerCase()) {
      case 'json':
        await writeFile(outputPath, JSON.stringify(translations, null, 2), "utf-8");
        break;
        
      case 'csv':
        // Convert to CSV format
        const languages = Object.keys(translations);
        const allKeys = new Set<string>();
        
        // Get all keys from all languages
        for (const lang of languages) {
          Object.keys(translations[lang]).forEach(key => allKeys.add(key));
        }
        
        // Create CSV content
        let csv = `key,${languages.join(',')}\n`;
        
        for (const key of Array.from(allKeys).sort()) {
          const values = languages.map(lang => {
            const value = translations[lang][key] || '';
            // Escape quotes and commas
            return `"${value.replace(/"/g, '""')}"`;
          });
          
          csv += `"${key}",${values.join(',')}\n`;
        }
        
        await writeFile(outputPath, csv, "utf-8");
        break;
        
      case 'xlsx':
        // Convert to XLSX format
        const workbook = xlsx.utils.book_new();
        const languages2 = Object.keys(translations);
        const allKeys2 = new Set<string>();
        
        // Get all keys
        for (const lang of languages2) {
          Object.keys(translations[lang]).forEach(key => allKeys2.add(key));
        }
        
        // Create worksheet data
        const wsData = [
          ['key', ...languages2],
          ...Array.from(allKeys2).sort().map(key => [
            key,
            ...languages2.map(lang => translations[lang][key] || '')
          ])
        ];
        
        const ws = xlsx.utils.aoa_to_sheet(wsData);
        xlsx.utils.book_append_sheet(workbook, ws, "Translations");
        
        // Write to file
        const wbout = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        await writeFile(outputPath, wbout);
        break;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    log(`Translations exported to ${outputPath} in ${format} format`);
  } catch (err: any) {
    throw new Error(`Failed to export translations: ${err.message}`);
  }
}

/**
 * Validate translation files for consistency
 * 
 * @param config - Transmate configuration
 * @returns Validation results
 */
export async function validateTranslationFiles(config: TransmateConfig): Promise<{
  valid: boolean;
  missingKeys: Record<string, string[]>;
  invalidStructure: string[];
}> {
  const { languages, translationFilePath, defaultLanguage } = config;
  
  const result = {
    valid: true,
    missingKeys: {} as Record<string, string[]>,
    invalidStructure: [] as string[]
  };
  
  try {
    // Read default language file
    const defaultFilePath = translationFilePath.replace('{language}', defaultLanguage);
    const defaultTranslations = await readTranslationFile(defaultFilePath);
    
    // Get all keys from default language
    const allKeys = getAllNestedKeys(defaultTranslations);
    
    // Check each language file
    for (const lang of languages) {
      if (lang === defaultLanguage) continue;
      
      const langFilePath = translationFilePath.replace('{language}', lang);
      
      try {
        const langTranslations = await readTranslationFile(langFilePath);
        
        // Track missing keys
        const langKeys = new Set(getAllNestedKeys(langTranslations));
        const missingKeys = allKeys.filter(key => !langKeys.has(key));
        
        if (missingKeys.length > 0) {
          result.valid = false;
          result.missingKeys[lang] = missingKeys;
        }
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          // File doesn't exist
          result.valid = false;
          result.missingKeys[lang] = Array.from(allKeys);
        } else if (err instanceof SyntaxError) {
          // Invalid JSON
          result.valid = false;
          result.invalidStructure.push(lang);
        } else {
          throw err;
        }
      }
    }
    
    return result;
  } catch (err: any) {
    warning(`Validation error: ${err.message}`);
    result.valid = false;
    return result;
  }
}

/**
 * Extract all nested keys from an object
 * 
 * @param obj - Object with nested properties
 * @param prefix - Current key prefix
 * @returns Array of dot-notation keys
 */
function getAllNestedKeys(obj: Record<string, any>, prefix: string = ''): string[] {
  return Object.keys(obj).reduce((keys: string[], key: string) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      return [...keys, ...getAllNestedKeys(obj[key], fullKey)];
    } else {
      return [...keys, fullKey];
    }
  }, []);
}
