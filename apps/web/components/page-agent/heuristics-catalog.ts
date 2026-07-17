/**
 * Comprehensive Knot UI help tasks used when no LLM API key is configured.
 * Keyword scoring picks the best task; the runner executes safe DOM/navigation steps.
 */

export type HeuristicStep =
  | { type: "navigate"; path: string; note?: string }
  | { type: "click"; dataKnot?: string; text?: string; selector?: string; note?: string }
  | { type: "highlight"; dataKnot?: string; text?: string; selector?: string; note?: string }
  | { type: "wait"; ms: number }
  | { type: "explain"; message: string }
  | { type: "confirm"; message: string };

export type HeuristicTask = {
  id: string;
  title: string;
  description: string;
  /** Phrases users might type */
  keywords: string[];
  examples: string[];
  steps: HeuristicStep[];
};

export const HEURISTIC_TASKS: HeuristicTask[] = [
  {
    id: "go-dashboard",
    title: "Open Dashboard",
    description: "Go to the main dashboard overview.",
    keywords: ["dashboard", "home", "overview", "main page", "start"],
    examples: ["Go to dashboard", "Open home"],
    steps: [
      { type: "navigate", path: "/dashboard" },
      { type: "explain", message: "You’re on the Dashboard — recent folders and videos live here." },
    ],
  },
  {
    id: "go-videos",
    title: "Open Videos library",
    description: "Browse and manage all recordings.",
    keywords: [
      "videos",
      "library",
      "recordings",
      "my videos",
      "video list",
      "show videos",
    ],
    examples: ["Show my videos", "Open video library"],
    steps: [
      { type: "navigate", path: "/dashboard/videos" },
      {
        type: "highlight",
        dataKnot: "create-video",
        note: "Use New video to add metadata-only entries, or record from the desktop app.",
      },
      {
        type: "explain",
        message:
          "Videos library: open a card to watch, or use ⋮ for share, embed, edit, delete.",
      },
    ],
  },
  {
    id: "go-folders",
    title: "Open Folders",
    description: "Organize videos in nested folders.",
    keywords: ["folders", "folder", "organize", "directory", "collections"],
    examples: ["Open folders", "Organize into folders"],
    steps: [
      { type: "navigate", path: "/dashboard/folders" },
      { type: "highlight", dataKnot: "create-folder" },
      {
        type: "explain",
        message: "Create nested folders here, then assign videos from the video editor.",
      },
    ],
  },
  {
    id: "go-notifications",
    title: "Open Notifications",
    description: "See comments, mentions, and recording-ready alerts.",
    keywords: [
      "notifications",
      "alerts",
      "inbox",
      "mentions",
      "unread",
      "bell",
    ],
    examples: ["Show notifications", "Open my alerts"],
    steps: [
      { type: "navigate", path: "/dashboard/notifications" },
      {
        type: "explain",
        message:
          "Notifications cover comments, @mentions, recording ready, and when a video becomes Public.",
      },
    ],
  },
  {
    id: "go-settings",
    title: "Open Settings",
    description: "Account, security, and Clerk profile.",
    keywords: ["settings", "account", "profile", "security", "password", "user"],
    examples: ["Open settings", "Change my account"],
    steps: [
      { type: "navigate", path: "/dashboard/settings" },
      {
        type: "explain",
        message: "Settings uses Clerk’s profile UI — update name, email, password, and sessions.",
      },
    ],
  },
  {
    id: "create-folder",
    title: "Create a folder",
    description: "Start the new-folder dialog.",
    keywords: [
      "create folder",
      "new folder",
      "add folder",
      "make folder",
      "folder create",
    ],
    examples: ["Create a folder", "Add a new folder"],
    steps: [
      { type: "navigate", path: "/dashboard/folders" },
      { type: "wait", ms: 250 },
      { type: "click", dataKnot: "create-folder", text: "Create Folder" },
      {
        type: "explain",
        message: "Name the folder (and optional parent), then save.",
      },
    ],
  },
  {
    id: "create-video",
    title: "Create a video entry",
    description: "Open the dashboard create-video dialog (metadata).",
    keywords: [
      "create video",
      "new video",
      "add video",
      "upload video",
      "make video",
    ],
    examples: ["Create a video", "Add a new video"],
    steps: [
      { type: "navigate", path: "/dashboard/videos" },
      { type: "wait", ms: 250 },
      { type: "click", dataKnot: "create-video", text: "Create Video" },
      {
        type: "explain",
        message:
          "This creates a dashboard video row. For screen recording + live upload, use the Knot desktop app while signed in.",
      },
    ],
  },
  {
    id: "record-desktop",
    title: "How to record with desktop",
    description: "Explain the desktop recording → cloud share flow.",
    keywords: [
      "record",
      "recording",
      "desktop",
      "screen capture",
      "start recording",
      "how to record",
      "loom",
      "capture",
    ],
    examples: ["How do I record?", "Start a screen recording"],
    steps: [
      {
        type: "explain",
        message:
          "1) Run the Knot desktop app and sign in with the same Clerk account.\n2) Pick screen/window/region, optional mic + system audio + webcam.\n3) Press Record — chunks upload while you capture.\n4) A share link appears after the cloud session starts (PUBLIC by default).\n5) Stop when done; open the link on the web to watch progressively.",
      },
      { type: "navigate", path: "/dashboard/videos" },
      {
        type: "explain",
        message: "After upload, the recording appears in Videos with a thumbnail once chunk 0 lands.",
      },
    ],
  },
  {
    id: "share-video",
    title: "Share a video",
    description: "Find share / copy link / embed on the videos page.",
    keywords: [
      "share",
      "copy link",
      "share link",
      "embed",
      "iframe",
      "short link",
      "public link",
    ],
    examples: ["How do I share a video?", "Copy share link"],
    steps: [
      { type: "navigate", path: "/dashboard/videos" },
      {
        type: "explain",
        message:
          "On a video card, open ⋮ → Copy link / Copy embed / Open watch page. On the watch page use Copy link or Embed. Short links look like /r/{slug}. Embed works only while visibility is Public.",
      },
      {
        type: "highlight",
        text: "Copy link",
        note: "If you already have a video open on the watch page, use the Copy link button there.",
      },
    ],
  },
  {
    id: "visibility",
    title: "Change video visibility",
    description: "Private, Public, or Signed-in only.",
    keywords: [
      "visibility",
      "private",
      "public",
      "authenticated",
      "signed-in",
      "who can watch",
      "access",
      "permissions",
    ],
    examples: ["Make a video private", "Change visibility"],
    steps: [
      { type: "navigate", path: "/dashboard/videos" },
      {
        type: "explain",
        message:
          "Edit a video (⋮ → Edit) and set visibility:\n• Private — only you\n• Public — anyone with the link (required for embed)\n• Signed-in — any Clerk user\nDesktop recordings start as Public so live share links work immediately.",
      },
    ],
  },
  {
    id: "watch-comments",
    title: "Comments & @mentions",
    description: "Leave timestamped feedback on the watch page.",
    keywords: [
      "comment",
      "comments",
      "mention",
      "mentions",
      "@",
      "feedback",
      "timestamp",
    ],
    examples: ["How do comments work?", "Mention someone"],
    steps: [
      {
        type: "explain",
        message:
          "Open any watch page → Comments.\n• Toggle “Attach current playback time” to stamp a moment.\n• Type @ + at least 2 characters for mention autocomplete (Clerk usernames).\n• Click a timestamp to seek.\n• Ctrl/Cmd+Enter posts. Owner gets COMMENT; mentioned users get MENTION.",
      },
      { type: "navigate", path: "/dashboard/videos" },
      {
        type: "explain",
        message: "Open a video with Watch → leave a comment there.",
      },
    ],
  },
  {
    id: "watch-hotkeys",
    title: "Watch page keyboard shortcuts",
    description: "J/K/L style playback controls.",
    keywords: [
      "shortcut",
      "shortcuts",
      "hotkey",
      "hotkeys",
      "keyboard",
      "jkl",
      "fullscreen",
      "mute",
    ],
    examples: ["What are the video shortcuts?", "Keyboard controls"],
    steps: [
      {
        type: "explain",
        message:
          "On the watch page (when not typing in a field):\n• K / Space — play/pause\n• J / L — seek ±10s\n• ← / → — ±5s\n• M — mute\n• F — fullscreen\n• 0–9 — jump to 0%–90%",
      },
    ],
  },
  {
    id: "mark-notifications-read",
    title: "Clear notifications",
    description: "Open notifications and mark them read.",
    keywords: [
      "mark read",
      "mark all read",
      "clear notifications",
      "dismiss alerts",
      "read all",
    ],
    examples: ["Mark all notifications read"],
    steps: [
      { type: "navigate", path: "/dashboard/notifications" },
      { type: "wait", ms: 300 },
      {
        type: "click",
        dataKnot: "mark-all-read",
        text: "Mark all read",
      },
      {
        type: "explain",
        message: "If the button wasn’t found, open Notifications and use Mark all read.",
      },
    ],
  },
  {
    id: "embed-help",
    title: "Embed a video on another site",
    description: "PUBLIC videos only — iframe snippet.",
    keywords: ["embed code", "iframe", "wordpress", "website embed", "embed video"],
    examples: ["Get embed code"],
    steps: [
      {
        type: "explain",
        message:
          "1) Set the video to Public.\n2) Watch page or Videos ⋮ → Embed / Copy embed code.\n3) Paste the iframe. Non-public videos 404 on /embed.",
      },
      { type: "navigate", path: "/dashboard/videos" },
    ],
  },
  {
    id: "thumbnail-help",
    title: "Thumbnails",
    description: "Where posters come from.",
    keywords: ["thumbnail", "poster", "preview image", "cover"],
    examples: ["Why is there no thumbnail?"],
    steps: [
      {
        type: "explain",
        message:
          "Desktop uploads a JPEG poster after chunk 0 succeeds. Dashboard cards and the watch <video poster> use that signed URL. Re-record or wait for chunk 0 if missing.",
      },
    ],
  },
  {
    id: "delete-video",
    title: "Delete a video",
    description: "Find delete in the video actions menu.",
    keywords: ["delete video", "remove video", "trash video"],
    examples: ["How do I delete a video?"],
    steps: [
      {
        type: "confirm",
        message:
          "Delete is permanent for the database row (B2 objects may remain). Continue to the Videos page?",
      },
      { type: "navigate", path: "/dashboard/videos" },
      {
        type: "explain",
        message: "Open ⋮ on a video → Delete, then confirm in the dialog.",
      },
    ],
  },
  {
    id: "edit-video",
    title: "Edit video details",
    description: "Title, description, folder, visibility.",
    keywords: ["edit video", "rename video", "change title", "move to folder"],
    examples: ["Edit a video title"],
    steps: [
      { type: "navigate", path: "/dashboard/videos" },
      {
        type: "explain",
        message: "Open ⋮ → Edit on a video to change title, description, folder, and visibility.",
      },
    ],
  },
  {
    id: "toggle-sidebar",
    title: "Toggle sidebar",
    description: "Collapse or expand the dashboard sidebar.",
    keywords: ["sidebar", "collapse sidebar", "menu", "navigation"],
    examples: ["Collapse the sidebar"],
    steps: [
      { type: "click", dataKnot: "sidebar-trigger", selector: '[data-sidebar="trigger"]' },
      { type: "explain", message: "Sidebar toggled. Click the trigger again to restore it." },
    ],
  },
  {
    id: "sign-out-help",
    title: "Sign out",
    description: "Use the Clerk user button.",
    keywords: ["sign out", "log out", "logout", "sign off"],
    examples: ["How do I sign out?"],
    steps: [
      {
        type: "explain",
        message:
          "Click your avatar (top-right of the dashboard header) → Sign out in the Clerk menu.",
      },
      {
        type: "highlight",
        selector: ".cl-userButtonTrigger, [data-clerk-component='UserButton'] button",
      },
    ],
  },
  {
    id: "help-overview",
    title: "What can you help with?",
    description: "List of guided tasks available without an LLM key.",
    keywords: ["help", "what can you do", "commands", "guide", "assistant"],
    examples: ["Help", "What can you do?"],
    steps: [
      {
        type: "explain",
        message:
          "I’m Knot Guide mode (no LLM key configured). I can navigate and click common UI actions: videos, folders, settings, notifications, create folder/video, share/embed/visibility help, comments, desktop recording steps, and more. Try: “open videos”, “create a folder”, “how do I record?”, “make video public”.",
      },
    ],
  },
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s@/-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Score how well a user utterance matches a task (higher is better). */
export const scoreHeuristicTask = (query: string, task: HeuristicTask) => {
  const q = normalize(query);
  if (!q) return 0;

  let score = 0;
  const title = normalize(task.title);
  const desc = normalize(task.description);

  if (title === q) score += 100;
  if (title.includes(q) || q.includes(title)) score += 40;

  for (const kw of task.keywords) {
    const k = normalize(kw);
    if (!k) continue;
    if (q === k) score += 50;
    else if (q.includes(k)) score += 28 + Math.min(k.length, 12);
    else if (k.includes(q) && q.length >= 4) score += 12;
  }

  for (const ex of task.examples) {
    const e = normalize(ex);
    if (e === q) score += 60;
    else if (q.includes(e) || e.includes(q)) score += 20;
  }

  for (const token of q.split(" ")) {
    if (token.length < 3) continue;
    if (title.includes(token)) score += 4;
    if (desc.includes(token)) score += 2;
  }

  return score;
};

export const matchHeuristicTask = (
  query: string,
  minScore = 18,
): { task: HeuristicTask; score: number } | null => {
  let best: { task: HeuristicTask; score: number } | null = null;

  for (const task of HEURISTIC_TASKS) {
    const score = scoreHeuristicTask(query, task);
    if (!best || score > best.score) best = { task, score };
  }

  if (!best || best.score < minScore) return null;
  return best;
};

export const listSuggestedTasks = (limit = 6) =>
  HEURISTIC_TASKS.filter((t) => t.id !== "help-overview")
    .slice(0, limit)
    .map((t) => ({ id: t.id, title: t.title, example: t.examples[0] ?? t.title }));
