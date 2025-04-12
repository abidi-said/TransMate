import { useState, useEffect } from "react";
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
import { Loader2, Save, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GeneralSettingsProps {
  settings: any;
  languages: any[];
  projectId: number;
}

export function GeneralSettings({ settings, languages, projectId }: GeneralSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState({
    name: "",
    defaultLanguage: "",
    translationFilePath: "./src/locales/{language}.json",
    sourcePatterns: "./src/**/*.{ts,tsx,js,jsx}",
    ignorePatterns: "./src/**/*.test.{ts,tsx,js,jsx}",
  });

  // Initialize form when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormValues({
        name: settings.name || "",
        defaultLanguage: settings.defaultLanguage || (languages[0]?.code || "en"),
        translationFilePath: settings.translationFilePath || "./src/locales/{language}.json",
        sourcePatterns: Array.isArray(settings.sourcePatterns) 
          ? settings.sourcePatterns.join(", ") 
          : "./src/**/*.{ts,tsx,js,jsx}",
        ignorePatterns: Array.isArray(settings.ignorePatterns) 
          ? settings.ignorePatterns.join(", ") 
          : "./src/**/*.test.{ts,tsx,js,jsx}",
      });
    }
  }, [settings, languages]);

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
        description: "Project settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message || "An error occurred while saving project settings.",
        variant: "destructive",
      });
    }
  });

  // Handle input changes
  const handleInputChange = (name: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save settings
  const handleSaveSettings = () => {
    // Convert comma-separated strings to arrays
    const dataToSend = {
      ...formValues,
      sourcePatterns: formValues.sourcePatterns.split(",").map(p => p.trim()),
      ignorePatterns: formValues.ignorePatterns.split(",").map(p => p.trim()),
    };
    
    saveSettingsMutation.mutate(dataToSend);
  };

  // Show supported languages UI
  const renderSupportedLanguages = () => {
    return (
      <div className="flex flex-wrap gap-2 p-3 border border-slate-300 rounded-lg">
        {languages.map(language => (
          <div key={language.code} className="flex items-center bg-slate-100 rounded-md px-2 py-1">
            <span className="text-sm text-slate-700">{language.name}</span>
            <button className="ml-1 text-slate-500 hover:text-slate-700">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button className="flex items-center text-sm text-primary bg-primary-50 rounded-md px-2 py-1 hover:bg-primary-100">
          <Plus className="h-3 w-3 mr-1" />
          Add Language
        </button>
      </div>
    );
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4">
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input 
              id="name"
              value={formValues.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="My Translation Project"
            />
          </div>
          
          <div>
            <Label htmlFor="defaultLanguage">Default Language</Label>
            <Select
              value={formValues.defaultLanguage}
              onValueChange={(value) => handleInputChange("defaultLanguage", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang: any) => (
                  <SelectItem key={lang.id} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="translationFilePath">Translation File Path</Label>
            <Input 
              id="translationFilePath"
              value={formValues.translationFilePath}
              onChange={(e) => handleInputChange("translationFilePath", e.target.value)}
              placeholder="./src/locales/{language}.json"
            />
            <p className="text-xs text-slate-500 mt-1">
              Must include {"{language}"} placeholder which will be replaced with language code
            </p>
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="sourcePatterns">Source Patterns</Label>
            <Input 
              id="sourcePatterns"
              value={formValues.sourcePatterns}
              onChange={(e) => handleInputChange("sourcePatterns", e.target.value)}
              placeholder="./src/**/*.{ts,tsx,js,jsx}"
            />
            <p className="text-xs text-slate-500 mt-1">
              Comma-separated glob patterns of source files to extract translation keys from
            </p>
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="ignorePatterns">Ignore Patterns</Label>
            <Input 
              id="ignorePatterns"
              value={formValues.ignorePatterns}
              onChange={(e) => handleInputChange("ignorePatterns", e.target.value)}
              placeholder="./src/**/*.test.{ts,tsx,js,jsx}"
            />
            <p className="text-xs text-slate-500 mt-1">
              Comma-separated glob patterns of files to exclude from scanning
            </p>
          </div>
          
          <div className="md:col-span-2">
            <Label className="mb-2 block">Supported Languages</Label>
            {languages ? renderSupportedLanguages() : <Skeleton className="h-20 w-full" />}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSaveSettings}
            disabled={saveSettingsMutation.isPending}
          >
            {saveSettingsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
