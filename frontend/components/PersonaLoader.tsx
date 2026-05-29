// Animated PersonaOn mark — used as the loading indicator while anything
// (extraction, generation, page load) is processing.

export function PersonaLoader({
  size = 56,
  label,
}: {
  size?: number;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <span className="relative inline-flex" style={{ width: size, height: size }}>
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/personaon-mark.svg"
          alt="PersonaOn"
          width={size}
          height={size}
          className="po-loader relative"
        />
      </span>
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
    </div>
  );
}
