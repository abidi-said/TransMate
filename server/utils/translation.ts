import { TransmateConfig } from "@shared/schema";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { franc } from "franc";
import { log, warning, debug } from "./logger";

/**
 * Translate text from one language to another using AI provider
 * 
 * @param text - Text to translate
 * @param sourceLanguage - Source language code
 * @param targetLanguage - Target language code
 * @param config - Transmate configuration
 * @returns Translated text
 */
export async function translateText(
  text: string,
  sourceLanguage: string, 
  targetLanguage: string,
  config: TransmateConfig
): Promise<string> {
  // Validate configuration
  if (!config.aiTranslation || !config.aiTranslation.enabled) {
    throw new Error("AI translation is not enabled in configuration");
  }
  
  if (!config.aiTranslation.apiKey) {
    throw new Error("API key is missing for AI translation");
  }
  
  // Get language names for better prompting
  const sourceLangName = getLanguageName(sourceLanguage);
  const targetLangName = getLanguageName(targetLanguage);
  
  switch (config.aiTranslation.provider) {
    case "openai":
      return translateWithOpenAI(
        text,
        sourceLangName,
        targetLangName,
        config.aiTranslation.apiKey,
        config.aiTranslation.model || "gpt-4o"
      );
    // Placeholder for future providers
    case "google":
      throw new Error("Google Translate integration is not implemented yet");
    case "azure":
      throw new Error("Azure AI Translator integration is not implemented yet");
    default:
      throw new Error(`Unsupported translation provider: ${config.aiTranslation.provider}`);
  }
}

/**
 * Translate text using OpenAI
 * 
 * @param text - Text to translate
 * @param sourceLanguage - Source language name
 * @param targetLanguage - Target language name
 * @param apiKey - OpenAI API key
 * @param model - OpenAI model to use
 * @returns Translated text
 */
async function translateWithOpenAI(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string,
  model: string = "gpt-4o"
): Promise<string> {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });
    
    // Create prompt for translation
    const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
Preserve any formatting, variables, or placeholders exactly as they appear in the original.
Maintain the tone and style of the original text.
Only respond with the translation, nothing else.

Text to translate: "${text}"

Translation:`;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a professional translator with expertise in multiple languages and technical terminology." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,  // Lower temperature for more consistent translations
      max_tokens: 1000
    });
    
    return response.choices[0].message.content?.trim() || text;
  } catch (err: any) {
    debug(`OpenAI translation error: ${err.message}`);
    
    if (err.status === 401) {
      throw new Error("Invalid OpenAI API key");
    } else if (err.status === 429) {
      throw new Error("OpenAI API rate limit exceeded");
    } else {
      throw new Error(`OpenAI API error: ${err.message}`);
    }
  }
}

/**
 * Get suggestions for a translation key
 * 
 * @param sourceText - Text in source language
 * @param sourceLanguage - Source language code
 * @param targetLanguages - Target language codes
 * @param config - Transmate configuration
 * @returns Translation suggestions
 */
export async function getTranslationSuggestions(
  sourceText: string,
  sourceLanguage: string,
  targetLanguages: string[],
  config: TransmateConfig
): Promise<{
  similarTranslations: any[],
  aiSuggestions: {
    message: string,
    translations: Record<string, string>
  }
}> {
  // This is a placeholder implementation. In a real app, this would:
  // 1. Search translation memory for similar entries
  // 2. Generate AI suggestions for each target language
  
  // For now, return mock data
  const suggestions = {
    similarTranslations: [
      {
        key: "common.buttons.submit",
        translations: {
          en: "Submit",
          fr: "Soumettre",
          de: "Absenden"
        }
      },
      {
        key: "common.buttons.save",
        translations: {
          en: "Save",
          fr: "Enregistrer",
          de: "Speichern"
        }
      }
    ],
    aiSuggestions: {
      message: "For simple action buttons like this, keep translations concise and direct. Common translations:",
      translations: {
        fr: "Soumettre",
        de: "Absenden",
        es: "Enviar"
      }
    }
  };
  
  return suggestions;
}

/**
 * Detect language of a text
 * 
 * @param text - Text to analyze
 * @returns Language code
 */
export function detectLanguage(text: string): string | null {
  try {
    const detectedLang = franc(text, { minLength: 3 });
    
    if (!detectedLang || detectedLang === 'und') {
      warning('Could not detect language confidently');
      return null;
    }
    
    return detectedLang;
  } catch (err) {
    debug(`Language detection error: ${err}`);
    return null;
  }
}

/**
 * Get full language name from language code
 * 
 * @param langCode - ISO language code
 * @returns Full language name
 */
export function getLanguageName(langCode: string): string {
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
