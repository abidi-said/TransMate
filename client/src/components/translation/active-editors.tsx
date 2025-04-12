import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { UsersRound } from "lucide-react";

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
  
  // Filter out the current user
  const otherEditors = excludeUserId 
    ? editors.filter(editor => editor.userId !== excludeUserId)
    : editors;
  
  if (otherEditors.length === 0) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-muted-foreground">
            <UsersRound className="h-4 w-4" />
            <span className="text-xs font-medium">{otherEditors.length}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-semibold">Currently editing:</p>
            <div className="flex flex-wrap gap-1">
              {otherEditors.map(editor => (
                <Badge key={editor.userId} variant="outline" className="text-xs">
                  {editor.userName}
                </Badge>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}