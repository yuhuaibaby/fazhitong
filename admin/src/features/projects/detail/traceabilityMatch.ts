import { aiApi } from "../../../api/client";
import { defectsApi } from "../../../api/defect.api";

export type TracePreview = Awaited<ReturnType<typeof defectsApi.previewTraceability>>;
export type TracePreviewItem = TracePreview["items"][number];

export function normalizeTracePreview(preview: TracePreview): TracePreview {
  const items = Array.isArray(preview.items) ? preview.items : [];
  return {
    ...preview,
    total: Number(preview.total || items.length || 0),
    recommended: items.filter((item) => item.recommended && item.testCaseId).length,
    items,
  };
}

export function updateTracePreviewItem(
  preview: TracePreview | null,
  defectId: string,
  updater: (item: TracePreviewItem) => TracePreviewItem,
): TracePreview | null {
  if (!preview) return preview;
  const items = preview.items.map((item) => item.defectId === defectId ? updater(item) : item);
  return normalizeTracePreview({ ...preview, items });
}

export function parseTraceTaskResult(result?: string | null): TracePreview | null {
  if (!result) return null;
  try {
    const parsed = JSON.parse(result);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return normalizeTracePreview(parsed as TracePreview);
  } catch {
    return null;
  }
}

export async function loadLatestTracePreview(projectId: string): Promise<TracePreview | null> {
  const tasks = await aiApi.listTasks(projectId);
  const latest = tasks.find((task) => task.type === "用例缺陷追溯" && task.status === "成功" && task.result);
  return parseTraceTaskResult(latest?.result);
}
