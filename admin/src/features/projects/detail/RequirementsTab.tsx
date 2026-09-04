import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Loader2, Radar, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "../../../app/store";
import { filesApi, requirementsApi } from "../../../api/client";
import { requirementReviewApi } from "../../../api/system.api";
import { useProjectData } from "../useProjectData";
import { useConfigError } from "../../../shared/hooks/useConfigError";
import { startParseRequirements, startReverseRequirements } from "../../../shared/hooks/aiTaskManager";
import { useUnsavedChanges } from "../../../shared/hooks/useUnsavedChanges";
import { DataTable } from "../../../shared/components/DataTable";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusPill } from "../../../shared/components/StatusPill";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { Modal } from "../../../shared/components/Modal";
import { MenuSelect } from "../../../shared/components/MenuSelect";
import { formatProjectTime as formatTime, reviewTone } from "./projectDetail.config";
import { riskTone, validityTone } from "../../../shared/utils/statusTone";
import { useProjectMutationLock } from "./ProjectMutationLockContext";
import type { TargetPlatform } from "../../../shared/types/platform";

// ═══════════════════════════════════════

const reverseScopeOptions = [
  { value: "recognized", label: "仅已识别页面" },
  { value: "default", label: "默认环境可见功能" },
  { value: "all", label: "全部识别结果" },
  { value: "keywords", label: "指定关键词/菜单" },
];
const reverseTargetOptions = [
  { value: "冒烟测试", label: "冒烟测试" },
  { value: "回归测试", label: "回归测试" },
  { value: "增量测试", label: "增量测试" },
  { value: "全量测试", label: "全量测试" },
];
const reverseWriteModeOptions = [
  { value: "append", label: "追加到当前需求" },
  { value: "overwrite", label: "覆盖当前需求" },
];

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function RequirementsTab({ projectId }: { projectId: string }) {
  const { project, files, requirements, refresh, refreshRequirements, initialLoading } = useProjectData(projectId);
  const { state, dispatch } = useStore();
  const { mutationLocked, mutationLockMessage } = useProjectMutationLock();
  const parsing = useMemo(() => state.activeAITasks.includes(`${projectId}:需求解析`), [state.activeAITasks, projectId]);
  const reversing = useMemo(() => state.activeAITasks.includes(`${projectId}:AI反推需求`), [state.activeAITasks, projectId]);
  const lockedByOtherTask = mutationLocked && !parsing && !reversing;
  const { showConfigError, dialog: configErrorDialog } = useConfigError();
  const [showReparseConfirm, setShowReparseConfirm] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reverseScope, setReverseScope] = useState("recognized");
  const [reverseTarget, setReverseTarget] = useState("冒烟测试");
  const [reverseWriteMode, setReverseWriteMode] = useState("append");
  const [reverseMaxPages, setReverseMaxPages] = useState(20);
  const [reverseMaxRequirements, setReverseMaxRequirements] = useState(30);
  const [reverseKeywords, setReverseKeywords] = useState("");
  const [viewReq, setViewReq] = useState<typeof requirements[0] | null>(null);
  const [editReq, setEditReq] = useState<typeof requirements[0] | null>(null);
  const [editRule, setEditRule] = useState("");
  const [editTargetPlatform, setEditTargetPlatform] = useState<TargetPlatform>("PC");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reviewReady, setReviewReady] = useState<boolean | null>(null);
  const reqDirty = useUnsavedChanges("需求");
  const requirementsMeta = useMemo(() => {
    if (parsing) return <>需求解析中，AI 正在从已审查资料生成正式需求</>;
    if (reversing) return <>AI 反推需求中，正在基于系统识别结果生成候选需求</>;
    return <>共 <strong>{requirements.length}</strong> 条需求，文档审查：{reviewReady ? "已全部确认" : "未完成"}</>;
  }, [parsing, requirements.length, reversing, reviewReady]);

  const refreshReviewReady = useCallback(async () => {
    try {
      const review = await requirementReviewApi.get(projectId);
      setReviewReady(Boolean(
        review.session?.status === "已完成"
        && review.questions.every((item) => item.confirmationStatus === "已确认"),
      ));
    } catch {
      setReviewReady(false);
    }
  }, [projectId]);
  useEffect(() => { void refreshReviewReady(); }, [refreshReviewReady]);

  const hasFiles = files.length > 0;
  const hasParsedFiles = requirements.length > 0;
  const isInvalid = (r: any) => r.validityStatus === "已失效" || r.reviewStatus === "已作废";
  const reviewableRequirements = requirements.filter((r) => !isInvalid(r));
  const allSelected = reviewableRequirements.length > 0 && reviewableRequirements.every((r) => selectedIds.has(r.id));
  // 仅当存在已失效数据时才显示"失效原因"列（含表头）
  const hasInvalid = requirements.some((r) => r.validityStatus === "已失效");
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(reviewableRequirements.map((r) => r.id)));
  const toggleSelect = (id: string) => setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const [showBatchApproveConfirm, setShowBatchApproveConfirm] = useState(false);

  const toggleReview = async (r: any) => {
    if (lockedByOtherTask) { toast.warning(mutationLockMessage); return; }
    if (isInvalid(r)) { toast.warning("已失效的需求不能修改评审状态，请重新解析需求"); return; }
    const newStatus = (r.reviewStatus === "已通过") ? "待评审" : "已通过";
    try {
      const updated = await requirementsApi.update(r.id, { reviewStatus: newStatus } as any);
      dispatch({ type: "UPDATE_REQUIREMENT", payload: updated });
    } catch (error) {
      toast.error(apiErrorMessage(error, "评审状态更新失败"));
      return;
    }
    await refresh();
  };
  const batchApprove = async () => {
    const selected = requirements.filter((r) => selectedIds.has(r.id));
    const invalid = selected.filter(isInvalid);
    const reviewable = selected.filter((r) => !isInvalid(r) && r.reviewStatus !== "已通过");

    if (reviewable.length === 0) {
      if (invalid.length > 0) {
        toast.warning(`选中的 ${selectedIds.size} 条需求均已失效，无法再次评审。数据失效后需重新解析需求`);
      } else {
        toast.info("选中的需求已是评审通过状态，无需重复评审");
      }
      setSelectedIds(new Set());
      return;
    }

    let passed = 0;
    for (const r of reviewable) {
      try {
        const updated = await requirementsApi.update(r.id, { reviewStatus: "已通过" } as any);
        dispatch({ type: "UPDATE_REQUIREMENT", payload: updated });
        passed += 1;
      } catch (error) {
        toast.error(apiErrorMessage(error, "批量评审失败"));
        return;
      }
    }
    if (invalid.length > 0) {
      toast.success(`已通过 ${passed} 条需求；其中 ${invalid.length} 条已失效被自动跳过`);
    } else {
      toast.success(`已通过 ${passed} 条需求`);
    }
    setSelectedIds(new Set());
    await refresh();
  };
  const doParse = async () => {
    if (lockedByOtherTask) { toast.warning(mutationLockMessage); return; }
    if (files.length === 0) { toast.warning("请先在「输入资料」页面上传文件"); return; }
    await startParseRequirements(projectId);
    await refresh();
    window.dispatchEvent(new CustomEvent("aitestlink:files-refresh", { detail: { projectId } }));
  };

  const handleParse = async () => {
    if (parsing) return;
    if (lockedByOtherTask) { toast.warning(mutationLockMessage); return; }
    // 每次点击都以服务端的最新评审状态为准，不能依赖页面初次加载时的缓存。
    try {
      const review = await requirementReviewApi.get(projectId);
      const ready = Boolean(review.session?.status === "已完成" && review.questions.every((item) => item.confirmationStatus === "已确认"));
      setReviewReady(ready);
      if (!ready) {
        toast.warning("请先在「文档审查」回复并校验全部问题，全部变为“已确认”后才能解析需求");
        return;
      }
    } catch {
      toast.error("无法获取文档审查状态，请稍后重试");
      return;
    }
    // 直接调 API 检查文件数量，避免跨实例状态不同步
    try {
      const freshFiles = await filesApi.list(projectId);
      if (!Array.isArray(freshFiles) || freshFiles.length === 0) {
        toast.warning("请先在「输入资料」页面上传文件");
        return;
      }
    } catch {
      toast.warning("请先在「输入资料」页面上传文件");
      return;
    }
    if (hasParsedFiles) { setShowReparseConfirm(true); return; }
    await doParse();
  };

  const handleReverseRequirements = async () => {
    if (reversing) return;
    if (lockedByOtherTask) { toast.warning(mutationLockMessage); return; }
    setShowReverseModal(false);
    const result = await startReverseRequirements(projectId, {
      scope: reverseScope,
      testTarget: reverseTarget,
      writeMode: reverseWriteMode,
      maxPages: reverseMaxPages,
      maxRequirements: reverseMaxRequirements,
      keywords: reverseKeywords,
    });
    if (!result.success && result.error) {
      toast.error(result.error);
    }
    await refresh();
  };

  const handleExport = async () => {
    if (requirements.length === 0) {
      toast.warning("暂无需求数据，请先解析需求");
      return;
    }
    try {
      const blob = await requirementsApi.export(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.name || "未命名项目"}-需求列表.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`已导出 ${requirements.length} 条需求`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "导出失败"));
    }
  };

  return (
    <div className="page-stack page-stack--spaced page-stack--fill">
      <SectionHeader title="需求列表" description="从上传的文档中解析需求，支持查看和确认。" meta={requirementsMeta}
        actions={<>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {selectedIds.size > 0 && <button className="ghost-button" type="button" onClick={() => setShowBatchApproveConfirm(true)} disabled={lockedByOtherTask} title={lockedByOtherTask ? mutationLockMessage : undefined}><CheckCircle2 size={13} /> 评审通过（{selectedIds.size}）</button>}
              <button className="ghost-button" type="button" onClick={handleExport} disabled={parsing || reversing}><Download size={13} /> 导出 Excel</button>
              <button className="ghost-button" type="button" onClick={() => setShowReverseModal(true)} disabled={reversing || lockedByOtherTask} title={lockedByOtherTask ? mutationLockMessage : undefined}>
                {reversing ? <><Loader2 size={13} className="animate-spin" /> 反推中...</> : <><Radar size={13} /> AI 反推需求</>}
              </button>
              <button className="primary-button" type="button" onClick={handleParse} disabled={parsing || lockedByOtherTask || reviewReady !== true} title={lockedByOtherTask ? mutationLockMessage : reviewReady !== true ? "请先完成文档审查并校验全部回复" : undefined}>
                {parsing ? <><Loader2 size={13} className="animate-spin" /> 解析中...</> : <><WandSparkles size={13} /> 需求解析</>}
              </button>
            </div>
          </div>
        </>} />
      <section className="work-panel">
        {initialLoading && requirements.length === 0 ? (
          <div className="empty-state"><Loader2 size={20} className="animate-spin" style={{ color: "var(--muted)" }} /><p style={{ marginTop: 8, color: "var(--muted)" }}>加载中...</p></div>
        ) : requirements.length === 0 ? (
          <div className="empty-state">
            {hasFiles ? <p>暂无需求数据，请点击「需求解析」按钮</p> : <p>暂无需求数据，请先在「输入资料」页面上传文件</p>}
          </div>
        ) : (
          <DataTable rows={requirements} getRowKey={(r) => r.id} columns={[
            { key: "select", label: <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} disabled={reviewableRequirements.length === 0} />, width: "40px", sticky: "left" as const, render: (r) => {
              const invalid = isInvalid(r);
              return <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} disabled={invalid} title={invalid ? "已失效需求不可评审" : undefined} />;
            } },
            { key: "reqId", label: "需求标识", width: "12%", render: (r) => r.reqId || <span className="text-muted">-</span> },
            { key: "module", label: "模块", width: "10%", render: (r) => r.module },
            { key: "feature", label: "需求描述", width: "10%", align: "left", lineClamp: 3, render: (r) => <span title={r.feature}>{r.feature}</span> },
            { key: "source", label: "来源", width: "10%", lineClamp: 3, render: (r) => <span title={r.source}>{r.source}</span> },
            { key: "risk", label: "风险", align: "center", render: (r) => <StatusPill tone={riskTone(r.risk)}>{r.risk}</StatusPill> },
            { key: "targetPlatform", label: "测试端", width: "72px", align: "center", render: (r) => r.targetPlatform || "PC" },
            { key: "rule", label: "业务规则", width: "20%", align: "left", lineClamp: 3, render: (r) => <span title={r.rule}>{r.rule}</span> },
            { key: "reviewStatus", label: "评审", width: "8%", align: "center", render: (r) => <button type="button" className="text-button" onClick={() => toggleReview(r)}><StatusPill tone={reviewTone(r.reviewStatus)}>{r.reviewStatus || "待评审"}</StatusPill></button> },
            { key: "validityStatus", label: "数据状态", align: "center", render: (r) => <StatusPill tone={validityTone(r.validityStatus)}>{r.validityStatus || "有效"}</StatusPill> },
            ...(hasInvalid ? [{ key: "invalidReason", label: "失效原因", align: "left" as const, width: "14%", lineClamp: 2, render: (r: any) => (r.validityStatus === "已失效" && r.invalidReason) ? <span title={r.invalidReason}>{r.invalidReason}</span> : null }] : []),
            { key: "createdAt", label: "生成时间", render: (r) => formatTime(r.createdAt) },
            { key: "updatedAt", label: "更新时间", render: (r) => formatTime(r.updatedAt) },
            { key: "actions", label: "操作", width: "120px", sticky: "right" as const, align: "center", render: (r) => (
              <div className="inline-actions">
                <button className="text-button" type="button" onClick={() => setViewReq(r)}>查看</button>
                <button className="text-button" type="button" onClick={() => { setEditReq(r); setEditRule(r.rule); setEditTargetPlatform((r.targetPlatform || "PC") as TargetPlatform); }}>编辑</button>
              </div>
            )},
          ]} />
        )}
      </section>

      {/* 查看需求弹窗 */}
      <Modal open={!!viewReq} onClose={() => setViewReq(null)} title="需求详情" width={640}>
        {viewReq && (
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">需求标识</span><span>{viewReq.reqId || "-"}</span></div>
            <div className="detail-row"><span className="detail-label">模块</span><span>{viewReq.module}</span></div>
            <div className="detail-row"><span className="detail-label">功能点</span><span>{viewReq.feature}</span></div>
            <div className="detail-row"><span className="detail-label">来源</span><span>{viewReq.source}</span></div>
            <div className="detail-row"><span className="detail-label">风险等级</span><StatusPill tone={riskTone(viewReq.risk)}>{viewReq.risk}</StatusPill></div>
            <div className="detail-row"><span className="detail-label">测试端</span><span>{viewReq.targetPlatform || "PC"}</span></div>
            <div className="detail-row detail-row--full"><span className="detail-label">业务规则</span><pre className="detail-pre">{viewReq.rule || "无"}</pre></div>
            <div className="detail-row"><span className="detail-label">评审状态</span><StatusPill tone={reviewTone(viewReq.reviewStatus)}>{viewReq.reviewStatus || "待评审"}</StatusPill></div>
          </div>
        )}
      </Modal>

      {/* 编辑需求弹窗 */}
      <Modal open={!!editReq} onClose={() => reqDirty.requestClose(() => setEditReq(null))} title="编辑需求" width={640}
        footer={<>
          <button className="ghost-button" type="button" onClick={() => reqDirty.requestClose(() => setEditReq(null))}>取消</button>
          <button className="primary-button" type="button" onClick={async () => {
            if (!editReq) return;
            try {
              const updatedReq = await requirementsApi.update(editReq.id, {
                rule: editRule,
                targetPlatform: editTargetPlatform,
              } as any);
              dispatch({ type: "UPDATE_REQUIREMENT", payload: updatedReq });
              setEditReq(updatedReq);
              if (viewReq?.id === updatedReq.id) setViewReq(updatedReq);
              await refreshRequirements();
              toast.success("保存成功");
              reqDirty.markClean();
              setEditReq(null);
            } catch (error) { toast.error(apiErrorMessage(error, "保存失败")); }
          }}>保存</button>
        </>}
      >
        {editReq && (
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">需求标识</span><span>{editReq.reqId || "-"}</span></div>
            <div className="detail-row"><span className="detail-label">模块</span><span>{editReq.module}</span></div>
            <div className="detail-row"><span className="detail-label">功能点</span><span>{editReq.feature}</span></div>
            <div className="detail-row"><span className="detail-label">来源</span><span>{editReq.source}</span></div>
            <div className="detail-row"><span className="detail-label">风险等级</span><StatusPill tone={riskTone(editReq.risk)}>{editReq.risk}</StatusPill></div>
            <div className="detail-row"><span className="detail-label">测试端</span><MenuSelect className="detail-row__menu-select" value={editTargetPlatform} options={[{ value: "PC", label: "PC" }, { value: "APP", label: "APP" }]} onChange={(value) => { setEditTargetPlatform(value); reqDirty.markDirty(); }} /></div>
            <div className="detail-row detail-row--full"><span className="detail-label">业务规则</span><textarea className="form-textarea" style={{ flex: 1 }} rows={5} value={editRule} onChange={(e) => { setEditRule(e.target.value); reqDirty.markDirty(); }} /></div>
            <div className="detail-row"><span className="detail-label">生成时间</span><span>{formatTime(editReq.createdAt)}</span></div>
            <div className="detail-row"><span className="detail-label">更新时间</span><span>{formatTime(editReq.updatedAt)}</span></div>

          </div>
        )}
      </Modal>

      <ConfirmDialog open={showReparseConfirm} title="重新解析需求" message="重新解析将基于最新已确认的项目上下文生成需求，并覆盖当前解析数据和需求。是否重新解析？" confirmLabel="重新解析" onConfirm={() => { setShowReparseConfirm(false); doParse(); }} onCancel={() => setShowReparseConfirm(false)} />
      <ConfirmDialog open={showBatchApproveConfirm} title="批量评审通过" message={(() => {
        const selected = requirements.filter((r) => selectedIds.has(r.id));
        const invalidCount = selected.filter(isInvalid).length;
        if (invalidCount === selected.length) {
          return `选中的 ${selectedIds.size} 条需求均已失效，无法再次评审。数据失效后需重新解析需求`;
        }
        if (invalidCount > 0) {
          return `选中的 ${selectedIds.size} 条需求中有 ${invalidCount} 条已失效，将被自动跳过，仅评审其余 ${selectedIds.size - invalidCount} 条。是否继续？`;
        }
        return `确定将选中的 ${selectedIds.size} 条需求标记为评审通过？`;
      })()} confirmLabel="确认通过" onConfirm={() => { setShowBatchApproveConfirm(false); batchApprove(); }} onCancel={() => setShowBatchApproveConfirm(false)} />
      <Modal open={showReverseModal} onClose={() => setShowReverseModal(false)} title="AI 反推需求" width={620}
        footer={<>
          <button className="ghost-button" type="button" onClick={() => setShowReverseModal(false)}>取消</button>
          <button className="primary-button" type="button" onClick={handleReverseRequirements} disabled={reversing || lockedByOtherTask} title={lockedByOtherTask ? mutationLockMessage : undefined}>
            {reversing ? <><Loader2 size={13} className="animate-spin" /> 反推中...</> : "开始反推"}
          </button>
        </>}
      >
        <div className="detail-grid reverse-requirements-form">
          <div className="detail-row detail-row--full">
            <span className="detail-label">反推说明</span>
            <div style={{ color: "var(--muted)", lineHeight: 1.7 }}>
              AI 将基于环境配置、测试账号和最近一次成功的系统识别结果生成候选需求。生成后进入需求列表，默认待评审，后续流程不变。
            </div>
          </div>
          <div className="detail-row">
            <span className="detail-label">反推范围</span>
            <MenuSelect className="detail-row__menu-select" value={reverseScope} options={reverseScopeOptions} onChange={setReverseScope} />
          </div>
          <div className="detail-row">
            <span className="detail-label">测试目标</span>
            <MenuSelect className="detail-row__menu-select" value={reverseTarget} options={reverseTargetOptions} onChange={setReverseTarget} />
          </div>
          <div className="detail-row">
            <span className="detail-label">写入规则</span>
            <MenuSelect className="detail-row__menu-select" value={reverseWriteMode} options={reverseWriteModeOptions} onChange={setReverseWriteMode} />
          </div>
          <div className="detail-row">
            <span className="detail-label">最大页面数</span>
            <input className="menu-field-input" type="number" min={1} max={100} value={reverseMaxPages} onChange={(e) => setReverseMaxPages(Number(e.target.value) || 20)} />
          </div>
          <div className="detail-row">
            <span className="detail-label">最大需求数</span>
            <input className="menu-field-input" type="number" min={1} max={100} value={reverseMaxRequirements} onChange={(e) => setReverseMaxRequirements(Number(e.target.value) || 30)} />
          </div>
          <div className="detail-row detail-row--full">
            <span className="detail-label">关键词/菜单</span>
            <textarea className="form-textarea" style={{ flex: 1 }} rows={3} placeholder="可选。指定要反推的菜单、模块或关键词，例如：用户管理、文件上传、审批流程" value={reverseKeywords} onChange={(e) => setReverseKeywords(e.target.value)} />
          </div>
        </div>
      </Modal>
      {configErrorDialog}
      {reqDirty.confirmDialog}

    </div>
  );
}
