import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Check, Filter, Plus, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface TranslationKeyListProps {
  translationKeys: any[];
  selectedKeyId: number | null;
  onKeySelect: (id: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterOptions: {
    missingTranslations: boolean;
    needsReview: boolean;
    aiTranslated: boolean;
  };
  onFilterChange: (name: string, value: boolean) => void;
}

export function TranslationKeyList({
  translationKeys,
  selectedKeyId,
  onKeySelect,
  searchValue,
  onSearchChange,
  filterOptions,
  onFilterChange
}: TranslationKeyListProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filteredKeys, setFilteredKeys] = useState(translationKeys);

  // Apply filters and search when dependencies change
  useEffect(() => {
    let result = [...translationKeys];
    
    // Apply search filter
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      result = result.filter(key => 
        key.key.toLowerCase().includes(searchLower) || 
        (key.description && key.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply other filters (in a real app, these would be implemented with backend filtering)
    if (filterOptions.missingTranslations) {
      result = result.filter(key => key.completion < 100);
    }
    
    if (filterOptions.needsReview) {
      result = result.filter(key => key.needsReview);
    }
    
    if (filterOptions.aiTranslated) {
      result = result.filter(key => key.aiGenerated);
    }
    
    setFilteredKeys(result);
  }, [translationKeys, searchValue, filterOptions]);

  // Helper to get completion status UI
  const getCompletionStatus = (key: any) => {
    const completion = key.completion || 0;
    
    if (completion === 100) {
      return (
        <span className="flex items-center text-xs text-success whitespace-nowrap">
          <Check className="h-3 w-3 mr-1" />
          <span>{key.translatedCount || 8}/{key.totalLanguages || 8}</span>
        </span>
      );
    } else if (completion >= 50) {
      return (
        <span className="flex items-center text-xs text-amber-500 whitespace-nowrap">
          <span className="material-icons text-xs">info</span>
          <span className="ml-1">{key.translatedCount || 6}/{key.totalLanguages || 8}</span>
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-xs text-destructive whitespace-nowrap">
          <span className="material-icons text-xs">error</span>
          <span className="ml-1">{key.translatedCount || 5}/{key.totalLanguages || 8}</span>
        </span>
      );
    }
  };

  // Helper to get category badge
  const getCategoryBadge = (category: string) => {
    switch (category.toLowerCase()) {
      case 'common':
        return <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">{category}</Badge>;
      case 'auth':
        return <Badge className="bg-secondary-100 text-secondary-800 hover:bg-secondary-100">{category}</Badge>;
      case 'errors':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">{category}</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  return (
    <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white overflow-hidden flex flex-col">
      {/* Search & Filter */}
      <div className="p-4 border-b border-slate-200">
        <div className="relative mb-2">
          <Input 
            type="text" 
            className="pl-10"
            placeholder="Search translation keys..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-700 px-2 py-1 h-auto">
                <Filter className="h-4 w-4 text-slate-500 mr-1" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="missing" 
                      checked={filterOptions.missingTranslations}
                      onCheckedChange={(checked) => 
                        onFilterChange('missingTranslations', !!checked)
                      }
                    />
                    <Label htmlFor="missing">Missing translations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="review" 
                      checked={filterOptions.needsReview}
                      onCheckedChange={(checked) => 
                        onFilterChange('needsReview', !!checked)
                      }
                    />
                    <Label htmlFor="review">Needs review</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="ai" 
                      checked={filterOptions.aiTranslated}
                      onCheckedChange={(checked) => 
                        onFilterChange('aiTranslated', !!checked)
                      }
                    />
                    <Label htmlFor="ai">AI translated</Label>
                  </div>
                </div>
                <Button 
                  className="w-full mt-3" 
                  size="sm"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90 px-2 py-1 h-auto">
            <Plus className="h-4 w-4 mr-1" /> New Key
          </Button>
        </div>
      </div>
      
      {/* Keys List */}
      <div className="flex-1 overflow-y-auto">
        {filteredKeys.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">No keys found matching your criteria</p>
          </div>
        ) : (
          <ul>
            {filteredKeys.map((key) => (
              <li 
                key={key.id}
                className={cn(
                  "translation-key-item p-3 border-b border-slate-200 cursor-pointer",
                  selectedKeyId === key.id && "selected bg-primary-50 border-l-3 border-l-primary"
                )}
                onClick={() => onKeySelect(key.id)}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-medium text-slate-800">{key.key}</h4>
                  {key.category && getCategoryBadge(key.category)}
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">{key.description || `"${key.defaultValue}" - Translation key`}</p>
                <div className="flex items-center mt-2 space-x-1">
                  {getCompletionStatus(key)}
                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-slate-500">
                    Last updated: {key.updatedAt 
                      ? formatDistanceToNow(new Date(key.updatedAt), { addSuffix: true }) 
                      : "recently"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
