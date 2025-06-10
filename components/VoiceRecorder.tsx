"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onTranscriptionComplete?: (note: any) => void;
  defaultFolderId?: string;
  availableFolders?: Array<{ id: string; name: string }>;
}

export function VoiceRecorder({
  onTranscriptionComplete,
  defaultFolderId,
  availableFolders = [],
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId || "");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions.",
      );
    }
  };

  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      toast.success("Recording paused");
    }
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success("Recording resumed");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      toast.success("Recording stopped");
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const discardRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    setIsPlaying(false);
    setTitle("");
    toast.success("Recording discarded");
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-note.webm");
      if (title) formData.append("title", title);
      if (folderId) formData.append("folderId", folderId);

      const response = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Transcription failed");
      }

      const data = await response.json();

      toast.success("Voice note transcribed successfully!");

      if (onTranscriptionComplete) {
        onTranscriptionComplete(data.note);
      }

      // Reset state
      discardRecording();
      setDialogOpen(false);
      setTitle("");
      setFolderId(defaultFolderId || "");
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to transcribe audio",
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mic className="h-4 w-4 mr-2" />
          Voice Note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Voice Note</DialogTitle>
          <DialogDescription>
            Record a voice note and it will be automatically transcribed and
            saved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recording Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-3xl font-mono">
                  {formatTime(recordingTime)}
                </div>

                {isRecording && (
                  <div className="flex justify-center">
                    <div
                      className={`w-4 h-4 rounded-full bg-red-500 ${
                        isPaused ? "" : "animate-pulse"
                      }`}
                    />
                  </div>
                )}

                <div className="flex justify-center gap-2">
                  {!isRecording && !audioBlob && (
                    <Button onClick={startRecording} size="lg">
                      <Mic className="h-5 w-5 mr-2" />
                      Start Recording
                    </Button>
                  )}

                  {isRecording && !isPaused && (
                    <>
                      <Button onClick={pauseRecording} variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button onClick={stopRecording} variant="destructive">
                        <Square className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {isRecording && isPaused && (
                    <>
                      <Button onClick={resumeRecording} variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button onClick={stopRecording} variant="destructive">
                        <Square className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audio Playback */}
          {audioBlob && audioUrl && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button onClick={playAudio} variant="outline">
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button onClick={discardRecording} variant="outline">
                      <MicOff className="h-4 w-4 mr-2" />
                      Discard
                    </Button>
                  </div>

                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    style={{ display: "none" }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcription Settings */}
          {audioBlob && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="noteTitle">Note Title (optional)</Label>
                <Input
                  id="noteTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Voice Note"
                />
              </div>

              {availableFolders.length > 0 && (
                <div>
                  <Label htmlFor="folder">Folder</Label>
                  <Select value={folderId} onValueChange={setFolderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Root folder</SelectItem>
                      {availableFolders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={transcribeAudio}
                disabled={isTranscribing}
                className="w-full"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Transcribe & Save
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
