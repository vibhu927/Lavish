import { cn } from "@/lib/utils";
import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-[var(--brand-leaf)] text-white hover:bg-[var(--brand-teal)]",
    secondary: "bg-white text-[var(--brand-charcoal)] border hover:bg-[var(--brand-sage-light)]",
    ghost: "hover:bg-[var(--brand-sage-light)] text-[var(--brand-charcoal)]",
    outline: "border border-[var(--brand-charcoal)] text-[var(--brand-charcoal)] hover:bg-[var(--brand-charcoal)] hover:text-white",
  };
  const sizes: Record<string, string> = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-sm",
    lg: "h-12 px-8 text-base",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
