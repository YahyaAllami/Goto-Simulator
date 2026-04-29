import type {
  Instruction,
  ParseResult,
  Program,
  ParseError,
} from './types';

const KEYWORDS = new Set(['goto', 'if', 'then', 'stop']);
const LABEL_RE = /^[a-zA-Z_][a-zA-Z_0-9]*$/;
const VAR_RE = /^x_?(\d+)$/;

interface RawStatement {
  text: string;
  line: number;
}

function stripComment(line: string): string {
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '/' && line[i + 1] === '/' && !inString) return line.slice(0, i);
    if (c === '#' && !inString) return line.slice(0, i);
  }
  return line;
}

function splitStatements(source: string): RawStatement[] {
  const out: RawStatement[] = [];
  const lines = source.split(/\r?\n/);
  lines.forEach((rawLine, idx) => {
    const noComment = stripComment(rawLine);
    const parts = noComment.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length === 0) continue;
      out.push({ text: trimmed, line: idx + 1 });
    }
  });
  return out;
}

function parseVar(token: string): number | null {
  const m = token.match(VAR_RE);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function parseUint(token: string): number | null {
  if (!/^\d+$/.test(token)) return null;
  return parseInt(token, 10);
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function closestLabel(target: string, candidates: string[]): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  const threshold = Math.max(1, Math.floor(target.length / 3));
  for (const c of candidates) {
    const d = editDistance(target.toLowerCase(), c.toLowerCase());
    if (d < bestDist && d <= threshold) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function err(
  message: string,
  line: number,
  excerpt?: string,
  suggestion?: string,
): ParseError {
  return { message, line, excerpt, suggestion };
}

function parseBody(
  body: string,
  line: number,
  rawFull: string,
  label: string | undefined,
): Instruction | ParseError {
  const trimmed = body.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'stop') {
    return { kind: 'stop', line, raw: rawFull, label };
  }

  if (/^goto\b/i.test(trimmed)) {
    const gotoMatch = trimmed.match(/^goto\s+([A-Za-z_][A-Za-z_0-9]*)$/i);
    if (!gotoMatch) {
      return err(
        'Ungueltige goto-Anweisung.',
        line,
        rawFull,
        'Erwartet: goto <Marke>. Die Marke muss mit Buchstabe oder Unterstrich beginnen.',
      );
    }
    const lbl = gotoMatch[1];
    if (KEYWORDS.has(lbl.toLowerCase())) {
      return err(
        `Schluesselwort "${lbl}" ist als Marke nicht erlaubt.`,
        line,
        rawFull,
        'Benenne die Marke um (z.B. "l1", "ende", "loop").',
      );
    }
    return { kind: 'goto', targetLabel: lbl, line, raw: rawFull, label };
  }

  if (/^if\b/i.test(trimmed)) {
    const ifMatch = trimmed.match(
      /^if\s+(x_?\d+)\s*=\s*(\d+)\s+then\s+goto\s+([A-Za-z_][A-Za-z_0-9]*)$/i,
    );
    if (ifMatch) {
      const v = parseVar(ifMatch[1]);
      const c = parseUint(ifMatch[2]);
      const lbl = ifMatch[3];
      if (v === null || c === null) {
        return err('Ungueltige if-Anweisung.', line, rawFull);
      }
      if (KEYWORDS.has(lbl.toLowerCase())) {
        return err(
          `Schluesselwort "${lbl}" ist als Marke nicht erlaubt.`,
          line,
          rawFull,
          'Benenne die Marke um.',
        );
      }
      return {
        kind: 'if_goto',
        variable: v,
        constant: c,
        targetLabel: lbl,
        line,
        raw: rawFull,
        label,
      };
    }
    // Missing goto between then and label
    if (/^if\s+x_?\d+\s*=\s*\d+\s+then\s+[A-Za-z_]/i.test(trimmed)) {
      return err(
        'Ungueltige if-Anweisung.',
        line,
        rawFull,
        'Fehlt "goto" vor der Marke? Erwartet: if xi = c then goto l',
      );
    }
    // Comparing to a variable instead of constant
    if (/^if\s+x_?\d+\s*=\s*x_?\d+/i.test(trimmed)) {
      return err(
        'Ungueltige if-Anweisung: rechts muss eine Konstante stehen.',
        line,
        rawFull,
        'Erlaubt: if xi = c then goto l (c ist eine Zahl, keine Variable).',
      );
    }
    return err(
      'Ungueltige if-Anweisung.',
      line,
      rawFull,
      'Erwartet: if xi = c then goto l',
    );
  }

  // Detect forbidden form: xi := xj +/- xk
  if (/^(x_?\d+)\s*:=\s*(x_?\d+)\s*[+\-]\s*(x_?\d+)$/.test(trimmed)) {
    return err(
      'Unerlaubte Form: xi := xj +/- xk (zwei Variablen rechts).',
      line,
      rawFull,
      'Rechts ist nur xj +/- Konstante erlaubt. Nutze eine Hilfsschleife, um Variablen zu addieren.',
    );
  }

  const assignMatch = trimmed.match(
    /^(x_?\d+)\s*:=\s*(x_?\d+)\s*([+\-])\s*(\d+)$/,
  );
  if (assignMatch) {
    const target = parseVar(assignMatch[1]);
    const source = parseVar(assignMatch[2]);
    const op = assignMatch[3];
    const constant = parseUint(assignMatch[4]);
    if (target === null || source === null || constant === null) {
      return err('Ungueltige Zuweisung.', line, rawFull);
    }
    return {
      kind: op === '+' ? 'assign_add' : 'assign_sub',
      target,
      source,
      constant,
      line,
      raw: rawFull,
      label,
    };
  }

  // xi := c (no source variable) or xi := xj (no operator)
  if (/^x_?\d+\s*:=\s*\d+$/.test(trimmed)) {
    return err(
      'Ungueltige Zuweisung: Quellvariable fehlt.',
      line,
      rawFull,
      'Verwende z.B. xi := x0 + c (x0 ist standardmaessig 0).',
    );
  }
  if (/^x_?\d+\s*:=\s*x_?\d+$/.test(trimmed)) {
    return err(
      'Ungueltige Zuweisung: Operator und Konstante fehlen.',
      line,
      rawFull,
      'Erwartet: xi := xj + c  (c kann 0 sein, um zu kopieren).',
    );
  }
  if (/^x_?\d+\s*:=/.test(trimmed)) {
    return err(
      'Ungueltige Zuweisung.',
      line,
      rawFull,
      'Erlaubt ist nur: xi := xj + c  oder  xi := xj - c',
    );
  }

  // = instead of :=
  if (/^x_?\d+\s*=[^=]/.test(trimmed)) {
    return err(
      `Syntaxfehler: "${trimmed}"`,
      line,
      rawFull,
      'Meintest du := statt = ? Zuweisungen brauchen ":=".',
    );
  }

  return err(
    `Syntaxfehler: "${trimmed}"`,
    line,
    rawFull,
    'Erwartet eine der fuenf Anweisungen: xi := xj +/- c, goto l, if xi = c then goto l, stop.',
  );
}

export function parseProgram(source: string): ParseResult {
  const statements = splitStatements(source);
  const instructions: Instruction[] = [];
  const labels: Record<string, number> = {};
  const labelLines: Record<string, number> = {};
  const variablesUsed = new Set<number>();

  for (const stmt of statements) {
    let body = stmt.text;
    let label: string | undefined;

    const labelMatch = body.match(/^([A-Za-z_][A-Za-z_0-9]*)\s*:(?!=)\s*(.*)$/);
    if (labelMatch) {
      const lbl = labelMatch[1];
      if (KEYWORDS.has(lbl.toLowerCase())) {
        return {
          ok: false,
          error: err(
            `Schluesselwort "${lbl}" ist als Marke nicht erlaubt.`,
            stmt.line,
            stmt.text,
            'Benenne die Marke um (z.B. "l1", "ende", "loop").',
          ),
        };
      }
      if (!LABEL_RE.test(lbl)) {
        return {
          ok: false,
          error: err(
            `Ungueltige Marke "${lbl}".`,
            stmt.line,
            stmt.text,
            'Marken beginnen mit Buchstabe oder Unterstrich, dann Buchstaben/Ziffern/Unterstriche.',
          ),
        };
      }
      if (lbl in labels) {
        return {
          ok: false,
          error: err(
            `Doppelte Marke "${lbl}" (zuerst in Zeile ${labelLines[lbl]}, erneut in Zeile ${stmt.line}).`,
            stmt.line,
            stmt.text,
            'Jede Marke darf nur einmal vergeben werden. Benenne eine der beiden Stellen um.',
          ),
        };
      }
      label = lbl;
      body = labelMatch[2];
      labels[lbl] = instructions.length;
      labelLines[lbl] = stmt.line;
      if (body.trim().length === 0) {
        return {
          ok: false,
          error: err(
            `Marke "${lbl}" ohne folgende Anweisung.`,
            stmt.line,
            stmt.text,
            'Nach "label:" muss direkt eine Anweisung stehen. Fehlendes Semikolon vorher?',
          ),
        };
      }
    }

    const parsed = parseBody(body, stmt.line, stmt.text, label);
    if ('message' in parsed) {
      return { ok: false, error: parsed };
    }
    instructions.push(parsed);

    if (parsed.kind === 'assign_add' || parsed.kind === 'assign_sub') {
      variablesUsed.add(parsed.target);
      variablesUsed.add(parsed.source);
    } else if (parsed.kind === 'if_goto') {
      variablesUsed.add(parsed.variable);
    }
  }

  if (instructions.length === 0) {
    return {
      ok: false,
      error: { message: 'Programm ist leer.' },
    };
  }

  const labelNames = Object.keys(labels);
  for (const ins of instructions) {
    if (ins.kind === 'goto' || ins.kind === 'if_goto') {
      if (!(ins.targetLabel in labels)) {
        const near = closestLabel(ins.targetLabel, labelNames);
        const suggestion = near
          ? `Meintest du "${near}"? Bekannte Marken: ${labelNames.join(', ') || '(keine)'}.`
          : `Definiere die Marke mit "${ins.targetLabel}: <anweisung>". Bekannte Marken: ${labelNames.join(', ') || '(keine)'}.`;
        return {
          ok: false,
          error: err(
            `Unbekannte Sprungmarke "${ins.targetLabel}".`,
            ins.line,
            ins.raw,
            suggestion,
          ),
        };
      }
    }
  }

  const program: Program = {
    instructions,
    labels,
    variablesUsed: Array.from(variablesUsed).sort((a, b) => a - b),
  };
  return { ok: true, program };
}
