import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileText, Lightbulb, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { aiApi, requirementReviewApi, type ProjectContextSnapshot, type RequirementReviewData } from "../../../api/system.api";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { Modal } from "../../../shared/components/Modal";
import { StatusPill } from "../../../shared/components/StatusPill";
import { DataTable } from "../../../shared/components/DataTable";
import { formatDateTime } from "../../../shared/utils/dateTime";
import { useStore } from "../../../app/store";
import { addNotification } from "../../../shared/hooks/aiTaskManager";
import { useProjectMutationLock } from "./ProjectMutationLockContext";

function answerFromSuggestedAnswer(value: string) {
  let text = (value || "").trim();
  text = text.replace(/^建议采用[:：]\s*/u, "");
  text = text.replace(/^推荐方案[:：]\s*/u, "");
  text = text.replace(/\s*请(?:业务)?(?:结合实际业务)?确认或修改[。.!！]*\s*$/u, "");
  text = text.replace(/\s*请(?:业务)?确认[。.!！]*\s*$/u, "");
  text = text.replace(/\s*你也可以修改后再确认[。.!！]*\s*$/u, "");
  return text.trim() || value.trim();
}

export function RequirementReviewTab({ projectId }: { projectId: string }) {
  const [data, setData] = useState<RequirementReviewData>({
    session: null,
    questions: [],
    isStale: false,
    staleReason: "",
    unreviewedFileIds: [],
    missingReviewedFileIds: [],
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [replyQuestion, setReplyQuestion] = useState<RequirementReviewData["questions"][number] | null>(null);
  const [showRereviewConfirm, setShowRereviewConfirm] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextSnapshot, setContextSnapshot] = useState<ProjectContextSnapshot | null>(null);
  const load = useCallback(async () => {
    const value = await requirementReviewApi.get(projectId);
    setData(value);
    setAnswers(Object.fromEntries(value.questions.map((item) => [item.id, item.answer || ""])));
    setLoading(false);
  }, [projectId]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!replyQuestion?.suggestedAnswer) return;
    setAnswers((current) => {
      if ((current[replyQuestion.id] || "").trim()) return current;
      return { ...current, [replyQuestion.id]: answerFromSuggestedAnswer(replyQuestion.suggestedAnswer) };
    });
  }, [replyQuestion]);
  useEffect(() => {
    const handler = (event: Event) => {
      const { projectId: pid } = (event as CustomEvent).detail || {};
      if (pid === projectId) void load();
    };
    window.addEventListener("aitestlink:data-refresh", handler);
    return () => window.removeEventListener("aitestlink:data-refresh", handler);
  }, [projectId, load]);

  const { state, dispatch } = useStore();
  const { mutationLocked, mutationLockMessage } = useProjectMutationLock();
  const reviewingKey = "需求评审" as const;  // 后端 task type 名称
  const taskKey = `${projectId}:${reviewingKey}`;
  const reviewing = state.activeAITasks.includes(taskKey);
  const validatingKey = `${projectId}:回复校验`;
  const validatingInStore = state.activeAITasks.includes(validatingKey);
  const lockedByOtherTask = mutationLocked && !reviewing && !validatingInStore;
  const startReview = async () => {
    if (reviewing) { toast.info("文档审查正在进行中，请等待完成"); return; }
    if (lockedByOtherTask) { toast.warning(mutationLockMessage); return; }
    dispatch({ type: "START_ACTIVE_AI_TASK", payload: taskKey });
    try {
      const task = await aiApi.reviewRequirements(projectId);
      toast.info("文档审查已启动，完成后会在通知列表中提醒");
      // 轮询等待完成（最长 6 分钟）
      for (let i = 0; i < 240; i++) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
        const tasks = await aiApi.listTasks(projectId);
        const current = tasks.find((t) => t.id === task.id);
        if (current?.status === "成功") {
          await load();
          window.dispatchEvent(new CustomEvent("aitestlink:data-refresh", { detail: { projectId } }));
          dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: taskKey });
          addNotification("任务完成", reviewingKey, projectId, "文档审查已完成", `/projects/${projectId}`, "文档审查");
          toast.success("文档审查完成");
          return;
        }
        if (current?.status === "失败") {
          throw new Error(current.errorMessage || "文档审查失败");
        }
      }
      throw new Error("文档审查仍在后台执行，请稍后刷新查看");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "文档审查失败";
      toast.error(msg);
      addNotification("任务失败", reviewingKey, projectId, msg, `/projects/${projectId}`, "文档审查");
      dispatch({ type: "STOP_ACTIVE_AI_TASK", payload: taskKey });
    }
  };
  const saveAnswer = async (id: string) => {
    if (lockedByOtherTask) { toast.warning(mutationLockMessage); return; }
    const answer = (answers[id] || "").trim();
    if (!answer) { toast.warning("请填写明确回复"); return; }
    setSavingId(id);
    try {
      await requirementReviewApi.answer(id, answer);
      await load();
      setReplyQuestion(null);
      toast.success("回复已保存，全部回复完成后请统一校验");
    }
    catch (error) { toast.error(error instanceof Error ? error.message : "保存失败"); }
    finally { setSavingId(""); }
  };
  const validateAnswers = async () => {
    if (lockedByOtherTask) { toast.warning(mutationLockMessage); return; }
    setValidating(true);
    try {
      const task = await requirementReviewApi.validate(projectId);
      toast.info("AI 正在结合需求资料、系统识别结果和全部回复进行校验");
      for (let index = 0; index < 240; index += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
        const current = (await aiApi.listTasks(projectId)).find((item) => item.id === task.id);
        if (current?.status === "成功") {
          await load();
          window.dispatchEvent(new CustomEvent("aitestlink:data-refresh", { detail: { projectId } }));
          toast.success("AI 回复校验完成");
          return;
        }
        if (current?.status === "失败") throw new Error(current.errorMessage || "AI 回复校验失败");
      }
      throw new Error("AI 回复校验仍在后台执行，请稍后刷新查看");
    } catch (error) { toast.error(error instanceof Error ? error.message : "回复校验失败"); }
    finally { setValidating(false); }
  };
  const openProjectContext = async () => {
    setContextOpen(true); setContextLoading(true);
    try { setContextSnapshot((await requirementReviewApi.getProjectContext(projectId)).snapshot); }
    catch (error) { toast.error(error instanceof Error ? error.message : "上下文加载失败"); }
    finally { setContextLoading(false); }
  };
  const confirmed = data.questions.filter((item) => item.confirmationStatus === "已确认").length;
  const replied = data.questions.filter((item) => item.replyStatus === "已回复").length;
  const failed = data.questions.filter((item) => item.confirmationStatus === "不通过").length;
  const allReplied = data.questions.length > 0 && data.questions.every((item) => item.replyStatus === "已回复");
  const allConfirmed = data.questions.length > 0 && data.questions.every((item) => item.confirmationStatus === "已确认");
  const staleDetail = data.isStale
    ? [
      data.unreviewedFileIds.length ? `新增 ${data.unreviewedFileIds.length} 个未审查文件` : "",
      data.missingReviewedFileIds.length ? `有 ${data.missingReviewedFileIds.length} 个已审查文件已删除` : "",
    ].filter(Boolean).join("，")
    : "";
  const reviewMeta = (() => {
    if (reviewing) return <>文档审查中，AI 正在分析需求资料和系统识别结果</>;
    if (validating || validatingInStore) return <>AI 回复校验中，正在核对全部回复是否完整可执行</>;
    if (data.session) {
      return <>已确认 <strong>{confirmed}/{data.questions.length}</strong>{replied ? `，待校验 ${replied}` : ""}{failed ? `，不通过 ${failed}` : ""}，审查状态：{data.isStale ? "需重新审查" : data.session.status}</>;
    }
    return <>尚未开始审查</>;
  })();
  const reviewButtonContent = reviewing
    ? <><Loader2 size={13} className="animate-spin" />审查中...</>
    : <><RefreshCw size={13} />{data.session ? "重新审查" : "开始审查"}</>;
  const suggestionCopy = (level: RequirementReviewData["questions"][number]["suggestionLevel"]) => ({
    "直接建议": "AI 已依据当前资料整理回复内容，并自动带入下方回复框；可直接修改后保存。",
    "推荐方案": "AI 已基于当前业务语境整理推荐回复，并自动带入下方回复框；请确认或修改。",
    "待补充信息": "当前资料不足以确定业务事实，AI 已整理需要补充的信息并带入下方回复框；请补充后确认。",
  })[level];
  const questionCodes = Object.fromEntries(data.questions.map((item, index) => [item.id, `Q_${String(index + 1).padStart(3, "0")}`]));
  return <div className="page-stack page-stack--spaced page-stack--fill">
    <SectionHeader title="文档审查" description="在生成正式需求前，结合需求资料和系统识别结果发现并确认所有不明确问题。"
      meta={reviewMeta}
      actions={<>
        <button className="ghost-button" type="button" onClick={openProjectContext}><FileText size={13} />查看项目上下文</button>
        {data.session && <button className="primary-button" type="button" onClick={validateAnswers} disabled={lockedByOtherTask || data.isStale || !allReplied || allConfirmed || validating} title={lockedByOtherTask ? mutationLockMessage : data.isStale ? "输入资料已变更，请重新审查" : !allReplied ? "请先回复全部问题" : undefined}>
          {validating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}{validating ? "AI 校验中..." : allConfirmed ? "已校验通过" : "校验回复"}
        </button>}
        <button className="primary-button" type="button" onClick={() => {
          if (data.session && replied > 0) { setShowRereviewConfirm(true); } else { startReview(); }
        }} disabled={reviewing || lockedByOtherTask} title={lockedByOtherTask ? mutationLockMessage : undefined}>
          {reviewButtonContent}
        </button>
      </>} />
    <section className="work-panel requirement-review-panel">
      {loading ? <div className="empty-state"><Loader2 className="animate-spin" /><p>加载中...</p></div> : !data.session ?
        <div className="empty-state"><p>请先上传需求资料并完成系统识别，然后开始文档审查。</p></div> : data.questions.length === 0 ?
        <div className="empty-state"><CheckCircle2 /><p>{data.isStale ? "输入资料已变更，请重新审查。" : "没有发现待确认问题，可以生成正式需求。"}</p></div> :
        <div className="requirement-review-list">
          {data.isStale && <div className="requirement-review-validation"><strong>{data.staleReason || "输入资料已变更，请重新审查"}</strong><p>{staleDetail || "当前审查结果不再覆盖最新输入资料，后续生成已被系统卡控。"}</p></div>}
          <DataTable
            rows={data.questions}
            getRowKey={(item) => item.id}
            columns={[
              { key: "id", label: "问题编号", width: "100px", render: (item) => questionCodes[item.id] },
              { key: "question", label: "问题描述", width: "34%", align: "left", lineClamp: 2, render: (item) => item.question },
              { key: "category", label: "问题类型", width: "110px", render: (item) => <StatusPill tone="slate">{item.category}</StatusPill> },
              { key: "reply", label: "回复状态", width: "100px", render: (item) => <StatusPill tone={item.replyStatus === "已回复" ? "blue" : "amber"}>{item.replyStatus}</StatusPill> },
              { key: "confirmation", label: "确认状态", width: "100px", render: (item) => <StatusPill tone={item.confirmationStatus === "已确认" ? "green" : item.confirmationStatus === "不通过" ? "red" : "amber"}>{item.confirmationStatus}</StatusPill> },
              { key: "time", label: "审查时间", width: "164px", render: (item) => formatDateTime(item.createdAt) },
              { key: "source", label: "来源", width: "92px", render: (item) => item.source || "AI评审" },
              { key: "actions", label: "操作", width: "92px", sticky: "right", render: (item) => <button className="text-button" type="button" disabled={lockedByOtherTask} title={lockedByOtherTask ? mutationLockMessage : undefined} onClick={() => setReplyQuestion(item)}>{item.confirmationStatus === "已确认" ? "查看/修改" : "回复"}</button> },
            ]}
          />
        </div>}
    </section>
    <ConfirmDialog
      open={showRereviewConfirm}
      title="重新审查确认"
      message={`当前已有 ${replied} 个问题已回复、${confirmed} 个问题已确认。同一份输入资料重新审查会保留现有问题、回复与状态，仅补充新问题；输入资料变更后才会开启新一轮审查。是否继续？`}
      confirmLabel="确认重新审查"
      onConfirm={() => { setShowRereviewConfirm(false); startReview(); }}
      onCancel={() => setShowRereviewConfirm(false)}
    />
    <Modal open={contextOpen} onClose={() => setContextOpen(false)} title="项目上下文（内部 AI 依据）" width={920} height="78vh"
      footer={<button className="ghost-button" type="button" onClick={() => setContextOpen(false)}>关闭</button>}>
      {contextLoading ? <div className="empty-state"><Loader2 className="animate-spin" /><p>加载中...</p></div> : !contextSnapshot ?
        <div className="empty-state"><FileText /><p>尚未生成项目上下文。完成一次文档审查后会自动创建。</p></div> :
        <div className="page-stack" style={{ gap: 12 }}>
          <p className="muted-text">状态：<strong>{contextSnapshot.status}</strong>　生成时间：{formatDateTime(contextSnapshot.updatedAt)}</p>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 13, lineHeight: 1.65, color: "var(--text-primary)" }}>{contextSnapshot.contentMarkdown}</pre>
        </div>}
    </Modal>
    <Modal open={!!replyQuestion} onClose={() => setReplyQuestion(null)} title="回复审查问题" width={1080} height="84vh"
      footer={<><button className="ghost-button" type="button" onClick={() => setReplyQuestion(null)}>取消</button><button className="primary-button" type="button" disabled={lockedByOtherTask || !replyQuestion || savingId === replyQuestion.id} title={lockedByOtherTask ? mutationLockMessage : undefined} onClick={() => replyQuestion && saveAnswer(replyQuestion.id)}>{savingId === replyQuestion?.id ? "保存中..." : replyQuestion?.confirmationStatus === "已确认" ? "修改回复" : "保存回复"}</button></>}>
      {!replyQuestion ? null : <div className="page-stack requirement-review-reply-modal">
        <div className="requirement-review-evidence"><strong>问题描述</strong><p>{replyQuestion.question}</p></div>
        {replyQuestion.evidence && <div className="requirement-review-evidence"><strong>评审依据</strong><p>{replyQuestion.evidence}</p></div>}
        <p className="requirement-review-history"><Lightbulb size={15} />{suggestionCopy(replyQuestion.suggestionLevel || "待补充信息")}</p>
        {replyQuestion.validationMessage && <div className="requirement-review-validation"><strong>校验未通过原因</strong><p>{replyQuestion.validationMessage}</p></div>}
        <div className="requirement-review-reply-meta">
          <strong>回复内容</strong>
          <span>问题类型 <StatusPill tone="slate">{replyQuestion.category}</StatusPill></span>
          <span>回复状态 <StatusPill tone={replyQuestion.replyStatus === "已回复" ? "blue" : "amber"}>{replyQuestion.replyStatus}</StatusPill></span>
          <span>确认状态 <StatusPill tone={replyQuestion.confirmationStatus === "已确认" ? "green" : replyQuestion.confirmationStatus === "不通过" ? "red" : "amber"}>{replyQuestion.confirmationStatus}</StatusPill></span>
          <span>审查时间 {formatDateTime(replyQuestion.createdAt)}</span>
        </div>
        <textarea className="form-textarea" autoFocus value={answers[replyQuestion.id] || ""} onChange={(event) => setAnswers((current) => ({ ...current, [replyQuestion.id]: event.target.value }))} placeholder={replyQuestion.confirmationStatus === "已确认" ? "修改后需重新校验" : "请填写明确回复"} rows={5} />
      </div>}
    </Modal>
  </div>;
}
