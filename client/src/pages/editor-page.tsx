import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TabNavigation } from "@/components/layout/tab-navigation";
import { TranslationKeyList } from "@/components/editor/translation-key-list";
import { TranslationForm } from "@/components/editor/translation-form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EditorPage() {
  const { toast } = useToast();
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en', 'fr', 'de']);
  const [searchKey, setSearchKey] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    missingTranslations: false,
    needsReview: false,
    aiTranslated: false
  });
  
  // Initialize WebSocket connection
  const { 
    connected,
    messages,
    joinProject,
    leaveProject,
    activeEditors
  } = useWebSocket();

  useEffect(() => {
    document.title = "Transmate - Translation Editor";
  }, []);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Assuming we're using the first project for now
  // In a real app, we'd have project selection functionality
  const projectId = projects && projects.length > 0 ? projects[0].id : null;
  
  // Join the project via WebSocket when a project is selected
  useEffect(() => {
    if (projectId && connected) {
      joinProject(projectId);
      
      if (connected) {
        toast({
          title: "Collaborative editing active",
          description: "You can now see other editors working on the same translations in real-time.",
        });
      }
      
      // Leave the project when unmounting
      return () => {
        leaveProject();
      };
    }
  }, [projectId, connected, joinProject, leaveProject, toast]);

  const { data: translationKeys, isLoading: keysLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "keys"],
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

  const isLoading = projectsLoading || keysLoading || languagesLoading;

  const handleKeySelect = (keyId: number) => {
    setSelectedKeyId(keyId);
  };

  const handleToggleLanguage = (code: string) => {
    setSelectedLanguages(prev => 
      prev.includes(code) 
        ? prev.filter(lang => lang !== code) 
        : [...prev, code]
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchKey(value);
  };

  const handleFilterChange = (name: keyof typeof filterOptions, value: boolean) => {
    setFilterOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <TabNavigation tabs={dashboardTabs} />
          
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row h-full">
              <TranslationKeyList 
                translationKeys={translationKeys || []}
                selectedKeyId={selectedKeyId}
                onKeySelect={handleKeySelect}
                searchValue={searchKey}
                onSearchChange={handleSearchChange}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
              />
              
              {selectedKeyId ? (
                <TranslationForm 
                  keyId={selectedKeyId}
                  languages={languages || []}
                  selectedLanguages={selectedLanguages}
                  onToggleLanguage={handleToggleLanguage}
                  projectId={projectId || 0}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-slate-50 p-8 text-center">
                  <div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Select a translation key</h3>
                    <p className="text-slate-500">Choose a key from the list to start editing translations</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
