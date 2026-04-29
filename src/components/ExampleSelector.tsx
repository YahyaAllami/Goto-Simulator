import { useState } from 'react';
import { Button, Label, Select } from './ui';
import { examples, type Example } from '../lib/examples';
import { Download } from 'lucide-react';

interface Props {
  onLoad: (ex: Example) => void;
}

export function ExampleSelector({ onLoad }: Props) {
  const [selected, setSelected] = useState(examples[0].id);

  const load = () => {
    const ex = examples.find((e) => e.id === selected);
    if (ex) onLoad(ex);
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor="example-select">Beispielprogramm</Label>
        <Select
          id="example-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="min-w-[220px]"
        >
          {examples.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </Select>
      </div>
      <Button variant="secondary" onClick={load}>
        <Download className="h-4 w-4" />
        Laden
      </Button>
    </div>
  );
}
