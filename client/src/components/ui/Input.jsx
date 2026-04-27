// Input.jsx — Reusable input with label and error state

const Input = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
            }
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            placeholder:text-gray-400 bg-white
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};

export default Input;