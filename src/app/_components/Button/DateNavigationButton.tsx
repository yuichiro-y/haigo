import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  direction: "previous" | "next";
  label: string;
  onClick: () => void;
};

export const DateNavigationButton = ({
  direction,
  label,
  onClick,
}: Props) => {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {direction === "previous" ? (
        <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
      ) : (
        <ChevronRight size={24} strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
};