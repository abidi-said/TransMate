export default function DemoTerminal() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 p-4 border-b border-gray-200">
        <h3 className="font-semibold">Translation workflow with Transmate</h3>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      <div className="bg-gray-900 text-white p-4 font-mono text-sm overflow-x-auto">
        <pre>
          <span className="text-green-400">$ transmate init</span>
          <br /><span className="text-blue-300">Creating configuration file...</span>
          <br /><span className="text-blue-300">Config file created at ./transmate.config.js</span>
          <br />
          <br /><span className="text-green-400">$ transmate extract-keys</span>
          <br /><span className="text-blue-300">Scanning source files...</span>
          <br /><span className="text-blue-300">Found 12 keys, 3 missing from translation files</span>
          <br /><span className="text-yellow-300">Missing keys:</span>
          <br /><span className="text-yellow-300">- user.profile.settings</span>
          <br /><span className="text-yellow-300">- checkout.payment.error</span>
          <br /><span className="text-yellow-300">- common.loading</span>
          <br />
          <br /><span className="text-green-400">$ transmate add-key --key="common.loading" --value="Loading..." --translate</span>
          <br /><span className="text-blue-300">Adding key 'common.loading' to translation files</span>
          <br /><span className="text-blue-300">en: "Loading..."</span>
          <br /><span className="text-blue-300">fr: "Chargement..."</span>
          <br /><span className="text-blue-300">de: "Wird geladen..."</span>
          <br /><span className="text-blue-300">es: "Cargando..."</span>
          <br /><span className="text-green-300">✓ Key added successfully to all language files</span>
          <br />
          <br /><span className="text-green-400">$ transmate translate-all</span>
          <br /><span className="text-blue-300">Translating missing keys...</span>
          <br /><span className="text-blue-300">Processing 2 missing keys across 3 languages</span>
          <br /><span className="text-blue-300">user.profile.settings:</span>
          <br /><span className="text-blue-300">  fr: "Paramètres du profil utilisateur"</span>
          <br /><span className="text-blue-300">  de: "Benutzerprofileinstellungen"</span>
          <br /><span className="text-blue-300">  es: "Configuración del perfil de usuario"</span>
          <br /><span className="text-blue-300">checkout.payment.error:</span>
          <br /><span className="text-blue-300">  fr: "Erreur lors du paiement"</span>
          <br /><span className="text-blue-300">  de: "Fehler bei der Zahlung"</span>
          <br /><span className="text-blue-300">  es: "Error en el pago"</span>
          <br /><span className="text-green-300">✓ All translations completed</span>
        </pre>
      </div>
    </div>
  );
}
