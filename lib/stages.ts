// The five stages every custom order moves through (Figma "Stage stepper" / "Tracking card").
export const stages = [
  { key: "idea", label: "Idea received", short: "Idea", tone: "amber" },
  { key: "price", label: "Price agreed", short: "Price", tone: "amber" },
  { key: "making", label: "In progress", short: "Making", tone: "amber" },
  { key: "ready", label: "Ready", short: "Ready", tone: "emerald" },
  { key: "delivered", label: "Delivered", short: "Delivered", tone: "emerald" },
] as const;

export type StageKey = (typeof stages)[number]["key"];

export function stageIndex(key: StageKey) {
  return stages.findIndex((s) => s.key === key);
}

// Ready pieces bought at checkout move through four steps instead.
export const shopStages = ["Paid", "Packing", "On its way", "Delivered"] as const;

/** The step a shop order is on: paid means Mimi is already packing it (one tap later it's with the rider). */
export const shopStep = (stage: number) => (stage === 0 ? 1 : stage);
