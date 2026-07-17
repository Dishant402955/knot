import { Badge } from "@/components/ui/badge";

const statusVariant = (
  status: string,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "READY":
      return "default";
    case "FAILED":
      return "destructive";
    case "RECORDING":
    case "PROCESSING":
      return "secondary";
    default:
      return "outline";
  }
};

const visibilityVariant = (
  visibility: string,
): "default" | "secondary" | "outline" => {
  switch (visibility) {
    case "PUBLIC":
      return "default";
    case "AUTHENTICATED":
      return "secondary";
    default:
      return "outline";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "RECORDING":
      return "Recording";
    case "PROCESSING":
      return "Processing";
    case "READY":
      return "Ready";
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
};

const visibilityLabel = (visibility: string) => {
  switch (visibility) {
    case "PUBLIC":
      return "Public";
    case "AUTHENTICATED":
      return "Signed-in";
    case "PRIVATE":
      return "Private";
    default:
      return visibility;
  }
};

const VideoStatusBadge = ({ status }: { status: string }) => (
  <Badge
    variant={statusVariant(status)}
    className={status === "RECORDING" ? "animate-pulse" : undefined}
  >
    {statusLabel(status)}
  </Badge>
);

const VideoVisibilityBadge = ({ visibility }: { visibility: string }) => (
  <Badge variant={visibilityVariant(visibility)}>
    {visibilityLabel(visibility)}
  </Badge>
);

export { VideoStatusBadge, VideoVisibilityBadge };
