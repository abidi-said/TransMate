/**
 * Logger utility for server-side logging
 */

/**
 * Log a regular message
 * 
 * @param message - The message to log
 */
export function log(message: string): void {
  console.log(`[INFO] ${message}`);
}

/**
 * Log a success message
 * 
 * @param message - The message to log
 */
export function success(message: string): void {
  console.log(`[SUCCESS] ${message}`);
}

/**
 * Log an error message
 * 
 * @param message - The message to log
 */
export function error(message: string): void {
  console.error(`[ERROR] ${message}`);
}

/**
 * Log a warning message
 * 
 * @param message - The message to log
 */
export function warning(message: string): void {
  console.warn(`[WARNING] ${message}`);
}

/**
 * Log a debug message (only in development mode)
 * 
 * @param message - The message to log
 */
export function debug(message: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`);
  }
}