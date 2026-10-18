type Props = {
  value: string;
  label: string;
  sub: string;
};

export const StatisticsSummaryCard = ({ value, label, sub }: Props) => {
  return (
    <div className="flex min-h-16 min-w-0 flex-col items-start justify-center gap-0.5 rounded-xl border border-border bg-card px-3 py-3 text-left shadow-sm sm:min-h-20">
      <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">
        {label}
      </p>
      <p className="max-w-full text-base font-extrabold break-all text-foreground tabular-nums sm:text-xl">
        {value}
      </p>
      <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">
        {sub}
      </p>
    </div>
  );
};
