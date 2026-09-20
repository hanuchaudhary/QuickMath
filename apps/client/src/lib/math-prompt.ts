export type StackedPrompt = {
  top: string;
  operator: string;
  bottom: string;
};

const SIMPLE = /^(-?\d+)\s*([+\-*/^÷×])\s*(-?\d+)$/;

export function parseStackedPrompt(prompt: string): StackedPrompt | null {
  const match = prompt.trim().match(SIMPLE);
  if (!match) return null;
  const operator =
    match[2] === "/" ? "÷" : match[2] === "*" ? "×" : match[2]!;
  return { top: match[1]!, operator, bottom: match[3]! };
}

export function evaluatePrompt(prompt: string): number | null {
  const expr = prompt.trim().replaceAll("^", "**").replaceAll("×", "*").replaceAll("÷", "/");
  if (!/^[\d+\-*/().\s]+$/.test(expr.replaceAll("**", "*"))) return null;
  try {
    const result = Function(`"use strict"; return (${expr})`)();
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}
