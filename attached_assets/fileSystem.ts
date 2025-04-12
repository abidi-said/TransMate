import fs from "fs";
import path from "path";
import { promisify } from "util";
import { glob } from "glob";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/**
 * Read a translation file
 * 
 * @param filePath - Path to the translation file
 * @returns The parsed translations
 */
export async function readTranslationFile(filePath: string): Promise<Record<string, any>> {
  try {
    const content = await readFileAsync(filePath);
    return JSON.parse(content);
  } catch (err: any) {
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
    const content = JSON.stringify(translations, null, 2);
    await writeFile(filePath, content, "utf-8");
  } catch (err: any) {
    throw new Error(`Failed to write to ${filePath}: ${err.message}`);
  }
}

/**
 * Get all translation files for a given pattern
 * 
 * @param pattern - File pattern with {language} placeholder
 * @param languages - List of languages
 * @returns List of file paths
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
 * Check if a file exists
 * 
 * @param filePath - Path to the file
 * @returns True if the file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Create a directory recursively
 * 
 * @param dirPath - Path to the directory
 */
export function createDirectory(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Find files matching a glob pattern
 * 
 * @param pattern - Glob pattern
 * @returns List of matching files
 */
export async function findFiles(pattern: string): Promise<string[]> {
  return glob(pattern);
}

/**
 * Read a file asynchronously
 * 
 * @param filePath - Path to the file
 * @returns File content
 */
export async function readFileAsync(filePath: string): Promise<string> {
  return readFile(filePath, "utf-8");
}

/**
 * Read a file synchronously
 * 
 * @param filePath - Path to the file
 * @returns File content
 */
export function readFileSync(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Validate translation file structure and consistency
 */
export async function validateTranslationFiles(config: TransmateConfig): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Load default language file
  const defaultLangPath = config.translationFilePath.replace('{language}', config.defaultLanguage);
  let defaultTranslations: Record<string, any>;

  try {
    defaultTranslations = await readTranslationFile(defaultLangPath);
  } catch (err: any) {
    errors.push(`Default language file is missing or invalid: ${err.message}`);
    return { isValid: false, errors, warnings };
  }

  // Get all keys from default language
  const defaultKeys = new Set(Object.keys(flattenObject(defaultTranslations)));

  // Check each language file
  for (const lang of config.languages) {
    if (lang === config.defaultLanguage) continue;

    const langPath = config.translationFilePath.replace('{language}', lang);
    
    try {
      // Check file exists
      if (!fs.existsSync(langPath)) {
        errors.push(`Missing translation file for ${lang}`);
        continue;
      }

      // Validate JSON format
      let langTranslations: Record<string, any>;
      try {
        const content = await readFileAsync(langPath);
        langTranslations = JSON.parse(content);
      } catch (err) {
        errors.push(`Invalid JSON format in ${lang} translation file`);
        continue;
      }

      // Check for missing keys
      const langKeys = new Set(Object.keys(flattenObject(langTranslations)));
      const missingKeys = [...defaultKeys].filter(key => !langKeys.has(key));
      const extraKeys = [...langKeys].filter(key => !defaultKeys.has(key));

      if (missingKeys.length > 0) {
        warnings.push(`${lang} is missing translations for: ${missingKeys.slice(0, 3).join(', ')}${missingKeys.length > 3 ? ` and ${missingKeys.length - 3} more` : ''}`);
      }

      if (extraKeys.length > 0) {
        warnings.push(`${lang} has extra keys not in default language: ${extraKeys.slice(0, 3).join(', ')}${extraKeys.length > 3 ? ` and ${extraKeys.length - 3} more` : ''}`);
      }

      // Validate value types match default language
      validateValueTypes(defaultTranslations, langTranslations, lang, '', errors);

    } catch (err: any) {
      errors.push(`Error validating ${lang}: ${err.message}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate that value types match between languages
 */
function validateValueTypes(
  defaultObj: Record<string, any>,
  langObj: Record<string, any>,
  lang: string,
  prefix: string,
  errors: string[]
) {
  for (const [key, defaultValue] of Object.entries(defaultObj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const langValue = langObj[key];

    if (typeof defaultValue !== typeof langValue) {
      if (langValue !== undefined) {
        errors.push(`Type mismatch in ${lang} for key "${fullKey}": expected ${typeof defaultValue}, got ${typeof langValue}`);
      }
    } else if (typeof defaultValue === 'object' && defaultValue !== null) {
      validateValueTypes(defaultValue, langValue || {}, lang, fullKey, errors);
    }
  }
}

/**
 * Flatten an object with nested keys into a flat object with dot-notation keys
 */
function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, any> {
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
