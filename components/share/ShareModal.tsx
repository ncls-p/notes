"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, X, Check, RefreshCw } from "lucide-react";

interface CollaboratorType {
  user: {
    id: string;
    email: string;
  };
  accessLevel: string;
  isOwner: boolean;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType: "note" | "folder";
  entityName: string;
}

export default function ShareModal({ isOpen, onClose, entityId, entityType, entityName }: ShareModalProps) {
  const [email, setEmail] = useState<string>("");
  const [accessLevel, setAccessLevel] = useState<string>("view");
  const [collaborators, setCollaborators] = useState<CollaboratorType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators();
    }
  }, [isOpen, entityId]);

  const fetchCollaborators = async () => {
    try {
      setIsLoading(true);
      // This is a placeholder for the actual API call
      // In a real application, you would call the /api/permissions endpoint
      const response = await fetch(`/api/permissions?entityType=${entityType}&entityId=${entityId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch collaborators");
      }
      
      const data = await response.json();
      setCollaborators(data);
    } catch (err) {
      console.error("Error fetching collaborators:", err);
      setError("Failed to load collaborator list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    
    try {
      // This is a placeholder for the actual API call
      // In a real application, you would call the /api/invitations endpoint
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          invitee_email: email,
          entity_type: entityType,
          entity_id: entityId,
          access_level: accessLevel
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }
      
      setSuccess(`Invitation sent to ${email}`);
      setEmail("");
      fetchCollaborators(); // Refresh the list
    } catch (err: any) {
      setError(err.message || "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateAccessLevel = async (collaboratorId: string, newAccessLevel: string) => {
    try {
      // This is a placeholder for the actual API call
      // In a real application, you would call the /api/permissions/{permissionId} endpoint
      const response = await fetch(`/api/permissions/${collaboratorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          access_level: newAccessLevel
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to update access level");
      }
      
      fetchCollaborators(); // Refresh the list
      setSuccess("Access level updated successfully");
    } catch (err) {
      console.error("Error updating access level:", err);
      setError("Failed to update access level");
    }
  };
  
  const removeCollaborator = async (collaboratorId: string) => {
    try {
      // This is a placeholder for the actual API call
      // In a real application, you would call the /api/permissions/{permissionId} endpoint
      const response = await fetch(`/api/permissions/${collaboratorId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to remove collaborator");
      }
      
      fetchCollaborators(); // Refresh the list
      setSuccess("Collaborator removed successfully");
    } catch (err) {
      console.error("Error removing collaborator:", err);
      setError("Failed to remove collaborator");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {entityType === "note" ? "Note" : "Folder"}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="text-sm font-medium mb-2">{entityName}</h3>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <div className="w-24">
                <Label htmlFor="access-level" className="text-xs">Access</Label>
                <Select value={accessLevel} onValueChange={setAccessLevel}>
                  <SelectTrigger id="access-level">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Invite
              </Button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Collaborators</h3>
              <Button variant="ghost" size="sm" onClick={fetchCollaborators} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : collaborators.length > 0 ? (
              <div className="border rounded-md divide-y">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.user.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm">{collaborator.user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {collaborator.isOwner ? "Owner" : `Can ${collaborator.accessLevel}`}
                      </p>
                    </div>
                    
                    {!collaborator.isOwner && (
                      <div className="flex items-center gap-2">
                        <Select 
                          value={collaborator.accessLevel} 
                          onValueChange={(value) => updateAccessLevel(collaborator.user.id, value)}
                          disabled={collaborator.isOwner}
                        >
                          <SelectTrigger className="h-8 w-20 text-xs">
                            <SelectValue placeholder="Access" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View</SelectItem>
                            <SelectItem value="edit">Edit</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCollaborator(collaborator.user.id)}
                          disabled={collaborator.isOwner}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-3">No collaborators yet</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}