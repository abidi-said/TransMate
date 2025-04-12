import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function LanguageProgress() {
  // Fetch project data
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Assuming we're using the first project for simplicity
  const projectId = projects && projects.length > 0 ? projects[0].id : null;

  // Fetch languages
  const { data: languages, isLoading: languagesLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "languages"],
    enabled: !!projectId,
  });

  // Mock progress data - in a real app this would come from the API
  // The backend would calculate completion percentages based on translated vs total keys
  const mockLanguageProgress = [
    { code: "en", name: "English (Default)", progress: 100 },
    { code: "fr", name: "French", progress: 92 },
    { code: "de", name: "German", progress: 88 },
    { code: "es", name: "Spanish", progress: 76 },
    { code: "pt", name: "Portuguese", progress: 67 },
    { code: "it", name: "Italian", progress: 52 },
    { code: "nl", name: "Dutch", progress: 41 },
    { code: "pl", name: "Polish", progress: 28 },
  ];

  // Function to decide progress bar color based on completion percentage
  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return "bg-primary";
    if (progress >= 50) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <Card className="border border-slate-200 h-full">
      <CardHeader className="px-5 py-4">
        <CardTitle>Language Completion</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {languagesLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-4">
            {mockLanguageProgress.map((lang) => (
              <li key={lang.code}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700">{lang.name}</span>
                  <span className="text-sm font-medium text-slate-700">{lang.progress}%</span>
                </div>
                <Progress
                  value={lang.progress}
                  className="h-2 bg-slate-200"
                  indicatorClassName={getProgressColor(lang.progress)}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
