import { TransmateConfig } from "@shared/schema";
import { readTranslationFile, writeTranslationFile } from "../utils/fileSystem";
import { log, debug } from "../utils/logger";
import path from "path";
import fs from "fs";
import { glob } from "glob";
import { parseSourceFile } from "../utils/parser";

/**
 * Extracts missing translation keys from source files
 * 
 * @param config - The Transmate configuration
 * @param pattern - Regex pattern to match translation keys
 * @param source - Source code glob pattern
 * @param add - Add missing keys automatically
 * @param dryRun - Preview changes without applying them
 * @returns A summary message
 */
export async function extractKeys(
  config: TransmateConfig,
  pattern?: string,
  source?: string,
  add: boolean = false,
  dryRun: boolean = false
): Promise<string> {
  log("Scanning source files...");
  
  // Use config source patterns if not provided
  const sourcePatterns = source ? [source] : config.sourcePatterns;
  
  if (!sourcePatterns || sourcePatterns.length === 0) {
    throw new Error("No source patterns provided");
  }
  
  // Use default pattern if not provided
  const keyPattern = pattern || "t\\(['\"]([^'\"]+)['\"]";
  
  try {
    // Find all source files
    const sourceFiles: string[] = [];
    
    for (const pattern of sourcePatterns) {
      const files = glob.sync(pattern);
      sourceFiles.push(...files);
    }
    
    // Filter out ignored files
    let filteredFiles = sourceFiles;
    
    if (config.ignorePatterns && config.ignorePatterns.length > 0) {
      const ignoreFiles: string[] = [];
      
      for (const pattern of config.ignorePatterns) {
        const files = glob.sync(pattern);
        ignoreFiles.push(...files);
      }
      
      filteredFiles = sourceFiles.filter(file => !ignoreFiles.includes(file));
    }
    
    if (filteredFiles.length === 0) {
      return "No source files found matching the pattern";
    }
    
    // Extract keys from all files
    const extractedKeys: Set<string> = new Set();
    
    for (const file of filteredFiles) {
      try {
        const keys = await parseSourceFile(file, keyPattern);
        keys.forEach(key => extractedKeys.add(key));
      } catch (err: any) {
        debug(`Failed to parse ${file}: ${err.message}`);
      }
    }
    
    if (extractedKeys.size === 0) {
      return "No translation keys found in source files";
    }
    
    // Load all translation files to find missing keys
    const defaultFilePath = config.translationFilePath.replace('{language}', config.defaultLanguage);
    let defaultTranslations: Record<string, any> = {};
    
    try {
      defaultTranslations = await readTranslationFile(defaultFilePath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        debug(`Default translation file not found: ${defaultFilePath}`);
        
        if (!dryRun && add) {
          // Create directory if needed
          const dir = path.dirname(defaultFilePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          // Create empty translation file
          defaultTranslations = {};
          await writeTranslationFile(defaultFilePath, defaultTranslations);
          debug(`Created empty default translation file: ${defaultFilePath}`);
        }
      } else {
        throw err;
      }
    }
    
    // Find missing keys
    const flatDefaultTranslations = flattenObject(defaultTranslations);
    const missingKeys = Array.from(extractedKeys).filter(key => !flatDefaultTranslations[key]);
    
    log(`Found ${extractedKeys.size} keys, ${missingKeys.length} missing from translation files`);
    
    if (missingKeys.length === 0) {
      return "No missing keys found";
    }
    
    // Display missing keys
    log("Missing keys:");
    missingKeys.forEach(key => log(`- ${key}`));
    
    // Add missing keys if requested
    if (add) {
      if (!dryRun) {
        let updated = { ...defaultTranslations };
        
        for (const key of missingKeys) {
          // Set the key in the nested structure
          const parts = key.split('.');
          let current = updated;
          
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }
          
          current[parts[parts.length - 1]] = key;
        }
        
        await writeTranslationFile(defaultFilePath, updated);
        debug(`Added ${missingKeys.length} missing keys to ${defaultFilePath}`);
      }
      
      if (dryRun) {
        return `Dry run completed. Would add ${missingKeys.length} missing keys to translation files.`;
      } else {
        return `✓ Added ${missingKeys.length} missing keys to translation files`;
      }
    } else {
      return `Run with --add to add these ${missingKeys.length} keys to translation files`;
    }
    
  } catch (err: any) {
    throw new Error(`Failed to extract keys: ${err.message}`);
  }
}

/**
 * Flattens a nested object with dot notation
 * 
 * @param obj - The object to flatten
 * @param prefix - The prefix for nested keys
 * @returns A flattened object
 */
function flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, any> {
  return Object.keys(obj).reduce((acc: Record<string, any>, key: string) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], prefixedKey));
    } else {
      acc[prefixedKey] = obj[key];
    }
    
    return acc;
  }, {});
}
