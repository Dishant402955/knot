"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  clientWatchShareUrl,
  embedIframeSnippet,
  visibilityCopyHint,
} from "@/lib/share";

import { Code2, Copy } from "lucide-react";

type VideoShareActionsProps = {
  videoId: string;
  shareSlug?: string | null;
  visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
  /** Compact button group (watch) vs menu-driven openEmbed (dashboard). */
  layout?: "buttons" | "none";
  openEmbed?: boolean;
  onOpenEmbedChange?: (open: boolean) => void;
};

const VideoShareActions = ({
  videoId,
  shareSlug = null,
  visibility,
  layout = "buttons",
  openEmbed,
  onOpenEmbedChange,
}: VideoShareActionsProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const embedOpen = openEmbed ?? internalOpen;
  const setEmbedOpen = onOpenEmbedChange ?? setInternalOpen;

  const canEmbed = visibility === "PUBLIC";
  const snippet = embedIframeSnippet(videoId);

  const copyShareLink = async () => {
    const url = clientWatchShareUrl(videoId, shareSlug);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied", {
        description: visibilityCopyHint(visibility),
      });
    } catch {
      toast.error("Could not copy link", { description: url });
    }
  };

  const copyEmbed = async () => {
    if (!canEmbed) {
      toast.error("Embed requires Public visibility", {
        description: "Change the video to Public, then copy the embed code.",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Embed code copied");
      setEmbedOpen(false);
    } catch {
      toast.error("Could not copy embed code");
    }
  };

  return (
    <>
      {layout === "buttons" ? (
        <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer flex-1 sm:flex-none"
            onClick={() => void copyShareLink()}
            data-knot="copy-share-link"
          >
            <Copy className="mr-1.5 h-4 w-4" />
            Copy link
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer flex-1 sm:flex-none"
            onClick={() => {
              if (!canEmbed) {
                toast.error("Embed requires Public visibility", {
                  description:
                    "Change the video to Public, then copy the embed code.",
                });
                return;
              }
              setEmbedOpen(true);
            }}
            data-knot="open-embed"
          >
            <Code2 className="mr-1.5 h-4 w-4" />
            Embed
          </Button>
        </div>
      ) : null}

      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Embed this video</DialogTitle>
            <DialogDescription>
              Paste this iframe on any site. Only works while the video is{" "}
              <span className="font-medium text-foreground">Public</span>.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            readOnly
            value={snippet}
            rows={5}
            className="font-mono text-xs"
            onFocus={(e) => e.target.select()}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => setEmbedOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={() => void copyEmbed()}
            >
              <Copy className="mr-1.5 h-4 w-4" />
              Copy code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { VideoShareActions };
