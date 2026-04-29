export type InstructionKind =
  | 'assign_add'
  | 'assign_sub'
  | 'goto'
  | 'if_goto'
  | 'stop';

export interface BaseInstruction {
  kind: InstructionKind;
  label?: string;
  line: number;
  raw: string;
}

export interface AssignAddInstruction extends BaseInstruction {
  kind: 'assign_add';
  target: number;
  source: number;
  constant: number;
}

export interface AssignSubInstruction extends BaseInstruction {
  kind: 'assign_sub';
  target: number;
  source: number;
  constant: number;
}

export interface GotoInstruction extends BaseInstruction {
  kind: 'goto';
  targetLabel: string;
}

export interface IfGotoInstruction extends BaseInstruction {
  kind: 'if_goto';
  variable: number;
  constant: number;
  targetLabel: string;
}

export interface StopInstruction extends BaseInstruction {
  kind: 'stop';
}

export type Instruction =
  | AssignAddInstruction
  | AssignSubInstruction
  | GotoInstruction
  | IfGotoInstruction
  | StopInstruction;

export interface Program {
  instructions: Instruction[];
  labels: Record<string, number>;
  variablesUsed: number[];
}

export interface ParseError {
  message: string;
  line?: number;
  excerpt?: string;
  suggestion?: string;
}

export type ParseResult =
  | { ok: true; program: Program }
  | { ok: false; error: ParseError };

export interface TraceEntry {
  step: number;
  pc: number;
  raw: string;
  description: string;
  snapshot: Record<number, number>;
  changed?: number;
}

export interface InterpreterState {
  pc: number;
  variables: Record<number, number>;
  halted: boolean;
  steps: number;
  trace: TraceEntry[];
  error?: string;
  terminated: boolean;
  lastChanged?: number;
}

export interface StepResult {
  state: InterpreterState;
  done: boolean;
}
