import { TransmateConfig } from "@shared/schema";
import { readTranslationFile, writeTranslationFile, getAllTranslationFiles } from "../utils/fileSystem";
import { translateText } from "../utils/translation";
import { log, debug, warning, success } from "../utils/logger";
import path from "path";
import inquirer from "inquirer";

/**
 * Translates all missing keys across language files
 * 
 * @param language - Only translate for specific language(s)
 * @param force - Override existing translations
 * @param dryRun - Preview translations without applying them
 * @param interactive - Prompt user for conflict resolution when overriding existing translations
 * @param config - The Transmate configuration
 * @returns A summary message
 */
export async function translateAll(
  language: string | undefined,
  force: boolean,
  dryRun: boolean,
  interactive: boolean,
  config: TransmateConfig
): Promise<string> {
  log("Translating missing keys...");
  
  const { defaultLanguage, languages, translationFilePath } = config;
  
  // Check if AI translation is properly configured
  if (!config.aiTranslation || !config.aiTranslation.enabled) {
    throw new Error("AI translation is not enabled in config");
  }

  if (!config.aiTranslation.apiKey) {
    throw new Error("OpenAI API key is missing. Set OPENAI_API_KEY in your environment or update your config file.");
  }
  
  // Determine which languages to process
  let languagesToProcess = languages.filter(lang => lang !== defaultLanguage);
  
  if (language) {
    const requestedLanguages = language.split(',').map(l => l.trim());
    languagesToProcess = languagesToProcess.filter(lang => requestedLanguages.includes(lang));
    
    if (languagesToProcess.length === 0) {
      throw new Error(`No valid languages specified. Available languages: ${languages.join(', ')}`);
    }
  }
  
  // Load the default language file
  const defaultFilePath = translationFilePath.replace('{language}', defaultLanguage);
  
  try {
    const defaultTranslations = await readTranslationFile(defaultFilePath);
    
    // Flatten the translations object to get all keys
    const flattenedDefaultTranslations = flattenObject(defaultTranslations);
    const defaultKeys = Object.keys(flattenedDefaultTranslations);
    
    if (defaultKeys.length === 0) {
      return "No keys found in the default language file";
    }
    
    // Process each language
    const missingKeysCount: Record<string, number> = {};
    const translatedKeysCount: Record<string, number> = {};
    
    for (const lang of languagesToProcess) {
      const langFilePath = translationFilePath.replace('{language}', lang);
      
      try {
        let langTranslations: Record<string, any> = {};
        
        try {
          langTranslations = await readTranslationFile(langFilePath);
        } catch (err: any) {
          if (err.code === 'ENOENT') {
            debug(`Translation file not found: ${langFilePath}, creating new`);
          } else {
            throw err;
          }
        }
        
        // Flatten the translations to get all keys
        const flattenedLangTranslations = flattenObject(langTranslations);
        
        // Find keys to process based on criteria
        let keysToProcess: string[];
        
        if (force) {
          // If force is true, consider all keys from default translations
          keysToProcess = defaultKeys;
        } else {
          // Otherwise, only missing keys
          keysToProcess = defaultKeys.filter(key => !flattenedLangTranslations[key]);
        }
        
        missingKeysCount[lang] = keysToProcess.length;
        translatedKeysCount[lang] = 0;
        
        if (keysToProcess.length === 0) {
          debug(`No keys to translate for ${lang}`);
          continue;
        }
        
        // Translate each key
        for (const key of keysToProcess) {
          const originalValue = flattenedDefaultTranslations[key];
          const existingTranslation = getNestedValue(langTranslations, key);
          const hasExistingTranslation = existingTranslation !== undefined;
          
          // If interactive mode and there's an existing translation, ask for confirmation
          let shouldTranslate = true;
          
          if (interactive && hasExistingTranslation && !dryRun) {
            warning(`Key "${key}" already has a translation in ${lang}:`);
            log(`  Original (${defaultLanguage}): "${originalValue}"`);
            log(`  Existing (${lang}): "${existingTranslation}"`);
            
            const { action } = await inquirer.prompt([{
              type: 'list',
              name: 'action',
              message: 'What would you like to do?',
              choices: [
                { name: 'Keep existing translation', value: 'keep' },
                { name: 'Replace with new AI translation', value: 'replace' },
                { name: 'Edit manually', value: 'edit' },
                { name: 'Skip this key', value: 'skip' }
              ]
            }]);
            
            if (action === 'keep') {
              log(`Keeping existing translation for "${key}"`);
              shouldTranslate = false;
            } else if (action === 'skip') {
              log(`Skipping translation for "${key}"`);
              continue;
            } else if (action === 'edit') {
              const { manualTranslation } = await inquirer.prompt([{
                type: 'input',
                name: 'manualTranslation',
                message: `Enter manual translation for "${key}":`,
                default: existingTranslation
              }]);
              
              setNestedValue(langTranslations, key, manualTranslation);
              translatedKeysCount[lang]++;
              success(`Manually updated: "${key}" = "${manualTranslation}"`);
              shouldTranslate = false;
            }
          }
          
          if (shouldTranslate) {
            try {
              const translatedValue = await translateText(originalValue, defaultLanguage, lang, config);
              
              setNestedValue(langTranslations, key, translatedValue);
              translatedKeysCount[lang]++;
              
              if (hasExistingTranslation) {
                success(`Updated ${lang}: "${key}" = "${translatedValue}" (was: "${existingTranslation}")`);
              } else {
                log(`Added ${lang}: "${key}" = "${translatedValue}"`);
              }
            } catch (err: any) {
              debug(`Translation failed for ${lang}, key ${key}: ${err.message}`);
            }
          }
        }
        
        // Save the updated language file if not in dry run mode
        if (!dryRun && translatedKeysCount[lang] > 0) {
          await writeTranslationFile(langFilePath, langTranslations);
          debug(`Updated ${lang} translations file with ${translatedKeysCount[lang]} translated keys`);
        }
        
      } catch (err: any) {
        throw new Error(`Failed to process ${lang} translations: ${err.message}`);
      }
    }
    
    // Generate summary
    const totalMissing = Object.values(missingKeysCount).reduce((sum, count) => sum + count, 0);
    const totalTranslated = Object.values(translatedKeysCount).reduce((sum, count) => sum + count, 0);
    
    if (totalMissing === 0) {
      return "No missing keys found across language files";
    }
    
    if (dryRun) {
      return `Dry run completed. Would translate ${totalMissing} keys across ${languagesToProcess.length} languages.`;
    } else {
      return `✓ Translated ${totalTranslated} keys across ${languagesToProcess.length} languages`;
    }
    
  } catch (err: any) {
    throw new Error(`Failed to translate keys: ${err.message}`);
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
 * Gets a nested value from an object using dot notation
 * 
 * @param obj - The object to extract the value from
 * @param path - The path to the value (dot notation)
 * @returns The value or undefined if not found
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length; i++) {
    if (current === undefined || current === null) {
      return undefined;
    }
    
    current = current[keys[i]];
  }
  
  return current;
}

/**
 * Sets a nested value in an object using dot notation
 * 
 * @param obj - The object to modify
 * @param path - The path to the value (dot notation)
 * @param value - The value to set
 */
function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}
