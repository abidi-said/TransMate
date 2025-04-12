/**
 * Options for the add-key command
 */
export interface AddKeyOptions {
  key: string;
  value?: string;
  translate?: boolean;
  dryRun?: boolean;
}

/**
 * Options for the translate-all command
 */
export interface TranslateAllOptions {
  language?: string;
  force?: boolean;
  dryRun?: boolean;
  interactive?: boolean;
}

/**
 * Options for the cleanup command
 */
export interface CleanupOptions {
  dryRun?: boolean;
}

/**
 * Options for the sync-translations command
 */
export interface SyncTranslationsOptions {
  source?: string;
  format?: "csv" | "xls" | "xlsx";
  merge?: "override" | "keep-existing";
  dryRun?: boolean;
}

/**
 * Options for the extract-keys command
 */
export interface ExtractKeysOptions {
  pattern?: string;
  source?: string;
  add?: boolean;
  dryRun?: boolean;
}

/**
 * Options for the init command
 */
export interface InitOptions {
  force?: boolean;
  js?: boolean;
}

/**
 * Common result interface for commands
 */
export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}
