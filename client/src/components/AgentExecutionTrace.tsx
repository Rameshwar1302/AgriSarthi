import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AgentExecutionStep, EvaluatedRisk, StructuredAdvisory } from '../types';
import { 
  Bot, 
  Play, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  ListTodo,
  BellRing
} from 'lucide-react';
import { api } from '../services/api';

interface AgentExecutionTraceProps {
  onWorkflowCompleted?: () => void;
}

export const AgentExecutionTrace: React.FC<AgentExecutionTraceProps> = ({ onWorkflowCompleted }) => {
  const { language, t, dashboardData } = useApp();
  const [isRunning, setIsRunning] = useState(false);
  const [trace, setTrace] = useState<AgentExecutionStep[]>([]);
  const [advisoryResult, setAdvisoryResult] = useState<StructuredAdvisory | null>(null);
  const [createdTasks, setCreatedTasks] = useState<any[]>([]);
  const [createdAlerts, setCreatedAlerts] = useState<any[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [totalTimeMs, setTotalTimeMs] = useState<number>(0);

  const handleRunAgent = async () => {
    setIsRunning(true);
    setTrace([]);
    setAdvisoryResult(null);
    setCreatedTasks([]);
    setCreatedAlerts([]);

    try {
      const res = await api.runAgent({
        cropName: dashboardData?.crop.name || 'Soybean',
        cropStage: dashboardData?.crop.stage || 'Flowering',
        language: language,
        question: 'Run full autonomous agritech screening workflow for current weather and market conditions.'
      });

      setTrace(res.executionTrace || []);
      setAdvisoryResult(res.advisory || null);
      setCreatedTasks(res.createdTasks || []);
      setCreatedAlerts(res.createdAlerts || []);
      setTotalTimeMs(res.totalDurationMs || 0);

      if (onWorkflowCompleted) {
        onWorkflowCompleted();
      }
    } catch (err: any) {
      alert(`Agent execution error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Decorative ambient backdrop glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header & Run Trigger */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                {t.agentAutonomousTitle}
              </h2>
              <p className="text-xs text-slate-400">
                Multi-system orchestration: Weather Forecasts • SoilGrids • Mandi Prices • Risk Engine • Grounded Advisory
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunAgent}
          disabled={isRunning}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition transform active:scale-95 shadow-lg ${
            isRunning
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/50'
          }`}
        >
          {isRunning ? (
            <>
              <Cpu className="w-4 h-4 animate-spin text-emerald-400" />
              <span>{t.agentExecuting}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{t.runAgentWorkflowBtn}</span>
            </>
          )}
        </button>
      </div>

      {/* Execution Content */}
      <div className="relative z-10 mt-6 space-y-6">
        {/* If trace is empty and not running */}
        {trace.length === 0 && !isRunning && (
          <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">
              Autonomous Agent Ready to Orchestrate
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Click the button above to trigger the 9-tool sequential agent workflow. The agent will ingest live Open-Meteo forecasts, compute heavy rainfall & waterlogging risk thresholds, cross-reference AGMARKNET mandi prices, synthesize an agronomist advisory, and automatically generate prioritized farm tasks and alerts.
            </p>
          </div>
        )}

        {/* Live / Completed Execution Trace */}
        {trace.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {t.agentTraceTitle} ({trace.length} Tools Executed)
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" /> Total Duration: {totalTimeMs}ms
              </span>
            </div>

            {/* Stepper pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {trace.map((step) => {
                const isExpanded = expandedStep === step.stepNumber;
                return (
                  <div
                    key={step.stepNumber}
                    className={`rounded-xl border transition overflow-hidden ${
                      isExpanded 
                        ? 'bg-slate-800/90 border-emerald-500/60 ring-1 ring-emerald-500/30' 
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => toggleStep(step.stepNumber)}
                      className="w-full text-left p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px] border border-emerald-500/30">
                          {step.stepNumber}
                        </span>
                        <div className="truncate">
                          <span className="font-mono font-bold text-emerald-300 block truncate">
                            {step.toolName}()
                          </span>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {step.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 text-slate-400">
                        <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {step.executionTimeMs}ms
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Collapsible Tool IO Detail */}
                    {isExpanded && (
                      <div className="p-3.5 pt-0 border-t border-slate-800 text-xs font-mono space-y-2.5 bg-black/30">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Input Parameters:
                          </span>
                          <pre className="p-2 rounded-lg bg-slate-950 text-slate-300 overflow-x-auto text-[11px]">
                            {JSON.stringify(step.input, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                            Tool Return Output:
                          </span>
                          <pre className="p-2 rounded-lg bg-slate-950 text-emerald-300/90 overflow-x-auto text-[11px] max-h-40">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Synthesized Advisory & Autonomous Actions */}
        {advisoryResult && (
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                Synthesized Multilingual Agronomic Advisory
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                advisoryResult.riskLevel === 'HIGH' || advisoryResult.riskLevel === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {advisoryResult.riskLevel} Risk Level
              </span>
            </div>

            {/* Direct Answer */}
            <div className="text-sm font-medium text-slate-100 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-emerald-500/20">
              {advisoryResult.directAnswer}
            </div>

            {/* Recommended Actions */}
            {advisoryResult.recommendedActions && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Recommended Immediate Actions ({advisoryResult.timeline}):
                </span>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {advisoryResult.recommendedActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* What to avoid */}
            {advisoryResult.whatToAvoid && advisoryResult.whatToAvoid.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  What to Avoid:
                </span>
                <ul className="text-xs text-amber-200/80 space-y-1 list-disc list-inside">
                  {advisoryResult.whatToAvoid.map((avoid, i) => (
                    <li key={i}>{avoid}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Automated Actions Dispatched Banner */}
            <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              {createdTasks.length > 0 && (
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <ListTodo className="w-4 h-4" />
                  <span>{createdTasks.length} Task(s) automatically created in farm scheduler</span>
                </div>
              )}
              {createdAlerts.length > 0 && (
                <div className="flex items-center gap-1.5 text-amber-300">
                  <BellRing className="w-4 h-4" />
                  <span>{createdAlerts.length} High-priority in-app alert dispatched</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

