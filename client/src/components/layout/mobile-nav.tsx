import { Link, useLocation } from "wouter";
import { BarChart4, FolderClosed, Globe, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileNavItemProps = {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
};

function MobileNavItem({ icon, label, href, active }: MobileNavItemProps) {
  return (
    <Link href={href}>
      <a className={cn(
        "flex flex-col items-center justify-center", 
        active ? "text-primary" : "text-slate-500"
      )}>
        {icon}
        <span className="text-xs mt-1">{label}</span>
      </a>
    </Link>
  );
}

export function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="md:hidden bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex items-center justify-around h-16">
        <MobileNavItem 
          icon={<LayoutDashboard className="h-5 w-5" />} 
          label="Dashboard" 
          href="/dashboard" 
          active={isActive("/dashboard") || isActive("/")}
        />
        <MobileNavItem 
          icon={<Globe className="h-5 w-5" />} 
          label="Translate" 
          href="/editor"
          active={isActive("/editor")}
        />
        <MobileNavItem 
          icon={<FolderClosed className="h-5 w-5" />} 
          label="Files" 
          href="/files"
          active={isActive("/files")}
        />
        <MobileNavItem 
          icon={<Settings className="h-5 w-5" />} 
          label="Settings" 
          href="/settings"
          active={isActive("/settings")}
        />
      </div>
    </nav>
  );
}

function LayoutDashboard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
