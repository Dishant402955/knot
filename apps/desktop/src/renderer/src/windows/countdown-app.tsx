import { useEffect, useRef, useState } from "react";

export function CountdownApp() {
  const [value, setValue] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    const clearTick = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      clearTick();
      setValue(null);
      window.knot.notifyCountdownFinished();
    };

    const off = window.knot.onCountdown((seconds) => {
      clearTick();
      finishedRef.current = false;

      if (seconds <= 0) {
        finish();
        return;
      }

      setValue(seconds);
      let remaining = seconds;

      intervalRef.current = window.setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          setValue(remaining);
          return;
        }
        finish();
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
