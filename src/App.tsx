import { useCallback, useEffect, useMemo, useState } from 'react';
import { Moon, Sun, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CodeEditor } from './components/CodeEditor';
import { ControlPanel } from './components/ControlPanel';
import { VariableView } from './components/VariableView';
import { TraceView } from './components/TraceView';
import { ExampleSelector } from './components/ExampleSelector';
import { InputFields } from './components/InputFields';
import { Badge, Button, Card, CardContent, CardHeader } from './components/ui';
import { parseProgram } from './lib/parser';
import { initState, runBatch, runToEnd, stepOnce } from './lib/interpreter';
import { examples, type Example } from './lib/examples';
import type { InterpreterState, Program } from './lib/types';

const STORAGE_KEY = 'goto-simulator-v1';

interface Persisted {
  code: string;
  inputs: Record<number, number>;
}

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('empty');
    const parsed = JSON.parse(raw) as Persisted;
    if (typeof parsed.code !== 'string') throw new Error('bad');
    return parsed;
  } catch {
    return { code: examples[0].code, inputs: examples[0].inputs };
  }
}

function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('goto-theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('goto-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark] as const;
}

export default function App() {
  const persisted = useMemo(loadPersisted, []);
  const [code, setCode] = useState(persisted.code);
  const [inputs, setInputs] = useState<Record<number, number>>(persisted.inputs);
  const [state, setState] = useState<InterpreterState | null>(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(20);
  const [dark, setDark] = useDarkMode();
  const [changeKey, setChangeKey] = useState(0);
  const [showErrors, setShowErrors] = useState(false);

  const parseResult = useMemo(() => parseProgram(code), [code]);
  const program: Program | null = parseResult.ok ? parseResult.program : null;

  useEffect(() => {
    const data: Persisted = { code, inputs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [code, inputs]);

  useEffect(() => {
    setRunning(false);
    setState(null);
    setShowErrors(false);
  }, [code, inputs]);

  const ensureState = useCallback((): InterpreterState | null => {
    if (!program) return null;
    if (state) return state;
    const s = initState(program, inputs);
    setState(s);
    return s;
  }, [program, state, inputs]);

  const handleReset = useCallback(() => {
    setRunning(false);
    if (program) setState(initState(program, inputs));
    else setState(null);
  }, [program, inputs]);

  const handleStep = useCallback(() => {
    setShowErrors(true);
    if (!program) return;
    const base = ensureState();
    if (!base) return;
    const next = stepOnce(program, base);
    setState(next);
    if (next.lastChanged !== undefined) setChangeKey((k) => k + 1);
  }, [program, ensureState]);

  const handleRunPause = useCallback(() => {
    if (running) {
      setRunning(false);
      return;
    }
    setShowErrors(true);
    if (!program) return;
    if (!state) setState(initState(program, inputs));
    setRunning(true);
  }, [program, running, state, inputs]);

  const handleRunToEnd = useCallback(() => {
    setShowErrors(true);
    if (!program) return;
    setRunning(false);
    const base = state ?? initState(program, inputs);
    const final = runToEnd(program, base);
    setState(final);
    if (final.lastChanged !== undefined) setChangeKey((k) => k + 1);
  }, [program, state, inputs]);

  useEffect(() => {
    if (!running || !program) return;
    const stepsPerSecond = Math.max(1, Math.round(Math.pow(speed / 10, 2) * 10));
    const tickMs = 50;
    const stepsPerTick = Math.max(1, Math.round((stepsPerSecond * tickMs) / 1000));
    const id = window.setInterval(() => {
      setState((prev) => {
        const base = prev ?? initState(program, inputs);
        const next = runBatch(program, base, stepsPerTick);
        if (next.halted || next.terminated) {
          setRunning(false);
        }
        if (next.lastChanged !== undefined && next !== prev) {
          setChangeKey((k) => k + 1);
        }
        return next;
      });
    }, tickMs);
    return () => window.clearInterval(id);
  }, [running, program, inputs, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunPause();
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleStep();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRunPause, handleStep]);

  const handleLoadExample = (ex: Example) => {
    setCode(ex.code);
    setInputs({ ...ex.inputs });
  };

  const activeInstruction =
    program && state && !state.halted && state.pc < program.instructions.length
      ? program.instructions[state.pc]
      : null;
  const activeLine = activeInstruction?.line;
  const errorLine = showErrors && !parseResult.ok ? parseResult.error.line : undefined;

  const displayVars = state
    ? state.variables
    : program
      ? (() => {
          const v: Record<number, number> = {};
          for (const k of program.variablesUsed) v[k] = inputs[k] ?? 0;
          for (const [k, val] of Object.entries(inputs)) v[Number(k)] = val;
          return v;
        })()
      : inputs;

  const statusBadge = (() => {
    if (showErrors && !parseResult.ok) {
      return (
        <Badge variant="error">
          <AlertCircle className="mr-1 h-3 w-3" />
          Parse-Fehler
        </Badge>
      );
    }
    if (state?.error) {
      return (
        <Badge variant="error">
          <AlertCircle className="mr-1 h-3 w-3" />
          Laufzeitfehler
        </Badge>
      );
    }
    if (state?.halted) {
      return (
        <Badge variant="success">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Beendet nach {state.steps} Schritten
        </Badge>
      );
    }
    if (running) return <Badge variant="info">Laeuft</Badge>;
    if (state) return <Badge variant="default">Pausiert (Schritt {state.steps})</Badge>;
    return <Badge variant="muted">Bereit</Badge>;
  })();

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto w-full max-w-[960px] px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5" aria-hidden />
            <h1 className="text-lg font-medium">GOTO-Simulator</h1>
            <span className="text-xs text-neutral-500">Typ-2-Grammatik, 5 Anweisungen</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => setDark(!dark)}
            aria-label={dark ? 'Hellen Modus aktivieren' : 'Dunklen Modus aktivieren'}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        <section className="mb-6 space-y-3">
          <ExampleSelector onLoad={handleLoadExample} />
          <CodeEditor
            value={code}
            onChange={setCode}
            activeLine={activeLine}
            errorLine={errorLine}
            onResetRequest={handleReset}
          />
          {showErrors && !parseResult.ok && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {parseResult.error.line
                      ? `Zeile ${parseResult.error.line}: `
                      : ''}
                    {parseResult.error.message}
                  </p>
                  {parseResult.error.excerpt && (
                    <p className="mt-1 font-mono text-xs opacity-80">
                      {parseResult.error.excerpt}
                    </p>
                  )}
                  {parseResult.error.suggestion && (
                    <p className="mt-1 text-xs">
                      <span className="font-medium">Vorschlag:</span>{' '}
                      {parseResult.error.suggestion}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowErrors(false)}
                  className="shrink-0 rounded px-1 text-xs text-red-900/60 hover:text-red-900 dark:text-red-200/60 dark:hover:text-red-100"
                  aria-label="Fehler ausblenden"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {state?.error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>{state.error}</p>
              </div>
            </div>
          )}
        </section>

        <section className="mb-6 space-y-3">
          <InputFields
            values={inputs}
            onChange={(i, v) => setInputs({ ...inputs, [i]: v })}
            disabled={running}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ControlPanel
              running={running}
              halted={state?.halted ?? false}
              canStep={!!program}
              speed={speed}
              onSpeedChange={setSpeed}
              onReset={handleReset}
              onStep={handleStep}
              onRunPause={handleRunPause}
              onRunToEnd={handleRunToEnd}
            />
            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              {statusBadge}
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            Tastenkuerzel: <code>Strg/Cmd+Enter</code> Run/Pause &nbsp;•&nbsp; <code>F10</code> Schritt &nbsp;•&nbsp; <code>Strg/Cmd+R</code> Reset (im Editor)
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <VariableView
            variables={displayVars}
            lastChanged={state?.lastChanged}
            changeKey={changeKey}
          />
          <Card>
            <CardHeader>Naechste Anweisung</CardHeader>
            <CardContent>
              {!program ? (
                <p className="text-xs text-neutral-500">Programm hat Fehler.</p>
              ) : activeInstruction ? (
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">
                    PC = {state?.pc ?? 0} &nbsp;•&nbsp; Zeile {activeInstruction.line}
                  </p>
                  <code className="block rounded bg-blue-50 px-2 py-1 font-mono text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                    {activeInstruction.label ? `${activeInstruction.label}: ` : ''}
                    {activeInstruction.raw.replace(/^[A-Za-z_][A-Za-z_0-9]*\s*:\s*/, '')}
                  </code>
                </div>
              ) : state?.halted ? (
                <p className="text-xs text-green-700 dark:text-green-400">
                  Programm beendet.
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">PC = 0</p>
                  <code className="block rounded bg-neutral-50 px-2 py-1 font-mono text-sm dark:bg-neutral-800">
                    {program.instructions[0]?.raw ?? '—'}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>
          <TraceView trace={state?.trace ?? []} autoScroll={running} />
        </section>
      </div>
    </div>
  );
}
