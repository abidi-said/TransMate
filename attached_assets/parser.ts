import fs from "fs";
import { parse } from "@babel/parser";
import { debug } from "./logger";

/**
 * Parse a source file to extract translation keys
 * 
 * @param filePath - Path to the source file
 * @param pattern - Regex pattern to match translation keys
 * @returns List of extracted keys
 */
export async function parseSourceFile(filePath: string, pattern: string): Promise<string[]> {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Try two methods to extract keys: regex and AST parsing
    const regexKeys = extractKeysWithRegex(content, pattern);
    
    // If regex finds keys, return them
    if (regexKeys.length > 0) {
      return regexKeys;
    }
    
    // Otherwise try AST parsing for more complex cases
    return extractKeysWithAST(content, filePath);
  } catch (err: any) {
    debug(`Error parsing ${filePath}: ${err.message}`);
    return [];
  }
}

/**
 * Extract translation keys using regex
 * 
 * @param content - File content
 * @param pattern - Regex pattern
 * @returns List of extracted keys
 */
function extractKeysWithRegex(content: string, pattern: string): string[] {
  const keys: Set<string> = new Set();
  
  try {
    const regex = new RegExp(pattern, "g");
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (match[1]) {
        keys.add(match[1]);
      }
    }
  } catch (err: any) {
    debug(`Regex extraction error: ${err.message}`);
  }
  
  return Array.from(keys);
}

/**
 * Extract translation keys using AST parsing
 * 
 * @param content - File content
 * @param filePath - Path to the file (for error reporting)
 * @returns List of extracted keys
 */
function extractKeysWithAST(content: string, filePath: string): string[] {
  const keys: Set<string> = new Set();
  
  try {
    // Determine parser plugins based on file extension
    const plugins: any[] = [];
    
    if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
      plugins.push("typescript");
    }
    
    if (filePath.endsWith(".jsx") || filePath.endsWith(".tsx")) {
      plugins.push("jsx");
    }
    
    // Parse the file
    const ast = parse(content, {
      sourceType: "module",
      plugins
    });
    
    // Simple traversal function to walk the AST
    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;
      
      // Check if this is a call expression (function call)
      if (node.type === 'CallExpression') {
        // Check if the callee is an identifier named 't' or 'i18n' or other common translation functions
        const isTranslationFunction = 
          // t('key')
          (node.callee.type === 'Identifier' && 
           (node.callee.name === 't' || node.callee.name === 'i18n' || node.callee.name === 'translate')) ||
          // i18n.t('key')
          (node.callee.type === 'MemberExpression' && 
           node.callee.object.type === 'Identifier' && 
           (node.callee.object.name === 'i18n' || node.callee.object.name === 'I18n') &&
           node.callee.property.type === 'Identifier' && 
           node.callee.property.name === 't') ||
          // formatMessage({id: 'key'})
          (node.callee.type === 'Identifier' && node.callee.name === 'formatMessage') ||
          // intl.formatMessage({id: 'key'})
          (node.callee.type === 'MemberExpression' && 
           node.callee.property.type === 'Identifier' && 
           node.callee.property.name === 'formatMessage');
        
        if (isTranslationFunction) {
          // Extract the key based on different function signatures
          
          // Case: t('key'), i18n.t('key'), translate('key')
          if (node.arguments.length > 0 && node.arguments[0].type === 'StringLiteral') {
            keys.add(node.arguments[0].value);
          }
          
          // Case: formatMessage({id: 'key'}) or intl.formatMessage({id: 'key'})
          if (node.arguments.length > 0 && 
              node.arguments[0].type === 'ObjectExpression') {
            const idProperty = node.arguments[0].properties.find(
              (prop: any) => prop.key.name === 'id' || prop.key.name === 'defaultMessage'
            );
            
            if (idProperty && idProperty.value.type === 'StringLiteral') {
              keys.add(idProperty.value.value);
            }
          }
        }
      }
      
      // Check if this is a JSX element with a translation attribute
      if (node.type === 'JSXOpeningElement') {
        const translationAttributes = (node.attributes || []).filter(
          (attr: any) => attr.type === 'JSXAttribute' && 
            (attr.name.name === 'i18nKey' || attr.name.name === 't' || attr.name.name === 'id')
        );
        
        translationAttributes.forEach((attr: any) => {
          if (attr.value && attr.value.type === 'StringLiteral') {
            keys.add(attr.value.value);
          }
        });
      }
      
      // Recursively traverse all properties
      for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key) && key !== 'loc' && key !== 'range') {
          const child = node[key];
          
          if (Array.isArray(child)) {
            child.forEach(item => traverse(item));
          } else if (child && typeof child === 'object') {
            traverse(child);
          }
        }
      }
    }
    
    // Start traversal from the program node
    traverse(ast.program);
    
  } catch (err: any) {
    debug(`AST parsing error for ${filePath}: ${err.message}`);
  }
  
  return Array.from(keys);
}
