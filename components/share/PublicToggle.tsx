"use client";

import { useState, useEffect } from 'react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Copy, Check, Globe, Lock } from 'lucide-react';

interface PublicToggleProps {
  entityId: string;
  entityType: 'note' | 'folder';
  initialIsPublic?: boolean;
  initialToken?: string | null;
}

export default function PublicToggle({ 
  entityId, 
  entityType,
  initialIsPublic = false,
  initialToken = null
}: PublicToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareToken, setShareToken] = useState<string | null>(initialToken);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Reset state when props change
    setIsPublic(initialIsPublic);
    setShareToken(initialToken);
  }, [initialIsPublic, initialToken]);

  const togglePublicStatus = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const newPublicStatus = !isPublic;
      const endpoint = `${entityType === 'note' ? '/api/notes' : '/api/folders'}/${entityId}/public`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublic: newPublicStatus })
      });

      if (!response.ok) {
        throw new Error(`Failed to update public status: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update state with new values
      setIsPublic(data[entityType].is_public);
      setShareToken(data[entityType].public_share_token);
      setSuccess(newPublicStatus ? 
        `${entityType === 'note' ? 'Note' : 'Folder'} is now public` : 
        `${entityType === 'note' ? 'Note' : 'Folder'} is now private`);
    } catch (err: any) {
      console.error(`Error toggling ${entityType} public status:`, err);
      setError(err.message || 'An error occurred while updating public status');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!shareToken) return;
    
    // Build the public share URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/public/${entityType}s/${shareToken}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="public-toggle"
          checked={isPublic}
          onCheckedChange={togglePublicStatus}
          disabled={isLoading}
        />
        <Label htmlFor="public-toggle" className="cursor-pointer flex items-center gap-1">
          {isPublic ? (
            <>
              <Globe className="h-4 w-4" />
              Public
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Private
            </>
          )}
        </Label>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {isPublic && shareToken && (
        <div className="flex space-x-2">
          <div className="flex-grow relative">
            <Input 
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/public/${entityType}s/${shareToken}`}
              readOnly
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-1 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}