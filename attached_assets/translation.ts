import { TransmateConfig } from "@shared/schema";
import { getChatCompletion } from "./openai";
import { debug } from "./logger";

/**
 * Translate text from one language to another using OpenAI
 * 
 * @param text - The text to translate
 * @param fromLang - The source language
 * @param toLang - The target language
 * @param config - The Transmate configuration
 * @returns The translated text
 */
export async function translateText(
  text: string,
  fromLang: string,
  toLang: string,
  config: TransmateConfig
): Promise<string> {
  if (!config.aiTranslation || !config.aiTranslation.enabled) {
    throw new Error("AI translation is not enabled");
  }
  
  if (!config.aiTranslation.apiKey) {
    throw new Error("OpenAI API key is missing");
  }
  
  // Only support OpenAI for now
  if (config.aiTranslation.provider !== "openai") {
    throw new Error(`Unsupported translation provider: ${config.aiTranslation.provider}`);
  }
  
  try {
    const prompt = createTranslationPrompt(text, fromLang, toLang);
    const model = config.aiTranslation.model || "gpt-4o";
    
    debug(`Translating from ${fromLang} to ${toLang} using ${model}`);
    
    const response = await getChatCompletion(prompt, model, config.aiTranslation.apiKey);
    
    return response.trim();
  } catch (err) {
    throw new Error(`Translation failed: ${err.message}`);
  }
}

/**
 * Create a translation prompt for OpenAI
 * 
 * @param text - The text to translate
 * @param fromLang - The source language
 * @param toLang - The target language
 * @returns The prompt
 */
function createTranslationPrompt(text: string, fromLang: string, toLang: string): string {
  // Get full language names
  const fromLangFull = getFullLanguageName(fromLang);
  const toLangFull = getFullLanguageName(toLang);
  
  return `Translate the following text from ${fromLangFull} to ${toLangFull}. 
Preserve any formatting, variables, or placeholders exactly as they appear in the original.
Maintain the tone and style of the original text.
Only respond with the translation, nothing else.

Text to translate: "${text}"

Translation:`;
}

/**
 * Get the full language name from a language code
 * 
 * @param langCode - The language code
 * @returns The full language name
 */
function getFullLanguageName(langCode: string): string {
  const languages: Record<string, string> = {
    en: "English",
    fr: "French",
    de: "German",
    es: "Spanish",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
    hi: "Hindi",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    sv: "Swedish",
    da: "Danish",
    no: "Norwegian",
    fi: "Finnish",
    cs: "Czech",
    hu: "Hungarian",
    ro: "Romanian",
    bg: "Bulgarian",
    el: "Greek",
    uk: "Ukrainian",
    th: "Thai",
    vi: "Vietnamese",
  };
  
  return languages[langCode] || langCode;
}
