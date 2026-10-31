import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FarmTask } from '../types';
import { 
  CalendarDays, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Sparkles,
  ChevronRight,
  Droplets
} from 'lucide-react';
import { api } from '../services/api';

interface CropCalendarTimelineProps {
  cropName?: string;
  cropStage?: string;
  tasks?: FarmTask[];
  onTasksUpdated?: () => void;
}

export const CropCalendarTimeline: React.FC<CropCalendarTimelineProps> = ({
  cropName = 'Soybean',
  cropStage = 'Flowering',
  tasks = [],
  onTasksUpdated
}) => {
  const { t } = useApp();
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('HIGH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stages definition for Soybean (and standard Kharif)
  const stages = [
    { name: 'Land Preparation', days: '0-15 Days', isCompleted: true },
    { name: 'Sowing & Emergence', days: 'Day 0-5', isCompleted: true },
    { name: 'Vegetative & Weeding', days: 'Day 15-35', isCompleted: true },
    { name: 'Flowering (Critical)', days: 'Day 35-55', isCurrent: true },
    { name: 'Pod & Grain Filling', days: 'Day 55-75', isUpcoming: true },
    { name: 'Maturity & Harvest', days: 'Day 75-95', isUpcoming: true }
  ];

  const handleToggleTask = async (task: FarmTask) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.updateTaskStatus(task._id, newStatus);
      if (onTasksUpdated) onTasksUpdated();
    } catch (err: any) {
      alert(`Could not update task: ${err.message}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    setIsSubmitting(true);
    try {
      await api.createTask({
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority
      });
      setShowAddTask(false);
      setTaskTitle('');
      setTaskDesc('');
      if (onTasksUpdated) onTasksUpdated();
    } catch (err: any) {
      alert(`Failed to create task: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              {t.cropCalendar}: {cropName}
            </h2>
            <p className="text-xs text-slate-500">
              Current Stage: <span className="font-semibold text-emerald-700">{cropStage}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddTask(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Stage Progress Bar / Stepper */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
            Phenological Growth Stage Tracker
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {stages.map((stg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border text-center transition ${
                  stg.isCurrent
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/30'
                    : stg.isCompleted
                    ? 'bg-slate-50 border-slate-200 opacity-80'
                    : 'bg-white border-dashed border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex justify-center mb-1">
                  {stg.isCurrent ? (
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                  ) : stg.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300" />
                  )}
                </div>
                <div className={`text-xs font-bold ${stg.isCurrent ? 'text-emerald-900' : 'text-slate-800'}`}>
                  {stg.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {stg.days}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Farm Tasks Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>{t.tasks} & Schedule</span>
            <span className="text-[11px] font-normal text-slate-400">
              {tasks.filter(t => t.status === 'COMPLETED').length}/{tasks.length} Completed
            </span>
          </div>

          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 rounded-xl bg-slate-50 border border-slate-100">
                No pending tasks. Run the autonomous agent to generate customized tasks.
              </div>
            ) : (
              tasks.map((task) => {
                const isDone = task.status === 'COMPLETED';
                return (
                  <div
                    key={task._id}
                    onClick={() => handleToggleTask(task)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 select-none ${
                      isDone
                        ? 'bg-slate-50/70 border-slate-200 line-through opacity-60'
                        : task.priority === 'HIGH' || task.priority === 'URGENT'
                        ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button className="mt-0.5 flex-shrink-0 text-emerald-600">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-500 transition" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold ${isDone ? 'text-slate-500' : 'text-slate-900'}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            task.source === 'AGENT_AUTO' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {task.source === 'AGENT_AUTO' ? 'AI Agent' : 'Manual'}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            task.priority === 'HIGH' || task.priority === 'URGENT'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-lg mb-1">
              Add New Farm Activity
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Schedule a field operation, weeding, or irrigation reminder.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect BBF drainage channels"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description / Agronomic Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Details about equipment, plots, or weather alerts..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
