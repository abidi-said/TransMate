import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary-500">
                <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.994 1.994 0 0 1-1.414-.586m0 0L11 14h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v4l.586-.586z"/>
              </svg>
              <h3 className="text-xl font-bold">Transmate</h3>
            </div>
            <p className="text-gray-400">A powerful translation management tool for modern web applications.</p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/docs"><a className="text-gray-400 hover:text-white transition">Documentation</a></Link></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">API Reference</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Examples</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Contributing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <ul className="space-y-2">
              <li><a href="https://github.com/transmate/transmate" className="text-gray-400 hover:text-white transition">GitHub</a></li>
              <li><a href="https://www.npmjs.com/package/transmate" className="text-gray-400 hover:text-white transition">NPM</a></li>
              <li><a href="https://twitter.com/transmatecli" className="text-gray-400 hover:text-white transition">Twitter</a></li>
              <li><a href="https://discord.gg/transmate" className="text-gray-400 hover:text-white transition">Discord</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© 2023 Transmate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
