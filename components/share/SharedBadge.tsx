"use client";

import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { Share2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface SharedBadgeProps {
  entityId: string;
  entityType: "note" | "folder";
  onClick?: () => void;
}

interface Collaborator {
  user: {
    id: string;
    email: string;
  };
  accessLevel: string;
  isOwner: boolean;
}

export default function SharedBadge({ entityId, entityType, onClick }: SharedBadgeProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        setIsLoading(true);
        // This is a placeholder for the actual API call
        // In a real application, you would call the /api/permissions endpoint
        const response = await fetch(
          `/api/permissions?entityType=${entityType}&entityId=${entityId}`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch collaborators");
        }
        
        const data = await response.json();
        setCollaborators(data);
      } catch (err) {
        console.error("Error fetching collaborators:", err);
        setCollaborators([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCollaborators();
  }, [entityId, entityType]);
  
  // Only show the badge if there are collaborators who are not the owner
  const nonOwnerCollaborators = collaborators.filter(
    (collaborator) => !collaborator.isOwner
  );
  
  if (isLoading || nonOwnerCollaborators.length === 0) {
    return null;
  }
  
  const tooltipText = `Shared with ${nonOwnerCollaborators.length} ${
    nonOwnerCollaborators.length === 1 ? "person" : "people"
  }`;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className="cursor-pointer"
            onClick={onClick}
          >
            <Share2 className="h-3 w-3 mr-1" />
            Shared
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}