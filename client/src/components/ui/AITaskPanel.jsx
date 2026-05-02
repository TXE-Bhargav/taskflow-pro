// components/ui/AITaskPanel.jsx
// Drop-in panel for any project board — generates and adds tasks via AI
// Usage: <AITaskPanel projectId={id} projectName={name} />

import { useState } from 'react';
import useAITasks from '../../hooks/useAITasks';
import Button from './Button';

const PRIORITY_STYLES = {
  URGENT: 'bg-rose-400/10 border-rose-400/20 text-rose-400',
  HIGH:   'bg-amber-400/10 border-amber-400/20 text-amber-400',
  MEDIUM: 'bg-sky-400/10 border-sky-400/20 text-sky-400',
  LOW:    'bg-emerald-400/10 border-emerald-400/20 text-emerald-400',
};

const TaskCheckRow = ({ task, index, selected, onToggle }) => (
  <div
    onClick={() => onToggle(index)}
    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
      selected
        ? 'bg-accent/10 border-accent/30'
        : 'bg-surface-3 border-border-2 hover:border-border-3'
    }`}
  >
    <div
      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
        selected ? 'bg-accent border-accent' : 'border-border-3'
      }`}
    >
      {selected && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap mb-0.5">
        <p className={`text-[12.5px] font-medium truncate ${selected ? 'text-ink-1' : 'text-ink-2'}`}>
          {task.title}
        </p>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM}`}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="text-[11.5px] text-ink-4 leading-relaxed line-clamp-2">{task.description}</p>
      )}
      {task.dueDate && (
        <p className="text-[11px] text-ink-4 mt-1">📅 Due {task.dueDate}</p>
      )}
    </div>
  </div>
);

const AITaskPanel = ({ projectId, projectName }) => {
  const [panelOpen, setPanelOpen] = useState(false);

  const {
    step, rawIdea, count, generatedTasks, selectedIndexes,
    isGenerating, isAdding,
    setRawIdea, setCount,
    generate, toggleTask, selectAll, deselectAll,
    addSelectedTasks, reset, goBack,
  } = useAITasks(projectId);

  const handleClose = () => { setPanelOpen(false); reset(); };
  const allSelected = selectedIndexes.size === generatedTasks.length;

  if (!panelOpen) {
    return (
      <button
        onClick={() => setPanelOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-accent/[0.07] hover:bg-accent/[0.12] border border-accent/20 hover:border-accent/35 rounded-lg text-[12px] font-medium text-accent-300 transition-all"
      >
        <span>✦</span>
        AI generate tasks
      </button>
    );
  }

  return (
    <div className="card-base p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-accent/15 border border-accent/25 rounded flex items-center justify-center text-accent-400 text-sm">✦</div>
          <p className="text-[12.5px] font-semibold text-ink-1">AI Task Generator</p>
        </div>
        <button onClick={handleClose} className="text-ink-4 hover:text-ink-2 transition-colors text-sm px-1">✕</button>
      </div>

      {/* Step 1 — Form */}
      {step === 'form' && (
        <>
          <div>
            <label className="text-[11.5px] text-ink-4 block mb-1.5">
              What needs to be done?
              <span className="ml-1 text-ink-4 opacity-60">(leave blank to use project name)</span>
            </label>
            <textarea
              rows={2}
              value={rawIdea}
              onChange={(e) => setRawIdea(e.target.value)}
              placeholder={`e.g. Set up auth, write tests, deploy to staging...`}
              className="input-base px-3 py-2 resize-none w-full text-[12.5px]"
            />
          </div>

          <div>
            <label className="text-[11.5px] text-ink-4 block mb-1.5">How many tasks?</label>
            <div className="flex gap-2">
              {[3, 5, 8, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`flex-1 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${
                    count === n
                      ? 'bg-accent/10 border-accent/30 text-accent-300'
                      : 'bg-surface-3 border-border-2 text-ink-3 hover:border-border-3'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" loading={isGenerating} onClick={() => generate(projectName)}>
            ✦ Generate {count} tasks
          </Button>
        </>
      )}

      {/* Step 2 — Preview */}
      {step === 'preview' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[11.5px] text-ink-4">
              {selectedIndexes.size} of {generatedTasks.length} selected
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={allSelected ? deselectAll : selectAll}
                className="text-[11px] text-accent-400 hover:text-accent-300 transition-colors"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              <button
                onClick={goBack}
                className="text-[11px] text-ink-4 hover:text-ink-2 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {generatedTasks.map((task, i) => (
              <TaskCheckRow
                key={i}
                task={task}
                index={i}
                selected={selectedIndexes.has(i)}
                onToggle={toggleTask}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              loading={isGenerating}
              onClick={() => generate(projectName)}
            >
              Regenerate
            </Button>
            <Button
              className="flex-1"
              size="sm"
              disabled={selectedIndexes.size === 0}
              loading={isAdding}
              onClick={async () => {
                await addSelectedTasks();
                handleClose();
              }}
            >
              Add {selectedIndexes.size} task{selectedIndexes.size !== 1 ? 's' : ''} →
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AITaskPanel;