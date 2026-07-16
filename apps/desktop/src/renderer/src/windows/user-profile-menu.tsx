import { useClerk, useUser } from "@clerk/electron/react";
import { useEffect, useRef, useState } from "react";

export function UserProfileMenu() {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!isLoaded || !user) return null;

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const name =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0] ||
    "Account";
  const imageUrl = user.imageUrl;

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        type="button"
        className="profile-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        {imageUrl ? (
          <img className="profile-avatar" src={imageUrl} alt="" />
        ) : (
          <span className="profile-avatar profile-avatar--fallback">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="profile-meta">
          <strong>{name}</strong>
          {email && <span>{email}</span>}
        </span>
      </button>

      {open && (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-head">
            {imageUrl ? (
              <img className="profile-avatar profile-avatar--lg" src={imageUrl} alt="" />
            ) : (
              <span className="profile-avatar profile-avatar--lg profile-avatar--fallback">
                {name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <strong>{name}</strong>
              {email && <p>{email}</p>}
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              openUserProfile();
            }}
          >
            Manage profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void window.knot.openDashboard();
            }}
          >
            Open dashboard
          </button>
          <button
            type="button"
            role="menuitem"
            className="profile-sign-out"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
