
import { franc } from 'franc';
import { log, warning } from './logger';
import { readTranslationFile, writeTranslationFile } from './fileSystem';
import { TransmateConfig } from '@shared/schema';

export async function detectAndCreateTranslationFile(text: string, config: TransmateConfig): Promise<string | null> {
  const detectedLang = franc(text, { minLength: 3 });
  
  if (!detectedLang || detectedLang === 'und') {
    warning('Could not detect language confidently');
    return null;
  }
  
  if (config.languages.includes(detectedLang)) {
    log(`Language ${detectedLang} already exists`);
    return detectedLang;
  }
  
  const filePath = config.translationFilePath.replace('{language}', detectedLang);
  await writeTranslationFile(filePath, {});
  
  log(`Created new translation file for ${detectedLang}`);
  return detectedLang;
}
