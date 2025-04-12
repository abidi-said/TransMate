import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export function ActivityFeed() {
  // Fetch project data
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Assuming we're using the first project for simplicity
  const projectId = projects && projects.length > 0 ? projects[0].id : null;

  // Fetch activity logs
  const { data: activityLogs, isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "activity"],
    enabled: !!projectId,
  });

  // Helper to render activity icon based on action type
  const getActivityIcon = (action: string, resourceType: string) => {
    if (action === "created" || action === "added") return "add_circle";
    if (action === "updated") return "edit";
    if (action === "deleted") return "delete";
    if (action === "completed") return "check_circle";
    if (action === "synced") return "sync";
    if (action === "bulk-translated") return "psychology";
    
    // Default based on resource type
    if (resourceType === "translation") return "translate";
    if (resourceType === "key") return "key";
    if (resourceType === "member") return "person";
    if (resourceType === "language") return "language";
    
    return "history";
  };

  // Helper to get activity icon background color
  const getActivityIconBg = (action: string) => {
    if (action === "created" || action === "added") return "bg-secondary-100 text-secondary-600";
    if (action === "completed") return "bg-success/20 text-success";
    if (action === "deleted") return "bg-destructive/20 text-destructive";
    if (action === "translated") return "bg-primary-100 text-primary-600";
    if (action === "bulk-translated") return "bg-primary-100 text-primary-600";
    return "bg-slate-100 text-slate-600";
  };

  // Helper to format activity description
  const formatActivityDescription = (log: any) => {
    const { action, resourceType, user, details } = log;
    
    if (resourceType === "translation") {
      return (
        <>
          <span className="font-bold">{user?.username || "User"}</span> {action} a translation for <span className="font-bold">{details?.key || "a key"}</span>
        </>
      );
    }
    
    if (resourceType === "key") {
      return (
        <>
          <span className="font-bold">{user?.username || "User"}</span> {action} key <span className="font-bold">{details?.key || "a key"}</span>
        </>
      );
    }
    
    if (resourceType === "language") {
      return (
        <>
          <span className="font-bold">{user?.username || "User"}</span> {action} <span className="font-bold">{details?.name || "a language"}</span> language
        </>
      );
    }
    
    if (resourceType === "member") {
      return (
        <>
          <span className="font-bold">{user?.username || "User"}</span> {action} member <span className="font-bold">{details?.username || "a user"}</span>
        </>
      );
    }
    
    if (resourceType === "project" && action === "bulk-translated") {
      return (
        <>
          Bulk translation completed ({details?.processed || "0"} keys processed)
        </>
      );
    }
    
    if (resourceType === "project" && action === "synced") {
      return (
        <>
          Project synced with repository <span className="font-bold">{details?.source || ""}</span>
        </>
      );
    }
    
    return (
      <>
        <span className="font-bold">{user?.username || "User"}</span> {action} {resourceType}
      </>
    );
  };

  // Helper to format activity subtext
  const formatActivitySubtext = (log: any) => {
    const { action, resourceType, details } = log;
    
    if (resourceType === "translation") {
      return `${details?.targetLanguage || "Language"} translation`;
    }
    
    if (action === "bulk-translated") {
      return `${details?.processed || "0"} keys processed, ${details?.failed || "0"} failed`;
    }
    
    if (action === "synced") {
      return `Added ${details?.added || "0"}, updated ${details?.updated || "0"} keys`;
    }
    
    return "";
  };

  // Render the activity feed
  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="flex-shrink-0 h-8 w-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-1" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {activityLogs && activityLogs.length > 0 ? (
                activityLogs.map((log) => (
                  <li key={log.id} className="flex items-start gap-4">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full ${getActivityIconBg(log.action)} flex items-center justify-center`}>
                      <span className="material-icons text-sm">{getActivityIcon(log.action, log.resourceType)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {formatActivityDescription(log)}
                      </p>
                      {formatActivitySubtext(log) && (
                        <p className="text-xs text-slate-500">{formatActivitySubtext(log)}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {log.createdAt 
                          ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) 
                          : "Recently"}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">No activity yet</p>
                </div>
              )}
            </ul>
            {activityLogs && activityLogs.length > 0 && (
              <a href="#" className="mt-3 block text-center text-sm text-primary hover:text-primary/90 font-medium">
                View All Activity
              </a>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
