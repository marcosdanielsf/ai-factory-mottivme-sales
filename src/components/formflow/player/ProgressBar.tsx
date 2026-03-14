interface ProgressBarProps {
  progress: number;
  current: number;
  total: number;
  primaryColor?: string;
}

export function ProgressBar({
  progress,
  current,
  total,
  primaryColor = "#4F46E5",
}: ProgressBarProps) {
  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: primaryColor,
          }}
        />
      </div>
      <span
        className="text-xs font-medium whitespace-nowrap opacity-60"
        style={{ color: "inherit" }}
      >
        {current} de {total}
      </span>
    </div>
  );
}
