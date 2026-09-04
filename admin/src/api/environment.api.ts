import { request } from "./request";
import type { AITask } from "../shared/types/platform";

export interface EnvironmentConfig {
  id: string;
  projectId: string;
  name: string;
  environmentType: "Web" | "APP";
  webUrl: string;
  appUrl: string;
  targetUrl?: string;
  otherUrls: string;
  captchaRequired: boolean;
  captchaCode: string;
  notes: string;
  isDefault: boolean;
  accounts: TestAccount[];
  createdAt: string;
  updatedAt: string;
}

export interface TestAccount {
  id: string;
  environmentId: string;
  name: string;
  username: string;
  department: string;
  password: string;
  hasPassword: boolean;
  role: string;
  isAdmin: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface UISnapshot {
  id: string;
  projectId: string;
  environmentId: string;
  accountId: string | null;
  status: string;
  summary: string;
  snapshot: Record<string, unknown>;
  error: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentConfigCreate {
  name: string;
  environmentType?: "Web" | "APP";
  webUrl?: string;
  appUrl?: string;
  otherUrls?: string;
  captchaRequired?: boolean;
  captchaCode?: string;
  notes?: string;
  isDefault?: boolean;
}

export interface TestAccountCreate {
  environmentId: string;
  name: string;
  username: string;
  department?: string;
  password: string;
  role?: string;
  isAdmin?: boolean;
  notes?: string;
}

export const environmentApi = {
  list: (projectId: string) =>
    request<EnvironmentConfig[]>(`/projects/${projectId}/environments`),

  create: (projectId: string, data: EnvironmentConfigCreate) =>
    request<EnvironmentConfig>(`/projects/${projectId}/environments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (configId: string, data: Partial<EnvironmentConfigCreate>) =>
    request<EnvironmentConfig>(`/environments/${configId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (configId: string) =>
    request<{ ok: boolean }>(`/environments/${configId}`, {
      method: "DELETE",
    }),

  createAccount: (environmentId: string, data: TestAccountCreate) =>
    request<TestAccount>(`/environments/${environmentId}/accounts`, {
      method: "POST",
      body: JSON.stringify({ ...data, environmentId }),
    }),

  updateAccount: (accountId: string, data: Partial<TestAccountCreate>) =>
    request<TestAccount>(`/accounts/${accountId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteAccount: (accountId: string) =>
    request<{ ok: boolean }>(`/accounts/${accountId}`, {
      method: "DELETE",
    }),

  getUISnapshot: (environmentId: string, accountId?: string) =>
    request<UISnapshot | { ok: false; message: string }>(`/environments/${environmentId}/ui-snapshot${accountId ? `?account_id=${accountId}` : ""}`),

  recognizeUI: (environmentId: string, data: { accountId?: string; headed?: boolean; scopeMode?: "full" | "incremental"; requirementIds?: string[]; requirementText?: string } = {}) =>
    request<AITask>(`/environments/${environmentId}/ui-snapshot/recognize`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  downloadAccountsTemplate: async (environmentId: string) => {
    const { API_BASE } = await import("./client");
    const { getAuthHeaders } = await import("./request");
    const response = await fetch(`${API_BASE}/environments/${environmentId}/accounts/template`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const text = await response.text();
      let detail = text;
      try { detail = JSON.parse(text).detail || text; } catch {}
      throw new Error(detail || "下载失败");
    }
    return response.blob();
  },

  exportAccounts: async (environmentId: string) => {
    const { API_BASE } = await import("./client");
    const { getAuthHeaders } = await import("./request");
    const response = await fetch(`${API_BASE}/environments/${environmentId}/accounts/export`, { headers: getAuthHeaders() });
    if (!response.ok) {
      const text = await response.text();
      let detail = text;
      try { detail = JSON.parse(text).detail || text; } catch {}
      throw new Error(detail || "导出失败");
    }
    return response.blob();
  },

  sync: (projectId: string, projects: Array<{ sourceProjectId: string; sourceEnvironmentIds: string[]; syncAccounts: boolean }>, overwrite = false) =>
    request<{
      ok: boolean;
      results?: Array<{ sourceProjectId: string; sourceProjectName: string; status: string; createdEnvironments: number; updatedEnvironments: number; createdAccounts: number }>;
      needsConfirm?: Array<{ sourceProjectId: string; sourceProjectName: string; syncAccounts: boolean; existingEnvironments: string[] }>;
    }>(
      `/projects/${projectId}/environments/sync`,
      {
        method: "POST",
        body: JSON.stringify({ projects, overwrite }),
      },
    ),

  importAccounts: async (environmentId: string, file: File) => {
    const { API_BASE } = await import("./client");
    const { getAuthHeaders } = await import("./request");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}/environments/${environmentId}/accounts/import`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      let detail = text;
      try { detail = JSON.parse(text).detail || text; } catch {}
      throw new Error(detail || "导入失败");
    }
    return response.json() as Promise<{ ok: boolean; created: number; skipped?: number; skippedDuplicates?: number; duplicates?: Array<{ department: string; name: string; username: string; role: string }> }>;
  },
};
