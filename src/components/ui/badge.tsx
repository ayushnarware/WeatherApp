import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        success:
          "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
        warning:
          "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
        danger:
          "border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200",
        info: "border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
