import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, CheckCircle2, Circle, ArrowUpRight, PartyPopper } from 'lucide-react';
import { useChecklist } from '@/contexts/ChecklistContext';

export function ChecklistBadge() {
  const { steps, completedCount, totalSteps, percentage, isAllCompleted } = useChecklist();
  const [expanded, setExpanded] = useState(false);

  if (isAllCompleted && !expanded) {
    // Fully completed - show compact green badge
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 shadow-lg text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
        >
          <PartyPopper className="h-4 w-4" />
          My checklist
          <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-bold text-green-800">
            Done!
          </span>
          <ChevronUp className="h-4 w-4 text-green-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Toggle button */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          My checklist
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            percentage >= 67 ? 'bg-green-100 text-green-700' :
            percentage >= 33 ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            Completed {percentage}%
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="w-[340px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header - purple like reference */}
          <div className="bg-[#5544e4] px-5 py-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-1.5">
                Welcome to menukits <PartyPopper className="h-4 w-4" />
              </h3>
              <button
                onClick={() => setExpanded(false)}
                className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress bar area */}
          <div className="px-5 pt-4 pb-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {completedCount} of {totalSteps} completed
              </span>
              <span className="text-sm font-bold text-gray-900">{percentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Steps list */}
          <div className="px-5 pb-5 pt-3 space-y-0">
            {steps.map((step) => (
              <Link
                key={step.id}
                to={step.completed ? '#' : (step.actionPath || '#')}
                onClick={(e) => {
                  if (step.completed) e.preventDefault();
                  else if (!step.actionPath) e.preventDefault();
                  if (step.actionPath) setExpanded(false);
                }}
                className="flex items-center gap-3 py-3 group"
              >
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-gray-300 group-hover:text-gray-400" />
                )}
                <span className={`text-sm font-medium flex-1 ${
                  step.completed
                    ? 'text-gray-400 line-through'
                    : 'text-gray-700 group-hover:text-gray-900'
                }`}>
                  {step.label}
                </span>
                {!step.completed && step.actionPath && (
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-gray-600" />
                )}
              </Link>
            ))}
          </div>

          {/* Collapse handle at bottom */}
          <button
            onClick={() => setExpanded(false)}
            className="flex w-full items-center justify-center gap-1.5 border-t border-gray-100 py-2.5 text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
