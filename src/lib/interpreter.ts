import type {
  Instruction,
  InterpreterState,
  Program,
  TraceEntry,
} from './types';

export const MAX_STEPS = 1_000_000;

export function initState(
  program: Program,
  initialVars: Record<number, number>,
): InterpreterState {
  const variables: Record<number, number> = {};
  for (const v of program.variablesUsed) variables[v] = 0;
  for (const [k, val] of Object.entries(initialVars)) {
    variables[Number(k)] = Math.max(0, Math.floor(val));
  }
  return {
    pc: 0,
    variables,
    halted: false,
    steps: 0,
    trace: [],
    terminated: false,
  };
}

function snapshot(vars: Record<number, number>): Record<number, number> {
  return { ...vars };
}

function formatVar(i: number): string {
  return `x${i}`;
}

function describe(
  ins: Instruction,
  before: Record<number, number>,
  after: Record<number, number>,
  jumped: boolean,
): string {
  switch (ins.kind) {
    case 'assign_add': {
      const sv = before[ins.source] ?? 0;
      return `${formatVar(ins.target)} := ${formatVar(ins.source)} + ${ins.constant} = ${sv} + ${ins.constant} = ${after[ins.target]}`;
    }
    case 'assign_sub': {
      const sv = before[ins.source] ?? 0;
      return `${formatVar(ins.target)} := ${formatVar(ins.source)} - ${ins.constant} = max(0, ${sv} - ${ins.constant}) = ${after[ins.target]}`;
    }
    case 'goto':
      return `goto ${ins.targetLabel}`;
    case 'if_goto': {
      const v = before[ins.variable] ?? 0;
      const cond = v === ins.constant;
      return `if ${formatVar(ins.variable)}=${ins.constant} (${v}${cond ? '=' : '≠'}${ins.constant} ${cond ? 'wahr' : 'falsch'}) → ${jumped ? `springe zu ${ins.targetLabel}` : 'weiter'}`;
    }
    case 'stop':
      return 'stop';
  }
}

export function stepOnce(
  program: Program,
  state: InterpreterState,
): InterpreterState {
  if (state.halted || state.terminated) return state;
  if (state.pc < 0 || state.pc >= program.instructions.length) {
    return {
      ...state,
      halted: true,
      terminated: true,
      error: 'Programmzaehler ausserhalb des Programms.',
    };
  }
  if (state.steps >= MAX_STEPS) {
    return {
      ...state,
      halted: true,
      terminated: true,
      error: 'Moegliche Endlosschleife – mehr als 1 Mio. Schritte',
    };
  }

  const ins = program.instructions[state.pc];
  const before = state.variables;
  let nextPc = state.pc + 1;
  let vars = before;
  let jumped = false;
  let changed: number | undefined;

  switch (ins.kind) {
    case 'assign_add': {
      const val = (before[ins.source] ?? 0) + ins.constant;
      if ((before[ins.target] ?? 0) !== val) changed = ins.target;
      vars = { ...before, [ins.target]: val };
      break;
    }
    case 'assign_sub': {
      const val = Math.max(0, (before[ins.source] ?? 0) - ins.constant);
      if ((before[ins.target] ?? 0) !== val) changed = ins.target;
      vars = { ...before, [ins.target]: val };
      break;
    }
    case 'goto': {
      nextPc = program.labels[ins.targetLabel];
      jumped = true;
      break;
    }
    case 'if_goto': {
      if ((before[ins.variable] ?? 0) === ins.constant) {
        nextPc = program.labels[ins.targetLabel];
        jumped = true;
      }
      break;
    }
    case 'stop': {
      // halt after this instruction
      break;
    }
  }

  const entry: TraceEntry = {
    step: state.steps + 1,
    pc: state.pc,
    raw: ins.raw,
    description: describe(ins, before, vars, jumped),
    snapshot: snapshot(vars),
    changed,
  };

  const halted = ins.kind === 'stop';
  const terminated = halted;

  return {
    pc: halted ? state.pc : nextPc,
    variables: vars,
    halted,
    terminated,
    steps: state.steps + 1,
    trace: [...state.trace, entry],
    lastChanged: changed,
  };
}

export function runBatch(
  program: Program,
  state: InterpreterState,
  maxSteps: number,
): InterpreterState {
  let s = state;
  for (let i = 0; i < maxSteps; i++) {
    if (s.halted || s.terminated) return s;
    s = stepOnce(program, s);
    if (s.error) return s;
  }
  return s;
}

export function runToEnd(
  program: Program,
  state: InterpreterState,
): InterpreterState {
  let s = state;
  while (!s.halted && !s.terminated) {
    s = stepOnce(program, s);
    if (s.error) return s;
  }
  return s;
}
