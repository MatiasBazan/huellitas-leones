import { cn } from '@/lib/utils';

// Misma geometría que scripts/brand-assets.mjs (viewBox 120×120)
const lobes = Array.from({ length: 12 }, (_, i) => i * 30);

export function LogoSymbol({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <g fill="var(--melena)">
        {lobes.map((deg) => (
          <circle key={deg} cx="60" cy="13" r="13" transform={`rotate(${deg} 60 60)`} />
        ))}
        <circle cx="60" cy="60" r="47" />
      </g>
      <circle cx="60" cy="60" r="38" fill="#E8590C" />
      <g fill="#FFF8EE" transform="translate(32 30) scale(0.56)">
        <path d="M50 90C33 90 23 81 25 69C27 57 38 50 50 50C62 50 73 57 75 69C77 81 67 90 50 90Z" />
        <ellipse cx="20" cy="45" rx="9" ry="12" transform="rotate(-22 20 45)" />
        <ellipse cx="38" cy="25" rx="9.5" ry="13" transform="rotate(-8 38 25)" />
        <ellipse cx="62" cy="25" rx="9.5" ry="13" transform="rotate(8 62 25)" />
        <ellipse cx="80" cy="45" rx="9" ry="12" transform="rotate(22 80 45)" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <LogoSymbol className="size-14 shrink-0" />
      <span className="flex flex-col font-heading leading-[0.9]">
        <span className="text-4xl font-extrabold text-foreground">Huellita</span>
        <span className="text-3xl font-bold text-brand">Leones</span>
      </span>
      <span className="sr-only">Huellita Leones</span>
    </span>
  );
}
