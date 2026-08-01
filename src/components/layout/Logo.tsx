import { cn } from '@/lib/utils';

interface LogoProps {
  /** "dark" = Barossa icon+wordmark, for light/cream backgrounds. "light" = Milk-gold icon+wordmark, for dark Barossa backgrounds. */
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

// Official wordmark/icon file not available in-repo — recreated in code from the
// brand guide (arch-shaped "m" mark + serif wordmark) rather than an <Image>.
export function Logo({ variant = 'dark', size = 'md', className, showIcon = true }: LogoProps) {
  const colorClass = variant === 'light' ? 'text-gold' : 'text-clay-deep';
  const iconSize = ICON_SIZE[size];

  return (
    <span className={cn('inline-flex items-center gap-1.5 shrink-0', colorClass, className)}>
      {showIcon && (
        <svg
          width={iconSize}
          height={iconSize * 0.75}
          viewBox="0 0 32 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M2 22V10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10V22"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M14 22V10C14 5.58172 17.5817 2 22 2C26.4183 2 30 5.58172 30 10V22"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span className={cn('font-logo font-semibold tracking-tight leading-none', TEXT_SIZE[size])}>
        Mylini
      </span>
    </span>
  );
}
