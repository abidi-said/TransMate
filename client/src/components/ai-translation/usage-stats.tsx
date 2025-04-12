import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageStatsProps {
  projectId: number;
}

export function UsageStats({ projectId }: UsageStatsProps) {
  // In a real implementation, this would fetch actual usage statistics
  // For now, we'll use mock data that matches the design
  
  // Usage progress percentage
  const usagePercent = 75;

  return (
    <Card className="border border-slate-200">
      <CardHeader className="px-5 py-4">
        <CardTitle>AI Usage Stats</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="text-center mb-4">
          {/* SVG Circle Progress */}
          <svg className="w-28 h-28 mx-auto" viewBox="0 0 36 36">
            <path 
              className="progress-arc" 
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
              fill="none" 
              stroke="#e2e8f0" 
              strokeWidth="2" 
            />
            <path 
              className="progress-arc" 
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeDasharray={`${usagePercent}, 100`}
              className="text-primary"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
            <text 
              x="18" 
              y="20.35" 
              textAnchor="middle" 
              className="text-lg font-medium text-slate-800"
            >
              {usagePercent}%
            </text>
          </svg>
          <p className="text-sm text-slate-500">Monthly usage</p>
        </div>
        
        <ul className="space-y-3">
          <li className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Tokens used this month</span>
            <span className="text-sm font-medium text-slate-800">382,105</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Translations completed</span>
            <span className="text-sm font-medium text-slate-800">463</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Success rate</span>
            <span className="text-sm font-medium text-success">98.2%</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Monthly limit</span>
            <span className="text-sm font-medium text-slate-800">500,000 tokens</span>
          </li>
        </ul>
        
        <div className="mt-4 pt-4 border-t border-slate-200">
          <a href="#" className="text-sm text-primary hover:text-primary/90 font-medium flex items-center">
            View detailed usage reports
            <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
