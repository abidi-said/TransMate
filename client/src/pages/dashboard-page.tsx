import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TabNavigation } from "@/components/layout/tab-navigation";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { LanguageProgress } from "@/components/dashboard/language-progress";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  useEffect(() => {
    document.title = "Transmate - Dashboard";
  }, []);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const dashboardTabs = [
    { label: "Overview", path: "/dashboard" },
    { label: "Translation Editor", path: "/editor" },
    { label: "File Management", path: "/files" },
    { label: "AI Translation", path: "/ai-translation" },
    { label: "Settings", path: "/settings" },
  ];

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
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Project Dashboard</h2>
                <p className="text-slate-500">Welcome back! Here's your translation progress.</p>
              </div>
              
              {projectsLoading ? (
                <div className="flex justify-center my-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Stats & Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatsCard 
                      title="Total Keys"
                      value="1,248"
                      change="+26 from last week"
                      icon="key"
                      iconColor="primary"
                    />
                    <StatsCard 
                      title="Completion Rate"
                      value="76%"
                      change="+5% from last week"
                      icon="check_circle"
                      iconColor="success"
                      changePositive
                    />
                    <StatsCard 
                      title="Languages"
                      value="8"
                      change="All languages active"
                      icon="language"
                      iconColor="secondary"
                    />
                    <StatsCard 
                      title="AI Translations"
                      value="463"
                      change="+123 this month"
                      icon="psychology"
                      iconColor="default"
                    />
                  </div>
                  
                  {/* Recent Activity & Progress */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <ActivityFeed />
                    </div>
                    
                    <div className="lg:col-span-1">
                      <LanguageProgress />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
