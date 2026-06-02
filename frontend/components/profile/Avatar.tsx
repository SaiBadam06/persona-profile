import type { CSSProperties } from "react";

export type AvatarShape = "circle" | "rounded" | "square" | undefined;

export function isPhoto(src?: string): boolean {
  return !!src && !src.includes("api.dicebear.com");
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PO";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function radiusFor(shape: AvatarShape, size: number): number | string {
  if (shape === "square") return Math.round(size * 0.16);
  if (shape === "rounded") return Math.round(size * 0.28);
  return 9999;
}

/**
 * Profile avatar: real uploaded photo when available, otherwise a polished
 * monogram (gradient + highlight + ring + soft shadow). Used everywhere.
 */
export function Avatar({
  name,
  src,
  shape = "circle",
  size = 64,
  onDark = false,
  className,
}: {
  name: string;
  src?: string;
  shape?: AvatarShape;
  size?: number;
  onDark?: boolean;
  className?: string;
}) {
  const radius = radiusFor(shape, size);
  const ring = onDark ? "rgba(255,255,255,0.28)" : "rgba(15,23,42,0.1)";
  const base: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    border: `1px solid ${ring}`,
    boxShadow: "0 8px 24px -10px rgba(15,23,42,0.4)",
  };

  if (isPhoto(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={className} style={{ ...base, objectFit: "cover" }} />;
  }

  return (
    <div
      className={className}
      style={{
        ...base,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #2f7fc4 0%, #4f46e5 100%)",
      }}
      aria-label={name}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.28), transparent 55%)",
        }}
      />
      <span
        style={{
          position: "relative",
          fontFamily: "var(--font-geist-sans), 'DM Sans', system-ui, sans-serif",
          fontWeight: 600,
          fontSize: Math.round(size * 0.36),
          letterSpacing: "0.01em",
          color: "#fff",
        }}
      >
        {initialsOf(name)}
      </span>
    </div>
  );
}
