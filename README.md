# GOTO-Simulator

Simulator für **GOTO-Programme** (theoretische Informatik, Typ-2-Grammatik nach Vossen/Witt bzw. Asteroth/Baier).
Parst, führt aus und traced GOTO-Code Schritt für Schritt im Browser.
Das Projekt ist mein Coping Mechnasim für theoretische Informatik

## Setup

```bash
npm install
npm run dev
```

Öffnet den Simulator unter `http://localhost:5173`.

Weitere Skripte:

```bash
npm run build   # tsc + vite build
npm run preview # Preview des Produktionsbuilds
```

Reiner Client: keine API, keine Konten. Letztes Programm und Startwerte werden in `localStorage` abgelegt.

## Syntaxübersicht

Fünf elementare Anweisungstypen:

| Form | Bedeutung |
|------|-----------|
| `xi := xj + c` | Zuweisung mit Addition (`c` nichtnegative Konstante) |
| `xi := xj - c` | Modifizierte Subtraktion (`max(0, xj - c)`) |
| `goto l` | Unbedingter Sprung zur Marke `l` |
| `if xi = c then goto l` | Bedingter Sprung |
| `stop` | Programmende |

Weitere Regeln:

- Variablen `x0, x1, x2, …`. Nicht initialisierte Variablen sind `0`.
- `x_1` ist äquivalent zu `x1`.
- Marken: `[a-zA-Z_][a-zA-Z_0-9]*`, eindeutig, keine Schlüsselwörter.
- Label-Syntax: `l1: anweisung;`
- Trennung: Semikolon `;` oder Zeilenumbruch (beides).
- Schlüsselwörter `goto`, `if`, `then`, `stop` sind case-insensitive.
- Kommentare: `//` oder `#` bis Zeilenende.
- **Nicht erlaubt:** `xi := xj + xk` (zwei Variablen rechts). Nur Konstanten.

## Bedienung

- **Beispiel laden**: Dropdown oben + „Laden".
- **Schritt** (F10): führt genau eine Anweisung aus.
- **Run/Pause** (Strg/Cmd+Enter): kontinuierlicher Lauf mit regelbarer Geschwindigkeit.
- **Bis Ende**: läuft das Programm ohne Animation bis zum `stop`.
- **Reset** (Strg/Cmd+R im Editor): setzt den Interpreter auf die Startwerte zurück.
- Tempo-Slider: Schritte pro Sekunde. Bei hoher Einstellung werden Schritte pro UI-Tick gebatcht.

## Schutzmechanismen

- Nach 1.000.000 Schritten ohne `stop` bricht der Interpreter mit „Moegliche Endlosschleife" ab.
- Parser meldet mit Zeilenangabe: unbekannte Marken, doppelte Marken, Syntaxfehler, unerlaubte Form.

## Beispielprogramme

Mitgeliefert: Addition, Subtraktion, Multiplikation, Maximum, Gerade-Prüfung, Fakultät, Summe 1..n. Jedes Beispiel hat im Kommentarkopf die erwarteten Ein- und Ausgaben.

## Projektstruktur

```
src/
  components/
    CodeEditor.tsx
    ControlPanel.tsx
    ExampleSelector.tsx
    InputFields.tsx
    TraceView.tsx
    VariableView.tsx
    ui.tsx
  lib/
    parser.ts
    interpreter.ts
    examples.ts
    types.ts
    cn.ts
  App.tsx
  main.tsx
  index.css
```

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS v3 (Dark-Mode via `class`)
- lucide-react Icons
- State ausschließlich über React-Hooks
