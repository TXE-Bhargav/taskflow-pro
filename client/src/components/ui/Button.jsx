// Button.jsx — Dark premium variant system
// variant: primary, secondary, danger, ghost, outline
// size: sm, md, lg

const Button = ({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const base = 'btn-base gap-2 whitespace-nowrap';

  const variants = {
    primary:  [
      'bg-accent text-surface-0 font-semibold',
      'hover:bg-accent-300 active:bg-accent-500',
      'shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]',
      'hover:shadow-[0_2px_8px_rgba(232,160,69,0.3)]',
    ].join(' '),

    secondary: [
      'bg-surface-3 text-ink-1 font-medium',
      'border border-border-3',
      'hover:bg-surface-4 hover:border-border-3 active:bg-surface-5',
      'shadow-card',
    ].join(' '),

    danger: [
      'bg-danger text-white font-semibold',
      'hover:bg-red-400 active:bg-red-600',
      'shadow-[0_1px_2px_rgba(0,0,0,0.4)]',
    ].join(' '),

    ghost: [
      'text-ink-2 font-medium',
      'hover:bg-surface-3 hover:text-ink-1 active:bg-surface-4',
    ].join(' '),

    outline: [
      'bg-transparent text-ink-1 font-medium',
      'border border-border-3',
      'hover:bg-surface-3 hover:border-border-3',
    ].join(' '),
  };

  const sizes = {
    xs: 'h-6  px-2   text-[11px] rounded',
    sm: 'h-7  px-3   text-[12.5px] rounded-md',
    md: 'h-8  px-3.5 text-[13px] rounded-md',
    lg: 'h-10 px-5   text-[13.5px] rounded-md',
    xl: 'h-12 px-6   text-sm rounded-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-3.5 w-3.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export default Button;