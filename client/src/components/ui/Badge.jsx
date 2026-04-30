// Badge.jsx — Dark premium badge with dot indicator

const CONFIGS = {
  // Priority
  URGENT:      { dot: 'bg-danger',         text: 'text-danger/90',   bg: 'bg-danger/10',   border: 'border-danger/20',   label: 'Urgent'      },
  HIGH:        { dot: 'bg-warning',         text: 'text-warning/90',  bg: 'bg-warning/10',  border: 'border-warning/20',  label: 'High'        },
  MEDIUM:      { dot: 'bg-accent-400',      text: 'text-accent-300',  bg: 'bg-accent/10',   border: 'border-accent/20',   label: 'Medium'      },
  LOW:         { dot: 'bg-success',         text: 'text-success/90',  bg: 'bg-success/10',  border: 'border-success/20',  label: 'Low'         },

  // Status
  TODO:        { dot: 'bg-ink-4',           text: 'text-ink-3',       bg: 'bg-surface-4',   border: 'border-border-3',    label: 'To Do'       },
  IN_PROGRESS: { dot: 'bg-info',            text: 'text-info/90',     bg: 'bg-info/10',     border: 'border-info/20',     label: 'In Progress' },
  IN_REVIEW:   { dot: 'bg-warning',         text: 'text-warning/90',  bg: 'bg-warning/10',  border: 'border-warning/20',  label: 'In Review'   },
  DONE:        { dot: 'bg-success',         text: 'text-success/90',  bg: 'bg-success/10',  border: 'border-success/20',  label: 'Done'        },

  default:     { dot: 'bg-ink-4',           text: 'text-ink-3',       bg: 'bg-surface-4',   border: 'border-border-2',    label: ''            },
};

const Badge = ({ label, type = 'default', size = 'sm' }) => {
  const cfg = CONFIGS[type] || CONFIGS.default;
  const displayLabel = label || cfg.label || type.replace(/_/g, ' ');

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded font-medium border',
        cfg.text, cfg.bg, cfg.border,
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
      ].join(' ')}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {displayLabel}
    </span>
  );
};

export default Badge;