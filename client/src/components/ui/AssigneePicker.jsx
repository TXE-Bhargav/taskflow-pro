// components/ui/AssigneePicker.jsx
// Member dropdown for task assignment — works in create form and task detail

import { useState, useRef, useEffect } from 'react';

const AssigneePicker = ({ members = [], value, onChange, placeholder = 'Unassigned' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = members.find((m) => (m.user?.id ?? m.id) === value);
  const displayName = selected?.user?.name ?? selected?.name;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-3 h-9 bg-surface-3 border border-border-2 hover:border-border-3 rounded-lg text-[12.5px] text-left transition-colors"
      >
        {displayName ? (
          <>
            <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent-300 font-semibold text-[9px] flex-shrink-0">
              {displayName[0].toUpperCase()}
            </div>
            <span className="text-ink-2 flex-1 truncate">{displayName}</span>
          </>
        ) : (
          <>
            <div className="w-5 h-5 rounded-full bg-surface-4 border border-border-2 flex items-center justify-center text-ink-4 text-xs flex-shrink-0">
              —
            </div>
            <span className="text-ink-4 flex-1">{placeholder}</span>
          </>
        )}
        <svg
          className={`w-3 h-3 text-ink-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-surface-2 border border-border-3 rounded-lg shadow-modal overflow-hidden">
          {/* Unassign option */}
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-[12.5px] hover:bg-surface-3 transition-colors ${!value ? 'bg-surface-3' : ''}`}
          >
            <div className="w-5 h-5 rounded-full bg-surface-4 border border-border-2 flex items-center justify-center text-ink-4 text-xs flex-shrink-0">—</div>
            <span className="text-ink-4 flex-1">Unassigned</span>
            {!value && <span className="text-accent-400 text-[11px]">✓</span>}
          </button>

          <div className="border-t border-border-1" />

          <div className="max-h-48 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-[12px] text-ink-4 text-center py-4">No members yet</p>
            ) : (
              members.map((m) => {
                const id   = m.user?.id ?? m.id;
                const name = m.user?.name ?? m.name;
                const email = m.user?.email ?? m.email;
                const isSelected = value === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { onChange(id); setOpen(false); }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-[12.5px] hover:bg-surface-3 transition-colors ${isSelected ? 'bg-accent/[0.06]' : ''}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent-300 font-semibold text-[9px] flex-shrink-0">
                      {name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-ink-2 font-medium truncate">{name}</p>
                      {email && <p className="text-[11px] text-ink-4 truncate">{email}</p>}
                    </div>
                    {isSelected && <span className="text-accent-400 text-[11px] flex-shrink-0">✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssigneePicker;