import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { addKey } from "./cli/commands/addKey";
import { translateAll } from "./cli/commands/translateAll";
import { syncTranslations } from "./cli/commands/syncTranslations";
import { extractKeys } from "./cli/commands/extractKeys";
import { cleanup } from "./cli/commands/cleanup";
import { initConfig } from "./cli/commands/init";
import { loadConfig } from "./cli/utils/config";
import { readTranslationFile, writeTranslationFile } from "./cli/utils/fileSystem";
import { debug, success, error, warning } from "./cli/utils/logger";
import { TransmateConfig, configSchema } from "@shared/schema";
import { ZodError } from "zod";

// Custom type declaration for request with transmate config
declare global {
  namespace Express {
    interface Request {
      transmate?: {
        config: TransmateConfig;
      };
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware for config validation
  const validateConfig = (req: Request, res: Response, next: NextFunction) => {
    try {
      const config: TransmateConfig = {
        defaultLanguage: "en",
        languages: ["en", "fr", "de", "es"],
        translationFilePath: "./src/locales/{language}.json",
        sourcePatterns: ["./src/**/*.{ts,tsx,js,jsx}"],
        ignorePatterns: ["./src/**/*.test.{ts,tsx,js,jsx}"],
        aiTranslation: {
          enabled: true,
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY || "",
          model: "gpt-4o"
        }
      };

      try {
        // Validate config schema
        configSchema.parse(config);
      } catch (err) {
        if (err instanceof ZodError) {
          return res.status(400).json({
            error: "Invalid configuration",
            details: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          });
        }
        throw err;
      }

      // Check that translation file path contains {language} placeholder
      if (!config.translationFilePath.includes('{language}')) {
        return res.status(400).json({
          error: "Invalid configuration",
          details: "translationFilePath must contain {language} placeholder"
        });
      }

      // Validate that the language directory exists or can be created
      try {
        const baseDir = path.dirname(config.translationFilePath.replace('{language}', config.defaultLanguage));

        if (!fs.existsSync(baseDir)) {
          // Try to create the directory
          fs.mkdirSync(baseDir, { recursive: true });
          debug(`Created translations directory: ${baseDir}`);
        }
      } catch (err: any) {
        return res.status(500).json({
          error: "File system error",
          details: `Cannot create or access translations directory: ${err.message}`
        });
      }

      // Make config available to route handlers
      req.transmate = { config };
      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // This is now declared at the top level file
  // API Endpoints
  app.get("/api/commands", (_req, res) => {
    const commands = [
      {
        name: "add-key",
        description: "Add a new translation key to all language files",
        options: [
          { name: "--key", description: "The translation key (required)", type: "string", required: true },
          { name: "--value", description: "The value for the default language", type: "string", required: false },
          { name: "--dry-run", description: "Preview changes without applying them", type: "boolean", required: false },
          { name: "--translate", description: "Automatically translate to all languages", type: "boolean", required: false },
        ]
      },
      {
        name: "translate-all",
        description: "Translate all missing keys across language files",
        options: [
          { name: "--dry-run", description: "Preview translations without applying them", type: "boolean", required: false },
          { name: "--language", description: "Only translate for specific language(s)", type: "string", required: false },
          { name: "--force", description: "Override existing translations", type: "boolean", required: false },
        ]
      },
      {
        name: "sync-translations",
        description: "Sync translations from external sources (CSV/XLS)",
        options: [
          { name: "--source", description: "URL or local path to translation source", type: "string", required: false },
          { name: "--format", description: "Source format (csv, xls, xlsx)", type: "string", required: false },
          { name: "--dry-run", description: "Preview changes without applying them", type: "boolean", required: false },
          { name: "--merge", description: "Merge strategy (override, keep-existing)", type: "string", required: false },
        ]
      },
      {
        name: "extract-keys",
        description: "Extract missing translation keys from source files",
        options: [
          { name: "--pattern", description: "Regex pattern to match translation keys", type: "string", required: false },
          { name: "--source", description: "Source code glob pattern", type: "string", required: false },
          { name: "--add", description: "Add missing keys automatically", type: "boolean", required: false },
          { name: "--dry-run", description: "Preview changes without applying them", type: "boolean", required: false },
        ]
      },
      {
        name: "init",
        description: "Initialize Transmate configuration",
        options: [
          { name: "--force", description: "Overwrite existing configuration", type: "boolean", required: false },
          { name: "--js", description: "Generate JavaScript configuration (default is TypeScript)", type: "boolean", required: false },
        ]
      },
      {
        name: "cleanup",
        description: "Clean unused translation keys from all language files",
        options: [
          { name: "--dry-run", description: "Preview changes without applying them", type: "boolean", required: false }
        ]
      }
    ];

    res.json(commands);
  });

  app.get("/api/features", (_req, res) => {
    const features = [
      {
        title: "AI-Powered Translations",
        description: "Leverage OpenAI to automatically translate missing keys with context awareness.",
        icon: "clipboard"
      },
      {
        title: "TS & JS Compatible",
        description: "Works seamlessly with both TypeScript and JavaScript projects.",
        icon: "code"
      },
      {
        title: "External Sync",
        description: "Import translations from external sources like CSV and XLS files.",
        icon: "chart"
      },
      {
        title: "Configurable Paths",
        description: "Flexible file path templating with support for custom locale structures.",
        icon: "code-2"
      },
      {
        title: "Missing Keys Extraction",
        description: "Automatically find and extract untranslated keys from your source code.",
        icon: "download"
      },
      {
        title: "Dry Run Mode",
        description: "Preview changes before applying them with the --dry-run option.",
        icon: "settings"
      },
      {
        title: "Visual Editor",
        description: "Edit translations with a web-based UI for easier management and collaboration.",
        icon: "edit"
      }
    ];

    res.json(features);
  });

  // Get translation files for the web editor
  app.get("/api/translations", validateConfig, async (req, res) => {
    try {
      // Validate translation files
      const validationResult = await validateTranslationFiles(req.transmate!.config);

      if (!validationResult.isValid) {
        return res.status(400).json({
          error: "Translation files validation failed",
          details: {
            errors: validationResult.errors,
            warnings: validationResult.warnings
          }
        });
      }

      const config: TransmateConfig = {
        defaultLanguage: "en",
        languages: ["en", "fr", "de", "es"],
        translationFilePath: "./src/locales/{language}.json",
        sourcePatterns: ["./src/**/*.{ts,tsx,js,jsx}"],
        ignorePatterns: ["./src/**/*.test.{ts,tsx,js,jsx}"],
        aiTranslation: {
          enabled: true,
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY || "",
          model: "gpt-4o"
        }
      };

      const { defaultLanguage, languages, translationFilePath } = config;

      // Load all translation files
      const files = [];

      // Load metadata file if it exists
      let metadataPath = path.join(path.dirname(translationFilePath.replace('{language}', defaultLanguage)), 'metadata.json');
      let metadata: Record<string, any> = {};

      try {
        metadata = await readTranslationFile(metadataPath);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          debug(`Metadata file not found: ${metadataPath}, creating empty one`);
          metadata = {};
        } else {
          throw err;
        }
      }

      for (const language of languages) {
        const filePath = translationFilePath.replace('{language}', language);
        try {
          // Use a demo path for development if file doesn't exist
          let translations = {};

          // Try to read the file if it exists
          try {
            translations = await readTranslationFile(filePath);
          } catch (err: any) {
            // If file doesn't exist, use empty object
            if (err.code === 'ENOENT') {
              debug(`Translation file not found: ${filePath}`);
            } else {
              throw err;
            }
          }

          // Augment translations with metadata
          const translationsWithMetadata = addMetadataToTranslations(translations, metadata, language);

          files.push({
            language,
            path: filePath,
            translations: translationsWithMetadata
          });
        } catch (err: any) {
          debug(`Error loading translation file ${filePath}: ${err.message}`);
        }
      }

      res.json({
        defaultLanguage,
        languages,
        translationFilePath,
        files
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Add metadata to translations
   */
  function addMetadataToTranslations(
    translations: Record<string, any>, 
    metadata: Record<string, any>,
    language: string,
    prefix = ''
  ): Record<string, any> {
    const result: Record<string, any> = {};

    Object.entries(translations).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle nested objects
        result[key] = addMetadataToTranslations(value, metadata, language, fullKey);
      } else {
        // This is a leaf node with a translation value
        const keyMetadata = metadata[fullKey] || {};
        const langMetadata = keyMetadata[language] || {};

        result[key] = {
          value,
          metadata: langMetadata
        };
      }
    });

    return result;
  }

  /**
   * Extract flat translations from metadata-enhanced translations
   */
  function extractFlatTranslations(
    translations: Record<string, any>,
    prefix = ''
  ): Record<string, string> {
    const result: Record<string, string> = {};

    Object.entries(translations).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        if ('value' in value && 'metadata' in value) {
          // This is a leaf node with metadata
          result[fullKey] = value.value;
        } else {
          // This is a nested object
          Object.assign(result, extractFlatTranslations(value, fullKey));
        }
      } else {
        // This is a simple value (should not happen with metadata, but handle anyway)
        result[fullKey] = value;
      }
    });

    return result;
  }

  /**
   * Flatten an object with nested keys into a flat object with dot-notation keys
   * 
   * @param obj - The object to flatten
   * @param prefix - The prefix for keys (used in recursion)
   * @returns A flattened object with dot-notation keys
   */
  function flattenTranslationKeys(obj: Record<string, any>, prefix = ''): Record<string, any> {
    return Object.keys(obj).reduce((acc: Record<string, any>, key: string) => {
      const prefixedKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        // Check if it's an object with value/metadata structure
        if ('value' in obj[key] && 'metadata' in obj[key]) {
          acc[prefixedKey] = obj[key].value;
        } else {
          // Regular nested object
          Object.assign(acc, flattenTranslationKeys(obj[key], prefixedKey));
        }
      } else {
        acc[prefixedKey] = obj[key];
      }

      return acc;
    }, {});
  }

  // Update translation files
  app.post("/api/translations", validateConfig, async (req, res) => {
    try {
      const { translations } = req.body;

      if (!translations || !Array.isArray(translations)) {
        throw new Error("Invalid translations data");
      }

      const config: TransmateConfig = {
        defaultLanguage: "en",
        languages: ["en", "fr", "de", "es"],
        translationFilePath: "./src/locales/{language}.json",
        sourcePatterns: ["./src/**/*.{ts,tsx,js,jsx}"],
        ignorePatterns: ["./src/**/*.test.{ts,tsx,js,jsx}"],
        aiTranslation: {
          enabled: true,
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY || "",
          model: "gpt-4o"
        }
      };

      const { defaultLanguage, languages, translationFilePath } = config;

      // Load all current translation files
      const translationFiles: Record<string, any> = {};

      for (const language of languages) {
        const filePath = translationFilePath.replace('{language}', language);
        try {
          translationFiles[language] = await readTranslationFile(filePath);
        } catch (err: any) {
          if (err.code === 'ENOENT') {
            // Create the directory if it doesn't exist
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            translationFiles[language] = {};
          } else {
            throw err;
          }
        }
      }

      // Load metadata file if it exists
      let metadataPath = path.join(path.dirname(translationFilePath.replace('{language}', defaultLanguage)), 'metadata.json');
      let metadata: Record<string, any> = {};

      try {
        metadata = await readTranslationFile(metadataPath);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          debug(`Metadata file not found: ${metadataPath}, creating empty one`);
          metadata = {};
        } else {
          throw err;
        }
      }

      // Update translation files with modified values and collect metadata updates
      for (const item of translations) {
        if (!item.key) continue;

        // Update metadata for this key
        if (!metadata[item.key]) {
          metadata[item.key] = {};
        }

        for (const [lang, valueObj] of Object.entries(item.values)) {
          if (!languages.includes(lang)) continue;

          let value: string;
          let updatedMetadata: any = {};

          // Check if value is an object with metadata or just a string
          if (typeof valueObj === 'object' && valueObj !== null && 'value' in valueObj) {
            const typedValueObj = valueObj as { value: string; metadata?: Record<string, any> };
            value = typedValueObj.value;
            updatedMetadata = typedValueObj.metadata || {};

            // Add version history if value has changed
            const currentValue = getNestedValue(translationFiles[lang], item.key);

            if (currentValue !== value) {
              // Initialize metadata for this key and language if needed
              if (!metadata[item.key][lang]) {
                metadata[item.key][lang] = {};
              }

              // Update last modified timestamp
              updatedMetadata.lastUpdated = new Date().toISOString();

              // Initialize or update version
              if (metadata[item.key][lang].version !== undefined) {
                updatedMetadata.version = (metadata[item.key][lang].version || 0) + 1;
              } else {
                updatedMetadata.version = 1;
              }

              // Initialize or update history
              if (!metadata[item.key][lang].history) {
                metadata[item.key][lang].history = [];
              }

              // Add current value to history if it exists
              if (currentValue) {
                metadata[item.key][lang].history.push({
                  value: currentValue,
                  updatedAt: metadata[item.key][lang].lastUpdated || new Date().toISOString()
                });
              }
            }

            // Update metadata for this key and language
            metadata[item.key][lang] = {
              ...metadata[item.key][lang],
              ...updatedMetadata
            };
          } else {
            // Simple value without metadata
            value = valueObj as string;
          }

          // Set the nested value in the translation file
          const parts = item.key.split('.');
          let current = translationFiles[lang];

          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] !== 'object') {
              current[part] = {};
            }
            current = current[part];
          }

          current[parts[parts.length - 1]] = value;
        }
      }

      // Write updated translation files
      for (const language of languages) {
        const filePath = translationFilePath.replace('{language}', language);
        await writeTranslationFile(filePath, translationFiles[language]);
        success(`Updated translation file: ${filePath}`);
      }

      // Write updated metadata file
      await writeTranslationFile(metadataPath, metadata);
      success(`Updated metadata file: ${metadataPath}`);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get a nested value from an object using dot notation
   * 
   * @param obj - The object to extract the value from
   * @param path - The path to the value (dot notation)
   * @returns The value or undefined if not found
   */
  function getNestedValue(obj: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  // Get config for editor
  app.get("/api/config", (_req, res) => {
    try {
      const config: TransmateConfig = {
        defaultLanguage: "en",
        languages: ["en", "fr", "de", "es"],
        translationFilePath: "./src/locales/{language}.json",
        sourcePatterns: ["./src/**/*.{ts,tsx,js,jsx}"],
        ignorePatterns: ["./src/**/*.test.{ts,tsx,js,jsx}"],
        aiTranslation: {
          enabled: true,
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY || "",
          model: "gpt-4o"
        }
      };

      // Don't expose sensitive information like API keys
      const safeConfig = {
        ...config,
        aiTranslation: config.aiTranslation ? {
          ...config.aiTranslation,
          apiKey: config.aiTranslation.apiKey ? "[REDACTED]" : undefined
        } : undefined
      };

      res.json(safeConfig);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get suggestions for a translation
  app.post("/api/translations/suggest", validateConfig, async (req, res) => {
    try {
      const { key, sourceLanguage, targetLanguage, context } = req.body;

      if (!key || !sourceLanguage || !targetLanguage) {
        throw new Error("Missing required fields: key, sourceLanguage, targetLanguage");
      }

      const config: TransmateConfig = {
        defaultLanguage: "en",
        languages: ["en", "fr", "de", "es"],
        translationFilePath: "./src/locales/{language}.json",
        sourcePatterns: ["./src/**/*.{ts,tsx,js,jsx}"],
        ignorePatterns: ["./src/**/*.test.{ts,tsx,js,jsx}"],
        aiTranslation: {
          enabled: true,
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY || "",
          model: "gpt-4o"
        }
      };

      // Check if AI translation is properly configured
      if (!config.aiTranslation || !config.aiTranslation.enabled) {
        throw new Error("AI translation is not enabled in config");
      }

      if (!config.aiTranslation.apiKey) {
        throw new Error("OpenAI API key is missing. Set OPENAI_API_KEY in your environment or update your config file.");
      }

      // Load the source translation
      const sourceFilePath = config.translationFilePath.replace('{language}', sourceLanguage);
      let sourceTranslations: Record<string, any> = {};

      try {
        sourceTranslations = await readTranslationFile(sourceFilePath);
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }

      // Get the source value
      const sourceValue = getNestedValue(sourceTranslations, key);

      if (!sourceValue) {
        throw new Error(`Source key "${key}" not found in ${sourceLanguage} translations`);
      }

      // Get suggestions from existing translations
      const similarSuggestions = await getSimilarTranslations(key, sourceValue, sourceLanguage, targetLanguage, config);

      // Get AI suggestion
      const aiSuggestion = await translateText(sourceValue, sourceLanguage, targetLanguage, config);

      // Combine and return suggestions
      const suggestions = [
        {
          value: aiSuggestion,
          confidence: 0.95,
          source: "ai"
        },
        ...similarSuggestions
      ];

      res.json({ 
        success: true, 
        suggestions,
        sourceValue
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Get similar translations based on key patterns and source value
   */
  async function getSimilarTranslations(
    key: string,
    sourceValue: string,
    sourceLanguage: string,
    targetLanguage: string,
    config: TransmateConfig
  ): Promise<{ value: string, confidence: number, source: string }[]> {
    const result: { value: string, confidence: number, source: string }[] = [];

    try {
      // Load the source and target translation files
      const sourceFilePath = config.translationFilePath.replace('{language}', sourceLanguage);
      const targetFilePath = config.translationFilePath.replace('{language}', targetLanguage);

      let sourceTranslations: Record<string, any> = {};
      let targetTranslations: Record<string, any> = {};

      try {
        sourceTranslations = await readTranslationFile(sourceFilePath);
        targetTranslations = await readTranslationFile(targetFilePath);
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }

      // Flatten translations for easier comparison
      const flatSource = flattenTranslationKeys(sourceTranslations);
      const flatTarget = flattenTranslationKeys(targetTranslations);

      // Find similar keys based on patterns (e.g., buttons.save vs buttons.cancel)
      const keyParts = key.split('.');
      const keyPrefix = keyParts.slice(0, -1).join('.');

      if (keyPrefix) {
        // Find keys with the same prefix
        const similarKeys = Object.keys(flatSource).filter(k => 
          k !== key && k.startsWith(keyPrefix)
        );

        // For each similar key, if it has a target translation, add it as a suggestion
        for (const similarKey of similarKeys) {
          if (flatSource[similarKey] && flatTarget[similarKey]) {
            result.push({
              value: flatTarget[similarKey],
              confidence: 0.7,
              source: `similar-key:${similarKey}`
            });
          }
        }
      }

      return result;
    } catch (err: any) {
      console.error(`Error getting similar translations: ${err.message}`);
      return [];
    }
  }

  /**
   * Simple text translation using OpenAI
   */
  async function translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    config: TransmateConfig
  ): Promise<string> {
    const model = config.aiTranslation?.model || "gpt-4o";
    const apiKey = config.aiTranslation?.apiKey || "";

    const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
Provide only the translated text with no additional explanations or comments:

"${text}"`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a professional translator." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${data.error?.message || "Unknown error"}`);
      }

      return data.choices[0].message.content.trim();
    } catch (err: any) {
      throw new Error(`Translation failed: ${err.message}`);
    }
  }

  // Endpoint for tracking key usage
  app.post("/api/translations/usage", async (req, res) => {
    try {
      const { key, language } = req.body;

      if (!key || !language) {
        throw new Error("Missing required fields: key, language");
      }

      const config: TransmateConfig = {
        defaultLanguage: "en",
        languages: ["en", "fr", "de", "es"],
        translationFilePath: "./src/locales/{language}.json",
        sourcePatterns: ["./src/**/*.{ts,tsx,js,jsx}"],
        ignorePatterns: ["./src/**/*.test.{ts,tsx,js,jsx}"],
        aiTranslation: {
          enabled: true,
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY || "",
          model: "gpt-4o"
        }
      };

      // Load metadata file
      const metadataPath = path.join(path.dirname(config.translationFilePath.replace('{language}', config.defaultLanguage)), 'metadata.json');
      let metadata: Record<string, any> = {};

      try {
        metadata = await readTranslationFile(metadataPath);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          debug(`Metadata file not found: ${metadataPath}, creating empty one`);
          metadata = {};
        } else {
          throw err;
        }
      }

      // Update usage count
      if (!metadata[key]) {
        metadata[key] = {};
      }

      if (!metadata[key][language]) {
        metadata[key][language] = {};
      }

      if (!metadata[key][language].usageCount) {
        metadata[key][language].usageCount = 0;
      }

      if (!metadata[key][language].firstUsed) {
        metadata[key][language].firstUsed = new Date().toISOString();
      }

      metadata[key][language].usageCount += 1;
      metadata[key][language].lastUsed = new Date().toISOString();

      // Save updated metadata
      await writeTranslationFile(metadataPath, metadata);

      // Send back usage stats
      res.json({
        success: true,
        stats: metadata[key][language]
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Endpoint for rating translation quality
  app.post("/api/translations/rate", async (req, res) => {
    try {
      const { key, language, rating } = req.body;

      if (!key || !language || !rating) {
        throw new Error("Missing required fields: key, language, rating");
      }

      if (!["good", "needs_review", "machine_generated", "unverified"].includes(rating)) {
        throw new Error("Invalid rating value. Must be one of: good, needs_review, machine_generated, unverified");
      }

      const config: TransmateConfig = {
        defaultLanguage: "en",
        languages: ["en", "fr", "de", "es"],
        translationFilePath: "./src/locales/{language}.json",
        sourcePatterns: ["./src/**/*.{ts,tsx,js,jsx}"],
        ignorePatterns: ["./src/**/*.test.{ts,tsx,js,jsx}"],
        aiTranslation: {
          enabled: true,
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY || "",
          model: "gpt-4o"
        }
      };

      // Load metadata file
      const metadataPath = path.join(path.dirname(config.translationFilePath.replace('{language}', config.defaultLanguage)), 'metadata.json');
      let metadata: Record<string, any> = {};

      try {
        metadata = await readTranslationFile(metadataPath);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          debug(`Metadata file not found: ${metadataPath}, creating empty one`);
          metadata = {};
        } else {
          throw err;
        }
      }

      // Update quality rating
      if (!metadata[key]) {
        metadata[key] = {};
      }

      if (!metadata[key][language]) {
        metadata[key][language] = {};
      }

      metadata[key][language].quality = rating;
      metadata[key][language].lastRated = new Date().toISOString();

      // Write updated metadata file
      await writeTranslationFile(metadataPath, metadata);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Endpoint for language detection and auto-creation of translation files
  app.post("/api/translations/detect-language", async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        throw new Error("Missing required field: text");
      }

      const config: TransmateConfig = {
        defaultLanguage: "en",
        languages: ["en", "fr", "de", "es"],
        translationFilePath: "./src/locales/{language}.json",
        sourcePatterns: ["./src/**/*.{ts,tsx,js,jsx}"],
        ignorePatterns: ["./src/**/*.test.{ts,tsx,js,jsx}"],
        aiTranslation: {
          enabled: true,
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY || "",
          model: "gpt-4o"
        }
      };

      // Detect language
      const detectedLanguage = await detectLanguage(text);

      if (!detectedLanguage) {
        throw new Error("Could not detect language");
      }

      // Check if the language already exists in the config
      const languageExists = config.languages.includes(detectedLanguage);

      if (!languageExists) {
        // Add the language to the config
        config.languages.push(detectedLanguage);

        // Create the translation file if it doesn't exist
        const filePath = config.translationFilePath.replace('{language}', detectedLanguage);
        const dir = path.dirname(filePath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (!fs.existsSync(filePath)) {
          // Create a new translation file with empty content
          await writeTranslationFile(filePath, {});
          success(`Created new translation file for language ${detectedLanguage}: ${filePath}`);
        }
      }

      res.json({
        success: true,
        detectedLanguage,
        isNewLanguage: !languageExists
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }

      res.json({
        success: true,
        detectedLanguage,
        isNewLanguage: !languageExists
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    } finally {
      // Clean up any resources if needed
    }
  });

  /**
   * Detect language using LanguageDetect
   */
  async function detectLanguage(text: string): Promise<string | null> {
    try {
      const LanguageDetect = require('languagedetect');
      const lngDetector = new LanguageDetect();

      // Get language detection results
      const results = lngDetector.detect(text, 1);

      if (results && results.length > 0) {
        // Map the detected language to ISO code
        const detectedLang = results[0][0];

        // Map from language name to ISO code
        const langMap: Record<string, string> = {
          'english': 'en',
          'french': 'fr',
          'german': 'de',
          'spanish': 'es',
          'italian': 'it',
          'portuguese': 'pt',
          'dutch': 'nl',
          'russian': 'ru',
          'japanese': 'ja',
          'chinese': 'zh',
          'korean': 'ko',
          'arabic': 'ar',
          'hindi': 'hi',
          'bengali': 'bn',
          'turkish': 'tr',
          'finnish': 'fi',
          'swedish': 'sv',
          'norwegian': 'no',
          'danish': 'da',
          'czech': 'cs',
          'polish': 'pl',
          'romanian': 'ro',
          'hungarian': 'hu',
          'greek': 'el',
          'bulgarian': 'bg',
          'catalan': 'ca',
          'latvian': 'lv',
          'lithuanian': 'lt',
          'estonian': 'et',
          'serbian': 'sr',
          'croatian': 'hr',
          'vietnamese': 'vi',
          'thai': 'th',
          'indonesian': 'id',
          'malay': 'ms'
        };

        return langMap[detectedLang] || detectedLang.substring(0, 2).toLowerCase();
      }

      return null;
    } catch (err: any) {
      console.error(`Error detecting language: ${err.message}`);
      return null;
    }
  }

  app.post("/api/execute-command", async (req, res) => {
    const { command, options } = req.body;

    try {
      let result;
      const config: TransmateConfig = {
        defaultLanguage: "en",
        languages: ["en", "fr", "de", "es"],
        translationFilePath: "./src/locales/{language}.json",
        sourcePatterns: ["./src/**/*.{ts,tsx,js,jsx}"],
        ignorePatterns: ["./src/**/*.test.{ts,tsx,js,jsx}"],
        aiTranslation: {
          enabled: true,
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY || "",
          model: "gpt-4o"
        }
      };

      switch (command) {
        case "add-key":
          result = await addKey(options.key, options.value, options.translate, options.dryRun, config);
          break;
        case "translate-all":
          result = await translateAll(options.language, options.force, options.dryRun, options.interactive, config);
          break;
        case "sync-translations":
          result = await syncTranslations(options.source, options.format, options.merge, options.dryRun, config);
          break;
        case "extract-keys":
          result = await extractKeys(config, options.pattern, options.source, options.add, options.dryRun);
          break;
        case "cleanup":
          result = await cleanup(options.dryRun, config);
          break;
        case "init":
          result = await initConfig(options.force, options.js);
          break;
        default:
          throw new Error(`Unknown command: ${command}`);
      }

      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  const httpServer = createServer(app);

  // Payment routes
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { planName } = req.body;
      const plan = subscriptionPlans[planName];

      if (!plan) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} Plan`,
                description: plan.features.join(", "),
              },
              unit_amount: plan.price * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/payment-success`,
        cancel_url: `${req.headers.origin}/pricing`,
      });

      res.json({ sessionId: session.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      // In a real app, you would get this from your database
      const mockStats = {
        revenue: 15420,
        users: 256,
        subscriptions: 180,
        recentTransactions: [
          { id: 1, user: "john@example.com", date: "2024-03-20", amount: 49 },
          { id: 2, user: "jane@example.com", date: "2024-03-19", amount: 15 },
        ],
        planDistribution: [
          { name: "Free", count: 76, percentage: 30 },
          { name: "Pro", count: 120, percentage: 47 },
          { name: "Team", count: 45, percentage: 18 },
          { name: "Enterprise", count: 15, percentage: 5 },
        ],
      };

      res.json(mockStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Translation Memory endpoints
  app.get("/api/translation-memory/suggestions", async (req, res) => {
    try {
      const { text, targetLanguage } = req.query;
      // Implement fuzzy matching and ML-based suggestions here
      const suggestions = await getTranslationSuggestions(text as string, targetLanguage as string);
      res.json(suggestions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Quality Assurance endpoints
  app.post("/api/quality/check", async (req, res) => {
    try {
      const { text, language } = req.body;
      const checks = await performQualityChecks(text, language);
      res.json(checks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhooks management
  app.post("/api/webhooks", async (req, res) => {
    try {
      const webhook = webhookSchema.parse(req.body);
      // Store webhook configuration
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Translation deadlines
  app.post("/api/deadlines", async (req, res) => {
    try {
      const deadline = translationDeadlineSchema.parse(req.body);
      // Store deadline and setup notifications
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics and metrics
  app.get("/api/analytics/team-performance", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const metrics = await getTeamPerformanceMetrics(startDate as string, endDate as string);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Advanced search
  app.post("/api/translations/search", async (req, res) => {
    try {
      const { query, filters } = req.body;
      const results = await searchTranslations(query, filters);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Version control integration
  app.post("/api/vcs/create-pr", async (req, res) => {
    try {
      const { changes, description } = req.body;
      const prUrl = await createTranslationPR(changes, description);
      res.json({ prUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

// Helper functions for the new endpoints
async function getTranslationSuggestions(text: string, targetLanguage: string) {
  // Implement fuzzy matching and ML suggestions
  return [];
}

async function performQualityChecks(text: string, language: string) {
  // Implement spelling and grammar checks
  return [];
}

async function getTeamPerformanceMetrics(startDate: string, endDate: string) {
  // Calculate team performance metrics
  return {};
}

async function searchTranslations(query: string, filters: any) {
  // Implement advanced search functionality
  return [];
}

async function createTranslationPR(changes: any, description: string) {
  // Implement PR creation logic
  return "";
}

async function validateTranslationFiles(config: TransmateConfig): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
  const { languages, translationFilePath } = config;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const language of languages) {
    const filePath = translationFilePath.replace('{language}', language);
    try {
      const data = await readTranslationFile(filePath);
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push(`Translation file ${filePath} is not a valid JSON object.`);
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        warnings.push(`Translation file ${filePath} not found.`);
      } else {
        errors.push(`Error reading translation file ${filePath}: ${err.message}`);
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}