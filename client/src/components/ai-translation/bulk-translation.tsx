import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, FolderSync } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BulkTranslationProps {
  languages: any[];
  projectId: number;
}

export function BulkTranslation({ languages, projectId }: BulkTranslationProps) {
  const { toast } = useToast();
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
  const [selection, setSelection] = useState("missing"); // missing, override, selected

  // Bulk translation mutation
  const bulkTranslateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/bulk-translate`, {
        sourceLanguage,
        targetLanguages,
        selection,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk translation started",
        description: `Processing ${data.totalKeys} keys for ${data.targetLanguages} languages.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk translation failed",
        description: error.message || "An error occurred during bulk translation.",
        variant: "destructive",
      });
    }
  });

  // Toggle target language selection
  const toggleTargetLanguage = (code: string) => {
    setTargetLanguages(prev => 
      prev.includes(code)
        ? prev.filter(lang => lang !== code)
        : [...prev, code]
    );
  };

  // Handle bulk translation start
  const handleStartBulkTranslation = () => {
    if (targetLanguages.length === 0) {
      toast({
        title: "No target languages selected",
        description: "Please select at least one target language.",
        variant: "destructive",
      });
      return;
    }
    
    bulkTranslateMutation.mutate();
  };

  // Get default language
  const defaultLanguage = languages?.find(lang => lang.isDefault);
  
  // Filter out the source language from potential target languages
  const availableTargetLanguages = languages?.filter(lang => 
    lang.code !== sourceLanguage
  );

  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4">
        <CardTitle>Bulk Translation</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <p className="text-sm text-slate-600 mb-4">
          Translate multiple keys at once using AI.
        </p>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="sourceLanguage">Source Language</Label>
            <Select
              value={sourceLanguage}
              onValueChange={setSourceLanguage}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source language" />
              </SelectTrigger>
              <SelectContent>
                {languages?.map((lang: any) => (
                  <SelectItem key={lang.id} value={lang.code}>
                    {lang.name} {lang.isDefault && "(Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="mb-2 block">Target Languages</Label>
            <div className="space-y-1">
              {availableTargetLanguages?.map((language: any) => (
                <div key={language.code} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`lang-${language.code}`}
                    checked={targetLanguages.includes(language.code)}
                    onCheckedChange={() => toggleTargetLanguage(language.code)}
                  />
                  <Label 
                    htmlFor={`lang-${language.code}`}
                    className="text-sm cursor-pointer"
                  >
                    {language.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="mb-2 block">Selection</Label>
            <RadioGroup value={selection} onValueChange={setSelection}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="missing" id="missing" />
                <Label htmlFor="missing" className="text-sm cursor-pointer">
                  Missing translations only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="override" id="override" />
                <Label htmlFor="override" className="text-sm cursor-pointer">
                  All translations (override)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="selected" />
                <Label htmlFor="selected" className="text-sm cursor-pointer">
                  Selected keys only
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleStartBulkTranslation}
            disabled={bulkTranslateMutation.isPending || targetLanguages.length === 0}
          >
            {bulkTranslateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <FolderSync className="h-4 w-4 mr-1" />
            )}
            Start Bulk Translation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
