import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, Info, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AiSettingsProps {
  settings: any;
  projectId: number;
}

export function AiSettings({ settings, projectId }: AiSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState({
    aiProvider: "openai",
    aiModel: "gpt-4o",
    aiApiKey: "",
    temperature: 0.3,
    aiInstructions: "",
    aiTranslationEnabled: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);

  // Initialize form with settings data when available
  useEffect(() => {
    if (settings) {
      setFormValues({
        aiProvider: settings.aiProvider || "openai",
        aiModel: settings.aiModel || "gpt-4o",
        aiApiKey: settings.aiApiKey ? "••••••••••••••••••••••••••••" : "",
        temperature: settings.temperature || 0.3,
        aiInstructions: settings.aiInstructions || "Translate the following text while preserving any placeholders, variables or formatting.",
        aiTranslationEnabled: settings.aiTranslationEnabled !== false, // Default to true if not set
      });
    }
  }, [settings]);

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
        description: "AI translation settings have been updated.",
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

  // Handle input changes
  const handleInputChange = (name: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle saving settings
  const handleSaveSettings = () => {
    // Don't send masked API key unless it was changed
    const dataToSend = {
      ...formValues,
      aiApiKey: formValues.aiApiKey.includes("•") ? undefined : formValues.aiApiKey,
    };
    
    saveSettingsMutation.mutate(dataToSend);
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4 flex flex-row items-center justify-between">
        <CardTitle>AI Translation Settings</CardTitle>
        <Badge variant={formValues.aiTranslationEnabled ? "success" : "outline"}>
          {formValues.aiTranslationEnabled ? "Active" : "Disabled"}
        </Badge>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="aiProvider">AI Provider</Label>
            <Select
              value={formValues.aiProvider}
              onValueChange={(value) => handleInputChange("aiProvider", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="google">Google Cloud Translation</SelectItem>
                <SelectItem value="azure">Azure AI Translator</SelectItem>
                <SelectItem value="amazon">Amazon Translate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="aiModel">Model</Label>
            <Select
              value={formValues.aiModel}
              onValueChange={(value) => handleInputChange("aiModel", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="aiApiKey">API Key</Label>
            <div className="relative">
              <Input 
                id="aiApiKey"
                type={showApiKey ? "text" : "password"}
                value={formValues.aiApiKey}
                onChange={(e) => handleInputChange("aiApiKey", e.target.value)}
                placeholder="Enter your API key"
              />
              <Button 
                variant="ghost" 
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowApiKey(!showApiKey)}
                type="button"
              >
                <span className="material-icons text-slate-400 hover:text-slate-600 text-sm">
                  {showApiKey ? "visibility_off" : "visibility"}
                </span>
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Use environment variable OPENAI_API_KEY for better security
            </p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="temperature">Temperature: {formValues.temperature}</Label>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={1}
              step={0.1}
              value={[formValues.temperature]}
              onValueChange={(value) => handleInputChange("temperature", value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>More Accurate (0.0)</span>
              <span>More Creative (1.0)</span>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="aiInstructions">Translation Instructions</Label>
            <Textarea 
              id="aiInstructions"
              rows={3}
              value={formValues.aiInstructions}
              onChange={(e) => handleInputChange("aiInstructions", e.target.value)}
              placeholder="Instructions for the AI when translating text"
            />
          </div>
          
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="aiTranslationEnabled"
                checked={formValues.aiTranslationEnabled}
                onCheckedChange={(checked) => handleInputChange("aiTranslationEnabled", checked)}
              />
              <Label htmlFor="aiTranslationEnabled">Enable AI translation</Label>
            </div>
          </div>
        </div>
        
        <div className="mt-6 space-y-3">
          <div className="bg-primary-50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Info className="h-4 w-4 text-primary mr-1" />
              <h4 className="text-sm font-medium text-primary-800">AI Translation Tips</h4>
            </div>
            <ul className="text-xs text-primary-700 space-y-1">
              <li className="flex items-start">
                <Check className="h-3 w-3 mt-0.5 mr-1" />
                <span>Use temperature settings below 0.5 for more consistent translations</span>
              </li>
              <li className="flex items-start">
                <Check className="h-3 w-3 mt-0.5 mr-1" />
                <span>Provide context in translation instructions for better results</span>
              </li>
              <li className="flex items-start">
                <Check className="h-3 w-3 mt-0.5 mr-1" />
                <span>Always review AI translations before publishing</span>
              </li>
            </ul>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleSaveSettings}
            disabled={saveSettingsMutation.isPending}
          >
            {saveSettingsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
