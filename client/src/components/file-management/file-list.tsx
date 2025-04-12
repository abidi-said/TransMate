import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Upload, Plus, Download, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

interface FileListProps {
  files: any[];
  projectId: number;
}

export function FileList({ files, projectId }: FileListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);

  // Query to get languages
  const { data: languages } = useQuery({
    queryKey: ["/api/projects", projectId, "languages"],
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest("DELETE", `/api/projects/${projectId}/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "files"],
      });
      toast({
        title: "File deleted",
        description: "The file has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete file",
        description: error.message || "An error occurred while deleting the file.",
        variant: "destructive",
      });
    }
  });

  // Handler for file deletion confirmation
  const handleDeleteConfirm = () => {
    if (fileToDelete !== null) {
      deleteFileMutation.mutate(fileToDelete);
      setFileToDelete(null);
    }
  };

  // Helper to get language name by ID
  const getLanguageName = (languageId: number | null) => {
    if (!languageId) return "Multiple";
    const language = languages?.find((lang: any) => lang.id === languageId);
    return language ? language.name : "Unknown";
  };

  // Helper to get language ISO code by ID for flag display
  const getLanguageCode = (languageId: number | null) => {
    if (!languageId) return null;
    const language = languages?.find((lang: any) => lang.id === languageId);
    return language ? language.code : null;
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4 flex flex-row items-center justify-between">
        <CardTitle>Translation Files</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Add File
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Keys</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-slate-500">No files found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add your first file
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="material-icons text-slate-400 mr-2">description</span>
                        <span className="font-medium text-slate-700">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {file.languageId ? (
                          getLanguageCode(file.languageId) ? (
                            <img 
                              src={`https://flagcdn.com/w40/${getLanguageCode(file.languageId) === 'en' ? 'gb' : getLanguageCode(file.languageId)}.png`}
                              width="20" 
                              height="15" 
                              className="mr-2" 
                              alt={`${getLanguageName(file.languageId)} flag`} 
                            />
                          ) : (
                            <span className="material-icons text-slate-400 mr-2">language</span>
                          )
                        ) : (
                          <span className="material-icons text-slate-400 mr-2">language</span>
                        )}
                        <span className="text-slate-700">{getLanguageName(file.languageId)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="uppercase text-xs font-medium text-slate-700">
                      {file.format}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {file.keyCount || "N/A"}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {file.updatedAt 
                        ? formatDistanceToNow(new Date(file.updatedAt), { addSuffix: true })
                        : (file.lastSyncedAt
                          ? formatDistanceToNow(new Date(file.lastSyncedAt), { addSuffix: true })
                          : "Never")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon" title="Download">
                          <Download className="h-4 w-4 text-slate-500 hover:text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit">
                          <Edit className="h-4 w-4 text-slate-500 hover:text-primary" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Delete"
                              onClick={() => setFileToDelete(file.id)}
                            >
                              <Trash2 className="h-4 w-4 text-slate-500 hover:text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the file "{file.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setFileToDelete(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDeleteConfirm}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleteFileMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : null}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
