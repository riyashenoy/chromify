"use client";

interface SiteHeaderProps {
  title: string;
  tagline?: string;
}

export function SiteHeader({
  title,
  tagline = "generate customizable chrome assets",
}: SiteHeaderProps) {
  return (
    <header className="border-b border-[rgba(150,157,166,0.18)] px-6 py-6 sm:px-8">
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <ChromeStar size={14} className="chrome-star-twinkle" gradientId="star-left" />
          <h1 className="font-display chrome-wordmark-animated bg-clip-text text-[22px] font-semibold tracking-[0.18em] text-transparent sm:text-[26px]">
            {title}
          </h1>
          <ChromeStar
            size={14}
            className="chrome-star-twinkle chrome-star-twinkle-delayed"
            gradientId="star-right"
          />
        </div>
        {tagline ? (
          <p className="max-w-[28rem] text-xs tracking-[0.04em] text-[#8b93a0]">
            {tagline}
          </p>
        ) : null}
      </div>
    </header>
  );
}

function ChromeStar({
  size,
  gradientId,
  className = "",
}: {
  size: number;
  gradientId: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#c2c8d0" />
          <stop offset="1" stopColor="#eef1f5" />
        </linearGradient>
      </defs>
      <path
        d="M12 0 L14.8 9.2 L24 12 L14.8 14.8 L12 24 L9.2 14.8 L0 12 L9.2 9.2 Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(150,157,166,0.14)] px-6 py-5 sm:px-8">
      <p className="text-center text-[12px] tracking-[0.04em] text-[#9aa1ad]">
        Built by Riya Shenoy ·{" "}
        <a
          href="https://riyashenoy.com"
          className="text-[#c6cdd6] underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bfdcf5]"
          rel="noopener noreferrer"
        >
          riyashenoy.com
        </a>
      </p>
    </footer>
  );
}
