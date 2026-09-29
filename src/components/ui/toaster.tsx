"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

type Toast = { id: number; message: string; type: "success" | "error" | "info" };
type ToastContextType = { toast: (msg: string, type?: Toast["type"]) => void };

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message: string; type?: Toast["type"] };
      if (detail?.message) toast(detail.message, detail.type || "success");
    };
    window.addEventListener("app-toast" as any, handler as any);
    return () => window.removeEventListener("app-toast" as any, handler as any);
  }, [toast]);

  const toastNode = (
    <div
      className="flex flex-col gap-2 pointer-events-none"
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 9999,
        maxWidth: "420px",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: t.type === "success" ? "#273338" : t.type === "error" ? "#DC2626" : "#FFFFFF",
            color: t.type === "info" ? "#273338" : "#FFFFFF",
            border: `1px solid ${t.type === "success" ? "#273338" : t.type === "error" ? "#DC2626" : "#E8EBE4"}`,
          }}
          className="pointer-events-auto min-w-[260px] max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-xl flex items-center gap-2"
        >
          <span className="text-base">{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted && typeof document !== "undefined" ? createPortal(toastNode, document.body) : null}
    </ToastContext.Provider>
  );
}

export function dispatchToast(message: string, type: Toast["type"] = "success") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("app-toast", { detail: { message, type } }));
  }
}
