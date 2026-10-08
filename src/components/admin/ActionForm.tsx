"use client";
import { useTransition } from "react";
import { useToast } from "@/components/ui/toaster";

/**
 * Wraps a one-click server action (delete / toggle / status change).
 * A bare `<form action={serverAction}>` lets a thrown error escape to
 * Next's error overlay (the production "Server Components render" red box).
 * This shows the real message as a toast instead — the page never crashes.
 */
export function ActionForm({
  action,
  children,
  className,
  confirmMessage,
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  confirmMessage?: string;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={className}
      action={() =>
        startTransition(async () => {
          try {
            if (confirmMessage && !window.confirm(confirmMessage)) return;
            await action();
          } catch (e) {
            toast(e instanceof Error ? e.message : "Action failed", "error");
          }
        })
      }
    >
      <fieldset disabled={pending} style={{ opacity: pending ? 0.6 : 1 }}>
        {children}
      </fieldset>
    </form>
  );
}
