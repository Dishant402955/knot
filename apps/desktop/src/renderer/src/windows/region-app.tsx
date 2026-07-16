import { useCallback, useEffect, useRef, useState } from "react";

type DragState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

export function RegionApp() {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const finish = useCallback((state: DragState | null) => {
    if (!state) {
      window.knot.cancelRegion();
      return;
    }

    const x = Math.min(state.startX, state.currentX);
    const y = Math.min(state.startY, state.currentY);
    const width = Math.abs(state.currentX - state.startX);
    const height = Math.abs(state.currentY - state.startY);

    if (width < 8 || height < 8) {
      window.knot.cancelRegion();
      return;
    }

    window.knot.submitRegion({ x, y, width, height });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.knot.cancelRegion();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rect = drag
    ? {
        left: Math.min(drag.startX, drag.currentX),
        top: Math.min(drag.startY, drag.currentY),
        width: Math.abs(drag.currentX - drag.startX),
        height: Math.abs(drag.currentY - drag.startY),
      }
    : null;

  return (
    <div
      className="region-shell"
      onMouseDown={(event) => {
        const next = {
          startX: event.clientX,
          startY: event.clientY,
          currentX: event.clientX,
          currentY: event.clientY,
        };
        dragRef.current = next;
        setDrag(next);
      }}
      onMouseMove={(event) => {
        if (!dragRef.current) return;
        const next = {
          ...dragRef.current,
          currentX: event.clientX,
          currentY: event.clientY,
        };
        dragRef.current = next;
        setDrag(next);
      }}
      onMouseUp={() => {
        finish(dragRef.current);
        dragRef.current = null;
        setDrag(null);
      }}
    >
      <div className="region-hint">Drag a region · Esc cancels</div>
      {rect && (
        <div
          className="region-box"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }}
        >
          <span className="region-size">
            {rect.width} × {rect.height}
          </span>
        </div>
      )}
    </div>
  );
}
