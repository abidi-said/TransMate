import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TabNavigation } from "@/components/layout/tab-navigation";
import { AiSettings } from "@/components/ai-translation/ai-settings";
import { TestTranslation } from "@/components/ai-translation/test-translation";
import { UsageStats } from "@/components/ai-translation/usage-stats";
import { BulkTranslation } from "@/components/ai-translation/bulk-translation";
import { Loader2 } from "lucide-react";

export default function AiTranslationPage() {
  useEffect(() => {
    document.title = "Transmate - AI Translation";
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

  const dashboardTabs = [
    { label: "Overview", path: "/dashboard" },
    { label: "Translation Editor", path: "/editor" },
    { label: "File Management", path: "/files" },
    { label: "AI Translation", path: "/ai-translation" },
    { label: "Settings", path: "/settings" },
  ];

  const isLoading = projectsLoading || settingsLoading || languagesLoading;

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
                <h2 className="text-2xl font-bold text-slate-800 mb-1">AI Translation</h2>
                <p className="text-slate-500">Automate translations with machine learning.</p>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center my-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* AI Translation Settings */}
                  <div className="lg:col-span-2">
                    <AiSettings 
                      settings={settings}
                      projectId={projectId || 0}
                    />
                    
                    {/* Test Translation */}
                    <div className="mt-6">
                      <TestTranslation 
                        languages={languages || []}
                        projectId={projectId || 0}
                      />
                    </div>
                  </div>
                  
                  {/* AI Usage & Stats */}
                  <div className="lg:col-span-1">
                    <div className="space-y-6">
                      <UsageStats projectId={projectId || 0} />
                      <BulkTranslation 
                        languages={languages || []}
                        projectId={projectId || 0}
                      />
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
