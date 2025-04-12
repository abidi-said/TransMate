#!/usr/bin/env node

import { Command } from "commander";
import { loadConfig } from "../utils/config";
import { 
  initConfig,
  extractKeys, 
  addKey, 
  syncTranslations, 
  translateAll,
  validateTranslations
} from "./commands";
import { log, error } from "../utils/logger";
import path from "path";
import fs from "fs";

// Get version from package.json
const getVersion = () => {
  try {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version || "1.0.0";
  } catch (err) {
    return "1.0.0";
  }
};

// Create CLI program
const program = new Command();

// Set basic info
program
  .name("transmate")
  .description("Translation management utility")
  .version(getVersion());

// Initialize command
program
  .command("init")
  .description("Initialize a new Transmate configuration file")
  .option("-f, --force", "Overwrite existing configuration", false)
  .option("--js", "Generate JavaScript configuration (default is TypeScript)", false)
  .action(async (options) => {
    try {
      const result = await initConfig(options.force, options.js);
      log(result);
    } catch (err: any) {
      error(err.message);
      process.exit(1);
    }
  });

// Extract keys command
program
  .command("extract-keys")
  .description("Extract translation keys from source files")
  .option("-a, --add", "Add missing keys to translation files", false)
  .option("-d, --dry-run", "Preview changes without applying them", false)
  .action(async (options) => {
    try {
      // Load the configuration
      const config = await loadConfig();
      
      // Extract keys
      const result = await extractKeys(options.add, options.dryRun, config);
      log(result);
    } catch (err: any) {
      error(err.message);
      process.exit(1);
    }
  });

// Add key command
program
  .command("add-key <key> [value]")
  .description("Add a new translation key")
  .option("-t, --translate", "Automatically translate to all languages", false)
  .option("-d, --dry-run", "Preview changes without applying them", false)
  .action(async (key, value, options) => {
    try {
      // Load the configuration
      const config = await loadConfig();
      
      // Add the key
      const result = await addKey(key, value, options.translate, options.dryRun, config);
      log(result);
    } catch (err: any) {
      error(err.message);
      process.exit(1);
    }
  });

// Sync translations command
program
  .command("sync")
  .description("Sync translations from external sources")
  .option("-s, --source <path>", "URL or path to translation source")
  .option("-f, --format <format>", "Source format (csv, xls, xlsx)", "csv")
  .option("-m, --merge <strategy>", "Merge strategy (override, keep-existing)", "override")
  .option("-d, --dry-run", "Preview changes without applying them", false)
  .action(async (options) => {
    try {
      // Load the configuration
      const config = await loadConfig();
      
      // Sync translations
      const result = await syncTranslations(
        options.source, 
        options.format, 
        options.merge, 
        options.dryRun, 
        config
      );
      log(result);
    } catch (err: any) {
      error(err.message);
      process.exit(1);
    }
  });

// Translate all command
program
  .command("translate-all")
  .description("Translate missing keys to all languages using AI")
  .option("-s, --source <language>", "Source language for translations", "")
  .option("-t, --target <languages>", "Comma-separated target languages (default: all)")
  .option("-d, --dry-run", "Preview changes without applying them", false)
  .action(async (options) => {
    try {
      // Load the configuration
      const config = await loadConfig();
      
      // Parse target languages
      const targetLanguages = options.target ? options.target.split(",") : undefined;
      
      // Translate all missing keys
      const result = await translateAll(
        options.source || config.defaultLanguage, 
        targetLanguages, 
        options.dryRun, 
        config
      );
      log(result);
    } catch (err: any) {
      error(err.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command("validate")
  .description("Validate translation files for consistency")
  .action(async () => {
    try {
      // Load the configuration
      const config = await loadConfig();
      
      // Validate translations
      const result = await validateTranslations(config);
      log(result);
    } catch (err: any) {
      error(err.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// If no args provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
