import { API_BASE, getAuthHeaders, request } from "./request";
import type { Defect, DefectCreate, DefectUpdate, DefectStats } from "../contracts/defect";

export const defectsApi = {
  list: (projectId: string, validity: "有效" | "已失效" | "全部" = "有效") =>
    request<Defect[]>(`/projects/${projectId}/defects?validity=${encodeURIComponent(validity)}`),

  create: (projectId: string, data: DefectCreate) =>
    request<Defect>(`/projects/${projectId}/defects`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: DefectUpdate) =>
    request<Defect>(`/defects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/defects/${id}`, { method: "DELETE" }),

  batchDelete: (ids: string[]) =>
    request<{ ok: boolean; deleted: number }>("/defects/batch-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  batchStatus: (ids: string[], status: string) =>
    request<{ ok: boolean; updated: number }>("/defects/batch-status", {
      method: "POST",
      body: JSON.stringify({ ids, status }),
    }),

  previewTraceability: (projectId: string) =>
    request<{ ok: boolean; total: number; recommended: number; items: any[]; message?: string }>(`/projects/${projectId}/defects/traceability/match-preview`, {
      method: "POST",
    }),

  applyTraceability: (projectId: string, matches: { defectId: string; testCaseId: string; score: number; reason?: string }[]) =>
    request<{ ok: boolean; applied: number; skipped: number }>(`/projects/${projectId}/defects/traceability/apply`, {
      method: "POST",
      body: JSON.stringify({ matches }),
    }),

  stats: (projectId: string) =>
    request<DefectStats>(`/projects/${projectId}/defects/stats`),

  export: async (projectId: string, validity: "有效" | "已失效" | "全部" = "有效") => {
    const response = await fetch(`${API_BASE}/projects/${projectId}/defects/export?validity=${encodeURIComponent(validity)}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const text = await response.text();
      let detail = text;
      try { detail = JSON.parse(text).detail || text; } catch {}
      throw new Error(detail || "导出失败");
    }
    return response.blob();
  },

  downloadImportTemplate: async (projectId: string) => {
    const response = await fetch(`${API_BASE}/projects/${projectId}/defects/import-template`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const text = await response.text();
      let detail = text;
      try { detail = JSON.parse(text).detail || text; } catch {}
      throw new Error(detail || "下载模板失败");
    }
    return response.blob();
  },

  importFile: async (projectId: string, file: File, source = "模板导入") => {
    const form = new FormData();
    form.append("file", file);
    form.append("source", source);
    const response = await fetch(`${API_BASE}/projects/${projectId}/defects/import`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: form,
    });
    if (!response.ok) {
      const text = await response.text();
      let detail = text;
      try { detail = JSON.parse(text).detail || text; } catch {}
      throw new Error(detail || "导入失败");
    }
    return response.json() as Promise<{ ok: boolean; imported: number; updated?: number; skipped: number; warnings: string[]; source: string }>;
  },

  previewImport: async (projectId: string, file: File, source = "模板导入") => {
    const form = new FormData();
    form.append("file", file);
    form.append("source", source);
    const response = await fetch(`${API_BASE}/projects/${projectId}/defects/import-preview`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: form,
    });
    if (!response.ok) {
      const text = await response.text();
      let detail = text;
      try { detail = JSON.parse(text).detail || text; } catch {}
      throw new Error(detail || "识别预览失败");
    }
    return response.json() as Promise<{ ok: boolean; source: string; total: number; importable: number; skipped: number; matchedCases: number; warnings: string[]; items: any[] }>;
  },
};
