import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-muted text-muted-foreground hover:bg-border",
  outline:
    "border-2 border-dashed border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-secondary hover:text-primary",
  ghost: "text-muted-foreground hover:bg-muted hover:text-destructive",
};

export const Button = ({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`inline-flex items-center justify-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
};
