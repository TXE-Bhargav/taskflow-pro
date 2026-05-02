// hooks/useAITasks.js
// Handles AI task generation and bulk creation for a project

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { aiService } from '../services/ai.service';
import { taskService } from '../services/task.service';

const useAITasks = (projectId) => {
  const queryClient = useQueryClient();

  const [step, setStep] = useState('form');        // 'form' | 'preview'
  const [rawIdea, setRawIdea] = useState('');
  const [count, setCount] = useState(5);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const generate = async (projectName) => {
    setIsGenerating(true);
    try {
      const data = await aiService.generateTasksFromIdea({
        rawIdea: rawIdea.trim() || `Tasks for ${projectName}`,
        projectName,
        count,
      });
      const tasks = data?.tasks || [];
      setGeneratedTasks(tasks);
      setSelectedIndexes(new Set(tasks.map((_, i) => i)));
      setStep('preview');
    } catch {
      toast.error('Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTask = (index) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const selectAll = () => setSelectedIndexes(new Set(generatedTasks.map((_, i) => i)));
  const deselectAll = () => setSelectedIndexes(new Set());

  const addSelectedTasks = async () => {
    if (!projectId) return;
    const toCreate = generatedTasks.filter((_, i) => selectedIndexes.has(i));
    setIsAdding(true);
    let created = 0;
    for (const t of toCreate) {
      try {
        await taskService.createTask(projectId, {
          title: t.title,
          description: t.description || null,
          priority: t.priority || 'MEDIUM',
          dueDate: t.dueDate || null,
          status: 'TODO',
          assigneeId: t.assigneeId || null,
        });
        created++;
      } catch (e) {
        console.error('Failed to create task:', t.title, e.message);
      }
    }
    setIsAdding(false);
    queryClient.invalidateQueries(['tasks', projectId]);
    toast.success(`${created} task${created !== 1 ? 's' : ''} added!`);
    reset();
    return created;
  };

  const reset = () => {
    setStep('form');
    setRawIdea('');
    setGeneratedTasks([]);
    setSelectedIndexes(new Set());
  };

  return {
    // state
    step,
    rawIdea,
    count,
    generatedTasks,
    selectedIndexes,
    isGenerating,
    isAdding,
    // setters
    setRawIdea,
    setCount,
    // actions
    generate,
    toggleTask,
    selectAll,
    deselectAll,
    addSelectedTasks,
    reset,
    goBack: () => setStep('form'),
  };
};

export default useAITasks;