"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createComment,
  deleteComment,
  type WatchComment,
} from "@/server-actions/comment";

import { MessageSquare, Trash2 } from "lucide-react";

const formatTimestamp = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const CommentsSection = ({
  videoId,
  initialComments,
  canComment,
  isOwner,
  getPlaybackSeconds,
}: {
  videoId: string;
  initialComments: WatchComment[];
  canComment: boolean;
  isOwner: boolean;
  getPlaybackSeconds: () => number | null;
}) => {
  const router = useRouter();
  const [items, setItems] = useState(initialComments);
  const [text, setText] = useState("");
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Comment cannot be empty.");
      return;
    }

    const stamp = includeTimestamp ? getPlaybackSeconds() : null;

    startTransition(async () => {
      const res = await createComment({
        videoId,
        text: trimmed,
        timestampSeconds: stamp,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      setItems((prev) => [...prev, res.comment]);
      setText("");
      toast.success(res.message);
      router.refresh();
    });
  };

  const remove = (commentId: string) => {
    startTransition(async () => {
      const res = await deleteComment({ commentId });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      setItems((prev) => prev.filter((c) => c.id !== commentId));
      toast.success(res.message);
      router.refresh();
    });
  };

  return (
    <section className="space-y-4 border-t pt-8">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold text-lg">
          Comments{" "}
          <span className="text-muted-foreground font-normal">
            ({items.length})
          </span>
        </h2>
      </div>

      {canComment ? (
        <div className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Leave a comment…"
            rows={3}
            maxLength={2000}
            disabled={pending}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="size-3.5 accent-primary"
                checked={includeTimestamp}
                onChange={(e) => setIncludeTimestamp(e.target.checked)}
                disabled={pending}
              />
              Attach current playback time
            </label>
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              disabled={pending || !text.trim()}
              onClick={submit}
            >
              Post comment
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/sign-in" className="underline underline-offset-2">
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to leave feedback.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border px-4 py-3 space-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {comment.isOwn ? "You" : "Viewer"}
                    </span>
                    <span>·</span>
                    <span>
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {comment.timestampSeconds != null ? (
                      <>
                        <span>·</span>
                        <span className="tabular-nums">
                          at {formatTimestamp(comment.timestampSeconds)}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                </div>

                {comment.isOwn || isOwner ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                    disabled={pending}
                    onClick={() => remove(comment.id)}
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export { CommentsSection };
