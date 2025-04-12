import { Link, useLocation } from "wouter";

export default function Header() {
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary-600">
            <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.994 1.994 0 0 1-1.414-.586m0 0L11 14h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v4l.586-.586z"/>
          </svg>
          <Link href="/">
            <a className="text-2xl font-bold text-primary-600">Transmate</a>
          </Link>
        </div>
        <nav className="flex items-center space-x-6">
          <Link href="/" className={`text-sm font-medium ${location === '/' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>
            Home
          </Link>
          <Link href="/docs" className={`text-sm font-medium ${location === '/docs' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>
            Documentation
          </Link>
          <Link href="/translations" className={`text-sm font-medium ${location === '/translations' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>
            Translation Editor
          </Link>
          <a 
            href="https://github.com/transmate/transmate" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            GitHub
          </a>
          <div>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">v1.0.0</span>
          </div>
        </nav>
      </div>
    </header>
  );
}