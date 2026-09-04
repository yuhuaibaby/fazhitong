import { describe, expect, it } from "vitest";
import { hasCompletedUpstreamRegeneration } from "./generationLineage";

const failedCaseTask = {
  type: "用例生成",
  status: "失败",
  createdAt: "2026-08-12T01:00:00Z",
  finishedAt: "2026-08-12T01:05:00Z",
};

describe("generation lineage", () => {
  it("上游测试点在失败用例任务后重新生成时，不允许续跑", () => {
    expect(hasCompletedUpstreamRegeneration([
      failedCaseTask,
      { type: "测试点生成", status: "成功", createdAt: "2026-08-12T01:10:00Z", finishedAt: "2026-08-12T01:11:00Z" },
    ], "测试点生成", failedCaseTask)).toBe(true);
  });

  it("失败任务之后没有新的上游成功任务时，保留继续生成资格", () => {
    expect(hasCompletedUpstreamRegeneration([
      { type: "测试点生成", status: "成功", createdAt: "2026-08-12T00:30:00Z", finishedAt: "2026-08-12T00:31:00Z" },
      failedCaseTask,
    ], "测试点生成", failedCaseTask)).toBe(false);
  });
});
