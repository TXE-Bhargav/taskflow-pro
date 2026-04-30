// Modal.jsx — Dark premium modal with glass effect

import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-3xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm sidebar-overlay" />

      {/* Modal */}
      <div
        className={[
          'relative w-full sm:w-auto z-10',
          'bg-surface-2 border border-border-3',
          'rounded-t-2xl sm:rounded-xl',
          'shadow-modal',
          'animate-slide-up',
          'sm:' + sizes[size],
          'max-h-[92svh] flex flex-col',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-border-3 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-1 flex-shrink-0">
          <h2 className="text-[13.5px] font-semibold text-ink-1 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-ink-4 hover:text-ink-2 hover:bg-surface-4 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;