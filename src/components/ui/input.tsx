import { cn } from "@/lib/utils";
import * as React from "react";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("flex h-10 w-full rounded-xl border border-[var(--brand-muted)] bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-leaf)] focus:border-transparent", className)} {...props} />
));
Input.displayName = "Input";
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("flex min-h-[80px] w-full rounded-xl border border-[var(--brand-muted)] bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-leaf)]", className)} {...props} />
));
Textarea.displayName = "Textarea";
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-[var(--brand-charcoal)]", className)} {...props} />;
}
