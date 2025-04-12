import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TabNavigation } from "@/components/layout/tab-navigation";
import { GeneralSettings } from "@/components/settings/general-settings";
import { CliConfig } from "@/components/settings/cli-config";
import { TeamManagement } from "@/components/settings/team-management";
import { ApiKeys } from "@/components/settings/api-keys";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  useEffect(() => {
    document.title = "Transmate - Settings";
  }, []);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Assuming we're using the first project for now
  // In a real app, we'd have project selection functionality
  const projectId = projects && projects.length > 0 ? projects[0].id : null;

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "settings"],
    enabled: !!projectId,
  });

  const { data: languages, isLoading: languagesLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "languages"],
    enabled: !!projectId,
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "members"],
    enabled: !!projectId,
  });

  const { data: apiKeys, isLoading: apiKeysLoading } = useQuery({
    queryKey: ["/api/api-keys"],
  });

  const dashboardTabs = [
    { label: "Overview", path: "/dashboard" },
    { label: "Translation Editor", path: "/editor" },
    { label: "File Management", path: "/files" },
    { label: "AI Translation", path: "/ai-translation" },
    { label: "Settings", path: "/settings" },
  ];

  const isLoading = projectsLoading || settingsLoading || languagesLoading || membersLoading || apiKeysLoading;

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <TabNavigation tabs={dashboardTabs} />
          
          <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
            <div className="p-4 md:p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Project Settings</h2>
                <p className="text-slate-500">Manage your translation project settings.</p>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center my-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* General Settings */}
                  <div className="lg:col-span-2">
                    <GeneralSettings 
                      settings={settings}
                      languages={languages || []}
                      projectId={projectId || 0}
                    />
                    
                    {/* CLI Configuration */}
                    <div className="mt-6">
                      <CliConfig settings={settings} />
                    </div>
                  </div>
                  
                  {/* Team & Access */}
                  <div className="lg:col-span-1">
                    <div className="space-y-6">
                      <TeamManagement 
                        members={members || []}
                        projectId={projectId || 0}
                      />
                      <ApiKeys apiKeys={apiKeys || []} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
