import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, Trash2, Send } from "lucide-react";

export type Note = {
  id: string;
  listing_id: string;
  user_id: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  comment: string;
  created_at: string;
  updated_at: string;
};

type NotesProps = {
  notes: Note[];
  currentUserId: string;
  userRole: "agent" | "client";
  onAddNote: (comment: string) => Promise<void>;
  onUpdateNote: (id: string, comment: string) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  isLoading?: boolean;
};

export function NotesPanel({
  notes,
  currentUserId,
  userRole,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  isLoading,
}: NotesProps) {
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await onAddNote(newComment);
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async (id: string) => {
    if (!editingText.trim()) return;
    setSubmitting(true);
    try {
      await onUpdateNote(id, editingText);
      setEditingId(null);
      setEditingText("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm("Delete this note?")) {
      setSubmitting(true);
      try {
        await onDeleteNote(id);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditingText(note.comment);
  };

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <Card className="border-cyan-200 bg-cyan-50">
        <CardHeader>
          <CardTitle className="text-base">Add a Note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add your thoughts, observations, or follow-up items..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="resize-none"
            rows={3}
            disabled={submitting}
          />
          <Button
            onClick={handleAddNote}
            disabled={!newComment.trim() || submitting}
            className="gap-2"
          >
            <Send className="h-4 w-4" /> Post note
          </Button>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-center text-sm text-slate-500">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Header with user info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {note.user?.full_name || "Unknown"}
                        </p>
                        {note.user?.id === currentUserId && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(note.created_at).toLocaleString()}
                        {note.updated_at !== note.created_at && " (edited)"}
                      </p>
                    </div>

                    {/* Actions */}
                    {(note.user_id === currentUserId || userRole === "agent") && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(note)}
                          className="rounded p-1 hover:bg-slate-100"
                          disabled={submitting}
                        >
                          <Edit className="h-4 w-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="rounded p-1 hover:bg-red-50"
                          disabled={submitting}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Note Content */}
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="resize-none"
                        rows={3}
                        disabled={submitting}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={!editingText.trim() || submitting}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-slate-700">
                      {note.comment}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
