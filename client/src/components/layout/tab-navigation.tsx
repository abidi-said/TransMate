import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type TabProps = {
  label: string;
  href: string;
  active?: boolean;
};

function Tab({ label, href, active }: TabProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2",
          active 
            ? "text-primary border-primary" 
            : "text-slate-600 border-transparent hover:text-slate-700 hover:border-slate-300"
        )}
      >
        {label}
      </a>
    </Link>
  );
}

type TabNavigationProps = {
  baseUrl?: string;
  tabs: {
    label: string;
    path: string;
  }[];
};

export function TabNavigation({ baseUrl = "", tabs }: TabNavigationProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm px-4 md:px-6">
      <div className="flex items-center space-x-1 overflow-x-auto">
        {tabs.map((tab) => (
          <Tab
            key={tab.path}
            label={tab.label}
            href={`${baseUrl}${tab.path}`}
            active={isActive(`${baseUrl}${tab.path}`)}
          />
        ))}
      </div>
    </div>
  );
}
