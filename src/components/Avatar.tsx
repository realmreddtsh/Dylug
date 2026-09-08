type Presence = "online" | "idle" | "dnd" | "offline" | "streaming";

const palette = [
  ["#5865f2", "#8b5cf6"],
  ["#ec4899", "#f97316"],
  ["#0ea5e9", "#14b8a6"],
  ["#22c55e", "#84cc16"],
  ["#f59e0b", "#ef4444"],
  ["#8b5cf6", "#d946ef"],
] as const;

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

const presenceColor: Record<Presence, string> = {
  online: "#23a55a",
  idle: "#f0b232",
  dnd: "#f23f43",
  offline: "#80848e",
  streaming: "#9146ff",
};

export default function Avatar({
  name,
  src,
  size = 40,
  status,
  className = "",
  square = false,
}: {
  name: string;
  src?: string | null;
  size?: number;
  status?: Presence;
  className?: string;
  square?: boolean;
}) {
  const [from, to] = colorFor(name);
  const initials = name
    .replace(/^@/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const dotSize = size >= 40 ? 14 : size >= 30 ? 11 : 9;

  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label={`${name}${status ? `, ${status}` : ""}`}
    >
      <span
        className={`flex h-full w-full items-center justify-center bg-cover bg-center font-bold text-white shadow-sm ${
          square ? "rounded-[30%]" : "rounded-full"
        }`}
        style={{
          backgroundImage: src
            ? `url(${src})`
            : `linear-gradient(145deg, ${from}, ${to})`,
          fontSize: Math.max(9, Math.round(size * 0.34)),
        }}
      >
        {!src && initials}
      </span>
      {status && (
        <span
          className="absolute bottom-[-1px] right-[-1px] rounded-full border-[3px] border-disc-side"
          style={{
            width: dotSize,
            height: dotSize,
            background: presenceColor[status],
          }}
          aria-hidden="true"
        >
          {status === "idle" && (
            <span className="absolute -left-[3px] -top-[3px] h-[70%] w-[70%] rounded-full bg-disc-side" />
          )}
          {status === "dnd" && (
            <span className="absolute left-[15%] top-[42%] h-[18%] w-[70%] rounded-full bg-disc-side" />
          )}
        </span>
      )}
    </span>
  );
}
