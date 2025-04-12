import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, EyeOff, ChevronDown, BrainCircuit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

import { ActiveEditors } from "@/components/translation/active-editors";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";

interface TranslationFormProps {
  keyId: number;
  languages: any[];
  selectedLanguages: string[];
  onToggleLanguage: (code: string) => void;
  projectId: number;
}

export function TranslationForm({
  keyId,
  languages,
  selectedLanguages,
  onToggleLanguage,
  projectId
}: TranslationFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Setup WebSocket functionality
  const { editTranslation, approveTranslation, activeEditors } = useWebSocket();

  // Fetch the translation key
  const { data: translationKey, isLoading: keyLoading } = useQuery({
    queryKey: ["/api/keys", keyId],
    enabled: !!keyId,
  });

  // Fetch translations for this key
  const { data: translations, isLoading: translationsLoading } = useQuery({
    queryKey: ["/api/keys", keyId, "translations"],
    enabled: !!keyId,
  });

  // Fetch translation memory suggestions
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["/api/keys", keyId, "suggestions"],
    enabled: !!keyId,
  });

  // Update form values when translations change
  useEffect(() => {
    if (translations) {
      const newValues: Record<string, string> = {};
      
      translations.forEach((translation: any) => {
        const language = languages.find(l => l.id === translation.languageId);
        if (language) {
          newValues[language.code] = translation.value;
        }
      });
      
      setFormValues(newValues);
    }
  }, [translations, languages]);

  // Save translations mutation
  const saveTranslationMutation = useMutation({
    mutationFn: async ({ languageId, value }: { languageId: number, value: string }) => {
      const res = await apiRequest("POST", `/api/keys/${keyId}/translations`, {
        languageId,
        value
      });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/keys", keyId, "translations"]
      });
      
      toast({
        title: "Translation saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save translation",
        description: error.message || "An error occurred while saving the translation.",
        variant: "destructive",
      });
    }
  });

  // AI translation mutation
  const aiTranslateMutation = useMutation({
    mutationFn: async ({ text, targetLanguage }: { text: string, targetLanguage: string }) => {
      const res = await apiRequest("POST", "/api/translate", {
        text,
        sourceLanguage: "en", // Assuming English is the source language
        targetLanguage,
        projectId
      });
      return await res.json();
    },
    onSuccess: (data, variables) => {
      // Update form value with the translation
      setFormValues(prev => ({
        ...prev,
        [variables.targetLanguage]: data.translation
      }));
      
      toast({
        title: "AI Translation",
        description: `Translated to ${variables.targetLanguage} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "AI Translation Failed",
        description: error.message || "An error occurred during translation.",
        variant: "destructive",
      });
    }
  });

  // Handle input change and broadcast via WebSocket
  const handleInputChange = (languageCode: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [languageCode]: value
    }));
    
    // Notify other users about this edit via WebSocket
    const language = languages.find(l => l.code === languageCode);
    if (language) {
      editTranslation(keyId, language.id, value);
    }
  };

  // Handle save for a specific language
  const handleSave = (languageCode: string) => {
    const language = languages.find(l => l.code === languageCode);
    if (!language) return;
    
    saveTranslationMutation.mutate({
      languageId: language.id,
      value: formValues[languageCode] || ""
    });
  };

  // Handle AI translation for a specific language
  const handleAiTranslate = (sourceLanguageCode: string, targetLanguageCode: string) => {
    const sourceText = formValues[sourceLanguageCode];
    if (!sourceText) {
      toast({
        title: "Translation Error",
        description: "Source text is empty",
        variant: "destructive",
      });
      return;
    }
    
    aiTranslateMutation.mutate({
      text: sourceText,
      targetLanguage: targetLanguageCode
    });
  };

  // Apply suggestion to a language
  const handleApplySuggestion = (suggestion: string, languageCode: string) => {
    setFormValues(prev => ({
      ...prev,
      [languageCode]: suggestion
    }));
  };

  // Save all translations
  const handleSaveAll = () => {
    // Get the default language
    const defaultLanguage = languages.find(l => l.isDefault);
    if (!defaultLanguage) return;
    
    // Get all selected languages except the default one
    const languagesToSave = languages.filter(l => 
      selectedLanguages.includes(l.code) && l.id !== defaultLanguage.id
    );
    
    // Save each translation sequentially
    const savePromises = languagesToSave.map(language => 
      saveTranslationMutation.mutate({
        languageId: language.id,
        value: formValues[language.code] || ""
      })
    );
    
    // Show a toast when all are done
    Promise.all(savePromises).then(() => {
      toast({
        title: "All Translations Saved",
        description: "All translations have been saved successfully.",
      });
    });
  };

  const isLoading = keyLoading || translationsLoading;

  if (isLoading) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white p-4 border-b border-slate-200">
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i} className="border border-slate-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <Skeleton className="h-20 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Editor Header */}
      <div className="bg-white p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{translationKey?.key}</h2>
          <p className="text-sm text-slate-500">{translationKey?.description || `"${formValues['en']}" - Translation key`}</p>
        </div>
        <div className="flex items-center mt-3 sm:mt-0">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="mr-3">
                <EyeOff className="h-4 w-4 mr-1" />
                Languages
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select languages to edit</DropdownMenuLabel>
              {languages.map(language => (
                <DropdownMenuCheckboxItem
                  key={language.code}
                  checked={selectedLanguages.includes(language.code)}
                  onCheckedChange={() => onToggleLanguage(language.code)}
                  disabled={language.isDefault} // Default language can't be unselected
                >
                  {language.name} {language.isDefault && "(Default)"}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleSaveAll}>
            <Save className="h-4 w-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>
      
      {/* Translation Form */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="space-y-4">
          {/* Default Language (English) */}
          {languages.filter(lang => 
            lang.isDefault || selectedLanguages.includes(lang.code)
          ).map(language => {
            const isDefault = language.isDefault;
            const isAiTranslating = aiTranslateMutation.isPending && 
              aiTranslateMutation.variables?.targetLanguage === language.code;
            const isSaving = saveTranslationMutation.isPending;
            
            return (
              <Card key={language.code} className="border border-slate-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      {/* Use flag icons from flagcdn.com */}
                      <img 
                        src={`https://flagcdn.com/w40/${language.code === 'en' ? 'gb' : language.code}.png`} 
                        width="24" 
                        height="18" 
                        className="mr-2" 
                        alt={`${language.name} flag`} 
                      />
                      <h3 className="text-sm font-medium text-slate-800">
                        {language.name} {isDefault && "(Default)"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isDefault && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs" 
                          onClick={() => handleAiTranslate('en', language.code)}
                          disabled={isAiTranslating}
                        >
                          {isAiTranslating ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <BrainCircuit className="h-3 w-3 mr-1" />
                          )}
                          AI Translate
                        </Button>
                      )}
                      <div className="text-xs text-slate-500">
                        Last updated: {
                          translations?.find((t: any) => 
                            languages.find(l => l.id === t.languageId)?.code === language.code
                          )?.updatedAt 
                            ? formatDistanceToNow(new Date(translations.find((t: any) => 
                                languages.find(l => l.id === t.languageId)?.code === language.code
                              ).updatedAt), { addSuffix: true })
                            : "never"
                        }
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      className="mt-2"
                      rows={3}
                      value={formValues[language.code] || ""}
                      onChange={(e) => handleInputChange(language.code, e.target.value)}
                      disabled={isAiTranslating}
                    />
                    <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                      {/* Show active editors for this translation */}
                      <ActiveEditors 
                        keyId={keyId}
                        languageId={language.id}
                        activeEditors={activeEditors}
                        excludeUserId={user?.id}
                      />
                      
                      {!isDefault && (
                        <Button 
                          size="sm" 
                          onClick={() => handleSave(language.code)}
                          disabled={isSaving || isAiTranslating}
                        >
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Translation Memory & Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <Card className="border border-slate-200">
              <CardContent className="p-4">
                <h3 className="font-medium text-slate-800 mb-3">Translation Memory & Suggestions</h3>
                
                {/* Similar translations */}
                {suggestions.similarTranslations && suggestions.similarTranslations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Similar translations used in this project:</h4>
                    <ul className="space-y-2">
                      {suggestions.similarTranslations.map((suggestion: any, index: number) => (
                        <li key={index}>
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex justify-between">
                              <span className="text-xs font-medium text-slate-700">{suggestion.key}</span>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-xs"
                                onClick={() => {
                                  // Apply to all selected languages except default
                                  languages.filter(l => !l.isDefault && selectedLanguages.includes(l.code))
                                    .forEach(l => {
                                      const suggestionForLang = suggestion.translations[l.code];
                                      if (suggestionForLang) {
                                        handleApplySuggestion(suggestionForLang, l.code);
                                      }
                                    });
                                }}
                              >
                                Use
                              </Button>
                            </div>
                            {Object.entries(suggestion.translations).map(([langCode, text]: [string, any]) => (
                              <p key={langCode} className="text-sm mt-1">
                                {langCode === 'en' ? 'English' : langCode}: <span className="font-medium">{text}</span>
                              </p>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* AI Suggestions */}
                {suggestions.aiSuggestions && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">AI Suggestions:</h4>
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <BrainCircuit className="h-4 w-4 text-primary mr-1" />
                            <span className="text-xs font-medium text-primary-700">AI Translation</span>
                          </div>
                          <p className="text-sm mt-1">{suggestions.aiSuggestions.message}</p>
                          <ul className="mt-1 space-y-1">
                            {Object.entries(suggestions.aiSuggestions.translations).map(([langCode, text]: [string, any]) => (
                              <li key={langCode} className="text-sm">
                                {langCode === 'fr' && '🇫🇷 French: '}
                                {langCode === 'de' && '🇩🇪 German: '}
                                {langCode === 'es' && '🇪🇸 Spanish: '}
                                <span className="font-medium">{text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs text-primary whitespace-nowrap"
                          onClick={() => {
                            // Apply all suggested translations
                            Object.entries(suggestions.aiSuggestions.translations).forEach(([langCode, text]: [string, any]) => {
                              if (selectedLanguages.includes(langCode)) {
                                handleApplySuggestion(text, langCode);
                              }
                            });
                          }}
                        >
                          Apply All
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
