"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { Textarea } from "@/components/ui/textarea";
import {
  searchMentionUsers,
  type MentionUser,
} from "@/server-actions/users";

type MentionTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
  ownerUserId: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  /** Ctrl/Cmd+Enter when the mention list is closed. */
  onSubmitShortcut?: () => void;
};

type ActiveMention = {
  query: string;
  start: number;
  end: number;
};

const findActiveMention = (
  text: string,
  caret: number,
): ActiveMention | null => {
  const before = text.slice(0, caret);
  const match = before.match(/@([a-zA-Z0-9_-]{0,30})$/);
  if (!match) return null;

  const query = match[1] ?? "";
  const start = caret - match[0].length;
  return { query, start, end: caret };
};

const MentionTextarea = ({
  value,
  onChange,
  visibility,
  ownerUserId,
  placeholder,
  disabled,
  rows = 3,
  maxLength = 2000,
  onSubmitShortcut,
}: MentionTextareaProps) => {
  const listId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [active, setActive] = useState<ActiveMention | null>(null);
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshActive = useCallback((text: string, caret: number) => {
    const next = findActiveMention(text, caret);
    setActive(next);
    if (!next || next.query.length < 2) {
      setUsers([]);
      setHighlight(0);
    }
  }, []);

  const activeQuery = active?.query ?? "";

  useEffect(() => {
    if (!active || activeQuery.length < 2) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchMentionUsers({
        query: activeQuery,
        visibility,
        ownerUserId,
      }).then((res) => {
        if (cancelled) return;
        setLoading(false);
        if (!res.success) {
          setUsers([]);
          return;
        }
        setUsers(res.users);
        setHighlight(0);
      });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, activeQuery, ownerUserId, visibility]);

  const insertMention = (user: MentionUser) => {
    if (!active) return;
    const before = value.slice(0, active.start);
    const after = value.slice(active.end);
    const insertion = `@${user.username} `;
    const next = `${before}${insertion}${after}`;
    onChange(next);
    setActive(null);
    setUsers([]);

    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const pos = before.length + insertion.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      onSubmitShortcut &&
      event.key === "Enter" &&
      (event.metaKey || event.ctrlKey) &&
      !(active && users.length > 0)
    ) {
      event.preventDefault();
      onSubmitShortcut();
      return;
    }

    if (!active || users.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((h) => (h + 1) % users.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => (h - 1 + users.length) % users.length);
      return;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const user = users[highlight];
      if (user) insertMention(user);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setActive(null);
      setUsers([]);
    }
  };

  const showList =
    Boolean(active) &&
    (active?.query.length ?? 0) >= 2 &&
    (loading || users.length > 0);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          refreshActive(next, e.target.selectionStart ?? next.length);
        }}
        onClick={(e) => {
          const el = e.currentTarget;
          refreshActive(el.value, el.selectionStart ?? el.value.length);
        }}
        onKeyUp={(e) => {
          const el = e.currentTarget;
          refreshActive(el.value, el.selectionStart ?? el.value.length);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-autocomplete="list"
        aria-controls={showList ? listId : undefined}
        aria-expanded={showList}
      />

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {loading && users.length === 0 ? (
            <li className="px-2 py-1.5 text-xs text-muted-foreground">
              Searching…
            </li>
          ) : (
            users.map((user, i) => (
              <li key={user.id} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm ${
                    i === highlight ? "bg-accent text-accent-foreground" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(user);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                >
                  {user.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.imageUrl}
                      alt=""
                      className="size-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px]">
                      {user.username.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      @{user.username}
                    </span>
                    {user.label !== user.username ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {user.label}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
};

export { MentionTextarea };
