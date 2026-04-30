// Input.jsx — Dark premium input with label, icon, and error states

const Input = ({
  label,
  error,
  icon,
  hint,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[12.5px] font-medium text-ink-2 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={[
            'input-base h-9 px-3 py-0',
            icon ? 'pl-9' : '',
            error
              ? 'border-danger/60 focus:border-danger focus:ring-danger/10 bg-danger/5'
              : '',
            className,
          ].join(' ')}
          {...props}
        />
      </div>

      {error && (
        <p className="text-[11.5px] text-danger/90 flex items-center gap-1.5 leading-tight">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-[11.5px] text-ink-4 leading-tight">{hint}</p>
      )}
    </div>
  );
};

export default Input;