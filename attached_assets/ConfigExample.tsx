import { useState } from "react";

export default function ConfigExample() {
  const [activeTab, setActiveTab] = useState<'ts' | 'js'>('ts');
  
  return (
    <div>
      <div className="flex mb-2">
        <button 
          className={`text-sm font-medium rounded-t-lg py-2 px-4 ${activeTab === 'ts' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`} 
          onClick={() => setActiveTab('ts')}
        >
          TypeScript
        </button>
        <button 
          className={`text-sm font-medium rounded-t-lg py-2 px-4 ${activeTab === 'js' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('js')}
        >
          JavaScript
        </button>
      </div>

      <div className={`bg-[#282a36] p-4 font-mono text-sm overflow-x-auto rounded-md ${activeTab === 'ts' ? '' : 'hidden'}`}>
        <pre className="text-gray-100">
          <span className="text-[#6272a4]">// transmate.config.ts</span>
          <br /><span className="text-[#ff79c6]">import</span> {'{ '}<span className="text-[#8be9fd]">TransmateConfig</span> {'}'} <span className="text-[#ff79c6]">from</span> <span className="text-[#f1fa8c]">'transmate'</span>;
          <br />
          <br /><span className="text-[#ff79c6]">const</span> <span className="text-[#8be9fd]">config</span>: <span className="text-[#8be9fd]">TransmateConfig</span> = {'{'} 
          <br />  <span className="text-[#6272a4]">// Default language to use for translations</span>
          <br />  <span className="text-[#8be9fd]">defaultLanguage</span>: <span className="text-[#f1fa8c]">'en'</span>,
          <br />  
          <br />  <span className="text-[#6272a4]">// Supported languages</span>
          <br />  <span className="text-[#8be9fd]">languages</span>: [<span className="text-[#f1fa8c]">'en'</span>, <span className="text-[#f1fa8c]">'fr'</span>, <span className="text-[#f1fa8c]">'de'</span>, <span className="text-[#f1fa8c]">'es'</span>],
          <br />  
          <br />  <span className="text-[#6272a4]">// Pattern for translation files</span>
          <br />  <span className="text-[#8be9fd]">translationFilePath</span>: <span className="text-[#f1fa8c]">'./src/locales/{'{'}language{'}'}.json'</span>,
          <br />  
          <br />  <span className="text-[#6272a4]">// Source code patterns to extract keys from</span>
          <br />  <span className="text-[#8be9fd]">sourcePatterns</span>: [<span className="text-[#f1fa8c]">'./src/**/*.{'{'}ts,tsx,js,jsx{'}'}'</span>],
          <br />  
          <br />  <span className="text-[#6272a4]">// Patterns to ignore when extracting keys</span>
          <br />  <span className="text-[#8be9fd]">ignorePatterns</span>: [<span className="text-[#f1fa8c]">'./src/**/*.test.{'{'}ts,tsx,js,jsx{'}'}'</span>],
          <br />  
          <br />  <span className="text-[#6272a4]">// AI translation configuration (optional)</span>
          <br />  <span className="text-[#8be9fd]">aiTranslation</span>: {'{'} 
          <br />    <span className="text-[#8be9fd]">enabled</span>: <span className="text-[#ff79c6]">true</span>,
          <br />    <span className="text-[#8be9fd]">provider</span>: <span className="text-[#f1fa8c]">'openai'</span>,
          <br />    <span className="text-[#8be9fd]">apiKey</span>: <span className="text-[#f1fa8c]">'${'{'} process.env.OPENAI_API_KEY {'}'}'</span>,
          <br />    <span className="text-[#8be9fd]">model</span>: <span className="text-[#f1fa8c]">'gpt-4o'</span>
          <br />  {'}'},
          <br />  
          <br />  <span className="text-[#6272a4]">// External sync configuration (optional)</span>
          <br />  <span className="text-[#8be9fd]">externalSync</span>: {'{'} 
          <br />    <span className="text-[#8be9fd]">source</span>: <span className="text-[#f1fa8c]">'csv'</span>,
          <br />    <span className="text-[#8be9fd]">url</span>: <span className="text-[#f1fa8c]">'https://example.com/translations.csv'</span>
          <br />  {'}'}
          <br />{'}'};
          <br />
          <br /><span className="text-[#ff79c6]">export</span> <span className="text-[#ff79c6]">default</span> <span className="text-[#8be9fd]">config</span>;
        </pre>
      </div>

      <div className={`bg-[#282a36] p-4 font-mono text-sm overflow-x-auto rounded-md ${activeTab === 'js' ? '' : 'hidden'}`}>
        <pre className="text-gray-100">
          <span className="text-[#6272a4]">// transmate.config.js</span>
          <br /><span className="text-[#ff79c6]">module</span>.<span className="text-[#8be9fd]">exports</span> = {'{'} 
          <br />  <span className="text-[#6272a4]">// Default language to use for translations</span>
          <br />  <span className="text-[#8be9fd]">defaultLanguage</span>: <span className="text-[#f1fa8c]">'en'</span>,
          <br />  
          <br />  <span className="text-[#6272a4]">// Supported languages</span>
          <br />  <span className="text-[#8be9fd]">languages</span>: [<span className="text-[#f1fa8c]">'en'</span>, <span className="text-[#f1fa8c]">'fr'</span>, <span className="text-[#f1fa8c]">'de'</span>, <span className="text-[#f1fa8c]">'es'</span>],
          <br />  
          <br />  <span className="text-[#6272a4]">// Pattern for translation files</span>
          <br />  <span className="text-[#8be9fd]">translationFilePath</span>: <span className="text-[#f1fa8c]">'./src/locales/{'{'}language{'}'}.json'</span>,
          <br />  
          <br />  <span className="text-[#6272a4]">// Source code patterns to extract keys from</span>
          <br />  <span className="text-[#8be9fd]">sourcePatterns</span>: [<span className="text-[#f1fa8c]">'./src/**/*.{'{'}ts,tsx,js,jsx{'}'}'</span>],
          <br />  
          <br />  <span className="text-[#6272a4]">// Patterns to ignore when extracting keys</span>
          <br />  <span className="text-[#8be9fd]">ignorePatterns</span>: [<span className="text-[#f1fa8c]">'./src/**/*.test.{'{'}ts,tsx,js,jsx{'}'}'</span>],
          <br />  
          <br />  <span className="text-[#6272a4]">// AI translation configuration (optional)</span>
          <br />  <span className="text-[#8be9fd]">aiTranslation</span>: {'{'} 
          <br />    <span className="text-[#8be9fd]">enabled</span>: <span className="text-[#ff79c6]">true</span>,
          <br />    <span className="text-[#8be9fd]">provider</span>: <span className="text-[#f1fa8c]">'openai'</span>,
          <br />    <span className="text-[#8be9fd]">apiKey</span>: <span className="text-[#f1fa8c]">`${'{'}process.env.OPENAI_API_KEY{'}'}`</span>,
          <br />    <span className="text-[#8be9fd]">model</span>: <span className="text-[#f1fa8c]">'gpt-4o'</span>
          <br />  {'}'},
          <br />  
          <br />  <span className="text-[#6272a4]">// External sync configuration (optional)</span>
          <br />  <span className="text-[#8be9fd]">externalSync</span>: {'{'} 
          <br />    <span className="text-[#8be9fd]">source</span>: <span className="text-[#f1fa8c]">'csv'</span>,
          <br />    <span className="text-[#8be9fd]">url</span>: <span className="text-[#f1fa8c]">'https://example.com/translations.csv'</span>
          <br />  {'}'}
          <br />{'}'}; 
        </pre>
      </div>
    </div>
  );
}
