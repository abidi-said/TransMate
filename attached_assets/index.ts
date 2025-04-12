#!/usr/bin/env node

import { Command } from "commander";
import { addKey } from "./commands/addKey";
import { translateAll } from "./commands/translateAll";
import { syncTranslations } from "./commands/syncTranslations";
import { extractKeys } from "./commands/extractKeys";
import { initConfig } from "./commands/init";
import { loadConfig } from "./utils/config";
import { log, error } from "./utils/logger";
import { TransmateConfig } from "@shared/schema";

// Create the CLI program
const program = new Command();

// Set program information
program
  .name("transmate")
  .description("A CLI tool for managing translations in multi-language web applications")
  .version("1.0.0");

// Define the 'init' command
program
  .command("init")
  .description("Initialize Transmate configuration")
  .option("--force", "Overwrite existing configuration")
  .option("--js", "Generate JavaScript configuration (default is TypeScript)")
  .action(async (options) => {
    try {
      const result = await initConfig(options.force, options.js);
      log(result);
    } catch (err) {
      error(err.message);
      process.exit(1);
    }
  });

// Define the 'add-key' command
program
  .command("add-key")
  .description("Add a new translation key to all language files")
  .requiredOption("--key <key>", "The translation key")
  .option("--value <value>", "The value for the default language")
  .option("--translate", "Automatically translate to all languages")
  .option("--dry-run", "Preview changes without applying them")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const result = await addKey(options.key, options.value, options.translate, options.dryRun, config);
      log(result);
    } catch (err) {
      error(err.message);
      process.exit(1);
    }
  });

// Define the 'translate-all' command
program
  .command("translate-all")
  .description("Translate all missing keys across language files")
  .option("--language <language>", "Only translate for specific language(s)")
  .option("--force", "Override existing translations")
  .option("--dry-run", "Preview translations without applying them")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const result = await translateAll(options.language, options.force, options.dryRun, config);
      log(result);
    } catch (err) {
      error(err.message);
      process.exit(1);
    }
  });

// Define the 'sync-translations' command
program
  .command("sync-translations")
  .description("Sync translations from external sources (CSV/XLS)")
  .option("--source <source>", "URL or local path to translation source")
  .option("--format <format>", "Source format (csv, xls, xlsx)")
  .option("--merge <strategy>", "Merge strategy (override, keep-existing)")
  .option("--dry-run", "Preview changes without applying them")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const result = await syncTranslations(options.source, options.format, options.merge, options.dryRun, config);
      log(result);
    } catch (err) {
      error(err.message);
      process.exit(1);
    }
  });

// Define the 'extract-keys' command
program
  .command("extract-keys")
  .description("Extract missing translation keys from source files")
  .option("--pattern <pattern>", "Regex pattern to match translation keys")
  .option("--source <source>", "Source code glob pattern")
  .option("--add", "Add missing keys automatically")
  .option("--dry-run", "Preview changes without applying them")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const result = await extractKeys(options.pattern, options.source, options.add, options.dryRun, config);
      log(result);
    } catch (err) {
      error(err.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
