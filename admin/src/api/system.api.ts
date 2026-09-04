import { request, getAuthHeaders, API_BASE } from "./request";
import type { User, ModelConfig, DocConfig, StatusLog, AITask, ProjectActivityLock, DocGenStatus, ConfigCheckResult } from "../contracts/system";

// ─── Auth API ───

export const authApi = {
  getCaptcha: () => request<{ captcha_id: string; code: string; image: string }>("/auth/captcha"),
  register: (data: { phone: string; password: string; captcha_id: string; captcha_code: string }) =>
    request<{ ok: boolean; message: string }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { phone: string; password: string; captcha_id: string; captcha_code: string }) =>
    request<{ ok: boolean; message: string; token?: string; user?: User }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  getMe: () => request<{ ok: boolean; user: User }>("/auth/me"),
  updateProfile: (data: { nickname: string }) =>
    request<{ ok: boolean; message: string }>("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/auth/avatar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const errText = await res.text();
      let detail = errText;
      try { detail = JSON.parse(errText).message || errText; } catch { /* keep raw */ }
      throw new Error(detail);
    }
    return res.json() as Promise<{ ok: boolean; message: string; avatar: string }>;
  },
  changePassword: (data: { old_password: string; new_password: string }) =>
    request<{ ok: boolean; message: string }>("/auth/password", { method: "PUT", body: JSON.stringify(data) }),
  listUsers: () => request<{ ok: boolean; users: User[] }>("/auth/users"),
  updateUser: (userId: string, data: Partial<User>) =>
    request<{ ok: boolean; message: string }>(`/auth/users/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (userId: string) =>
    request<{ ok: boolean; message: string }>(`/auth/users/${userId}`, { method: "DELETE" }),
};

// ─── Model Config API ───

export const modelConfigApi = {
  list: () => request<ModelConfig[]>("/model-configs"),
  get: (id: string) => request<ModelConfig>(`/model-configs/${id}`),
  update: (configs: ModelConfig[]) =>
    request<{ ok: boolean; count: number }>("/model-configs", {
      method: "PUT",
      // 普通配置保存只提交模型连接信息，提示词由管理员专用接口维护。
      body: JSON.stringify({
        configs: configs.map(({ prompt: _prompt, adminPrompt: _adminPrompt, ...config }) => config),
      }),
    }),
  test: (id: string) =>
    request<{ ok: boolean; status: ModelConfig["connectionStatus"]; message: string; latencyMs?: number | null; lastTestedAt?: string | null; detail?: string }>(`/model-configs/${id}/test`, {
      method: "POST",
    }),
};

// ─── Doc Config API ───

export const docConfigApi = {
  list: () => request<DocConfig[]>("/doc-configs"),
  get: (id: string) => request<DocConfig>("/doc-configs/" + id),
  update: (configs: DocConfig[]) =>
    request<{ ok: boolean; count: number }>("/doc-configs", {
      method: "PUT",
      body: JSON.stringify({ configs }),
    }),
  downloadUrl: (id: string) => API_BASE + "/doc-configs/" + id + "/download",
  upload: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(API_BASE + "/doc-configs/" + id + "/upload", {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.detail || "上传失败");
      return data;
    }) as Promise<{ ok: boolean; templateFile: string; templateHash?: string; parseStatus?: string; parseError?: string; parsedAt?: string }>;
  },
};

// ─── Status Log API ───

export const statusLogsApi = {
  list: (projectId: string) => request<StatusLog[]>(`/projects/${projectId}/status-logs`),
};

// ─── AI API ───

export const aiApi = {
  listTasks: (projectId: string) => request<AITask[]>(`/projects/${projectId}/ai/tasks`),
  activityLock: (projectId: string) => request<ProjectActivityLock>(`/projects/${projectId}/ai/activity-lock`),
  checkConfig: (projectId: string, taskType: string) =>
    request<ConfigCheckResult>(`/projects/${projectId}/ai/check-config/${taskType}`),
  parseRequirements: (projectId: string) =>
    request<AITask>(`/projects/${projectId}/ai/parse-requirements`, { method: "POST" }),
  reviewRequirements: (projectId: string) =>
    request<AITask>(`/projects/${projectId}/ai/review-requirements`, { method: "POST" }),
  reverseRequirements: (projectId: string, data: { scope: string; testTarget: string; writeMode: string; maxPages: number; maxRequirements: number; keywords?: string }) =>
    request<AITask>(`/projects/${projectId}/ai/reverse-requirements`, { method: "POST", body: JSON.stringify(data) }),
  generateTestPoints: (projectId: string) =>
    request<AITask>(`/projects/${projectId}/ai/generate-test-points`, { method: "POST" }),
  generateTestCases: (projectId: string) =>
    request<AITask>(`/projects/${projectId}/ai/generate-test-cases`, { method: "POST" }),
  generateScripts: (projectId: string, mode: "restart" = "restart") =>
    request<AITask>(`/projects/${projectId}/ai/generate-scripts`, { method: "POST", body: JSON.stringify({ mode }) }),
  matchDefectCases: (projectId: string) =>
    request<AITask>(`/projects/${projectId}/ai/match-defect-cases`, { method: "POST" }),
  executeScripts: (projectId: string) =>
    request<AITask>(`/projects/${projectId}/ai/execute-scripts`, { method: "POST" }),
  generateDocs: (projectId: string, templateId?: string) =>
    request<AITask>(`/projects/${projectId}/ai/generate-docs`, {
      method: "POST",
      body: templateId ? JSON.stringify({ template_id: templateId }) : undefined,
    }),
};

export interface RequirementReviewQuestion {
  id: string; category: string; question: string; answer: string; suggestedAnswer: string; evidence: string;
  suggestionLevel: "直接建议" | "推荐方案" | "待补充信息";
  source: string; replyStatus: "待回复" | "已回复";
  confirmationStatus: "待确认" | "已确认" | "不通过";
  status: "待确认" | "已确认" | "不通过"; validationMessage: string;
  confirmedBy: string; confirmedAt: string | null; createdAt: string | null; updatedAt: string | null;
}
export interface RequirementReviewData {
  session: null | { id: string; status: string; summary: string; reviewedFileIds: string[]; createdAt: string };
  questions: RequirementReviewQuestion[];
  isStale: boolean;
  staleReason: string;
  unreviewedFileIds: string[];
  missingReviewedFileIds: string[];
}
export interface ProjectContextSnapshot {
  id: string; status: "草稿" | "已确认" | "已失效"; sourceSignature: string;
  contentMarkdown: string; createdAt: string | null; updatedAt: string | null;
}
export const requirementReviewApi = {
  get: (projectId: string) => request<RequirementReviewData>(`/projects/${projectId}/requirement-review`),
  answer: (questionId: string, answer: string) => request<RequirementReviewQuestion>(`/requirement-review/questions/${questionId}`, {
    method: "PUT", body: JSON.stringify({ answer }),
  }),
  validate: (projectId: string) => request<AITask>(`/projects/${projectId}/requirement-review/validate`, {
    method: "POST",
  }),
  getProjectContext: (projectId: string) => request<{ snapshot: ProjectContextSnapshot | null }>(`/projects/${projectId}/project-context`),
};

// ─── Doc Gen Status API ───

export const docGenApi = {
  getStatus: (projectId: string) => request<DocGenStatus>(`/projects/${projectId}/doc-gen-status`),
  updateStatus: (projectId: string, templateId: string, status: string) =>
    request<{ ok: boolean; status: string }>(`/projects/${projectId}/doc-gen-status`, {
      method: "PUT",
      body: JSON.stringify({ template_id: templateId, status }),
    }),
};

// ─── Token Usage API ───

export interface TokenUsageSummary {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  avgLatencyMs: number;
  callCount: number;
}

export interface TokenUsageByTask {
  taskType: string;
  label: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  calls: number;
}

export interface TokenUsageByModel {
  model: string;
  provider: string;
  totalTokens: number;
  calls: number;
  avgLatencyMs: number;
}

export interface TokenUsageDaily {
  date: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  calls: number;
}

export const tokenUsageApi = {
  summary: (days: number = 30) => request<TokenUsageSummary>(`/token-usage/summary?days=${days}`),
  byTask: (days: number = 30) => request<TokenUsageByTask[]>(`/token-usage/by-task?days=${days}`),
  byModel: (days: number = 30) => request<TokenUsageByModel[]>(`/token-usage/by-model?days=${days}`),
  daily: (days: number = 30) => request<TokenUsageDaily[]>(`/token-usage/daily?days=${days}`),
};
