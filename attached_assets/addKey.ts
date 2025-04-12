import { TransmateConfig } from "@shared/schema";
import { readTranslationFile, writeTranslationFile } from "../utils/fileSystem";
import { translateText } from "../utils/translation";
import { log, debug } from "../utils/logger";
import path from "path";
import fs from "fs";

/**
 * Adds a new translation key to all language files
 * 
 * @param key - The translation key to add
 * @param value - The value for the default language
 * @param translate - Whether to translate to all languages
 * @param dryRun - Whether to preview changes without applying them
 * @param config - The Transmate configuration
 * @returns A summary message
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
        fs.mkdirSync(dir, { recursive: true });
      }
      debug(`Created directory: ${dir}`);
    }
    
    let defaultTranslations: Record<string, any> = {};
    
    try {
      defaultTranslations = await readTranslationFile(defaultFilePath);
    } catch (err) {
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
    const parts = key.split('.');
    let current = defaultTranslations;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value || key;
    
    // Save the default language file if not in dry run mode
    if (!dryRun) {
      await writeTranslationFile(defaultFilePath, defaultTranslations);
      debug(`Updated ${defaultLanguage}: "${key}" = "${value || key}"`);
    }
    
    log(`${defaultLanguage}: "${value || key}"`);
    
    // Now handle all other languages
    for (const language of languages) {
      if (language === defaultLanguage) continue;
      
      const filePath = translationFilePath.replace('{language}', language);
      
      try {
        // Make sure the directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          if (!dryRun) {
            fs.mkdirSync(dir, { recursive: true });
          }
          debug(`Created directory: ${dir}`);
        }
        
        let translations: Record<string, any> = {};
        
        try {
          translations = await readTranslationFile(filePath);
        } catch (err) {
          // If file doesn't exist, create a new one
          if (err.code === 'ENOENT') {
            debug(`Translation file not found: ${filePath}, creating new`);
          } else {
            throw err;
          }
        }
        
        // If translate option is enabled, use AI to translate the value
        let translatedValue = value || key;
        
        if (translate && value) {
          try {
            translatedValue = await translateText(value, defaultLanguage, language, config);
          } catch (err) {
            debug(`Translation failed: ${err.message}`);
            translatedValue = value;
          }
        }
        
        updates[language] = translatedValue;
        
        // Set the value in the nested structure
        const parts = key.split('.');
        let current = translations;
        
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        
        current[parts[parts.length - 1]] = translatedValue;
        
        // Save the language file if not in dry run mode
        if (!dryRun) {
          await writeTranslationFile(filePath, translations);
          debug(`Updated ${language}: "${key}" = "${translatedValue}"`);
        }
        
        log(`${language}: "${translatedValue}"`);
      } catch (err) {
        throw new Error(`Failed to process ${language} translations: ${err.message}`);
      }
    }
    
    if (dryRun) {
      return "Dry run completed. No changes were made.";
    } else {
      return "✓ Key added successfully to all language files";
    }
    
  } catch (err) {
    throw new Error(`Failed to add key: ${err.message}`);
  }
}
