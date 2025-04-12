import fs from "fs";
import path from "path";
import { prompt } from "inquirer";
import { log, debug } from "../utils/logger";

/**
 * Initialize Transmate configuration
 * 
 * @param force - Overwrite existing configuration
 * @param useJS - Generate JavaScript configuration (default is TypeScript)
 * @returns A success message
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
  } catch (err) {
    throw new Error(`Failed to create config file: ${err.message}`);
  }
}

/**
 * Generate the configuration file content
 * 
 * @param useJS - Whether to generate JavaScript (vs TypeScript)
 * @returns The file content
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
