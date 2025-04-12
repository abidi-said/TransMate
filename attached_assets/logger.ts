import chalk from "chalk";

/**
 * Log a regular message
 * 
 * @param message - The message to log
 */
export function log(message: string): void {
  console.log(message);
}

/**
 * Log a success message
 * 
 * @param message - The message to log
 */
export function success(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * Log an error message
 * 
 * @param message - The message to log
 */
export function error(message: string): void {
  console.error(chalk.red(`✗ Error: ${message}`));
}

/**
 * Log a warning message
 * 
 * @param message - The message to log
 */
export function warning(message: string): void {
  console.warn(chalk.yellow(`⚠ Warning: ${message}`));
}

/**
 * Log a debug message (only if DEBUG=transmate is set)
 * 
 * @param message - The message to log
 */
export function debug(message: string): void {
  if (process.env.DEBUG === "transmate" || process.env.DEBUG === "*") {
    console.debug(chalk.blue(`ℹ [debug] ${message}`));
  }
}

/**
 * Log a heading
 * 
 * @param message - The heading text
 */
export function heading(message: string): void {
  console.log(chalk.bold.cyan(`\n${message}`));
  console.log(chalk.bold.cyan('='.repeat(message.length)));
}

/**
 * Log a subheading
 * 
 * @param message - The subheading text
 */
export function subheading(message: string): void {
  console.log(chalk.bold.white(`\n${message}`));
  console.log(chalk.bold.white('-'.repeat(message.length)));
}

/**
 * Log a progress update
 * 
 * @param current - Current progress
 * @param total - Total goal
 * @param message - Optional message to display
 */
export function progress(current: number, total: number, message?: string): void {
  const percent = Math.round((current / total) * 100);
  const barLength = 30;
  const filledLength = Math.round((current / total) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  const output = message 
    ? `${bar} ${percent}% | ${current}/${total} | ${message}`
    : `${bar} ${percent}% | ${current}/${total}`;
    
  console.log(chalk.cyan(output));
}

/**
 * Log a key-value pair
 * 
 * @param key - The key
 * @param value - The value
 */
export function keyValue(key: string, value: string): void {
  console.log(`${chalk.bold.white(key)}: ${value}`);
}

/**
 * Log a table of data
 * 
 * @param headers - Table headers
 * @param rows - Table rows
 */
export function table(headers: string[], rows: string[][]): void {
  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxDataLength = Math.max(...rows.map(r => r[i]?.length || 0));
    return Math.max(h.length, maxDataLength);
  });
  
  // Build header row
  const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join(' | ');
  const separator = widths.map(w => '-'.repeat(w)).join('-+-');
  
  console.log(chalk.bold.white(headerRow));
  console.log(separator);
  
  // Build data rows
  rows.forEach(row => {
    const formattedRow = row.map((cell, i) => (cell || '').padEnd(widths[i])).join(' | ');
    console.log(formattedRow);
  });
}
