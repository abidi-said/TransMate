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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";

interface TeamManagementProps {
  members: any[];
  projectId: number;
}

export function TeamManagement({ members, projectId }: TeamManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "translator"
  });
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/members`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "members"],
      });
      setIsDialogOpen(false);
      setInviteForm({
        email: "",
        role: "translator"
      });
      toast({
        title: "Team member added",
        description: "The user has been added to the project.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add member",
        description: error.message || "An error occurred while adding the team member.",
        variant: "destructive",
      });
    }
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest("DELETE", `/api/projects/${projectId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "members"],
      });
      setMemberToRemove(null);
      toast({
        title: "Team member removed",
        description: "The user has been removed from the project.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove member",
        description: error.message || "An error occurred while removing the team member.",
        variant: "destructive",
      });
    }
  });

  // Handle input changes for invite form
  const handleInputChange = (name: string, value: string) => {
    setInviteForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle invite submission
  const handleInvite = () => {
    if (!inviteForm.email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }
    
    addMemberMutation.mutate(inviteForm);
  };

  // Handle member removal confirmation
  const handleRemoveConfirm = () => {
    if (memberToRemove !== null) {
      removeMemberMutation.mutate(memberToRemove);
    }
  };

  // Helper to get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">Admin</Badge>;
      case 'translator':
        return <Badge className="bg-secondary-100 text-secondary-800 hover:bg-secondary-100">Translator</Badge>;
      case 'reviewer':
        return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">Reviewer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4">
        <CardTitle>Team Management</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">Project Members</h4>
            {members.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No team members yet</p>
                <p className="text-xs mt-1">Invite team members to collaborate on this project</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {members.map((member) => (
                  <li key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={`https://avatar.vercel.sh/${member.user.username}`} 
                          alt={member.user.username}
                        />
                        <AvatarFallback>
                          {member.user.fullName 
                            ? getInitials(member.user.fullName) 
                            : member.user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-700">
                          {member.user.fullName || member.user.username}
                        </p>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(member.role)}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setMemberToRemove(member.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-slate-500 hover:text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove team member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {member.user.fullName || member.user.username} from this project? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setMemberToRemove(null)}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleRemoveConfirm}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {removeMemberMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : null}
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
                <UserPlus className="h-4 w-4 mr-1" />
                Invite Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Invite a user to collaborate on this project
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    placeholder="user@example.com"
                    value={inviteForm.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="translator">Translator</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleInvite}
                  disabled={addMemberMutation.isPending || !inviteForm.email.trim()}
                >
                  {addMemberMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
