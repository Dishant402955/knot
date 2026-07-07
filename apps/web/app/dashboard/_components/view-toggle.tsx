"use client";

import { LayoutGrid, List } from "lucide-react";

import { Button } from "@/components/ui/button";

const ViewToggle = ({
  view,
  onChange,
}: {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}) => {
  return (
    <div className="flex gap-1">
      <Button
        size="icon"
        variant={view === "grid" ? "secondary" : "ghost"}
        onClick={() => onChange("grid")}
        className="h-8 w-8 cursor-pointer"
        aria-label="Grid view"
        aria-pressed={view === "grid"}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant={view === "list" ? "secondary" : "ghost"}
        onClick={() => onChange("list")}
        className="h-8 w-8 cursor-pointer"
        aria-label="List view"
        aria-pressed={view === "list"}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};

export { ViewToggle };
