import { showAlert } from "../shared/utils/dialogEvents";
import { API_BASE } from "../shared/config/deploy";
import { TOKEN_KEY } from "../shared/config/storage";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options?.headers as Record<string, string> || {}),
  };
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error("网络连接失败，请检查后端服务是否启动");
  }
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
      throw new Error("登录已过期");
    }
    const errText = await res.text();
    let detail = errText;
    try {
      const j = JSON.parse(errText);
      if (j.detail) {
        // FastAPI 验证错误的 detail 可能是数组 [{msg, type, loc}, ...]
        detail = Array.isArray(j.detail)
          ? j.detail.map((item: any) => item.msg || item.detail || JSON.stringify(item)).join("；")
          : typeof j.detail === "object" && j.detail !== null
            ? (j.detail.message || JSON.stringify(j.detail))
            : String(j.detail);
      }
    } catch {}
    throw new Error(detail || `请求失败 (${res.status})`);
  }
  return res.json();
}

export { getAuthHeaders, API_BASE };
