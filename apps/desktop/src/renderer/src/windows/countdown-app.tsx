import { useEffect, useRef, useState } from "react";

export function CountdownApp() {
  const [value, setValue] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTick = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const off = window.knot.onCountdown((seconds) => {
      clearTick();

      if (seconds <= 0) {
        setValue(null);
        return;
      }

      setValue(seconds);
      let remaining = seconds;

      intervalRef.current = window.setInterval(() => {
        remaining -= 1;
        setValue(remaining > 0 ? remaining : null);
        if (remaining <= 0) {
          clearTick();
        }
      }, 1000);
    });

    return () => {
      clearTick();
      off();
    };
  }, []);

  if (value === null) {
    return <div style={{ width: "100%", height: "100%" }} />;
  }

  return (
    <div className="countdown-shell">
      <div className="countdown-ring" key={value}>
        <span>{value}</span>
      </div>
      <p className="countdown-hint">Recording starts</p>
    </div>
  );
}
