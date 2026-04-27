// Modal.jsx — Reusable modal/dialog
// useEffect closes modal on Escape key press

import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal box */}
      <div
        className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]} z-10 animate-in`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
