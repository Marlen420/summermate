"use client";

import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-20 lg:bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 shadow-lg bg-card animate-slide-in",
            toast.variant === "destructive" && "border-destructive bg-destructive/10"
          )}
        >
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className={cn(
                "text-sm font-semibold",
                toast.variant === "destructive" ? "text-destructive" : "text-foreground"
              )}>
                {toast.title}
              </p>
            )}
            {toast.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
