"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AlertCircle, Check, X, Clock, Loader2 } from "lucide-react";

interface Invitation {
  id: string;
  entity_type: string;
  entity_id: string;
  access_level: string;
  expires_at: string;
  created_at: string;
  inviter: {
    id: string;
    email: string;
  };
}

export default function PendingInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // This is a placeholder for the actual API call
      // In a real application, you would call the /api/invitations/pending endpoint
      const response = await fetch("/api/invitations/pending");
      
      if (!response.ok) {
        throw new Error("Failed to fetch invitations");
      }
      
      const data = await response.json();
      setInvitations(data);
    } catch (err: any) {
      console.error("Error fetching invitations:", err);
      setError(err.message || "Failed to load invitations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    try {
      setProcessingIds((prev) => ({ ...prev, [invitationId]: true }));
      
      // This is a placeholder for the actual API call
      // In a real application, you would call the /api/invitations/{invitationId}/accept endpoint
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Failed to accept invitation");
      }
      
      // Remove the accepted invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      setError(err.message || "Failed to accept invitation");
    } finally {
      setProcessingIds((prev) => ({ ...prev, [invitationId]: false }));
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      setProcessingIds((prev) => ({ ...prev, [invitationId]: true }));
      
      // This is a placeholder for the actual API call
      // In a real application, you would call the /api/invitations/{invitationId}/decline endpoint
      const response = await fetch(`/api/invitations/${invitationId}/decline`, {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Failed to decline invitation");
      }
      
      // Remove the declined invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (err: any) {
      console.error("Error declining invitation:", err);
      setError(err.message || "Failed to decline invitation");
    } finally {
      setProcessingIds((prev) => ({ ...prev, [invitationId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-10">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchInvitations}>
          Try Again
        </Button>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-muted-foreground">No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <Card key={invitation.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">
                  {invitation.entity_type === "note" ? "Note" : "Folder"} Invitation
                </CardTitle>
                <CardDescription>
                  From {invitation.inviter.email}
                </CardDescription>
              </div>
              <Badge>{invitation.access_level === "edit" ? "Edit Access" : "View Access"}</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="text-sm flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Expires{" "}
                {new Date(invitation.expires_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </span>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDecline(invitation.id)}
              disabled={processingIds[invitation.id]}
            >
              {processingIds[invitation.id] ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-1" />
              )}
              Decline
            </Button>
            
            <Button
              size="sm"
              onClick={() => handleAccept(invitation.id)}
              disabled={processingIds[invitation.id]}
            >
              {processingIds[invitation.id] ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Accept
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}