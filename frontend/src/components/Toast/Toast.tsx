import type { JSX } from "react";
import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function Toast({
  message,
  onDismiss,
  autoDismissMs = 3000,
}: ToastProps): JSX.Element | null {
  useEffect(() => {
    if (!message) return;

    const timerId = window.setTimeout(onDismiss, autoDismissMs);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [message, autoDismissMs, onDismiss]);

  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: "#dc2626",
        color: "white",
        padding: "12px 16px",
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        zIndex: 1000,
        maxWidth: "320px",
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: "transparent",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "20px",
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}