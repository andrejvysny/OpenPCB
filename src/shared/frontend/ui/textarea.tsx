import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Themed multiline input. Shared by the comment composer + reply box. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-control border border-border-control bg-surface-input px-2 py-1.5",
        "text-xs text-text-strong outline-none placeholder:text-text-disabled focus:border-selection",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
