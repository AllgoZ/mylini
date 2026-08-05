import { cn } from '@/lib/utils';

interface LogoProps {
  /** "dark" = Barossa (#3E0F2F) icon+wordmark, for light/cream backgrounds. "light" = Milk White (#FFF3E6) icon+wordmark, for dark backgrounds. */
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Set false to render the wordmark only, without the arch icon mark. */
  showIcon?: boolean;
}

const ICON_SIZE: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

const TEXT_SIZE: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-[2rem]',
};

// Official brand mark (mylini-v2/logo/*.svg) — arch "m" icon traced below at its exact
// path data (viewBox cropped tightly to the icon's real bounding box, verified via a
// render+auto-trim pass rather than hand-measured). "Mylini" is set live in Montserrat
// (--font-logo) rather than the SVG file's own baked-in serif lettering, per design
// direction — only the icon mark comes from the provided artwork, the wordmark is real
// text so it can use the brand's Montserrat typeface.
export function Logo({ variant = 'dark', size = 'md', className, showIcon = true }: LogoProps) {
  const colorClass = variant === 'light' ? 'text-[#FFF3E6]' : 'text-[#3E0F2F]';
  const iconSize = ICON_SIZE[size];

  return (
    <span className={cn('inline-flex items-center gap-1.5 shrink-0', colorClass, className)}>
      {showIcon && (
        <svg
          width={iconSize}
          height={iconSize * (176 / 230)}
          viewBox="160 82 230 176"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M169 120.191V240.15C169 244.893 172.845 248.738 177.588 248.738H190.412C195.155 248.738 199 244.893 199 240.15V134.536C199 126.591 205.47 120.167 213.414 120.222L216.786 120.246C224.652 120.301 231 126.693 231 134.559V210.807C231 215.55 234.845 219.395 239.588 219.395H252.412C257.155 219.395 261 215.55 261 210.807V144.359V137.858C261 128.192 268.832 120.353 278.499 120.345H328.279C334.064 120.345 339.65 122.459 343.985 126.289C349.081 130.792 352 137.265 352 144.066V240.15C352 244.893 355.845 248.738 360.588 248.738H372.412C377.155 248.738 381 244.893 381 240.15V185.359V153.752V121.859C381.189 104.873 367.471 91.0025 350.484 91.0025H343.269L284.081 91.0025C262.2 91.0025 247.8 101.767 247.8 118.8C247.8 101.767 226.302 90.8116 219.098 91.0025L196.891 91.5735C181.373 91.9725 169 104.668 169 120.191Z"
            fill="currentColor"
          />
          <path
            d="M314.337 149.359C319.554 149.36 323 153.642 323 158.859V210.359C323 215.577 319.554 219.496 314.337 219.496H302.447C297.23 219.496 293 215.266 293 210.049V158.807C293 153.589 297.23 149.359 302.447 149.359H314.337Z"
            fill="currentColor"
          />
        </svg>
      )}
      <span className={cn('font-logo font-bold tracking-tight leading-none', TEXT_SIZE[size])}>
        Mylini
      </span>
    </span>
  );
}
