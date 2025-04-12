import fs from "fs";
import path from "path";
import { promisify } from "util";
import https from "https";
import http from "http";
import { parse as parseCSV } from "csv-parse/sync";
import xlsx from "xlsx";

const readFile = promisify(fs.readFile);

/**
 * Fetch CSV from a URL
 * 
 * @param url - The URL to fetch from
 * @returns CSV content as array of arrays
 */
export async function fetchCSV(url: string): Promise<string[][]> {
  try {
    const csvContent = await fetchText(url);
    return parseCSV(csvContent, { skip_empty_lines: true });
  } catch (err) {
    throw new Error(`Failed to fetch CSV from ${url}: ${err.message}`);
  }
}

/**
 * Read CSV from a local file
 * 
 * @param filePath - Path to the CSV file
 * @returns CSV content as array of arrays
 */
export async function readCSV(filePath: string): Promise<string[][]> {
  try {
    const content = await readFile(filePath, "utf-8");
    return parseCSV(content, { skip_empty_lines: true });
  } catch (err) {
    throw new Error(`Failed to read CSV file ${filePath}: ${err.message}`);
  }
}

/**
 * Read Excel file
 * 
 * @param filePath - Path to the Excel file
 * @returns Translations object
 */
export async function readExcel(filePath: string): Promise<Record<string, Record<string, string>>> {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    
    if (jsonData.length === 0) {
      throw new Error("Excel file is empty or has no data");
    }
    
    // Determine the key column
    const firstRow = jsonData[0] as Record<string, any>;
    const keyColumn = Object.keys(firstRow).find(key => 
      key.toLowerCase() === "key" || key.toLowerCase() === "id"
    );
    
    if (!keyColumn) {
      throw new Error('Excel file must have a "key" or "id" column');
    }
    
    // Process the data
    const result: Record<string, Record<string, string>> = {};
    const columns = Object.keys(firstRow).filter(col => col !== keyColumn);
    
    // Initialize result with language keys from columns
    for (const col of columns) {
      result[col] = {};
    }
    
    // Populate translations
    for (const row of jsonData) {
      const rowObj = row as Record<string, any>;
      const key = rowObj[keyColumn];
      
      if (!key) continue;
      
      for (const col of columns) {
        if (rowObj[col]) {
          result[col][key] = String(rowObj[col]);
        }
      }
    }
    
    return result;
  } catch (err) {
    throw new Error(`Failed to read Excel file ${filePath}: ${err.message}`);
  }
}

/**
 * Fetch text from a URL
 * 
 * @param url - The URL to fetch from
 * @returns Text content
 */
async function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    
    protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Request failed with status code ${res.statusCode}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      
      res.on("data", (chunk) => {
        chunks.push(chunk);
      });
      
      res.on("end", () => {
        resolve(Buffer.concat(chunks).toString("utf-8"));
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}
