import { debug, log, success, warning } from "../utils/logger";
import { findFiles } from "../utils/fileSystem";
import { readTranslationFile, writeTranslationFile } from "../utils/fileSystem";
import { parseSourceFile } from "../utils/parser";
import { TransmateConfig } from "@shared/schema";
import path from "path";

/**
 * Clean unused translation keys from all language files
 * 
 * @param dryRun - Preview changes without applying them
 * @param config - The Transmate configuration
 * @returns A summary message
 */
export async function cleanup(
  dryRun: boolean = false,
  config: TransmateConfig
): Promise<string> {
  log("Scanning source files for used translation keys...");
  
  // Use config source patterns
  const sourcePatterns = config.sourcePatterns;
  
  if (!sourcePatterns || sourcePatterns.length === 0) {
    throw new Error("No source patterns provided in configuration");
  }
  
  // Use configured pattern if available
  const keyPattern = config.keyPattern || "t\\(['\"]([^'\"]+)['\"]";
  
  try {
    // Find all source files
    const sourceFiles: string[] = [];
    
    for (const pattern of sourcePatterns) {
      const files = await findFiles(pattern);
      sourceFiles.push(...files);
    }
    
    // Filter out ignored files
    let filteredFiles = sourceFiles;
    
    if (config.ignorePatterns && config.ignorePatterns.length > 0) {
      const ignoreFiles: string[] = [];
      
      for (const pattern of config.ignorePatterns) {
        const files = await findFiles(pattern);
        ignoreFiles.push(...files);
      }
      
      filteredFiles = sourceFiles.filter(file => !ignoreFiles.includes(file));
    }
    
    if (filteredFiles.length === 0) {
      return "No source files found matching the patterns";
    }
    
    // Extract used keys from all files
    const usedKeys: Set<string> = new Set();
    
    for (const file of filteredFiles) {
      try {
        const keys = await parseSourceFile(file, keyPattern);
        keys.forEach(key => usedKeys.add(key));
      } catch (err: any) {
        debug(`Failed to parse ${file}: ${err.message}`);
      }
    }
    
    if (usedKeys.size === 0) {
      warning("No translation keys found in source files. This might indicate an issue with your key pattern.");
      return "No translation keys found in source files";
    }
    
    log(`Found ${usedKeys.size} used translation keys in source files`);
    
    // Load all language files to find unused keys
    const unusedKeysByLanguage: Record<string, string[]> = {};
    const totalUnusedKeys: Set<string> = new Set();
    
    for (const language of config.languages) {
      const filePath = config.translationFilePath.replace('{language}', language);
      
      try {
        // Read the translation file
        const translations = await readTranslationFile(filePath);
        
        // Flatten the nested structure
        const flatTranslations = flattenObject(translations);
        
        // Find keys that are not used
        const unusedKeys = Object.keys(flatTranslations).filter(key => !usedKeys.has(key));
        
        if (unusedKeys.length > 0) {
          unusedKeysByLanguage[language] = unusedKeys;
          unusedKeys.forEach(key => totalUnusedKeys.add(key));
        }
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          debug(`Translation file not found: ${filePath}`);
        } else {
          throw err;
        }
      }
    }
    
    const totalUnusedCount = totalUnusedKeys.size;
    
    if (totalUnusedCount === 0) {
      success("No unused translation keys found");
      return "No unused translation keys found";
    }
    
    // Display unused keys by language
    log(`Found ${totalUnusedCount} unused translation keys across ${Object.keys(unusedKeysByLanguage).length} languages`);
    
    for (const [language, keys] of Object.entries(unusedKeysByLanguage)) {
      log(`${language}: ${keys.length} unused keys`);
      if (keys.length <= 10) {
        keys.forEach(key => log(`  - ${key}`));
      } else {
        keys.slice(0, 5).forEach(key => log(`  - ${key}`));
        log(`  ... and ${keys.length - 5} more`);
      }
    }
    
    // Remove unused keys if not in dry run mode
    if (!dryRun) {
      for (const language of config.languages) {
        const filePath = config.translationFilePath.replace('{language}', language);
        
        try {
          // Read the translation file
          const translations = await readTranslationFile(filePath);
          
          // Create a copy for modification
          let updated = JSON.parse(JSON.stringify(translations));
          
          // Remove each unused key
          if (unusedKeysByLanguage[language]) {
            for (const key of unusedKeysByLanguage[language]) {
              removeNestedKey(updated, key);
            }
          }
          
          // Write the updated translations
          await writeTranslationFile(filePath, updated);
          success(`Removed ${unusedKeysByLanguage[language]?.length || 0} unused keys from ${filePath}`);
        } catch (err: any) {
          if (err.code !== 'ENOENT') {
            throw err;
          }
        }
      }
      
      return `✓ Removed ${totalUnusedCount} unused translation keys from all language files`;
    } else {
      return `Dry run completed. Would remove ${totalUnusedCount} unused keys from translation files.`;
    }
    
  } catch (err: any) {
    throw new Error(`Failed to clean unused keys: ${err.message}`);
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

/**
 * Removes a nested key from an object
 * 
 * @param obj - The object to modify
 * @param key - The key to remove (dot notation)
 */
function removeNestedKey(obj: Record<string, any>, key: string): void {
  const parts = key.split('.');
  
  if (parts.length === 1) {
    // Direct property of the object
    delete obj[key];
    return;
  }
  
  const lastPart = parts.pop();
  let current = obj;
  
  // Navigate to the parent object
  for (const part of parts) {
    if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
      // Path doesn't exist, nothing to remove
      return;
    }
    current = current[part];
  }
  
  // Remove the property from the parent object
  if (lastPart) {
    delete current[lastPart];
  }
  
  // Clean up empty objects in the path
  if (Object.keys(current).length === 0) {
    removeNestedKey(obj, parts.join('.'));
  }
}