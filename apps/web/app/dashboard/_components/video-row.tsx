import { format } from "date-fns";

import { Video } from "lucide-react";

const VideoRow = ({
  title,
  description,
  status,
  createdAt,
  updatedAt,
}: {
  title: string;
  description: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition hover:bg-muted/50">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Video className="h-5 w-5 shrink-0" />

        <div className="min-w-0">
          <p className="truncate font-medium">{title}</p>

          {description && (
            <p className="truncate text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-6 text-sm text-muted-foreground lg:flex">
        <span className="capitalize">{status.toLowerCase()}</span>

        <span>Created {format(new Date(createdAt), "PP")}</span>

        <span>Updated {format(new Date(updatedAt), "PP")}</span>
      </div>
    </div>
  );
};

export { VideoRow };
