import fs from "fs";
import path from "path";
import { TransmateConfig, configSchema } from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Load and validate the Transmate configuration
 * 
 * @returns The validated configuration
 */
export async function loadConfig(): Promise<TransmateConfig> {
  const tsConfigPath = path.resolve(process.cwd(), "transmate.config.ts");
  const jsConfigPath = path.resolve(process.cwd(), "transmate.config.js");
  
  let configPath: string | null = null;
  
  // Check if config files exist
  if (fs.existsSync(tsConfigPath)) {
    configPath = tsConfigPath;
  } else if (fs.existsSync(jsConfigPath)) {
    configPath = jsConfigPath;
  } else {
    throw new Error("Configuration file not found. Run 'transmate init' to create one.");
  }
  
  try {
    // Import the config
    const config = await importConfig(configPath);
    
    // Validate the config
    const validationResult = configSchema.safeParse(config);
    
    if (!validationResult.success) {
      const errorMessage = formatValidationErrors(validationResult.error.errors);
      throw new Error(`Invalid configuration: ${errorMessage}`);
    }
    
    // Process environment variables in the config
    processEnvVars(validationResult.data);
    
    return validationResult.data;
  } catch (err) {
    throw new Error(`Failed to load configuration: ${err.message}`);
  }
}

/**
 * Import the configuration file
 * 
 * @param configPath - Path to the configuration file
 * @returns The imported configuration
 */
async function importConfig(configPath: string): Promise<any> {
  try {
    if (configPath.endsWith(".ts")) {
      // For TypeScript configs, we need to require ts-node/register
      try {
        require("ts-node/register");
      } catch (err) {
        // ts-node might not be installed, let's try to handle with esbuild
        const esbuild = require("esbuild");
        const tmpFile = path.join(process.cwd(), ".transmate-config-temp.js");
        
        await esbuild.build({
          entryPoints: [configPath],
          outfile: tmpFile,
          platform: "node",
          format: "cjs",
        });
        
        const config = require(tmpFile);
        fs.unlinkSync(tmpFile);
        return config.default || config;
      }
    }
    
    // Clear require cache to ensure we get the latest version
    delete require.cache[require.resolve(configPath)];
    
    const config = require(configPath);
    return config.default || config;
  } catch (err) {
    throw new Error(`Error importing config file: ${err.message}`);
  }
}

/**
 * Format validation errors
 * 
 * @param errors - Validation errors
 * @returns Formatted error message
 */
function formatValidationErrors(errors: any[]): string {
  const messages: string[] = [];
  
  for (const err of errors) {
    const path = err.path.join('.');
    let message = `${path} - ${err.message}`;
    
    // Add contextual validation messages
    switch (path) {
      case 'translationFilePath':
        if (!err.message.includes('{language}')) {
          message += "\nHint: Translation file path must include {language} placeholder";
        }
        break;
      case 'sourcePatterns':
        if (err.message.includes('empty')) {
          message += "\nHint: Add patterns like ['./src/**/*.{ts,tsx}'] to scan for translations";
        }
        break;
      case 'languages':
        if (!Array.isArray(err.value) || err.value.length === 0) {
          message += "\nHint: Specify at least one language code, e.g. ['en', 'es']";
        }
        break;
    }
    
    messages.push(message);
  }
  
  return messages.join("\n");
}

async function validateFileStructure(config: TransmateConfig): Promise<string[]> {
  const errors: string[] = [];
  
  // Validate translation files exist
  for (const lang of config.languages) {
    const filePath = config.translationFilePath.replace('{language}', lang);
    if (!fs.existsSync(filePath)) {
      errors.push(`Translation file missing for ${lang}: ${filePath}`);
    }
  }
  
  // Validate source patterns match files
  for (const pattern of config.sourcePatterns) {
    const files = await findFiles(pattern);
    if (files.length === 0) {
      errors.push(`No files found matching pattern: ${pattern}`);
    }
  }
  
  return errors;
}

/**
 * Process environment variables in the configuration
 * 
 * @param config - The configuration object
 */
function processEnvVars(config: any): void {
  // Replace environment variables in API key
  if (config.aiTranslation?.apiKey) {
    const match = config.aiTranslation.apiKey.match(/\${([^}]+)}/);
    if (match) {
      const envVar = match[1].trim();
      config.aiTranslation.apiKey = process.env[envVar] || "";
    }
  }
}
