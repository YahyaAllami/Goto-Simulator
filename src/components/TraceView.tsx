import { useEffect, useRef, useState } from 'react';
import { Button, Card, CardContent, CardHeader } from './ui';
import { Copy, Check } from 'lucide-react';
import type { TraceEntry } from '../lib/types';

interface Props {
  trace: TraceEntry[];
  autoScroll: boolean;
}

export function TraceView({ trace, autoScroll }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ block: 'end' });
    }
  }, [trace.length, autoScroll]);

  const entries = showAll ? trace : trace.slice(-20);

  const copyTrace = async () => {
    const header = ['Schritt', 'PC', 'Anweisung', 'Aktion', 'Zustand'].join('\t');
    const rows = trace.map((e) => {
      const snap = Object.keys(e.snapshot)
        .map(Number)
        .sort((a, b) => a - b)
        .map((k) => `x${k}=${e.snapshot[k]}`)
        .join(' ');
      return [e.step, e.pc, e.raw.replace(/\s+/g, ' '), e.description, snap].join('\t');
    });
    const text = [header, ...rows].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <span>Trace</span>
          <div className="flex items-center gap-2">
            {trace.length > 20 && (
              <button
                type="button"
                onClick={() => setShowAll((x) => !x)}
                className="text-[10px] font-medium uppercase text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                {showAll ? 'Letzte 20' : 'Ganzen Trace'}
              </button>
            )}
            <Button
              variant="ghost"
              onClick={copyTrace}
              className="h-6 px-1.5 py-0 text-[10px]"
              disabled={trace.length === 0}
              aria-label="Trace kopieren"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Kopiert' : 'Kopieren'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollerRef}
          className="max-h-72 overflow-y-auto font-mono text-xs"
        >
          {entries.length === 0 ? (
            <p className="py-2 text-center text-neutral-500">Noch keine Schritte.</p>
          ) : (
            <ol className="space-y-1">
              {entries.map((e) => {
                const snap = Object.keys(e.snapshot)
                  .map(Number)
                  .sort((a, b) => a - b)
                  .map((k) => `x${k}=${e.snapshot[k]}`)
                  .join('  ');
                return (
                  <li
                    key={e.step}
                    className="flex flex-col gap-0.5 border-b border-neutral-100 pb-1 last:border-0 dark:border-neutral-800"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="w-8 shrink-0 text-right tabular-nums text-neutral-400">
                        {e.step}
                      </span>
                      <span className="text-neutral-900 dark:text-neutral-100">
                        {e.description}
                      </span>
                    </div>
                    <div className="pl-10 text-neutral-500 dark:text-neutral-400">
                      {snap}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <div ref={bottomRef} />
        </div>
      </CardContent>
    </Card>
  );
}
