import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

interface CliConfigProps {
  settings: any;
}

export function CliConfig({ settings }: CliConfigProps) {
  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4">
        <CardTitle>CLI Configuration</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <p className="text-sm text-slate-600 mb-4">
          Configure the CLI tool for automated translation workflows.
        </p>
        
        <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
          <pre className="code-editor text-slate-200 text-sm">
{`// transmate.config.ts
import { TransmateConfig } from 'transmate';

const config: TransmateConfig = {
  // Default language to use for translations
  defaultLanguage: '${settings?.defaultLanguage || 'en'}',
  
  // Supported languages
  languages: ${JSON.stringify(settings?.languages || ['en', 'fr', 'de', 'es', 'pt', 'it', 'nl', 'pl'])},
  
  // Pattern for translation files
  translationFilePath: '${settings?.translationFilePath || './src/locales/{language}.json'}',
  
  // Source code patterns to extract keys from
  sourcePatterns: ${JSON.stringify(settings?.sourcePatterns || ['./src/**/*.{ts,tsx,js,jsx}'])},
  
  // Patterns to ignore when extracting keys
  ignorePatterns: ${JSON.stringify(settings?.ignorePatterns || ['./src/**/*.test.{ts,tsx,js,jsx}'])},
  
  // AI translation configuration
  aiTranslation: {
    enabled: ${settings?.aiTranslationEnabled !== false},
    provider: '${settings?.aiProvider || 'openai'}',
    apiKey: process.env.OPENAI_API_KEY,
    model: '${settings?.aiModel || 'gpt-4o'}'
  },
  
  // External sync configuration
  externalSync: {
    source: '${settings?.externalSync?.source || 'csv'}',
    url: '${settings?.externalSync?.url || ''}'
  }
};

export default config;`}
          </pre>
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">CLI Usage Examples:</h4>
          <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
            <pre className="code-editor text-slate-200 text-sm">
{`# Extract missing keys from source files
transmate extract-keys --add

# Translate missing keys for all languages
transmate translate-all

# Add a new translation key
transmate add-key "welcome.title" "Welcome to our application" --translate

# Sync translations from external sources
transmate sync --source "https://example.com/translations.csv"`}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
