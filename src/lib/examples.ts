export interface Example {
  id: string;
  name: string;
  inputs: Record<number, number>;
  description: string;
  code: string;
}

export const examples: Example[] = [
  {
    id: 'addition',
    name: 'Addition  x3 := x1 + x2',
    inputs: { 1: 3, 2: 2 },
    description: 'Erwartung: x1=3, x2=2 → x3=5',
    code: `// Addition: x3 := x1 + x2
// Eingabe: x1, x2    Ausgabe: x3
// Beispiel: x1=3, x2=2 → x3=5
x3 := x1 + 0;
loop: if x2 = 0 then goto ende;
      x3 := x3 + 1;
      x2 := x2 - 1;
      goto loop;
ende: stop`,
  },
  {
    id: 'subtraktion',
    name: 'Subtraktion  x3 := x1 - x2',
    inputs: { 1: 7, 2: 3 },
    description: 'Modifizierte Subtraktion (fuer x1 >= x2). Beispiel: 7-3=4',
    code: `// Subtraktion: x3 := x1 - x2 (modifiziert, >= 0)
// Beispiel: x1=7, x2=3 → x3=4
x3 := x1 + 0;
loop: if x2 = 0 then goto ende;
      x3 := x3 - 1;
      x2 := x2 - 1;
      goto loop;
ende: stop`,
  },
  {
    id: 'multiplikation',
    name: 'Multiplikation  x3 := x1 * x2',
    inputs: { 1: 4, 2: 3 },
    description: 'Verschachtelte Schleife. Beispiel: 4*3=12',
    code: `// Multiplikation: x3 := x1 * x2
// Aeussere Schleife x1 mal: addiere x2 zu x3
// Beispiel: x1=4, x2=3 → x3=12
outer: if x1 = 0 then goto ende;
       x4 := x2 + 0;
inner: if x4 = 0 then goto weiter;
       x3 := x3 + 1;
       x4 := x4 - 1;
       goto inner;
weiter: x1 := x1 - 1;
        goto outer;
ende: stop`,
  },
  {
    id: 'maximum',
    name: 'Maximum  x3 := max(x1, x2)',
    inputs: { 1: 5, 2: 8 },
    description: 'Paralleles Runterzaehlen. Beispiel: max(5,8)=8',
    code: `// Maximum: x3 := max(x1, x2)
// Zaehle x1 und x2 parallel runter. Wer zuerst 0 erreicht, ist kleiner.
// Beispiel: x1=5, x2=8 → x3=8
x4 := x1 + 0;
x5 := x2 + 0;
loop: if x4 = 0 then goto x2gewinnt;
      if x5 = 0 then goto x1gewinnt;
      x4 := x4 - 1;
      x5 := x5 - 1;
      goto loop;
x1gewinnt: x3 := x1 + 0;
           goto ende;
x2gewinnt: x3 := x2 + 0;
ende: stop`,
  },
  {
    id: 'gerade',
    name: 'Gerade-Pruefung  x2 := [x1 gerade]',
    inputs: { 1: 6 },
    description: 'Flag-Toggle. x2=1 falls x1 gerade, sonst 0. Beispiel: 6→1, 7→0',
    code: `// Gerade-Pruefung: x2 := 1 falls x1 gerade, sonst 0
// Toggle Flag bei jedem Dekrement von x1
// Beispiel: x1=6 → x2=1 ; x1=7 → x2=0
x2 := x0 + 1;
x3 := x1 + 0;
loop: if x3 = 0 then goto ende;
      x3 := x3 - 1;
      if x2 = 0 then goto setze_eins;
      x2 := x2 - 1;
      goto loop;
setze_eins: x2 := x0 + 1;
            goto loop;
ende: stop`,
  },
  {
    id: 'fakultaet',
    name: 'Fakultaet  x2 := x1!',
    inputs: { 1: 4 },
    description: 'Drei verschachtelte Schleifen. Beispiel: 4!=24',
    code: `// Fakultaet: x2 := x1!
// x2 = Ergebnis, x3 = Zaehler (Faktor), x4 = Zwischenspeicher
// Innerste Schleife addiert x4 genau x6-mal auf x2.
// Beispiel: x1=4 → x2=24
x2 := x0 + 1;
x3 := x1 + 0;
outer: if x3 = 0 then goto ende;
       x4 := x2 + 0;
       x2 := x0 + 0;
       x6 := x3 + 0;
inner: if x6 = 0 then goto nach_inner;
       x7 := x4 + 0;
add:   if x7 = 0 then goto add_fertig;
       x2 := x2 + 1;
       x7 := x7 - 1;
       goto add;
add_fertig: x6 := x6 - 1;
            goto inner;
nach_inner: x3 := x3 - 1;
            goto outer;
ende: stop`,
  },
  {
    id: 'summe',
    name: 'Summe 1..n  x2 := 1+2+...+x1',
    inputs: { 1: 5 },
    description: 'Gauss-Summe. Beispiel: n=5 → 15',
    code: `// Summe 1 + 2 + ... + x1 nach x2
// Beispiel: x1=5 → x2=15
x3 := x1 + 0;
loop: if x3 = 0 then goto ende;
      x4 := x3 + 0;
add:  if x4 = 0 then goto add_fertig;
      x2 := x2 + 1;
      x4 := x4 - 1;
      goto add;
add_fertig: x3 := x3 - 1;
            goto loop;
ende: stop`,
  },
];
