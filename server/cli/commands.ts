import { TransmateConfig } from "@shared/schema";
import { 
  readTranslationFile, 
  writeTranslationFile, 
  getAllTranslationFiles,
  findFiles,
  extractKeysFromFiles,
  ensureDirectoryExists,
  validateTranslationFiles
} from "../utils/fileSystem";
import { translateText } from "../utils/translation";
import { log, debug, warning, success, table, progress } from "../utils/logger";
import path from "path";
import fs from "fs";
import { fetchCSV, readCSV, readExcel } from "../utils/externalSources";

/**
 * Initialize a new Transmate configuration file
 * 
 * @param force - Overwrite existing configuration
 * @param useJS - Generate JavaScript configuration (default is TypeScript)
 * @returns Success message
 */
export async function initConfig(
  force: boolean = false,
  useJS: boolean = false
): Promise<string> {
  log("Creating configuration file...");
  
  // Determine the file name
  const fileName = useJS ? "transmate.config.js" : "transmate.config.ts";
  const filePath = path.resolve(process.cwd(), fileName);
  
  // Check if the file already exists
  if (fs.existsSync(filePath) && !force) {
    throw new Error(`Configuration file ${fileName} already exists. Use --force to overwrite.`);
  }
  
  try {
    // Generate the config file
    const fileContent = generateConfigFile(useJS);
    
    // Write the file
    fs.writeFileSync(filePath, fileContent);
    
    return `Config file created at ./${fileName}`;
  } catch (err: any) {
    throw new Error(`Failed to create config file: ${err.message}`);
  }
}

/**
 * Generate the configuration file content
 * 
 * @param useJS - Whether to generate JavaScript (vs TypeScript)
 * @returns File content
 */
function generateConfigFile(useJS: boolean): string {
  if (useJS) {
    return `/**
 * Transmate Configuration
 * @type {import('transmate').TransmateConfig}
 */
module.exports = {
  // Default language to use for translations
  defaultLanguage: 'en',
  
  // Supported languages
  languages: ['en', 'fr', 'de', 'es'],
  
  // Pattern for translation files
  translationFilePath: './src/locales/{language}.json',
  
  // Source code patterns to extract keys from
  sourcePatterns: ['./src/**/*.{ts,tsx,js,jsx}'],
  
  // Patterns to ignore when extracting keys
  ignorePatterns: ['./src/**/*.test.{ts,tsx,js,jsx}'],
  
  // AI translation configuration (optional)
  aiTranslation: {
    enabled: true,
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o'
  },
  
  // External sync configuration (optional)
  externalSync: {
    source: 'csv',
    url: ''
  }
};
`;
  } else {
    return `import { TransmateConfig } from 'transmate';

const config: TransmateConfig = {
  // Default language to use for translations
  defaultLanguage: 'en',
  
  // Supported languages
  languages: ['en', 'fr', 'de', 'es'],
  
  // Pattern for translation files
  translationFilePath: './src/locales/{language}.json',
  
  // Source code patterns to extract keys from
  sourcePatterns: ['./src/**/*.{ts,tsx,js,jsx}'],
  
  // Patterns to ignore when extracting keys
  ignorePatterns: ['./src/**/*.test.{ts,tsx,js,jsx}'],
  
  // AI translation configuration (optional)
  aiTranslation: {
    enabled: true,
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o'
  },
  
  // External sync configuration (optional)
  externalSync: {
    source: 'csv',
    url: ''
  }
};

export default config;
`;
  }
}

/**
 * Extract translation keys from source files
 * 
 * @param add - Add missing keys to translation files
 * @param dryRun - Preview changes without applying them
 * @param config - The Transmate configuration
 * @returns Summary message
 */
export async function extractKeys(
  add: boolean = false,
  dryRun: boolean = false,
  config: TransmateConfig
): Promise<string> {
  const { sourcePatterns, ignorePatterns, translationFilePath, defaultLanguage, languages } = config;
  
  log("Extracting translation keys from source files...");
  
  try {
    // Find all source files
    const allFiles: string[] = [];
    for (const pattern of sourcePatterns) {
      const files = await findFiles(pattern);
      allFiles.push(...files);
    }
    
    // Filter out ignored files
    let filteredFiles = allFiles;
    if (ignorePatterns && ignorePatterns.length > 0) {
      for (const pattern of ignorePatterns) {
        const ignoredFiles = await findFiles(pattern);
        const ignoredSet = new Set(ignoredFiles);
        filteredFiles = filteredFiles.filter(file => !ignoredSet.has(file));
      }
    }
    
    debug(`Found ${filteredFiles.length} source files to scan`);
    
    // Extract translation keys from files
    const extractedKeys = await extractKeysFromFiles(filteredFiles);
    debug(`Extracted ${extractedKeys.size} unique translation keys`);
    
    // If not adding keys, just return the count
    if (!add) {
      return `Found ${extractedKeys.size} translation keys in ${filteredFiles.length} files`;
    }
    
    // Read default language file
    const defaultFilePath = translationFilePath.replace('{language}', defaultLanguage);
    let defaultTranslations: Record<string, any> = {};
    
    try {
      defaultTranslations = await readTranslationFile(defaultFilePath);
    } catch (err: any) {
      // If file doesn't exist, create a new empty one
      if (err.code === 'ENOENT') {
        debug(`Default language file not found: ${defaultFilePath}`);
        defaultTranslations = {};
      } else {
        throw err;
      }
    }
    
    // Find missing keys
    const existingKeys = new Set(getAllNestedKeys(defaultTranslations));
    const missingKeys = Array.from(extractedKeys).filter(key => !existingKeys.has(key));
    
    debug(`Found ${missingKeys.length} missing keys`);
    
    // Add missing keys to default language file
    let addedCount = 0;
    
    for (const key of missingKeys) {
      // Add key to default translations
      const value = key; // Default value is the key itself
      
      // Set the nested key
      setNestedValue(defaultTranslations, key, value);
      addedCount++;
    }
    
    // Write updated default language file
    if (!dryRun && addedCount > 0) {
      await writeTranslationFile(defaultFilePath, defaultTranslations);
    }
    
    const dryRunPrefix = dryRun ? "[DRY RUN] " : "";
    return `${dryRunPrefix}Found ${extractedKeys.size} translation keys in ${filteredFiles.length} files. Added ${addedCount} missing keys to ${defaultLanguage} translation.`;
  } catch (err: any) {
    throw new Error(`Failed to extract keys: ${err.message}`);
  }
}

/**
 * Add a new translation key to all language files
 * 
 * @param key - The translation key to add
 * @param value - The value for the default language
 * @param translate - Whether to translate to all languages
 * @param dryRun - Whether to preview changes without applying them
 * @param config - The Transmate configuration
 * @returns Summary message
 */
export async function addKey(
  key: string,
  value: string = "",
  translate: boolean = false,
  dryRun: boolean = false,
  config: TransmateConfig
): Promise<string> {
  if (!key) {
    throw new Error("No key provided");
  }

  log(`Adding key '${key}' to translation files`);
  
  const { defaultLanguage, languages, translationFilePath } = config;
  
  // If AI translation is requested, check if it's properly configured
  if (translate && (!config.aiTranslation || !config.aiTranslation.enabled)) {
    throw new Error("AI translation is not enabled in config. Please enable it to use the --translate option.");
  }

  if (translate && config.aiTranslation?.enabled && !config.aiTranslation?.apiKey) {
    throw new Error("OpenAI API key is missing. Set OPENAI_API_KEY in your environment or update your config file.");
  }

  const updates: Record<string, string> = {};
  
  // First, load the default language file to get the structure
  const defaultFilePath = translationFilePath.replace('{language}', defaultLanguage);
  
  try {
    // Make sure the directory exists
    const dir = path.dirname(defaultFilePath);
    if (!fs.existsSync(dir)) {
      if (!dryRun) {
        await ensureDirectoryExists(dir);
      }
      debug(`Created directory: ${dir}`);
    }
    
    let defaultTranslations: Record<string, any> = {};
    
    try {
      defaultTranslations = await readTranslationFile(defaultFilePath);
    } catch (err: any) {
      // If file doesn't exist, create a new one
      if (err.code === 'ENOENT') {
        debug(`Default translation file not found: ${defaultFilePath}, creating new`);
      } else {
        throw err;
      }
    }
    
    // Add the new key to the default language
    updates[defaultLanguage] = value || key;
    
    // Set the value in the nested structure
    setNestedValue(defaultTranslations, key, value || key);
    
    // Write the updated default language file
    if (!dryRun) {
      await writeTranslationFile(defaultFilePath, defaultTranslations);
    }
    
    // If translate option is enabled, translate to all other languages
    if (translate) {
      for (const lang of languages) {
        if (lang === defaultLanguage) continue;
        
        const langFilePath = translationFilePath.replace('{language}', lang);
        let langTranslations: Record<string, any> = {};
        
        try {
          langTranslations = await readTranslationFile(langFilePath);
        } catch (err: any) {
          // If file doesn't exist, create a new one
          if (err.code === 'ENOENT') {
            debug(`Translation file not found: ${langFilePath}, creating new`);
          } else {
            throw err;
          }
        }
        
        // Translate the value
        const translatedValue = await translateText(value || key, defaultLanguage, lang, config);
        updates[lang] = translatedValue;
        
        // Set the nested value
        setNestedValue(langTranslations, key, translatedValue);
        
        // Write the updated language file
        if (!dryRun) {
          await writeTranslationFile(langFilePath, langTranslations);
        }
      }
    }
    
    // Build result message
    const dryRunPrefix = dryRun ? "[DRY RUN] " : "";
    let resultMessage = `${dryRunPrefix}Added key '${key}' to ${defaultLanguage} translation`;
    
    if (translate) {
      resultMessage += ` and translated to ${languages.length - 1} other languages`;
    }
    
    // Add details about translations
    const translationDetails = Object.entries(updates)
      .map(([lang, text]) => `\n  - ${lang}: "${text}"`)
      .join('');
    
    return resultMessage + translationDetails;
  } catch (err: any) {
    throw new Error(`Failed to add key: ${err.message}`);
  }
}

/**
 * Translate all missing keys to target languages
 * 
 * @param sourceLanguage - Source language code
 * @param targetLanguages - List of target language codes (or undefined for all)
 * @param dryRun - Whether to preview changes without applying them
 * @param config - The Transmate configuration
 * @returns Summary message
 */
export async function translateAll(
  sourceLanguage: string,
  targetLanguages?: string[],
  dryRun: boolean = false,
  config: TransmateConfig
): Promise<string> {
  const { languages, translationFilePath } = config;
  
  // Validate source language
  if (!languages.includes(sourceLanguage)) {
    throw new Error(`Source language '${sourceLanguage}' is not in the configured languages: ${languages.join(', ')}`);
  }
  
  // Determine target languages
  const targets = targetLanguages 
    ? targetLanguages.filter(lang => languages.includes(lang) && lang !== sourceLanguage)
    : languages.filter(lang => lang !== sourceLanguage);
  
  if (targets.length === 0) {
    throw new Error("No valid target languages specified");
  }
  
  // Check AI translation configuration
  if (!config.aiTranslation || !config.aiTranslation.enabled) {
    throw new Error("AI translation is not enabled in config");
  }

  if (!config.aiTranslation.apiKey) {
    throw new Error("OpenAI API key is missing. Set OPENAI_API_KEY in your environment or update your config file.");
  }
  
  log(`Translating from ${sourceLanguage} to ${targets.join(', ')}...`);
  
  try {
    // Load source language translations
    const sourceFilePath = translationFilePath.replace('{language}', sourceLanguage);
    const sourceTranslations = await readTranslationFile(sourceFilePath);
    
    // Get all keys from source
    const allKeys = getAllNestedKeys(sourceTranslations);
    debug(`Found ${allKeys.length} keys in source language`);
    
    // Initialize counters
    const stats: Record<string, { added: number, updated: number, skipped: number }> = {};
    for (const lang of targets) {
      stats[lang] = { added: 0, updated: 0, skipped: 0 };
    }
    
    // Process each target language
    for (const targetLang of targets) {
      log(`Processing ${targetLang}...`);
      
      // Load target language translations
      const targetFilePath = translationFilePath.replace('{language}', targetLang);
      let targetTranslations: Record<string, any> = {};
      
      try {
        targetTranslations = await readTranslationFile(targetFilePath);
      } catch (err: any) {
        // If file doesn't exist, create a new one
        if (err.code === 'ENOENT') {
          debug(`Target language file not found: ${targetFilePath}, creating new`);
        } else {
          throw err;
        }
      }
      
      // Find untranslated keys
      const targetKeys = new Set(getAllNestedKeys(targetTranslations));
      const missingKeys = allKeys.filter(key => !targetKeys.has(key));
      
      debug(`Found ${missingKeys.length} untranslated keys for ${targetLang}`);
      
      if (missingKeys.length === 0) {
        log(`No missing translations for ${targetLang}`);
        continue;
      }
      
      // Translate missing keys in batches
      const batchSize = 10;
      let translatedCount = 0;
      let skipCount = 0;
      let updateCount = 0;
      
      for (let i = 0; i < missingKeys.length; i += batchSize) {
        const batch = missingKeys.slice(i, i + batchSize);
        
        // Show progress
        progress(i, missingKeys.length, `Translating ${targetLang} (${i}/${missingKeys.length})`);
        
        // Process each key in the batch
        for (const key of batch) {
          // Get the source value
          const sourceValue = getNestedValue(sourceTranslations, key);
          
          if (typeof sourceValue !== 'string') {
            debug(`Skipping non-string value for key: ${key}`);
            skipCount++;
            continue;
          }
          
          // Translate the value
          try {
            const translatedValue = await translateText(sourceValue, sourceLanguage, targetLang, config);
            
            // Set the nested value
            setNestedValue(targetTranslations, key, translatedValue);
            translatedCount++;
          } catch (err: any) {
            warning(`Failed to translate key '${key}': ${err.message}`);
            skipCount++;
          }
        }
      }
      
      // Show completion
      progress(missingKeys.length, missingKeys.length, `Translated ${translatedCount} keys for ${targetLang}`);
      
      // Write the updated file
      if (!dryRun && translatedCount > 0) {
        await writeTranslationFile(targetFilePath, targetTranslations);
      }
      
      // Update stats
      stats[targetLang].added = translatedCount;
      stats[targetLang].skipped = skipCount;
      stats[targetLang].updated = updateCount;
      
      success(`${dryRun ? "[DRY RUN] " : ""}${targetLang}: Translated ${translatedCount} keys, skipped ${skipCount}`);
    }
    
    // Build summary message
    let summary = dryRun ? "[DRY RUN] " : "";
    summary += `Translation complete. Summary:`;
    
    // Add stats for each language
    for (const [lang, stat] of Object.entries(stats)) {
      summary += `\n- ${lang}: Added ${stat.added}, Updated ${stat.updated}, Skipped ${stat.skipped}`;
    }
    
    return summary;
  } catch (err: any) {
    throw new Error(`Translation failed: ${err.message}`);
  }
}

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
        translations = parseExcelTranslations(await readExcel(source));
      }
    }

    // Check if we have any translations
    if (!translations || Object.keys(translations).length === 0) {
      throw new Error("No translations found in the external source");
    }

    // Get all languages in the source
    const externalLanguages = Object.keys(translations);
    
    if (!externalLanguages.includes(config.defaultLanguage)) {
      throw new Error(`Default language "${config.defaultLanguage}" not found in the external source`);
    }

    // Process each language
    const stats: Record<string, { added: number, updated: number, skipped: number }> = {};
    
    for (const lang of config.languages) {
      if (!externalLanguages.includes(lang)) {
        warning(`Language "${lang}" not found in the external source`);
        continue;
      }
      
      // Load existing translation file
      const filePath = config.translationFilePath.replace('{language}', lang);
      let existingTranslations: Record<string, any> = {};
      
      try {
        existingTranslations = await readTranslationFile(filePath);
      } catch (err: any) {
        // If file doesn't exist, create a new one
        if (err.code === 'ENOENT') {
          debug(`Translation file not found: ${filePath}, creating new`);
        } else {
          throw err;
        }
      }
      
      // Initialize stats
      stats[lang] = { added: 0, updated: 0, skipped: 0 };
      
      // Process each translation key
      const externalTranslations = translations[lang];
      
      for (const [key, value] of Object.entries(externalTranslations)) {
        // Skip empty values
        if (!value.trim()) {
          stats[lang].skipped++;
          continue;
        }
        
        // Check if key already exists
        const existingValue = getNestedValue(existingTranslations, key);
        
        if (existingValue !== undefined) {
          // Key exists, apply merge strategy
          if (merge === "keep-existing") {
            stats[lang].skipped++;
            continue;
          }
          
          // Override strategy
          setNestedValue(existingTranslations, key, value);
          stats[lang].updated++;
        } else {
          // New key
          setNestedValue(existingTranslations, key, value);
          stats[lang].added++;
        }
      }
      
      // Write updated translations
      if (!dryRun && (stats[lang].added > 0 || stats[lang].updated > 0)) {
        await writeTranslationFile(filePath, existingTranslations);
      }
      
      success(`${dryRun ? "[DRY RUN] " : ""}${lang}: Added ${stats[lang].added}, Updated ${stats[lang].updated}, Skipped ${stats[lang].skipped}`);
    }
    
    // Build summary message
    let summary = dryRun ? "[DRY RUN] " : "";
    summary += "Sync complete. Summary:";
    
    for (const [lang, stat] of Object.entries(stats)) {
      summary += `\n- ${lang}: Added ${stat.added}, Updated ${stat.updated}, Skipped ${stat.skipped}`;
    }
    
    return summary;
  } catch (err: any) {
    throw new Error(`Sync failed: ${err.message}`);
  }
}

/**
 * Validate translation files for consistency
 * 
 * @param config - The Transmate configuration
 * @returns Validation summary
 */
export async function validateTranslations(
  config: TransmateConfig
): Promise<string> {
  log("Validating translation files...");
  
  try {
    const results = await validateTranslationFiles(config);
    
    if (results.valid) {
      return "All translation files are valid and consistent.";
    }
    
    let summary = "Validation found the following issues:";
    
    // Report missing keys
    if (Object.keys(results.missingKeys).length > 0) {
      summary += "\n\nMissing keys by language:";
      
      for (const [lang, keys] of Object.entries(results.missingKeys)) {
        summary += `\n- ${lang}: ${keys.length} missing keys`;
        
        // Show up to 5 examples
        if (keys.length > 0) {
          const examples = keys.slice(0, 5);
          summary += `\n  Examples: ${examples.join(', ')}${keys.length > 5 ? ' ...' : ''}`;
        }
      }
    }
    
    // Report invalid structure
    if (results.invalidStructure.length > 0) {
      summary += "\n\nFiles with invalid structure:";
      summary += `\n- ${results.invalidStructure.join(', ')}`;
    }
    
    return summary;
  } catch (err: any) {
    throw new Error(`Validation failed: ${err.message}`);
  }
}

/**
 * Parse CSV data into a translations object
 * 
 * @param data - CSV data as array of arrays
 * @returns Structured translations object
 */
function parseCSVTranslations(data: string[][]): Record<string, Record<string, string>> {
  // Expect format: key,en,fr,de,...
  if (data.length < 2) {
    throw new Error("CSV file must have at least a header row and one data row");
  }
  
  // Get header row (first row)
  const header = data[0];
  if (header[0].toLowerCase() !== 'key') {
    throw new Error("CSV file must have 'key' as the first column");
  }
  
  // Initialize translations object
  const translations: Record<string, Record<string, string>> = {};
  
  // Get languages from header (skip first column which is 'key')
  const languages = header.slice(1);
  
  for (const lang of languages) {
    translations[lang] = {};
  }
  
  // Process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const key = row[0];
    
    if (!key) continue; // Skip rows without keys
    
    // Add translations for each language
    for (let j = 1; j < header.length; j++) {
      const lang = header[j];
      const value = row[j] || ''; // Use empty string for missing values
      
      translations[lang][key] = value;
    }
  }
  
  return translations;
}

/**
 * Parse Excel data into a translations object
 * 
 * @param data - Excel data as array of arrays
 * @returns Structured translations object
 */
function parseExcelTranslations(data: any[][]): Record<string, Record<string, string>> {
  // Similar to CSV parsing
  return parseCSVTranslations(data);
}

/**
 * Get all nested keys from an object
 * 
 * @param obj - Object with nested keys
 * @param prefix - Current key prefix
 * @returns Array of flattened keys
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

/**
 * Get a nested value from an object using dot notation
 * 
 * @param obj - The object to get value from
 * @param path - Dot notation path
 * @returns The value or undefined
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Set a nested value in an object using dot notation
 * 
 * @param obj - The object to set value in
 * @param path - Dot notation path
 * @param value - The value to set
 */
function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}
