import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, disabled, children, className, ...props }, ref) => (
    <Button
      ref={ref}
      disabled={disabled || loading}
      className={cn("relative", className)}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        </span>
      )}
      <span className={loading ? "invisible" : ""}>{children}</span>
    </Button>
  )
);
LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
