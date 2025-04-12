import { Link, useLocation } from "wouter";
import { 
  BarChart4, 
  FolderClosed, 
  Globe, 
  HelpCircle, 
  LayoutDashboard, 
  Settings, 
  Users 
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
};

function SidebarItem({ icon, label, href, active }: SidebarItemProps) {
  return (
    <li className="px-2">
      <Link href={href}>
        <a 
          className={cn(
            "relative flex items-center justify-center lg:justify-start py-2 px-2 rounded-lg group",
            active 
              ? "bg-primary-50 text-primary" 
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {icon}
          <span className="ml-3 text-sm font-medium hidden lg:block">{label}</span>
          <span className="sidebar-menu-tooltip invisible opacity-0 absolute left-14 bg-slate-800 text-white text-xs p-2 rounded transition-opacity duration-200 lg:hidden">
            {label}
          </span>
        </a>
      </Link>
    </li>
  );
}

export function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <aside className="hidden md:flex flex-col w-16 lg:w-64 bg-white border-r border-slate-200 shadow-sm">
      <div className="flex flex-col h-full">
        {/* Main Navigation */}
        <nav className="py-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            <SidebarItem 
              icon={<LayoutDashboard className="h-5 w-5" />} 
              label="Dashboard" 
              href="/dashboard" 
              active={isActive("/dashboard") || isActive("/")}
            />
            <SidebarItem 
              icon={<FolderClosed className="h-5 w-5" />} 
              label="Projects" 
              href="/projects"
              active={isActive("/projects")}
            />
            <SidebarItem 
              icon={<Globe className="h-5 w-5" />} 
              label="Translations" 
              href="/editor"
              active={isActive("/editor")}
            />
            <SidebarItem 
              icon={<Users className="h-5 w-5" />} 
              label="Team" 
              href="/team"
              active={isActive("/team")}
            />
            <SidebarItem 
              icon={<BarChart4 className="h-5 w-5" />} 
              label="Analytics" 
              href="/analytics"
              active={isActive("/analytics")}
            />
            <SidebarItem 
              icon={<Settings className="h-5 w-5" />} 
              label="Settings" 
              href="/settings"
              active={isActive("/settings")}
            />
          </ul>
        </nav>
        
        {/* Help and Support (Bottom) */}
        <div className="p-2 mt-auto">
          <div className="lg:p-4 lg:bg-slate-50 lg:rounded-lg hidden lg:block mb-2">
            <h4 className="text-sm font-medium mb-2">Need help?</h4>
            <p className="text-xs text-slate-500 mb-3">Check our documentation or contact support for assistance.</p>
            <Link href="/docs">
              <a className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/90">
                View Documentation
                <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </Link>
          </div>
          
          <SidebarItem 
            icon={<HelpCircle className="h-5 w-5" />} 
            label="Help & Support" 
            href="/help"
            active={isActive("/help")}
          />
        </div>
      </div>
    </aside>
  );
}
