import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchIcon, SaveIcon, RefreshCw, PlusCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

type Translation = {
  key: string;
  values: Record<string, string>;
  isNew?: boolean;
  isModified?: boolean;
  usageCount?: number; // Added usageCount
};

type TranslationFile = {
  language: string;
  path: string;
  translations: Record<string, any>;
};

export default function TranslationEditor() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [filteredTranslations, setFilteredTranslations] = useState<Translation[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKeyDialog, setNewKeyDialog] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});

  // Get suggestions for a translation
  const getSuggestions = useMutation({
    mutationFn: async (data: { key: string, value: string, targetLang: string }) => {
      const response = await apiRequest('/api/suggestions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: (data, variables) => {
      setSuggestions(prev => ({
        ...prev,
        [variables.key]: data.suggestions
      }));
    }
  });

  // Define types for API responses
  interface ConfigResponse {
    defaultLanguage: string;
    languages: string[];
    translationFilePath: string;
    sourcePatterns: string[];
    ignorePatterns: string[];
    aiTranslation?: {
      enabled: boolean;
      provider: string;
      apiKey?: string;
      model: string;
    };
  }

  interface TranslationsResponse {
    files: TranslationFile[];
    defaultLanguage: string;
  }

  // Fetch available languages and translation files
  const { data: configData, isLoading: isLoadingConfig } = useQuery<ConfigResponse>({
    queryKey: ['/api/config'],
  });

  // Fetch translations data
  const { data: translationsData, isLoading, refetch } = useQuery<TranslationsResponse>({
    queryKey: ['/api/translations'],
  });

  // Save translations mutation
  const saveTranslations = useMutation({
    mutationFn: (data: { translations: Translation[] }) => {
      return apiRequest('/api/translations', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Translations saved successfully",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to save translations: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Translate missing keys mutation
  const translateMissingKeys = useMutation({
    mutationFn: (data: { language?: string, force?: boolean }) => {
      setIsTranslating(true);
      setTranslationProgress(0);

      return apiRequest('/api/execute-command', {
        method: 'POST',
        body: JSON.stringify({
          command: 'translate-all',
          options: {
            language: data.language,
            force: data.force,
            dryRun: false,
            interactive: false
          }
        }),
      });
    },
    onSuccess: () => {
      setIsTranslating(false);
      toast({
        title: "Success",
        description: "Translations completed successfully",
      });
      refetch();
    },
    onError: (error: any) => {
      setIsTranslating(false);
      toast({
        title: "Error",
        description: `Failed to translate: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add new key mutation
  const addNewKey = useMutation({
    mutationFn: (data: { key: string, value: string, translate: boolean }) => {
      return apiRequest('/api/execute-command', {
        method: 'POST',
        body: JSON.stringify({
          command: 'add-key',
          options: {
            key: data.key,
            value: data.value,
            translate: data.translate,
            dryRun: false
          }
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New translation key added successfully",
      });
      setNewKeyDialog(false);
      setNewKey("");
      setNewKeyValue("");
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add key: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Process translations data when it changes
  useEffect(() => {
    if (translationsData && Array.isArray(translationsData.files)) {
      const translationFiles: TranslationFile[] = translationsData.files;
      const defaultLanguage = translationsData.defaultLanguage || "en";

      // Find all unique keys across all translation files
      const allKeys = new Set<string>();
      translationFiles.forEach(file => {
        const flattenedKeys = flattenTranslationKeys(file.translations);
        Object.keys(flattenedKeys).forEach(key => allKeys.add(key));
      });

      // Create a normalized structure with all keys and their values across languages
      const normalizedTranslations: Translation[] = Array.from(allKeys).map(key => {
        const values: Record<string, string> = {};

        translationFiles.forEach(file => {
          const flattenedTranslations = flattenTranslationKeys(file.translations);
          values[file.language] = flattenedTranslations[key] || "";
        });

        return { key, values, usageCount: 0 }; // Added usageCount
      });

      setTranslations(normalizedTranslations);

      // Set default selected language if not already set
      if (!selectedLanguage && translationFiles.length > 0) {
        setSelectedLanguage(defaultLanguage);
      }
    }
  }, [translationsData]);

  // Filter translations based on search query and active tab
  useEffect(() => {
    if (!translations.length) return;

    let filtered = [...translations];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.key.toLowerCase().includes(query) ||
        Object.values(t.values).some(v =>
          typeof v === 'string' && v.toLowerCase().includes(query)
        )
      );
    }

    // Apply tab filter
    if (activeTab === 'missing' && selectedLanguage) {
      filtered = filtered.filter(t => !t.values[selectedLanguage]);
    } else if (activeTab === 'modified') {
      filtered = filtered.filter(t => t.isModified);
    } else if (activeTab === 'usage') {
      filtered = filtered.filter(t => t.usageCount > 0);
    }

    // Sort alphabetically by key
    filtered.sort((a, b) => a.key.localeCompare(b.key));

    setFilteredTranslations(filtered);
  }, [translations, searchQuery, activeTab, selectedLanguage]);

  // Update a translation value
  const updateTranslationValue = (key: string, language: string, value: string) => {
    const updatedTranslations = translations.map(t => {
      if (t.key === key) {
        return {
          ...t,
          values: {
            ...t.values,
            [language]: value
          },
          isModified: true
        };
      }
      return t;
    });

    setTranslations(updatedTranslations);
  };

  // Handle saving all translations
  const handleSaveTranslations = () => {
    const modifiedTranslations = translations.filter(t => t.isModified || t.isNew);

    if (modifiedTranslations.length === 0) {
      toast({
        title: "Info",
        description: "No changes to save",
      });
      return;
    }

    saveTranslations.mutate({ translations: modifiedTranslations });
  };

  // Handle adding a new key
  const handleAddNewKey = () => {
    if (!newKey) {
      toast({
        title: "Error",
        description: "Please enter a key name",
        variant: "destructive",
      });
      return;
    }

    addNewKey.mutate({
      key: newKey,
      value: newKeyValue,
      translate: true
    });
  };

  // Utility function to flatten nested translation objects
  const flattenTranslationKeys = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
    return Object.keys(obj).reduce((acc: Record<string, string>, k) => {
      const pre = prefix.length ? `${prefix}.${k}` : k;
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenTranslationKeys(obj[k], pre));
      } else {
        acc[pre] = obj[k]?.toString() || '';
      }
      return acc;
    }, {});
  };

  // Loading state
  if (isLoading || isLoadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin h-10 w-10 text-primary" />
          <p className="text-lg">Loading translation data...</p>
        </div>
      </div>
    );
  }

  const languages = configData?.languages || [];
  const defaultLanguage = configData?.defaultLanguage || "en";
  const missingTranslationsCount = selectedLanguage ?
    translations.filter(t => !t.values[selectedLanguage]).length : 0;
  const modifiedTranslationsCount = translations.filter(t => t.isModified).length;

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Translation Editor</h1>
          <p className="text-muted-foreground">
            Manage and edit translations for your application.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search translations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang: string) => (
                  <SelectItem key={lang} value={lang}>
                    {lang} {lang === defaultLanguage && "(Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={newKeyDialog} onOpenChange={setNewKeyDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Translation Key</DialogTitle>
                  <DialogDescription>
                    Add a new translation key and its default value.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="new-key">Key Name</label>
                    <Input
                      id="new-key"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="e.g., common.buttons.submit"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="new-value">
                      Default Value ({defaultLanguage})
                    </label>
                    <Input
                      id="new-value"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      placeholder="e.g., Submit"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewKeyDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddNewKey} disabled={addNewKey.isPending}>
                    {addNewKey.isPending ? "Adding..." : "Add Key"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              className="gap-2"
              onClick={handleSaveTranslations}
              disabled={saveTranslations.isPending || translations.filter(t => t.isModified).length === 0}
            >
              <SaveIcon className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Translation Keys</CardTitle>
                <CardDescription>
                  {filteredTranslations.length} of {translations.length} keys shown
                </CardDescription>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  disabled={isTranslating}
                  onClick={() => translateMissingKeys.mutate({ language: selectedLanguage })}
                >
                  <RefreshCw className={`h-4 w-4 ${isTranslating ? 'animate-spin' : ''}`} />
                  Translate Missing Keys
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    apiRequest('/api/execute-command', {
                      method: 'POST',
                      body: JSON.stringify({
                        command: 'cleanup',
                        options: { dryRun: false }
                      })
                    }).then(() => refetch());
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Clean Unused Keys
                </Button>
              </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-0">
            {isTranslating && (
              <div className="mb-4">
                <p className="text-sm mb-2">Translation in progress...</p>
                <Progress value={translationProgress} className="h-2" />
              </div>
            )}

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Keys</TabsTrigger>
                <TabsTrigger value="missing">
                  Missing Translations
                  {missingTranslationsCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {missingTranslationsCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="usage">
                  Usage Stats
                  <Badge variant="secondary" className="ml-2">
                    {translations.filter(t => t.usageCount > 0).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="modified">
                  Modified
                  {modifiedTranslationsCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {modifiedTranslationsCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="m-0">
                <TranslationTable
                  translations={filteredTranslations}
                  languages={languages}
                  defaultLanguage={defaultLanguage}
                  selectedLanguage={selectedLanguage}
                  editingKey={editingKey}
                  setEditingKey={setEditingKey}
                  updateTranslationValue={updateTranslationValue}
                />
              </TabsContent>

              <TabsContent value="missing" className="m-0">
                <TranslationTable
                  translations={filteredTranslations}
                  languages={languages}
                  defaultLanguage={defaultLanguage}
                  selectedLanguage={selectedLanguage}
                  editingKey={editingKey}
                  setEditingKey={setEditingKey}
                  updateTranslationValue={updateTranslationValue}
                />
              </TabsContent>

              <TabsContent value="usage" className="m-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Usage Statistics</h3>
                      <p className="text-sm text-muted-foreground">
                        Showing usage data for all translation keys
                      </p>
                    </div>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang} {lang === defaultLanguage && "(Default)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Key</TableHead>
                        <TableHead>Usage Count</TableHead>
                        <TableHead>First Used</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTranslations.map((item) => (
                        <TableRow key={item.key}>
                          <TableCell className="font-mono text-xs">{item.key}</TableCell>
                          <TableCell>{item.usageCount || 0}</TableCell>
                          <TableCell>
                            {item.firstUsed ? new Date(item.firstUsed).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            {item.lastUsed ? new Date(item.lastUsed).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            {item.usageCount > 0 ? (
                              <Badge>Active</Badge>
                            ) : (
                              <Badge variant="secondary">Unused</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="modified" className="m-0">
                <TranslationTable
                  translations={filteredTranslations}
                  languages={languages}
                  defaultLanguage={defaultLanguage}
                  selectedLanguage={selectedLanguage}
                  editingKey={editingKey}
                  setEditingKey={setEditingKey}
                  updateTranslationValue={updateTranslationValue}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TranslationTable({
  translations,
  languages,
  defaultLanguage,
  selectedLanguage,
  editingKey,
  setEditingKey,
  updateTranslationValue
}: {
  translations: Translation[];
  languages: string[];
  defaultLanguage: string;
  selectedLanguage: string;
  editingKey: string | null;
  setEditingKey: (key: string | null) => void;
  updateTranslationValue: (key: string, language: string, value: string) => void;
}) {
  if (translations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No translations found.</p>
      </div>
    );
  }

  // Only show selected language plus default language
  const displayLanguages = selectedLanguage
    ? Array.from(new Set([defaultLanguage, selectedLanguage]))
    : languages;

  return (
    <div className="border rounded-md">
      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Key</TableHead>
              {displayLanguages.map((lang: string) => (
                <TableHead key={lang}>
                  {lang} {lang === defaultLanguage && "(Default)"}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {translations.map((item) => (
              <TableRow key={item.key} className={item.isModified ? "bg-muted/50" : undefined}>
                <TableCell className="font-mono text-xs break-all align-top py-3">
                  {item.key}
                  {item.isModified && (
                    <Badge variant="outline" className="ml-2">
                      Modified
                    </Badge>
                  )}
                </TableCell>

                {displayLanguages.map((lang: string) => (
                  <TableCell key={lang} className="align-top py-3">
                    {editingKey === `${item.key}-${lang}` ? (
                      <div className="flex flex-col gap-2">
                        <Input
                          value={item.values[lang] || ""}
                          onChange={(e) => updateTranslationValue(item.key, lang, e.target.value)}
                          autoFocus
                          onBlur={() => setEditingKey(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setEditingKey(null);
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingKey(null)}
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`min-h-[24px] p-2 rounded hover:bg-muted cursor-pointer ${!item.values[lang] ? 'text-muted-foreground italic' : ''}`}
                        onClick={() => setEditingKey(`${item.key}-${lang}`)}
                      >
                        {item.values[lang] || "Not translated"}
                      </div>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}