import * as React from "react";
import { cn } from "@/lib/utils";

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn("rounded-lg border border-border bg-background/80 p-4 text-sm shadow-sm", className)}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

export { Alert };
