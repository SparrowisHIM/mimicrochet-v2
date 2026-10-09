// The four body measurements the fit questions take on the tape (see fit-sheet.tsx), all in cm.

export type Measures = { bust?: number; waist?: number; hips?: number; length?: number };
export type MeasureKey = keyof Measures;

export const measureSteps: { key: MeasureKey; label: string; help: string; start: number; min: number; max: number }[] = [
  { key: "bust", label: "Bust", help: "Around the fullest part of your chest. Keep the tape level and snug, not tight.", start: 86, min: 60, max: 150 },
  { key: "waist", label: "Waist", help: "Around the narrowest part of your waist, usually just above the belly button.", start: 70, min: 50, max: 140 },
  { key: "hips", label: "Hips", help: "Around the fullest part of your hips and bottom, feet together.", start: 94, min: 70, max: 160 },
  { key: "length", label: "Length", help: "From the top of the shoulder down to where you want the piece to end.", start: 80, min: 20, max: 160 },
];

export const toIn = (cm: number) => Math.round((cm / 2.54) * 2) / 2;
