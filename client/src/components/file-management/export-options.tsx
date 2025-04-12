import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ExportOptionsProps {
  projectId: number;
}

export function ExportOptions({ projectId }: ExportOptionsProps) {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState("json");
  const [exportLanguages, setExportLanguages] = useState("all");

  // Fetch languages
  const { data: languages } = useQuery({
    queryKey: ["/api/projects", projectId, "languages"],
    enabled: !!projectId,
  });

  // Export translations mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/export`, {
        format: exportFormat,
        languages: exportLanguages === "all" ? "all" : exportLanguages,
      });
      
      return response;
    },
    onSuccess: async (response) => {
      // In a real implementation, this would handle file download
      // For now, we'll just show a success message
      toast({
        title: "Export successful",
        description: "Your translations have been exported successfully.",
      });
      
      // In a real implementation with actual file downloads:
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `translations.${exportFormat}`;
      // document.body.appendChild(a);
      // a.click();
      // a.remove();
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "An error occurred while exporting translations.",
        variant: "destructive",
      });
    }
  });

  // Handle export
  const handleExport = () => {
    exportMutation.mutate();
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4">
        <CardTitle>Export Options</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <p className="text-sm text-slate-600 mb-4">
          Export your translations in different formats for use in other systems.
        </p>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="format">Format</Label>
            <Select
              value={exportFormat}
              onValueChange={setExportFormat}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">XLSX</SelectItem>
                <SelectItem value="yaml">YAML</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="languages">Languages</Label>
            <Select
              value={exportLanguages}
              onValueChange={setExportLanguages}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages?.map((lang: any) => (
                  <SelectItem key={lang.id} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Export Translations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
