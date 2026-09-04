import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkConfig, parseRequirements, toastInfo, toastError } = vi.hoisted(() => ({
  checkConfig: vi.fn(),
  parseRequirements: vi.fn(),
  toastInfo: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../../api/client", () => ({
  aiApi: { checkConfig, parseRequirements },
  requirementsApi: {},
  testPointsApi: {},
  testCasesApi: {},
  scriptsApi: {},
}));

vi.mock("sonner", () => ({
  toast: { info: toastInfo, error: toastError },
}));

vi.mock("../ai-tasks/aiTaskNotifications", () => ({
  addTaskNotification: vi.fn(),
  initNotificationContext: vi.fn(),
}));

import { startParseRequirements } from "./aiTaskManager";

describe("startParseRequirements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkConfig.mockResolvedValue({ configured: true, connectionStatus: "normal" });
  });

  it("评审未完成、后端拒绝创建任务时不显示已启动提示", async () => {
    parseRequirements.mockRejectedValue(new Error("请先在「文档审查」完成所有待确认问题，再生成正式需求"));

    const result = await startParseRequirements("project-1");

    expect(result.success).toBe(false);
    expect(toastInfo).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining("完成所有待确认问题"));
  });
});
