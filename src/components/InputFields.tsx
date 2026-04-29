import { useEffect, useState } from 'react';
import { Input, Label } from './ui';

interface Props {
  values: Record<number, number>;
  onChange: (idx: number, v: number) => void;
  disabled?: boolean;
}

const IDS = [1, 2, 3, 4, 5];

export function InputFields({ values, onChange, disabled }: Props) {
  const [drafts, setDrafts] = useState<Record<number, string>>(() => {
    const d: Record<number, string> = {};
    for (const i of IDS) d[i] = String(values[i] ?? 0);
    return d;
  });

  useEffect(() => {
    setDrafts((prev) => {
      const next: Record<number, string> = { ...prev };
      for (const i of IDS) {
        const incoming = String(values[i] ?? 0);
        const current = prev[i] ?? '';
        if (parseInt(current, 10) !== parseInt(incoming, 10) || current === '') {
          next[i] = incoming;
        }
      }
      return next;
    });
  }, [values]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      {IDS.map((i) => (
        <div key={i} className="flex flex-col gap-1">
          <Label htmlFor={`x${i}`}>x{i}</Label>
          <Input
            id={`x${i}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={drafts[i] ?? ''}
            disabled={disabled}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setDrafts((d) => ({ ...d, [i]: raw }));
              const v = raw === '' ? 0 : parseInt(raw, 10);
              onChange(i, Number.isFinite(v) && v >= 0 ? v : 0);
            }}
            onBlur={() => {
              setDrafts((d) => ({ ...d, [i]: String(values[i] ?? 0) }));
            }}
          />
        </div>
      ))}
    </div>
  );
}
