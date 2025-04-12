import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GitSyncProps {
  settings: any;
  projectId: number;
}

export function GitSync({ settings, projectId }: GitSyncProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [gitForm, setGitForm] = useState({
    gitRepository: settings?.gitRepository || "",
    gitBranch: settings?.gitBranch || "main",
    filesPath: settings?.filesPath || "src/locales/",
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/settings`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "settings"],
      });
      toast({
        title: "Settings saved",
        description: "Git repository settings have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message || "An error occurred while saving settings.",
        variant: "destructive",
      });
    }
  });

  // Sync with Git mutation
  const syncGitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/sync-git`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "files"],
      });
      toast({
        title: "Git sync completed",
        description: `Successfully synced ${data.added || 0} new files and updated ${data.updated || 0} files.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Git sync failed",
        description: error.message || "An error occurred during Git synchronization.",
        variant: "destructive",
      });
    }
  });

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGitForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save settings
  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      gitRepository: gitForm.gitRepository,
      gitBranch: gitForm.gitBranch,
      filesPath: gitForm.filesPath,
    });
  };

  // Sync with Git
  const handleSync = () => {
    syncGitMutation.mutate();
  };

  // Determine if settings have changed
  const hasChanges = 
    gitForm.gitRepository !== settings?.gitRepository ||
    gitForm.gitBranch !== settings?.gitBranch ||
    gitForm.filesPath !== settings?.filesPath;

  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4">
        <CardTitle>Git Repository Sync</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <p className="text-sm text-slate-600 mb-4">
          Synchronize your translation files with a Git repository to keep everything in sync.
        </p>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="gitRepository">Repository URL</Label>
            <Input
              id="gitRepository"
              name="gitRepository"
              placeholder="https://github.com/username/repo.git"
              value={gitForm.gitRepository}
              onChange={handleInputChange}
            />
          </div>
          
          <div>
            <Label htmlFor="gitBranch">Branch</Label>
            <Input
              id="gitBranch"
              name="gitBranch"
              placeholder="main"
              value={gitForm.gitBranch}
              onChange={handleInputChange}
            />
          </div>
          
          <div>
            <Label htmlFor="filesPath">Files Path</Label>
            <Input
              id="filesPath"
              name="filesPath"
              placeholder="src/locales/"
              value={gitForm.filesPath}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="flex items-center text-xs text-success">
              <Check className="h-3 w-3 mr-1" />
              Last synced: {settings?.lastSyncedAt 
                ? new Date(settings.lastSyncedAt).toLocaleString() 
                : "Never"}
            </span>
            
            <div className="space-x-2">
              {hasChanges && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSaveSettings}
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Save
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSync}
                disabled={syncGitMutation.isPending || !settings?.gitRepository}
              >
                {syncGitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Sync Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
