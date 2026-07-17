"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { MentionTextarea } from "@/app/watch/[videoId]/mention-textarea";
import { Button } from "@/components/ui/button";
import { splitMentionSegments } from "@/lib/mentions";
import {
  createComment,
  deleteComment,
  type WatchComment,
} from "@/server-actions/comment";

import { MessageSquare, Trash2 } from "lucide-react";

const formatTimestamp = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
};

const CommentBody = ({ text }: { text: string }) => (
  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
    {splitMentionSegments(text).map((part, i) =>
      part.type === "mention" ? (
        <span key={`${i}-${part.value}`} className="font-medium text-primary">
          {part.value}
        </span>
      ) : (
        <span key={`${i}-${part.value.slice(0, 12)}`}>{part.value}</span>
      ),
    )}
  </p>
);

const AuthorAvatar = ({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Clerk CDN avatars
      <img
        src={imageUrl}
        alt=""
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground"
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
};

const CommentsSection = ({
  videoId,
  initialComments,
  canComment,
  isOwner,
  visibility,
  ownerUserId,
  getPlaybackSeconds,
  onSeekTo,
}: {
  videoId: string;
  initialComments: WatchComment[];
  canComment: boolean;
  isOwner: boolean;
  visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
  ownerUserId: string;
  getPlaybackSeconds: () => number | null;
  onSeekTo: (absoluteSeconds: number) => void;
}) => {
  const [items, setItems] = useState(initialComments);
  const [text, setText] = useState("");
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setItems(initialComments);
  }, [initialComments]);

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
    });
  };

  return (
    <section className="space-y-4 border-t pt-6 sm:pt-8" aria-label="Comments">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" aria-hidden />
        <h2 className="text-lg font-semibold">
          Comments{" "}
          <span className="font-normal text-muted-foreground">
            ({items.length})
          </span>
        </h2>
      </div>

      {canComment ? (
        <div className="space-y-3">
          <MentionTextarea
            value={text}
            onChange={setText}
            visibility={visibility}
            ownerUserId={ownerUserId}
            placeholder="Leave a comment… Type @ to mention someone"
            rows={3}
            maxLength={2000}
            disabled={pending}
            onSubmitShortcut={submit}
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
              {pending ? "Posting…" : "Post comment"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tip: press{" "}
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
              Ctrl
            </kbd>
            +
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>{" "}
            to post
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent(`/watch/${videoId}`)}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to leave feedback.
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {items.map((comment) => {
            const displayName = comment.isOwn
              ? "You"
              : comment.authorDisplayName;
            const subtitle =
              !comment.isOwn && comment.authorUsername
                ? `@${comment.authorUsername}`
                : null;

            return (
              <li key={comment.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <AuthorAvatar
                      name={comment.authorDisplayName}
                      imageUrl={comment.authorImageUrl}
                    />
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {displayName}
                        </span>
                        {subtitle ? <span>{subtitle}</span> : null}
                        <span aria-hidden>·</span>
                        <time
                          dateTime={new Date(comment.createdAt).toISOString()}
                        >
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </time>
                        {comment.timestampSeconds != null ? (
                          <>
                            <span aria-hidden>·</span>
                            <button
                              type="button"
                              className="cursor-pointer tabular-nums text-primary underline-offset-2 hover:underline"
                              onClick={() =>
                                onSeekTo(comment.timestampSeconds!)
                              }
                              title="Jump to this moment"
                            >
                              at {formatTimestamp(comment.timestampSeconds)}
                            </button>
                          </>
                        ) : null}
                      </div>
                      <CommentBody text={comment.text} />
                    </div>
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
            );
          })}
        </ul>
      )}
    </section>
  );
};

export { CommentsSection };
