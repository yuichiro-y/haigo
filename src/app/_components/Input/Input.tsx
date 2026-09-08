import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`rounded-lg bg-muted px-3 py-2.5 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:opacity-50 md:text-sm ${className}`}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
