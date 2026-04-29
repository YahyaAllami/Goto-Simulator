import { useMemo, useRef, useEffect, useState } from 'react';
import { Textarea } from './ui';
import { cn } from '../lib/cn';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  activeLine?: number;
  errorLine?: number;
  onResetRequest?: () => void;
}

export function CodeEditor({ value, onChange, activeLine, errorLine, onResetRequest }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [cheatOpen, setCheatOpen] = useState(false);

  const lines = useMemo(() => value.split('\n'), [value]);
  const lineCount = Math.max(lines.length, 1);

  useEffect(() => {
    const ta = textareaRef.current;
    const gutter = gutterRef.current;
    const hl = highlightRef.current;
    if (!ta) return;
    const sync = () => {
      if (gutter) gutter.scrollTop = ta.scrollTop;
      if (hl) hl.scrollTop = ta.scrollTop;
    };
    ta.addEventListener('scroll', sync);
    return () => ta.removeEventListener('scroll', sync);
  }, []);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      onResetRequest?.();
    }
  };

  const lineHeight = 20;

  return (
    <div>
      <div className="relative flex overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
        <div
          ref={gutterRef}
          aria-hidden
          className="select-none bg-neutral-50 text-right font-mono text-xs text-neutral-400 dark:bg-neutral-950 dark:text-neutral-500"
          style={{
            width: '2.5rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            paddingRight: '0.5rem',
            lineHeight: `${lineHeight}px`,
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="relative flex-1">
          <div
            ref={highlightRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden p-2 font-mono text-sm"
            style={{ lineHeight: `${lineHeight}px` }}
          >
            {Array.from({ length: lineCount }).map((_, i) => {
              const isActive = activeLine === i + 1;
              const isError = errorLine === i + 1;
              return (
                <div
                  key={i}
                  className={cn(
                    'whitespace-pre',
                    isError && 'bg-red-200/70 dark:bg-red-900/60',
                    isActive && !isError && 'bg-blue-100 dark:bg-blue-900/50',
                  )}
                >
                  &nbsp;
                </div>
              );
            })}
          </div>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            spellCheck={false}
            className="relative min-h-[220px] resize-y rounded-none border-0 bg-transparent p-2 leading-5"
            style={{ lineHeight: `${lineHeight}px` }}
            aria-label="GOTO-Programm Quellcode"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCheatOpen((x) => !x)}
        className="mt-2 inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        aria-expanded={cheatOpen}
      >
        {cheatOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        Syntaxuebersicht
      </button>
      {cheatOpen && (
        <div className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-950">
          <ul className="space-y-1 font-mono text-neutral-700 dark:text-neutral-300">
            <li><code>xi := xj + c</code> &nbsp;— Zuweisung mit Addition</li>
            <li><code>xi := xj - c</code> &nbsp;— modifizierte Subtraktion (nie negativ)</li>
            <li><code>goto l</code> &nbsp;— unbedingter Sprung</li>
            <li><code>if xi = c then goto l</code> &nbsp;— bedingter Sprung</li>
            <li><code>stop</code> &nbsp;— Programmende</li>
          </ul>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Marke: <code>l1: anweisung;</code> &nbsp;•&nbsp; Trennung durch <code>;</code> oder Zeilenumbruch &nbsp;•&nbsp; Kommentar: <code>//</code> oder <code>#</code>
          </p>
        </div>
      )}
    </div>
  );
}
