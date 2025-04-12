import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Eye, EyeOff, Copy, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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

interface ApiKeysProps {
  apiKeys: any[];
}

export function ApiKeys({ apiKeys }: ApiKeysProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});
  const [keyToDelete, setKeyToDelete] = useState<number | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/api-keys", { name });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/api-keys"],
      });
      setKeyName("");
      setNewKey(data.key);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create API key",
        description: error.message || "An error occurred while creating the API key.",
        variant: "destructive",
      });
    }
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      await apiRequest("DELETE", `/api/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/api-keys"],
      });
      setKeyToDelete(null);
      toast({
        title: "API key deleted",
        description: "The API key has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete API key",
        description: error.message || "An error occurred while deleting the API key.",
        variant: "destructive",
      });
    }
  });

  // Handle create key
  const handleCreateKey = () => {
    if (!keyName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the API key.",
        variant: "destructive",
      });
      return;
    }
    
    createKeyMutation.mutate(keyName);
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewKey(null);
  };

  // Toggle key visibility
  const toggleKeyVisibility = (keyId: number) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  // Copy key to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied to clipboard",
          description: "API key copied to clipboard.",
        });
      },
      () => {
        toast({
          title: "Failed to copy",
          description: "Could not copy API key to clipboard.",
          variant: "destructive",
        });
      }
    );
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (keyToDelete !== null) {
      deleteKeyMutation.mutate(keyToDelete);
    }
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4">
        <CardTitle>API Access</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <p className="text-sm text-slate-600 mb-4">
          Create and manage API keys for programmatic access.
        </p>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Your API Keys</h4>
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No API keys yet</p>
                <p className="text-xs mt-1">Create an API key to access the Transmate API</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {apiKeys.map((key) => (
                  <li key={key.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{key.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Created: {key.createdAt 
                            ? formatDistanceToNow(new Date(key.createdAt), { addSuffix: true }) 
                            : "recently"}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setKeyToDelete(key.id)}
                          >
                            <Trash2 className="h-4 w-4 text-slate-500 hover:text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this API key? This action cannot be undone 
                              and may break applications that use this key.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setKeyToDelete(null)}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteConfirm}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteKeyMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : null}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="mt-2 flex items-center">
                      <Input 
                        type={visibleKeys[key.id] ? "text" : "password"} 
                        readOnly 
                        className="font-mono text-xs"
                        value={key.key}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="ml-2"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {visibleKeys[key.id] ? (
                          <EyeOff className="h-4 w-4 text-slate-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-500" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="ml-2"
                        onClick={() => copyToClipboard(key.key)}
                      >
                        <Copy className="h-4 w-4 text-slate-500" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full" 
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  {newKey 
                    ? "Your new API key has been created. Make sure to copy it now as you won't be able to see it again." 
                    : "Create a new API key for accessing the Transmate API."}
                </DialogDescription>
              </DialogHeader>
              
              {newKey ? (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="newApiKey">API Key</Label>
                    <div className="flex items-center">
                      <Input 
                        id="newApiKey" 
                        value={newKey}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="ml-2"
                        onClick={() => copyToClipboard(newKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-amber-500 mt-1">
                      This key will only be shown once. Save it somewhere secure.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input 
                      id="keyName" 
                      placeholder="e.g., Production Key"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter>
                {newKey ? (
                  <Button onClick={handleCloseDialog}>
                    Close
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateKey}
                      disabled={createKeyMutation.isPending || !keyName.trim()}
                    >
                      {createKeyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Plus className="h-4 w-4 mr-1" />
                      )}
                      Create API Key
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
