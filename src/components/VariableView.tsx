import { Card, CardContent, CardHeader } from './ui';
import { cn } from '../lib/cn';

interface Props {
  variables: Record<number, number>;
  lastChanged?: number;
  changeKey: number;
}

export function VariableView({ variables, lastChanged, changeKey }: Props) {
  const keys = Object.keys(variables)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Card>
      <CardHeader>Variablen</CardHeader>
      <CardContent>
        {keys.length === 0 ? (
          <p className="text-xs text-neutral-500">Keine Variablen.</p>
        ) : (
          <ul className="space-y-1 font-mono text-sm">
            {keys.map((k) => {
              const isChanged = lastChanged === k;
              return (
                <li
                  key={`${k}-${isChanged ? changeKey : 'static'}`}
                  className={cn(
                    'flex items-center justify-between rounded px-2 py-1',
                    isChanged && 'flash-change',
                  )}
                >
                  <span className="text-neutral-600 dark:text-neutral-300">x{k}</span>
                  <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                    {variables[k]}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
