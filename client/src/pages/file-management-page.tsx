import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TabNavigation } from "@/components/layout/tab-navigation";
import { FileList } from "@/components/file-management/file-list";
import { GitSync } from "@/components/file-management/git-sync";
import { ExportOptions } from "@/components/file-management/export-options";
import { Loader2 } from "lucide-react";

export default function FileManagementPage() {
  useEffect(() => {
    document.title = "Transmate - File Management";
  }, []);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Assuming we're using the first project for now
  // In a real app, we'd have project selection functionality
  const projectId = projects && projects.length > 0 ? projects[0].id : null;

  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "files"],
    enabled: !!projectId,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "settings"],
    enabled: !!projectId,
  });

  const dashboardTabs = [
    { label: "Overview", path: "/dashboard" },
    { label: "Translation Editor", path: "/editor" },
    { label: "File Management", path: "/files" },
    { label: "AI Translation", path: "/ai-translation" },
    { label: "Settings", path: "/settings" },
  ];

  const isLoading = projectsLoading || filesLoading || settingsLoading;

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
                <h2 className="text-2xl font-bold text-slate-800 mb-1">File Management</h2>
                <p className="text-slate-500">Manage translation files and formats.</p>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center my-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Files & Formats */}
                  <div className="lg:col-span-2">
                    <FileList files={files || []} projectId={projectId || 0} />
                  </div>
                  
                  {/* File Operations */}
                  <div className="lg:col-span-1">
                    <div className="space-y-6">
                      <GitSync settings={settings} projectId={projectId || 0} />
                      <ExportOptions projectId={projectId || 0} />
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
