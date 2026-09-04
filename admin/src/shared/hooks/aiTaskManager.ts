/**
 * 全局 AI 任务管理器
 * 独立于 React 组件运行，切换 tab 或退出页面时轮询不中断。
 * 任务完成/失败时自动往 store 里写通知。
 */
import { aiApi, requirementsApi, testPointsApi, testCasesApi, scriptsApi } from "../../api/client";
import type { ApiRequirement, ApiTestPoint, ApiTestCase, ApiScript } from "../../api/client";
import { environmentApi } from "../../api/environment.api";
import { toast } from "sonner";
import { addTaskNotification, initNotificationContext } from "../ai-tasks/aiTaskNotifications";
import type { AITask, AITaskType } from "../types/platform";
import type { AIGenerationProgress } from "../../app/store";

// ── 持有 store dispatch 的引用（由 initManager 注入） ──
let _dispatch: React.Dispatch<any> | null = null;
let _navigateToModelConfig: (() => void) | null = null;

export function initManager(
  dispatch: React.Dispatch<any>,
  getProjects: () => { id: string; name: string }[],
  navigateToModelConfig?: () => void,
) {
  _dispatch = dispatch;
  _navigateToModelConfig = navigateToModelConfig ?? null;
  initNotificationContext(dispatch, getProjects);
}

export const addNotification = addTaskNotification;

function taskDisplayLabel(taskType: AITaskType | string): string {
  if (taskType === "需求评审") return "文档审查";
  if (taskType === "用例缺陷追溯") return "AI追溯匹配";
  return taskType;
}

// ── 活跃轮询任务 ──
const activeTasks = new Map<string, AbortController>();
// 记录系统识别任务当前识别的环境 id（切页面保持），供 UI 精确显示哪个环境在识别
const recognizingEnvIds = new Map<string, string>();
const MAX_CONCURRENT_UI_RECOGNITIONS = 3;

function setTaskProgress(projectId: string, taskType: AITaskType, stage: string, message: string) {
  _dispatch?.({
    type: "SET_AI_TASK_PROGRESS",
    payload: {
      key: `${projectId}:${taskType}`,
      progress: { stage, message, generatedItems: 0, generatedResults: 0, generatedSourceIds: [] },
    },
  });
}

function scriptPartialFailureMessage(error: string | null | undefined, result: string | null | undefined): string {
  const fallback = error || "脚本生成失败";
  try {
    const progress = result ? JSON.parse(result) : null;
    const generated = Number(progress?.generatedScripts);
    const total = Number(progress?.totalCases);
    if (Number.isInteger(generated) && generated > 0 && Number.isInteger(total) && total > generated) {
      return `${fallback}；本轮已成功生成 ${generated}/${total} 条脚本，再次点击“生成自动化脚本”将重新生成。`;
    }
  } catch { /* task progress may be legacy plain text */ }
  return fallback;
}

// ── 轮询 AI 任务状态 ──
async function pollAITask(
  projectId: string,
  taskId: string,
  taskType: AITaskType,
  signal: AbortSignal,
  onProgress?: () => Promise<void>,
  onProgressData?: (progress: AIGenerationProgress) => void,
): Promise<{ success: boolean; error?: string; info?: string }> {
  let lastResult = "";
  while (!signal.aborted) {
    if (signal.aborted) return { success: false };
    await new Promise((r) => setTimeout(r, 1000));
    if (signal.aborted) return { success: false };
    try {
      const tasks = await aiApi.listTasks(projectId);
      const task = tasks.find((t) => t.id === taskId);
      if (task?.result && task.result !== lastResult) {
        lastResult = task.result;
        // 保留后端的结构化来源进度和结果进度，页面不能只靠 message 猜测。
        if (onProgressData) {
          try {
            const parsed = JSON.parse(task.result);
            if (parsed && typeof parsed === "object") {
              onProgressData(parsed as AIGenerationProgress);
            }
          } catch { /* ignore */ }
        }
        await onProgress?.();
      }
      if (task && (task.status === "成功" || task.status === "失败")) {
        if (_dispatch) {
          _dispatch({
            type: "UPDATE_AI_TASK",
            payload: {
              id: task.id,
              projectId: task.projectId,
              type: task.type,
              status: task.status,
              modelName: task.modelName,
              createdAt: task.createdAt,
              finishedAt: task.finishedAt ?? undefined,
              errorMessage: task.errorMessage ?? undefined,
            },
          });
        }
        if (task.status === "成功") {
          let info: string | undefined;
          try {
            const parsed = task.result ? JSON.parse(task.result) : null;
            if (parsed && typeof parsed.message === "string" && parsed.message.trim()) {
              info = parsed.message.trim();
            }
          } catch { /* ignore */ }
          return { success: true, info };
        }
        return {
          success: false,
          error: taskType === "脚本生成"
            ? scriptPartialFailureMessage(task.errorMessage, task.result)
            : task.errorMessage || undefined,
        };
      }
    } catch (e) {
      console.warn('Polling error:', e);
    }
  }
  return { success: false };
}

function getTaskTargetPath(projectId: string): string {
  return `/projects/${projectId}`;
}

// ── 公共 API ──

function makeTaskKey(projectId: string, type: string) {
  return `${projectId}:${type}`;
}

function emitProjectDataRefresh(projectId: string) {
  window.dispatchEvent(new CustomEvent("aitestlink:data-refresh", { detail: { projectId } }));
}

async function getTaskResult<T = any>(projectId: string, taskId: string): Promise<T | null> {
  const tasks = await aiApi.listTasks(projectId);
  const task = tasks.find((item) => item.id === taskId);
  if (!task?.result) return null;
  try {
    return JSON.parse(task.result) as T;
  } catch {
    return null;
  }
}

/** 接管刷新页面前已经在后端执行的任务，恢复进度与 loading，直至任务进入终态。 */
export function resumeAITaskPolling(task: AITask) {
  const key = makeTaskKey(task.projectId, task.type);
  if (task.status !== "执行中") return;
  if (_dispatch) {
    _dispatch({ type: "START_ACTIVE_AI_TASK", payload: key });
    _dispatch({ type: "ADD_AI_TASK", payload: task });
    try {
      const rawResult = (task as unknown as { result?: string | null }).result;
      const progress = rawResult ? JSON.parse(rawResult) : null;
      if (progress && typeof progress === "object") {
        _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key, progress } });
      }
    } catch { /* 兼容旧任务的纯文本进度 */ }
  }
  if (activeTasks.has(key)) return;

  const controller = new AbortController();
  activeTasks.set(key, controller);
  void (async () => {
    try {
      const result = await pollAITask(
        task.projectId,
        task.id,
        task.type,
        controller.signal,
        async () => emitProjectDataRefresh(task.projectId),
        (progress) => _dispatch?.({ type: "SET_AI_TASK_PROGRESS", payload: { key, progress } }),
      );
      if (result.success) {
        emitProjectDataRefresh(task.projectId);
        addNotification("任务完成", task.type, task.projectId, `${task.type}已完成`, getTaskTargetPath(task.projectId));
      } else if (!controller.signal.aborted) {
        const message = result.error || `${task.type}失败`;
        notifyTaskFailure(task.type, task.projectId, message, getTaskTargetPath(task.projectId), message);
      }
    } finally {
      activeTasks.delete(key);
      if (!controller.signal.aborted && _dispatch) {
        _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: key });
      }
    }
  })();
}

function emitUISnapshotRefresh(environmentId: string) {
  window.dispatchEvent(new CustomEvent("aitestlink:ui-snapshot-refresh", { detail: { environmentId } }));
}

async function refreshRequirements(projectId: string) {
  const reqs = await requirementsApi.list(projectId);
  if (!_dispatch) return;
  _dispatch({ type: "CLEAR_REQUIREMENTS", payload: projectId });
  reqs.forEach((r: ApiRequirement) => {
    _dispatch!({
      type: "ADD_REQUIREMENT",
      payload: {
        id: r.id, projectId: r.projectId, module: r.module, feature: r.feature,
        reqId: r.reqId,
        source: r.source, risk: r.risk, rule: r.rule, question: r.question, confirmed: r.confirmed,
        clarificationStatus: r.clarificationStatus,
        clarificationAnswer: r.clarificationAnswer,
        reviewStatus: r.reviewStatus ?? "待评审",
        validityStatus: (r as any).validityStatus ?? "有效",
        invalidReason: (r as any).invalidReason ?? "",
        invalidatedAt: (r as any).invalidatedAt ?? null,
        createdAt: r.createdAt, updatedAt: r.updatedAt,
      },
    });
  });
}

async function refreshTestPoints(projectId: string) {
  const tps = await testPointsApi.list(projectId);
  if (!_dispatch) return;
  _dispatch({ type: "CLEAR_TEST_POINTS", payload: projectId });
  tps.forEach((tp: ApiTestPoint) => {
    _dispatch!({
      type: "ADD_TEST_POINT",
      payload: {
        id: tp.id, projectId: tp.projectId, requirementId: tp.requirementId ?? null,
        pointCode: tp.pointCode,
        module: tp.module, type: tp.type, title: tp.title, description: tp.description,
        priority: tp.priority, automatable: tp.automatable, reviewStatus: tp.reviewStatus,
        validityStatus: (tp as any).validityStatus ?? "有效",
        invalidReason: (tp as any).invalidReason ?? "",
        invalidatedAt: (tp as any).invalidatedAt ?? null,
        createdAt: tp.createdAt, updatedAt: tp.updatedAt,
      },
    });
  });
}

async function refreshTestCases(projectId: string) {
  const tcs = await testCasesApi.list(projectId);
  if (!_dispatch) return;
  _dispatch({ type: "CLEAR_TEST_CASES", payload: projectId });
  tcs.forEach((tc: ApiTestCase) => {
    _dispatch!({
      type: "ADD_TEST_CASE",
      payload: {
        id: tc.id, projectId: tc.projectId,
        testPointId: tc.testPointId ?? null, requirementId: tc.requirementId ?? null,
        caseCode: tc.caseCode, module: tc.module, feature: tc.feature, title: tc.title,
        priority: tc.priority, precondition: tc.precondition, steps: tc.steps,
        testData: tc.testData, expectedResult: tc.expectedResult,
        environmentId: tc.environmentId, targetPlatform: tc.targetPlatform,
        testUrl: tc.testUrl, requiredRole: tc.requiredRole,
        testType: tc.testType ?? "功能测试", actualResult: tc.actualResult ?? "", passed: tc.passed ?? "未执行",
        automation: tc.automation, reviewStatus: tc.reviewStatus, remark: tc.remark,
        validityStatus: (tc as any).validityStatus ?? "有效",
        invalidReason: (tc as any).invalidReason ?? "",
        invalidatedAt: (tc as any).invalidatedAt ?? null,
        tester: tc.tester ?? "", testDate: tc.testDate ?? "",
        createdAt: tc.createdAt, updatedAt: tc.updatedAt,
      },
    });
  });
}

async function refreshScripts(projectId: string) {
  const scripts = await scriptsApi.list(projectId);
  if (!_dispatch) return;
  _dispatch({ type: "CLEAR_SCRIPTS", payload: projectId });
  scripts.forEach((s: ApiScript) => {
    _dispatch!({
      type: "ADD_SCRIPT",
      payload: {
        id: s.id, projectId: s.projectId, testCaseId: s.testCaseId,
        scriptType: s.scriptType as any,
        framework: s.framework as any,
        language: s.language,
        code: s.code,
        status: s.status as any,
        scriptCode: s.scriptCode,
        reviewStatus: s.reviewStatus,
        validityStatus: (s as any).validityStatus ?? "有效",
        invalidReason: (s as any).invalidReason ?? "",
        invalidatedAt: (s as any).invalidatedAt ?? null,
        generatedByAi: s.generatedByAi,
        executedAt: s.executedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      },
    });
  });
}

function isModelConfigError(message: string) {
  return [
    "模型配置",
    "模型未配置",
    "配置不存在",
    "已禁用",
    "连接状态异常",
    "API Key",
    "API 地址",
    "Endpoint",
  ].some((keyword) => message.includes(keyword));
}

function notifyTaskFailure(taskType: AITaskType, projectId: string, message: string, targetPath = `/projects/${projectId}`, detail?: string) {
  addNotification("任务失败", taskType, projectId, message, targetPath, taskDisplayLabel(taskType), detail);
  if (isModelConfigError(message) && _navigateToModelConfig) {
    toast.error(message, {
      action: {
        label: "去配置",
        onClick: () => _navigateToModelConfig?.(),
      },
    });
    return;
  }
  toast.error(message);
}

/** 检查模型配置 */
async function checkConfig(projectId: string, taskType: string): Promise<boolean> {
  try {
    const result = await aiApi.checkConfig(projectId, taskType);
    return result.configured;
  } catch {
    return false;
  }
}

/**
 * 验证 AI 节点：检查是否启用 + 测试连通性
 * 返回 { ok, error? } — 失败时 error 包含中文提示
 */
async function verifyAIConfig(projectId: string, taskType: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await aiApi.checkConfig(projectId, taskType);
    if (!result.configured) {
      return { ok: false, error: result.message || "模型未配置" };
    }
    if (result.connectionStatus === "abnormal") {
      return { ok: false, error: result.lastTestMessage || result.message || "模型连接状态异常" };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "AI 节点验证失败" };
  }
}

/** 启动一个轮询任务，返回 { success, error? } */
async function runTask(
  projectId: string,
  taskType: AITaskType,
  apiCall: () => Promise<{ id: string; projectId: string; type: string; status: string; modelName: string; createdAt: string }>,
  onSuccess?: () => Promise<void>,
  opts?: { skipStartDispatch?: boolean; onProgress?: () => Promise<void>; onProgressData?: (progress: AIGenerationProgress) => void; onStarted?: () => void },
): Promise<{ success: boolean; error?: string; info?: string }> {
  const key = makeTaskKey(projectId, taskType);

  // 如果同类任务正在进行，先取消
  if (activeTasks.has(key)) {
    activeTasks.get(key)!.abort();
    activeTasks.delete(key);
  }

  const controller = new AbortController();
  activeTasks.set(key, controller);

  // 任务只有进入终态或发生真实异常时，才解除页面上的“生成中”状态。
  let taskEnded = false;
  try {
    const task = await apiCall();
    if (_dispatch) {
      if (!opts?.skipStartDispatch) {
        _dispatch({ type: "START_ACTIVE_AI_TASK", payload: `${projectId}:${taskType}` });
      }
      _dispatch({
        type: "ADD_AI_TASK",
        payload: {
          id: task.id,
          projectId: task.projectId,
          type: task.type as any,
          status: task.status as any,
          modelName: task.modelName,
          createdAt: task.createdAt,
        },
      });
    }
    opts?.onStarted?.();

    const pollResult = await pollAITask(projectId, task.id, taskType, controller.signal, opts?.onProgress, opts?.onProgressData);

    if (pollResult.success) {
      if (onSuccess) await onSuccess();
      emitProjectDataRefresh(projectId);
      const label = taskDisplayLabel(taskType);
      addNotification("任务完成", taskType, projectId, `${label}已完成`, getTaskTargetPath(projectId), label);
      if (pollResult.info) {
        toast.info(pollResult.info, { duration: 12000 });
      }
      taskEnded = true;
      return { success: true, info: pollResult.info };
    } else {
      taskEnded = true;
      const errorMsg = pollResult.error || `${taskType}失败`;
      if (!controller.signal.aborted) {
        notifyTaskFailure(taskType, projectId, errorMsg, getTaskTargetPath(projectId), errorMsg);
      }
      return { success: false, error: errorMsg };
    }
  } catch (err) {
    taskEnded = true;
    if (!controller.signal.aborted) {
      const msg = err instanceof Error ? err.message : "未知错误";
      notifyTaskFailure(taskType, projectId, `${taskDisplayLabel(taskType)}失败: ${msg}`, undefined, msg);
    }
    return { success: false, error: err instanceof Error ? err.message : "未知错误" };
  } finally {
    activeTasks.delete(key);
    // 只有任务真正结束（成功/失败/异常）才清除按钮状态。
    if (taskEnded && _dispatch) {
      _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:${taskType}` });
    }
  }
}

// ── 便捷方法 ──

export async function startParseRequirements(projectId: string) {
  try {
    // 立即更新 UI 状态，避免用户等待验证
    if (_dispatch) {
      _dispatch({ type: "START_ACTIVE_AI_TASK", payload: `${projectId}:需求解析` });
    }
    setTaskProgress(projectId, "需求解析", "checking", "正在检查需求解析模型配置");

    const verify = await verifyAIConfig(projectId, "需求解析");
    if (!verify.ok) {
      if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:需求解析` });
      notifyTaskFailure("需求解析", projectId, `需求解析失败：${verify.error}`);
      return { success: false, error: verify.error };
    }

    setTaskProgress(projectId, "需求解析", "creating", "模型配置正常，正在创建需求解析任务");
    return await runTask(projectId, "需求解析", () => aiApi.parseRequirements(projectId), () => refreshRequirements(projectId), {
      skipStartDispatch: true,
      onProgress: async () => {
        await refreshRequirements(projectId);
        emitProjectDataRefresh(projectId);
      },
      onStarted: () => toast.info("需求解析已启动，完成后会在通知列表中提醒"),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "需求解析失败";
    notifyTaskFailure("需求解析", projectId, msg);
    if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:需求解析` });
    return { success: false, error: msg };
  }
}

export async function startReverseRequirements(
  projectId: string,
  options: { scope: string; testTarget: string; writeMode: string; maxPages: number; maxRequirements: number; keywords?: string },
) {
  try {
    if (_dispatch) {
      _dispatch({ type: "START_ACTIVE_AI_TASK", payload: `${projectId}:AI反推需求` });
    }
    setTaskProgress(projectId, "AI反推需求", "checking", "正在检查 AI 反推需求模型配置");

    const verify = await verifyAIConfig(projectId, "AI反推需求");
    if (!verify.ok) {
      if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:AI反推需求` });
      notifyTaskFailure("AI反推需求", projectId, `AI反推需求失败：${verify.error}`);
      return { success: false, error: verify.error };
    }

    setTaskProgress(projectId, "AI反推需求", "creating", "模型配置正常，正在创建 AI 反推需求任务");
    toast.info("AI反推需求已启动，完成后会在通知列表中提醒");
    return await runTask(projectId, "AI反推需求", () => aiApi.reverseRequirements(projectId, options), () => refreshRequirements(projectId), {
      skipStartDispatch: true,
      onProgress: async () => {
        await refreshRequirements(projectId);
        emitProjectDataRefresh(projectId);
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI反推需求失败";
    notifyTaskFailure("AI反推需求", projectId, msg);
    if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:AI反推需求` });
    return { success: false, error: msg };
  }
}

export async function startGenerateTestPoints(projectId: string) {
  try {
    const taskKey = `${projectId}:测试点生成`;
    if (_dispatch) {
      _dispatch({ type: "START_ACTIVE_AI_TASK", payload: taskKey });
      _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress: { stage: "checking", message: "正在检查测试点生成模型配置", generatedItems: 0, generatedResults: 0, generatedSourceIds: [] } } });
    }

    const verify = await verifyAIConfig(projectId, "测试点生成");
    if (!verify.ok) {
      if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:测试点生成` });
      notifyTaskFailure("测试点生成", projectId, `测试点生成失败：${verify.error}`);
      return { success: false, error: verify.error };
    }

    if (_dispatch) {
      _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress: { stage: "creating", message: "模型配置正常，正在创建测试点生成任务", generatedItems: 0, generatedResults: 0, generatedSourceIds: [] } } });
    }
    toast.info("测试点生成已启动，完成后会在通知列表中提醒");
    return await runTask(projectId, "测试点生成", () => aiApi.generateTestPoints(projectId), () => refreshTestPoints(projectId), {
      skipStartDispatch: true,
      onProgress: async () => {
        await refreshTestPoints(projectId);
        emitProjectDataRefresh(projectId);
      },
      onProgressData: (progress) => {
        if (_dispatch) _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress } });
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "测试点生成失败";
    notifyTaskFailure("测试点生成", projectId, msg);
    if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:测试点生成` });
    return { success: false, error: msg };
  }
}

export async function startGenerateTestCases(projectId: string) {
  try {
    const taskKey = `${projectId}:用例生成`;
    if (_dispatch) {
      _dispatch({ type: "START_ACTIVE_AI_TASK", payload: taskKey });
      _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress: { stage: "checking", message: "正在检查用例生成模型配置", generatedItems: 0, generatedResults: 0, generatedSourceIds: [] } } });
    }

    const verify = await verifyAIConfig(projectId, "用例生成");
    if (!verify.ok) {
      if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:用例生成` });
      notifyTaskFailure("用例生成", projectId, `用例生成失败：${verify.error}`);
      return { success: false, error: verify.error };
    }

    if (_dispatch) {
      _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress: { stage: "creating", message: "模型配置正常，正在创建用例生成任务", generatedItems: 0, generatedResults: 0, generatedSourceIds: [] } } });
    }
    toast.info("用例生成已启动，完成后会在通知列表中提醒");
    return await runTask(projectId, "用例生成", () => aiApi.generateTestCases(projectId), () => refreshTestCases(projectId), {
      skipStartDispatch: true,
      onProgress: async () => {
        await refreshTestCases(projectId);
        emitProjectDataRefresh(projectId);
      },
      onProgressData: (progress) => {
        if (_dispatch) _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress } });
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "用例生成失败";
    notifyTaskFailure("用例生成", projectId, msg);
    if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:用例生成` });
    return { success: false, error: msg };
  }
}

export async function startGenerateScripts(projectId: string, mode: "restart" = "restart") {
  try {
    const taskKey = `${projectId}:脚本生成`;
    if (_dispatch) {
      _dispatch({ type: "START_ACTIVE_AI_TASK", payload: taskKey });
      _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress: { stage: "checking", message: "正在检查脚本生成模型配置", generatedItems: 0, generatedResults: 0, generatedSourceIds: [] } } });
    }

    const verify = await verifyAIConfig(projectId, "脚本生成");
    if (!verify.ok) {
      if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:脚本生成` });
      notifyTaskFailure("脚本生成", projectId, `脚本生成失败：${verify.error}`);
      return { success: false, error: verify.error };
    }

    if (_dispatch) {
      _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress: { stage: "creating", message: "模型配置正常，正在创建脚本生成任务", generatedItems: 0, generatedResults: 0, generatedSourceIds: [] } } });
    }
    return await runTask(projectId, "脚本生成", () => aiApi.generateScripts(projectId, mode), () => refreshScripts(projectId), {
      skipStartDispatch: true,
      onProgress: async () => {
        await refreshScripts(projectId);
        // 首条新脚本落库时会切换版本，需同步刷新缺陷、执行与汇总页面。
        emitProjectDataRefresh(projectId);
      },
      onProgressData: (progress) => {
        if (_dispatch) _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress } });
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "脚本生成失败";
    notifyTaskFailure("脚本生成", projectId, msg);
    if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:脚本生成` });
    return { success: false, error: msg };
  }
}

export async function startGenerateDocs(projectId: string, templateId: string) {
  try {
    if (_dispatch) _dispatch({ type: "START_ACTIVE_AI_TASK", payload: `${projectId}:文档生成` });
    setTaskProgress(projectId, "文档生成", "checking", "正在检查文档生成模型配置");

    const verify = await verifyAIConfig(projectId, "文档生成");
    if (!verify.ok) {
      if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:文档生成` });
      notifyTaskFailure("文档生成", projectId, `文档生成失败：${verify.error}`);
      return { success: false, error: verify.error };
    }

    setTaskProgress(projectId, "文档生成", "creating", "模型配置正常，正在创建文档生成任务");
    return await runTask(projectId, "文档生成", () => aiApi.generateDocs(projectId, templateId), undefined, {
      skipStartDispatch: true,
      onStarted: () => toast.info("文档生成已启动，完成后会在通知列表中提醒"),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "文档生成失败";
    notifyTaskFailure("文档生成", projectId, msg);
    if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:文档生成` });
    return { success: false, error: msg };
  }
}

export async function startTraceabilityMatch(projectId: string) {
  const taskType: AITaskType = "用例缺陷追溯";
  const taskKey = `${projectId}:${taskType}`;
  let startedTaskId = "";
  try {
    if (_dispatch) {
      _dispatch({ type: "START_ACTIVE_AI_TASK", payload: taskKey });
      _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress: { stage: "checking", message: "正在检查 AI追溯匹配模型配置", generatedItems: 0, generatedResults: 0, generatedSourceIds: [] } } });
    }

    const verify = await verifyAIConfig(projectId, taskType);
    if (!verify.ok) {
      if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: taskKey });
      notifyTaskFailure(taskType, projectId, `AI追溯匹配失败：${verify.error}`);
      return { success: false, error: verify.error };
    }

    if (_dispatch) {
      _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress: { stage: "creating", message: "模型配置正常，正在创建 AI追溯匹配任务", generatedItems: 0, generatedResults: 0, generatedSourceIds: [] } } });
    }

    const result = await runTask(projectId, taskType, async () => {
      const task = await aiApi.matchDefectCases(projectId);
      startedTaskId = task.id;
      return task;
    }, undefined, {
      skipStartDispatch: true,
      onStarted: () => toast.info("AI追溯匹配已启动，完成后会在通知列表中提醒"),
      onProgressData: (progress) => {
        if (_dispatch) _dispatch({ type: "SET_AI_TASK_PROGRESS", payload: { key: taskKey, progress } });
      },
    });

    if (!result.success) {
      return result;
    }
    const taskResult = startedTaskId ? await getTaskResult(projectId, startedTaskId) : null;
    return { success: true, info: result.info, result: taskResult };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI追溯匹配失败";
    notifyTaskFailure(taskType, projectId, msg);
    if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: taskKey });
    return { success: false, error: msg };
  }
}

export async function startExecuteScripts(projectId: string) {
  try {
    if (_dispatch) _dispatch({ type: "START_ACTIVE_AI_TASK", payload: `${projectId}:执行脚本` });
    setTaskProgress(projectId, "执行脚本", "checking", "正在检查执行脚本模型配置");

    const verify = await verifyAIConfig(projectId, "执行脚本");
    if (!verify.ok) {
      if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:执行脚本` });
      notifyTaskFailure("执行脚本", projectId, `执行脚本失败：${verify.error}`);
      return { success: false, error: verify.error };
    }

    setTaskProgress(projectId, "执行脚本", "creating", "模型配置正常，正在创建执行脚本任务");
    toast.info("脚本执行分析已启动，完成后会在通知列表中提醒");
    return await runTask(projectId, "执行脚本", () => aiApi.executeScripts(projectId), undefined, { skipStartDispatch: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "执行脚本失败";
    notifyTaskFailure("执行脚本", projectId, msg);
    if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:执行脚本` });
    return { success: false, error: msg };
  }
}

export async function startRecognizeUI(
  projectId: string,
  environmentId: string,
  options: { accountId?: string; headed?: boolean; scopeMode?: "full" | "incremental"; requirementIds?: string[]; requirementText?: string } = {},
) {
  try {
    const recognitionPrefix = `${projectId}:系统识别:`;
    const currentRecognitions = [...activeTasks.keys()].filter((key) => key.startsWith(recognitionPrefix)).length;
    if (currentRecognitions >= MAX_CONCURRENT_UI_RECOGNITIONS) {
      const error = `同一项目最多同时识别 ${MAX_CONCURRENT_UI_RECOGNITIONS} 个账号，请等待已有识别任务完成后再试`;
      toast.info(error);
      return { success: false, error };
    }
    const verify = await verifyAIConfig(projectId, "系统识别");
    if (!verify.ok) {
      notifyTaskFailure("系统识别", projectId, `系统识别失败：${verify.error}`);
      return { success: false, error: verify.error };
    }

    // 先调 API 创建任务；后端会在创建任务前校验识别账号等前置条件，
    // 校验不通过直接返回 400，此时还没设"识别中"，用户立即看到错误提示。
    const task = await environmentApi.recognizeUI(environmentId, options);
    // API 成功说明任务已创建，此时才设"识别中"状态并提示已启动
    if (_dispatch) {
      _dispatch({ type: "START_ACTIVE_AI_TASK", payload: `${projectId}:系统识别` });
      _dispatch({
        type: "ADD_AI_TASK",
        payload: {
          id: task.id,
          projectId: task.projectId,
          type: task.type as any,
          status: task.status as any,
          modelName: task.modelName,
          createdAt: task.createdAt,
        },
      });
    }
    recognizingEnvIds.set(projectId, environmentId);
    toast.info("系统识别已启动，完成后会在通知列表中提醒");

    // 轮询任务状态（复用 runTask 的轮询，但跳过它的 apiCall/START）
    const controller = new AbortController();
    const key = `${projectId}:系统识别:${environmentId}:${options.accountId || "default"}`;
    activeTasks.set(key, controller);
    let pollResult: { success?: boolean; error?: string; info?: string } = {};
    try {
      pollResult = await pollAITask(projectId, task.id, "系统识别", controller.signal, async () => {
        emitUISnapshotRefresh(environmentId);
      });
      if (pollResult.success) {
        emitUISnapshotRefresh(environmentId);
        addNotification("任务完成", "系统识别", projectId, "系统识别已完成", `/projects/${projectId}`);
        if (pollResult.info) toast.info(pollResult.info, { duration: 12000 });
      } else {
        if (!controller.signal.aborted) {
          notifyTaskFailure("系统识别", projectId, pollResult.error || "系统识别失败", `/projects/${projectId}`);
        }
      }
    } finally {
      activeTasks.delete(key);
      if (_dispatch) _dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: `${projectId}:系统识别` });
      recognizingEnvIds.delete(projectId);
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "系统识别失败";
    notifyTaskFailure("系统识别", projectId, msg);
    recognizingEnvIds.delete(projectId);
    return { success: false, error: msg };
  }
}

/** 返回某个项目当前正在识别的环境 id（若有），用于精确显示"识别中" */
export function getRecognizingEnvId(projectId: string): string | undefined {
  return recognizingEnvIds.get(projectId);
}

/** 查询某个项目是否有正在运行的任务 */
export function hasActiveTask(projectId: string, taskType?: string): boolean {
  for (const key of activeTasks.keys()) {
    if (taskType ? key === `${projectId}:${taskType}` : key.startsWith(`${projectId}:`)) {
      return true;
    }
  }
  return false;
}
