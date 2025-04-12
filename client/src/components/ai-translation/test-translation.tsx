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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TestTranslationProps {
  languages: any[];
  projectId: number;
}

export function TestTranslation({ languages, projectId }: TestTranslationProps) {
  const { toast } = useToast();
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("de");
  const [sourceText, setSourceText] = useState("Welcome back, {username}! You have {count} new notifications.");
  const [translationResult, setTranslationResult] = useState("");

  // AI translation mutation
  const translateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/translate", {
        text: sourceText,
        sourceLanguage,
        targetLanguage,
        projectId,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setTranslationResult(data.translation);
      toast({
        title: "Translation complete",
        description: "The text has been translated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Translation failed",
        description: error.message || "An error occurred during translation.",
        variant: "destructive",
      });
    }
  });

  // Handle translate
  const handleTranslate = () => {
    if (!sourceText.trim()) {
      toast({
        title: "Empty source text",
        description: "Please enter some text to translate.",
        variant: "destructive",
      });
      return;
    }
    
    translateMutation.mutate();
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4">
        <CardTitle>Test Translation</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
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
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="targetLanguage">Target Language</Label>
            <Select
              value={targetLanguage}
              onValueChange={setTargetLanguage}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target language" />
              </SelectTrigger>
              <SelectContent>
                {languages?.filter((lang: any) => lang.code !== sourceLanguage).map((lang: any) => (
                  <SelectItem key={lang.id} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="sourceText">Text to Translate</Label>
            <Textarea 
              id="sourceText"
              rows={3}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
            />
          </div>
          
          <Button 
            onClick={handleTranslate}
            disabled={translateMutation.isPending || !sourceText.trim()}
          >
            {translateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Languages className="h-4 w-4 mr-1" />
            )}
            Translate
          </Button>
          
          {(translationResult || translateMutation.isPending) && (
            <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Translation Result:</h4>
              {translateMutation.isPending ? (
                <Skeleton className="h-5 w-full" />
              ) : (
                <p className="text-sm text-slate-800">{translationResult}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
