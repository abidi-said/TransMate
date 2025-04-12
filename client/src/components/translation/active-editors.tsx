import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActiveEditorsProps {
  keyId: number;
  languageId: number;
  activeEditors: Record<string, { userId: number; userName: string }[]>;
  excludeUserId?: number;
}

export function ActiveEditors({ 
  keyId, 
  languageId, 
  activeEditors,
  excludeUserId
}: ActiveEditorsProps) {
  const translationKey = `${keyId}-${languageId}`;
  const editors = activeEditors[translationKey] || [];
  
  // Filter out the current user if excludeUserId is provided
  const otherEditors = excludeUserId 
    ? editors.filter(editor => editor.userId !== excludeUserId)
    : editors;
  
  if (otherEditors.length === 0) {
    return null;
  }
  
  return (
    <div className="flex -space-x-2">
      <TooltipProvider>
        {otherEditors.slice(0, 3).map((editor) => (
          <Tooltip key={editor.userId}>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6 border-2 border-white">
                <AvatarFallback className="bg-primary text-white text-xs">
                  {editor.userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{editor.userName} is editing</p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {otherEditors.length > 3 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6 border-2 border-white">
                <AvatarFallback className="bg-slate-500 text-white text-xs">
                  +{otherEditors.length - 3}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{otherEditors.length - 3} more editors</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}