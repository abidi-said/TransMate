import { Link } from "wouter";
import FeatureCard from "@/components/FeatureCard";
import CommandCard from "@/components/CommandCard";
import ConfigExample from "@/components/ConfigExample";
import ErrorExample from "@/components/ErrorExample";
import DemoTerminal from "@/components/DemoTerminal";
import { type Feature } from "@shared/schema";

export default function Home() {
  const features: Feature[] = [
    {
      title: "AI-Powered Translations",
      description: "Leverage OpenAI to automatically translate missing keys with context awareness.",
      icon: "clipboard"
    },
    {
      title: "TS & JS Compatible",
      description: "Works seamlessly with both TypeScript and JavaScript projects.",
      icon: "code"
    },
    {
      title: "External Sync",
      description: "Import translations from external sources like CSV and XLS files.",
      icon: "chart"
    },
    {
      title: "Configurable Paths",
      description: "Flexible file path templating with support for custom locale structures.",
      icon: "code-2"
    },
    {
      title: "Missing Keys Extraction",
      description: "Automatically find and extract untranslated keys from your source code.",
      icon: "download"
    },
    {
      title: "Dry Run Mode",
      description: "Preview changes before applying them with the --dry-run option.",
      icon: "settings"
    },
  ];

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
    }
  ];

  const errors = [
    {
      title: "Missing Translation Files",
      command: "transmate translate-all",
      errorMessage: "Error: Translation file not found: ./src/locales/fr.json",
      suggestion: "You can create the file by running:",
      command2: "transmate init-language --language=fr"
    },
    {
      title: "Invalid File Structure",
      command: "transmate add-key --key=\"welcome.title\" --value=\"Welcome\"",
      errorMessage: "Error: Invalid JSON format in ./src/locales/en.json",
      suggestion: "Please fix the file structure before proceeding",
      command2: "Error details: Unexpected token } in JSON at position 245"
    },
    {
      title: "Missing OpenAI Key",
      command: "transmate translate-all",
      errorMessage: "Error: OpenAI API key is missing",
      suggestion: "AI translation is enabled but no API key is provided",
      command2: "Set OPENAI_API_KEY in your environment or update your config file"
    },
    {
      title: "Missing External Source",
      command: "transmate sync-translations",
      errorMessage: "Error: No external source URL provided",
      suggestion: "Please provide a source URL with --source option",
      command2: "Example: transmate sync-translations --source=https://example.com/translations.csv"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-800">Translation Management CLI Tool</h2>
        <p className="text-lg text-gray-600">
          A powerful command-line interface for managing translations in both TypeScript and JavaScript projects.
        </p>
        <div className="flex items-center justify-center space-x-4 mt-6">
          <a href="#installation" className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition">Get Started</a>
          <a href="#commands" className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-5 py-2.5 rounded-lg font-medium transition">View Commands</a>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <FeatureCard 
            key={index} 
            title={feature.title} 
            description={feature.description} 
            icon={feature.icon} 
          />
        ))}
      </section>

      {/* Installation Section */}
      <section id="installation" className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Installation</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">NPM</h3>
            <div className="bg-[#282a36] p-4 font-mono text-sm overflow-x-auto rounded-md text-gray-100">
              <pre>npm install -g transmate</pre>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3">Yarn</h3>
            <div className="bg-[#282a36] p-4 font-mono text-sm overflow-x-auto rounded-md text-gray-100">
              <pre>yarn global add transmate</pre>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3">Initialize Configuration</h3>
            <div className="bg-[#282a36] p-4 font-mono text-sm overflow-x-auto rounded-md text-gray-100">
              <pre>transmate init</pre>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              This will create a <code className="bg-gray-100 px-1.5 py-0.5 rounded">transmate.config.ts</code> or <code className="bg-gray-100 px-1.5 py-0.5 rounded">transmate.config.js</code> file in your project root.
            </p>
          </div>
        </div>
      </section>

      {/* Configuration Section */}
      <section className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Configuration</h2>
        <div className="space-y-4">
          <p className="text-gray-600">The configuration file supports both TypeScript and JavaScript formats. Here's an example:</p>
          <ConfigExample />
        </div>
      </section>

      {/* Commands Section */}
      <section id="commands" className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-8">Commands</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commands.map((command, index) => (
            <CommandCard 
              key={index}
              name={command.name} 
              description={command.description}
              usage={command.usage}
              options={command.options}
            />
          ))}
        </div>
      </section>

      {/* Demo Section */}
      <section className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Workflow Example</h2>
        <DemoTerminal />
      </section>

      {/* Error Handling Section */}
      <section className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Error Handling</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {errors.map((error, index) => (
            <ErrorExample 
              key={index}
              title={error.title}
              command={error.command}
              errorMessage={error.errorMessage}
              suggestion={error.suggestion}
              command2={error.command2}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
