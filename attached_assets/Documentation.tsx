import { Link } from "wouter";
import CommandCard from "@/components/CommandCard";
import ConfigExample from "@/components/ConfigExample";
import { useState } from "react";

export default function Documentation() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const commands = [
    {
      name: "add-key",
      description: "Add a new translation key to all language files",
      usage: "transmate add-key --key=\"welcome.title\" --value=\"Welcome to our app\"",
      options: [
        { name: "--key", description: "The translation key (required)" },
        { name: "--value", description: "The value for the default language" },
        { name: "--dry-run", description: "Preview changes without applying them" },
        { name: "--translate", description: "Automatically translate to all languages", tooltip: "Requires AI translation to be enabled in config" }
      ]
    },
    {
      name: "translate-all",
      description: "Translate all missing keys across language files",
      usage: "transmate translate-all --dry-run",
      options: [
        { name: "--dry-run", description: "Preview translations without applying them" },
        { name: "--language", description: "Only translate for specific language(s)" },
        { name: "--force", description: "Override existing translations" }
      ]
    },
    {
      name: "sync-translations",
      description: "Sync translations from external sources (CSV/XLS)",
      usage: "transmate sync-translations --source=\"https://example.com/translations.csv\"",
      options: [
        { name: "--source", description: "URL or local path to translation source" },
        { name: "--format", description: "Source format (csv, xls, xlsx)" },
        { name: "--dry-run", description: "Preview changes without applying them" },
        { name: "--merge", description: "Merge strategy (override, keep-existing)" }
      ]
    },
    {
      name: "extract-keys",
      description: "Extract missing translation keys from source files",
      usage: "transmate extract-keys --pattern=\"t\\(['\\\"]([^'\\\"]+)['\\\"]\"",
      options: [
        { name: "--pattern", description: "Regex pattern to match translation keys" },
        { name: "--source", description: "Source code glob pattern" },
        { name: "--add", description: "Add missing keys automatically" },
        { name: "--dry-run", description: "Preview changes without applying them" }
      ]
    },
    {
      name: "init",
      description: "Initialize a new transmate configuration file",
      usage: "transmate init",
      options: [
        { name: "--force", description: "Overwrite existing configuration file" },
        { name: "--js", description: "Generate JavaScript configuration (default is TypeScript)" }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap">
            <button
              className={`px-6 py-4 text-sm font-medium ${activeTab === 'overview' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium ${activeTab === 'commands' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('commands')}
            >
              Commands
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium ${activeTab === 'configuration' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('configuration')}
            >
              Configuration
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium ${activeTab === 'api' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('api')}
            >
              API Reference
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="prose max-w-none">
              <h1>Transmate Documentation</h1>
              <p>
                Transmate is a powerful CLI tool for managing translations in multi-language web applications. 
                It provides a simple and intuitive way to manage your translation files, extract keys from your 
                source code, and automatically translate missing keys using AI.
              </p>
              
              <h2>Key Features</h2>
              <ul>
                <li>AI-powered translations using OpenAI</li>
                <li>Support for both TypeScript and JavaScript projects</li>
                <li>Automatic extraction of translation keys from source files</li>
                <li>External synchronization with CSV and XLS files</li>
                <li>Dry run mode for previewing changes</li>
                <li>Configurable file paths and structures</li>
              </ul>
              
              <h2>Getting Started</h2>
              <p>
                To get started with Transmate, first install it globally:
              </p>
              
              <pre><code>npm install -g transmate</code></pre>
              
              <p>
                Then initialize a configuration file in your project:
              </p>
              
              <pre><code>transmate init</code></pre>
              
              <p>
                This will create a <code>transmate.config.ts</code> or <code>transmate.config.js</code> file 
                in your project root. You can customize this file to match your project structure and requirements.
              </p>
              
              <p>
                Check out the <a href="#" onClick={() => setActiveTab('commands')} className="text-primary-600 hover:text-primary-700">Commands</a> section for 
                more information on how to use Transmate.
              </p>
            </div>
          )}
          
          {activeTab === 'commands' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Available Commands</h1>
              <p className="mb-6 text-gray-600">
                Transmate provides several commands to help you manage your translations. 
                Here's a detailed overview of each command and its options.
              </p>
              
              <div className="space-y-8">
                {commands.map((command, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <CommandCard 
                      name={command.name} 
                      description={command.description}
                      usage={command.usage}
                      options={command.options}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'configuration' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Configuration</h1>
              <p className="mb-6 text-gray-600">
                Transmate is highly configurable through a <code className="bg-gray-100 px-1.5 py-0.5 rounded">transmate.config.ts</code> or 
                <code className="bg-gray-100 px-1.5 py-0.5 rounded">transmate.config.js</code> file in your project root.
              </p>
              
              <ConfigExample />
              
              <div className="mt-8 space-y-4">
                <h2 className="text-xl font-semibold">Configuration Options</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">defaultLanguage</h3>
                    <p className="text-gray-600">The default language used for translations. This language will be used as the source for translating to other languages.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">languages</h3>
                    <p className="text-gray-600">An array of languages that your application supports.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">translationFilePath</h3>
                    <p className="text-gray-600">The path pattern for your translation files. Use <code className="bg-gray-100 px-1.5 py-0.5 rounded">{"{language}"}</code> as a placeholder for the language code.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">sourcePatterns</h3>
                    <p className="text-gray-600">An array of glob patterns to search for source files containing translation keys.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">ignorePatterns</h3>
                    <p className="text-gray-600">An array of glob patterns to ignore when searching for source files.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">aiTranslation</h3>
                    <p className="text-gray-600">Configuration options for AI-powered translations.</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                      <li><strong>enabled</strong>: Whether to use AI translations.</li>
                      <li><strong>provider</strong>: The AI provider to use (currently only "openai" is supported).</li>
                      <li><strong>apiKey</strong>: Your API key for the provider.</li>
                      <li><strong>model</strong>: The model to use for translations.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">externalSync</h3>
                    <p className="text-gray-600">Configuration options for syncing translations from external sources.</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                      <li><strong>source</strong>: The format of the external source ("csv", "xls", "xlsx").</li>
                      <li><strong>url</strong>: The URL or local path to the external source.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'api' && (
            <div className="prose max-w-none">
              <h1>API Reference</h1>
              <p>
                Transmate provides a programmatic API that you can use in your Node.js applications.
              </p>
              
              <h2>Installation</h2>
              <pre><code>npm install transmate</code></pre>
              
              <h2>Usage</h2>
              <p>
                Here's how to use the Transmate API in your code:
              </p>
              
              <pre><code>{`import { Transmate } from 'transmate';

// Initialize with a configuration object
const transmate = new Transmate({
  defaultLanguage: 'en',
  languages: ['en', 'fr', 'de'],
  translationFilePath: './src/locales/{language}.json',
  sourcePatterns: ['./src/**/*.{ts,tsx,js,jsx}']
});

// Add a new translation key
await transmate.addKey({
  key: 'welcome.title',
  value: 'Welcome to our app',
  translate: true
});

// Translate all missing keys
await transmate.translateAll();

// Extract keys from source files
const extractedKeys = await transmate.extractKeys();

// Sync from external source
await transmate.syncTranslations({
  source: 'https://example.com/translations.csv',
  format: 'csv'
});`}</code></pre>
              
              <h2>API Methods</h2>
              
              <h3>addKey(options)</h3>
              <p>Adds a new translation key to all language files.</p>
              <pre><code>{`interface AddKeyOptions {
  key: string;
  value: string;
  translate?: boolean;
  dryRun?: boolean;
}`}</code></pre>
              
              <h3>translateAll(options)</h3>
              <p>Translates all missing keys in all language files.</p>
              <pre><code>{`interface TranslateAllOptions {
  dryRun?: boolean;
  language?: string | string[];
  force?: boolean;
}`}</code></pre>
              
              <h3>extractKeys(options)</h3>
              <p>Extracts translation keys from source files.</p>
              <pre><code>{`interface ExtractKeysOptions {
  pattern?: string;
  source?: string | string[];
  add?: boolean;
  dryRun?: boolean;
}`}</code></pre>
              
              <h3>syncTranslations(options)</h3>
              <p>Syncs translations from an external source.</p>
              <pre><code>{`interface SyncTranslationsOptions {
  source?: string;
  format?: 'csv' | 'xls' | 'xlsx';
  dryRun?: boolean;
  merge?: 'override' | 'keep-existing';
}`}</code></pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
