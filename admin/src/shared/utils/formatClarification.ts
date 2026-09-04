import { clarificationQuestionParts } from "./requirementClarification";

export function formatClarificationForDisplay(text?: string | null): string {
  if (!text) return "";
  const parts = clarificationQuestionParts(text);
  if (parts.length <= 1) return text.replace(/\r\n?/g, "\n").trim();
  return parts.map((part, index) => `${index + 1}、${part}`).join("\n");
}
