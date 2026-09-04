import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { useProjectData } from "../useProjectData";
import { defectsApi } from "../../../api/defect.api";
import { DataTable, type Column } from "../../../shared/components/DataTable";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusPill } from "../../../shared/components/StatusPill";
import { Modal } from "../../../shared/components/Modal";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { MenuSelect, type MenuSelectOption } from "../../../shared/components/MenuSelect";
import { RichTextEditor } from "../../../shared/components/RichTextEditor";
import { getMe } from "../../../features/auth/api/auth";
import type { Defect, DefectCreate, DefectSeverity, DefectPriority, DefectStatus, DefectCategory } from "../../../contracts/defect";
import { formatProjectTime as formatTime } from "./projectDetail.config";
import { useProjectMutationLock } from "./ProjectMutationLockContext";
import { startTraceabilityMatch } from "../../../shared/hooks/aiTaskManager";
import { loadLatestTracePreview, normalizeTracePreview, updateTracePreviewItem, type TracePreview, type TracePreviewItem } from "./traceabilityMatch";

const SEVERITY_OPTIONS: MenuSelectOption<DefectSeverity>[] = (["致命", "严重", "一般", "轻微", "建议"] as const).map((v) => ({ value: v, label: v }));
const PRIORITY_OPTIONS: MenuSelectOption<DefectPriority>[] = (["P0", "P1", "P2", "P3"] as const).map((v) => ({ value: v, label: v }));
const STATUS_OPTIONS: MenuSelectOption<DefectStatus>[] = (["新建", "确认", "修复中", "已修复", "已验证", "已关闭", "重新打开"] as const).map((v) => ({ value: v, label: v }));
const CATEGORY_OPTIONS: MenuSelectOption<DefectCategory>[] = (["功能缺陷", "性能缺陷", "界面缺陷", "安全缺陷", "兼容性缺陷"] as const).map((v) => ({ value: v, label: v }));

type DefectImportPreview = Awaited<ReturnType<typeof defectsApi.previewImport>>;
type TracePreviewState = TracePreview;

const severityTone = (s: string) => s === "致命" || s === "严重" ? "red" : s === "一般" ? "amber" : "slate";
const statusTone = (s: string) => {
  if (s === "已修复" || s === "已验证" || s === "已关闭") return "green";
  if (s === "修复中") return "blue";
  if (s === "重新打开") return "red";
  return "slate";
};
const priorityTone = (p: string) => p === "P0" ? "red" : p === "P1" ? "amber" : "slate";
const sourceTone = (s: string) => s === "自动化" ? "blue" : "slate";

const emptyForm: DefectCreate = {
  title: "",
  description: "",
  severity: "一般",
  priority: "P1",
  status: "新建",
  module: "",
  category: "功能缺陷",
  source: "手工",
  testCaseId: null,
  testCaseIds: [],
  scriptId: null,
  executionRunId: null,
  assignee: "",
  testPlan: "",
  iteration: "",
  environmentInfo: "",
  reporter: "",
  remark: "",
  stepsToReproduce: "",
};

/* DefectForm: left-right split layout matching screenshot */
function DefectForm({ form, setForm, testCases }: { form: DefectCreate; setForm: (f: DefectCreate) => void; testCases?: { id: string; caseCode: string; title: string }[] }) {
  const update = (patch: Partial<DefectCreate>) => setForm({ ...form, ...patch });

  const Select = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: MenuSelectOption<string>[] }) => (
    <MenuSelect value={value} options={options} onChange={onChange} />
  );

  const selectedTestCase = (testCases || []).find((tc) => tc.id === form.testCaseId);
  const selectedTestCaseIds = form.testCaseIds?.length ? form.testCaseIds : (form.testCaseId ? [form.testCaseId] : []);
  const selectedTestCases = selectedTestCaseIds
    .map((id) => (testCases || []).find((tc) => tc.id === id))
    .filter((tc): tc is { id: string; caseCode: string; title: string } => Boolean(tc));
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const casePickerRef = useRef<HTMLDivElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const updateCaseIds = (ids: string[]) => {
    const nextIds = Array.from(new Set(ids.filter(Boolean)));
    update({ testCaseIds: nextIds, testCaseId: nextIds[0] || null });
  };
  const toggleCase = (id: string) => {
    updateCaseIds(selectedTestCaseIds.includes(id)
      ? selectedTestCaseIds.filter((item) => item !== id)
      : [...selectedTestCaseIds, id]);
  };

  useEffect(() => {
    if (!casePickerOpen) return;
    const close = (event: MouseEvent) => {
      if (!casePickerRef.current?.contains(event.target as Node)) {
        setCasePickerOpen(false);
      }
    };
    window.addEventListener("click", close, true);
    return () => window.removeEventListener("click", close, true);
  }, [casePickerOpen]);

  useEffect(() => {
    const textarea = titleTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [form.title]);

  return (
    <div className="defect-form-split">
      {/* Left: title + rich text editor */}
      <div className="defect-form-split__left">
        <div className="defect-form-title-area">
          <label className="defect-form-title-area__label">{"缺陷标题"}</label>
          <textarea
            ref={titleTextareaRef}
            className="form-input defect-form-title-area__input"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder={"简要描述缺陷现象"}
            rows={1}
          />
        </div>

        <div className="defect-form-editor-area">
          <label className="defect-form-editor-area__label">{"缺陷详情"}</label>
          <RichTextEditor
            value={form.description || ""}
            onChange={(html) => update({ description: html })}
            placeholder={"请详细描述缺陷现象、复现路径、影响范围和补充说明..."}
          />
        </div>
      </div>

      {/* Right: basic info sidebar */}
      <div className="defect-form-split__right">
        <div className="defect-form-sidebar">
          <h4 className="defect-form-sidebar__title">{"缺陷基础信息"}</h4>

          <div className="defect-form-sidebar__field">
            <label className="defect-form-sidebar__label">{"用例标识"}</label>
            <div className="defect-case-picker" ref={casePickerRef}>
              <button className="defect-case-picker__trigger" type="button" onClick={() => setCasePickerOpen((open) => !open)}>
                <span>{selectedTestCases.length ? selectedTestCases.map((tc) => tc.caseCode).join("、") : "请选择"}</span>
              </button>
              {casePickerOpen ? (
                <div className="defect-case-picker__menu">
                  {(testCases || []).map((tc) => {
                    const checked = selectedTestCaseIds.includes(tc.id);
                    return (
                      <label key={tc.id} className={checked ? "defect-case-picker__item defect-case-picker__item--checked" : "defect-case-picker__item"}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCase(tc.id)} />
                        <span className="defect-case-picker__item-text">
                          <span className="defect-case-picker__item-code">{tc.caseCode}</span>
                          <span className="defect-case-picker__item-title">{tc.title}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="defect-form-sidebar__field">
            <label className="defect-form-sidebar__label">{"用例标题"}</label>
            <div className="defect-form-sidebar__readonly defect-form-sidebar__readonly--stack">
              {selectedTestCases.length
                ? selectedTestCases.map((tc) => <div key={tc.id}>{tc.caseCode}：{tc.title}</div>)
                : selectedTestCase?.title || "选择用例标识后自动带出"}
            </div>
          </div>

          <div className="defect-form-sidebar__field">
            <label className="defect-form-sidebar__label">{"严重程度"}</label>
            <Select value={form.severity || "一般"} onChange={(v) => update({ severity: v as DefectSeverity })} options={SEVERITY_OPTIONS} />
          </div>

          <div className="defect-form-sidebar__field">
            <label className="defect-form-sidebar__label">{"优先级"}</label>
            <Select value={form.priority || "P1"} onChange={(v) => update({ priority: v as DefectPriority })} options={PRIORITY_OPTIONS} />
          </div>

          <div className="defect-form-sidebar__field">
            <label className="defect-form-sidebar__label">{"缺陷类型"}</label>
            <Select value={form.category || "功能缺陷"} onChange={(v) => update({ category: v as DefectCategory })} options={CATEGORY_OPTIONS} />
          </div>

          <div className="defect-form-sidebar__field">
            <label className="defect-form-sidebar__label">{"指派给"}</label>
            <input className="form-input" value={form.assignee || ""} onChange={(e) => update({ assignee: e.target.value })} placeholder={"负责人"} />
          </div>


        </div>
      </div>
    </div>
  );
}

/* Main component */
export function DefectsTab({ projectId }: { projectId: string }) {
  const { testCases, initialLoading } = useProjectData(projectId);
  const { mutationLocked, mutationLockMessage } = useProjectMutationLock();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDefect, setEditDefect] = useState<Defect | null>(null);
  const [form, setForm] = useState<DefectCreate>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailDefect, setDetailDefect] = useState<Defect | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<DefectImportPreview | null>(null);
  const [tracePreview, setTracePreview] = useState<TracePreviewState | null>(null);
  const [lastTracePreview, setLastTracePreview] = useState<TracePreviewState | null>(null);
  const [tracePreviewLoaded, setTracePreviewLoaded] = useState(false);
  const [traceChoiceOpen, setTraceChoiceOpen] = useState(false);
  const [traceDetail, setTraceDetail] = useState<TracePreviewItem | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceApplying, setTraceApplying] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Defect | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const templateImportRef = useRef<HTMLInputElement>(null);
  const externalImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMe()
      .then((res) => setCurrentUser(res.user.nickname || res.user.phone || ""))
      .catch(() => {});
  }, []);

  const fetchDefects = useCallback(async () => {
    try {
      // 缺陷管理默认展示完整历史，不按数据有效性隐藏记录。
      const data = await defectsApi.list(projectId, "全部");
      setDefects(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchDefects(); }, [fetchDefects]);
  useEffect(() => {
    const handler = () => fetchDefects();
    window.addEventListener("aitestlink:data-refresh", handler);
    return () => window.removeEventListener("aitestlink:data-refresh", handler);
  }, [fetchDefects]);

  // 加载上次匹配结果，用于显示按钮文案
  useEffect(() => {
    // 先从 sessionStorage 读取缓存
    const cached = sessionStorage.getItem(`tracePreview_${projectId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.items && parsed.items.length > 0) {
          setLastTracePreview(parsed);
        }
      } catch { /* ignore */ }
    }
    setTracePreviewLoaded(true);

    // 再从 API 获取最新
    loadLatestTracePreview(projectId)
      .then((previous) => {
        if (previous && previous.items.length > 0) {
          setLastTracePreview(previous);
          sessionStorage.setItem(`tracePreview_${projectId}`, JSON.stringify(previous));
        }
      })
      .catch(() => {});
  }, [projectId]);

  const selectableDefects = defects;
  const selectedDefects = defects.filter((d) => selectedIds.has(d.id));
  const selectedValidDefectIds = selectedDefects.filter((d) => d.validityStatus !== "已失效").map((d) => d.id);
  const allSelected = selectableDefects.length > 0 && selectableDefects.every((d) => selectedIds.has(d.id));
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(selectableDefects.map((d) => d.id)));
  const toggleSelect = (id: string) => setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const openCreate = () => {
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    setEditDefect(null); setForm({ ...emptyForm, reporter: currentUser }); setShowForm(true);
  };
  const openEdit = (d: Defect) => {
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    if (d.validityStatus === "已失效") { toast.warning("已失效缺陷仅用于历史追溯，不能继续编辑"); return; }
    setEditDefect(d);
    setForm({
      title: d.title, description: d.description, severity: d.severity, priority: d.priority, status: d.status,
      module: d.module, category: d.category, source: d.source || "手工", testCaseId: d.testCaseId,
      testCaseIds: d.testCaseIds?.length ? d.testCaseIds : (d.testCaseId ? [d.testCaseId] : []),
      scriptId: d.scriptId, executionRunId: d.executionRunId, screenshotUrl: d.screenshotUrl,
      stepsToReproduce: d.stepsToReproduce, environmentInfo: d.environmentInfo,
      reporter: d.reporter, assignee: d.assignee, remark: d.remark,
      testPlan: d.testPlan, iteration: d.iteration,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    if (!form.title.trim()) { toast.warning("请填写缺陷标题"); return; }
    setSaving(true);
    try {
      if (editDefect) { await defectsApi.update(editDefect.id, form); toast.success("缺陷已更新"); }
      else { await defectsApi.create(projectId, form); toast.success("缺陷已创建"); }
      setShowForm(false);
      fetchDefects();
    } catch (err) { toast.error(err instanceof Error ? err.message : "操作失败"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (d: Defect) => {
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    setDeleteTarget(d);
  };

  const handleBatchDelete = () => {
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    if (selectedIds.size === 0) { toast.warning("请先选择缺陷"); return; }
    setBatchDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget && !batchDeleteOpen) return;
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    setDeleting(true);
    try {
      if (batchDeleteOpen) {
        const result = await defectsApi.batchDelete(Array.from(selectedIds));
        toast.success(`已删除 ${result.deleted} 个缺陷`);
        setSelectedIds(new Set());
        setBatchDeleteOpen(false);
      } else if (deleteTarget) {
        await defectsApi.delete(deleteTarget.id);
        toast.success("已删除");
        setDeleteTarget(null);
      }
      fetchDefects();
    }
    catch (err) { toast.error(err instanceof Error ? err.message : "删除失败"); }
    finally { setDeleting(false); }
  };

  const handleBatchStatus = async (status: string) => {
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    if (selectedIds.size === 0) { toast.warning("请先选择缺陷"); return; }
    if (selectedValidDefectIds.length === 0) { toast.warning("已失效缺陷不能批量修改状态"); return; }
    try {
      await defectsApi.batchStatus(selectedValidDefectIds, status);
      toast.success("已将 " + selectedValidDefectIds.length + " 个缺陷状态更新「" + status + "」");
      setSelectedIds(new Set());
      fetchDefects();
    } catch (err) { toast.error(err instanceof Error ? err.message : "操作失败"); }
  };

  const runTraceabilityMatch = async () => {
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    setTraceChoiceOpen(false);
    setTraceLoading(true);
    try {
      const taskResult = await startTraceabilityMatch(projectId);
      if (taskResult.success && "result" in taskResult && taskResult.result) {
        setTracePreview(normalizeTracePreview(taskResult.result as TracePreviewState));
      } else if (taskResult.success) {
        toast.info(taskResult.info || "AI追溯匹配已完成");
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "AI 匹配失败"); }
    finally { setTraceLoading(false); }
  };

  const handleTraceabilityPreview = async () => {
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    // 如果已有上次匹配结果，直接展示预览，不显示加载动画
    if (lastTracePreview && lastTracePreview.items.length > 0) {
      setTracePreview(lastTracePreview);
      return;
    }
    setTraceLoading(true);
    try {
      const previous = await loadLatestTracePreview(projectId);
      if (previous && previous.items.length > 0) {
        setLastTracePreview(previous);
        sessionStorage.setItem(`tracePreview_${projectId}`, JSON.stringify(previous));
        setTracePreview(previous);
        setTraceLoading(false);
        return;
      }
    } catch {
      // 历史结果读取失败不影响重新匹配。
    } finally {
      setTraceLoading(false);
    }
    await runTraceabilityMatch();
  };

  const toggleTraceRecommended = (item: TracePreviewItem) => {
    if (!item.testCaseId) {
      toast.warning("该缺陷没有候选用例，不能标记为可关联");
      return;
    }
    setTracePreview((prev) => updateTracePreviewItem(prev, item.defectId, (current) => ({
      ...current,
      recommended: !current.recommended,
    })));
  };

  const confirmTraceabilityApply = async () => {
    const matches = (tracePreview?.items || []).filter((item) => item.recommended && item.testCaseId);
    if (!matches.length) { toast.warning("没有达到推荐阈值的匹配关系"); return; }
    setTraceApplying(true);
    try {
      const result = await defectsApi.applyTraceability(projectId, matches.map((item) => ({
        defectId: item.defectId,
        testCaseId: item.testCaseId,
        score: item.score,
        reason: item.reason,
      })));
      toast.success(`已关联 ${result.applied} 条缺陷与用例`);
      setTracePreview(null);
      fetchDefects();
      window.dispatchEvent(new Event("aitestlink:data-refresh"));
    } catch (err) { toast.error(err instanceof Error ? err.message : "应用匹配失败"); }
    finally { setTraceApplying(false); }
  };

  const handleExport = async () => {
    try {
      const blob = await defectsApi.export(projectId, "全部");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "缺陷列表.xlsx"; a.click();
      URL.revokeObjectURL(url); toast.success("导出成功");
    } catch (err) { toast.error(err instanceof Error ? err.message : "导出失败"); }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await defectsApi.downloadImportTemplate(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "缺陷导入模板.xlsx"; a.click();
      URL.revokeObjectURL(url); toast.success("模板已下载");
    } catch (err) { toast.error(err instanceof Error ? err.message : "下载模板失败"); }
  };

  const handleImportFile = async (file: File | undefined, source: "模板导入" | "外部平台导入") => {
    if (!file) return;
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    setPreviewing(true);
    try {
      const preview = await defectsApi.previewImport(projectId, file, source);
      setImportFile(file);
      setImportPreview(preview);
    } catch (err) { toast.error(err instanceof Error ? err.message : "识别预览失败"); }
    finally {
      setPreviewing(false);
      if (templateImportRef.current) templateImportRef.current.value = "";
      if (externalImportRef.current) externalImportRef.current.value = "";
    }
  };

  const confirmImportFile = async () => {
    if (!importFile) return;
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    setImporting(true);
    try {
      const result = await defectsApi.importFile(projectId, importFile, importPreview?.source || "模板导入");
      const warningText = result.warnings?.length ? `，${result.warnings.length} 条需关注` : "";
      const updatedText = result.updated ? `，更新 ${result.updated} 条` : "";
      toast.success(`导入完成：新增 ${result.imported} 条${updatedText}，跳过 ${result.skipped} 条${warningText}`);
      setImportFile(null);
      setImportPreview(null);
      fetchDefects();
      window.dispatchEvent(new Event("aitestlink:data-refresh"));
    } catch (err) { toast.error(err instanceof Error ? err.message : "导入失败"); }
    finally {
      setImporting(false);
    }
  };

  const getTestCaseTitles = (defect: Defect) => {
    const ids = defect.testCaseIds?.length ? defect.testCaseIds : (defect.testCaseId ? [defect.testCaseId] : []);
    const relatedCases = ids
      .map((id) => testCases.find((t) => t.id === id))
      .filter((tc): tc is typeof testCases[number] => Boolean(tc));
    return relatedCases.length ? relatedCases.map((tc) => `${tc.caseCode}：${tc.title}`) : [];
  };

  const getTestCaseCodes = (defect: Defect) => {
    const ids = defect.testCaseIds?.length ? defect.testCaseIds : (defect.testCaseId ? [defect.testCaseId] : []);
    return ids
      .map((id) => testCases.find((t) => t.id === id)?.caseCode)
      .filter((code): code is string => Boolean(code));
  };

  const columns: Column<Defect>[] = [
    { key: "select", label: <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} disabled={selectableDefects.length === 0} />, width: "40px", sticky: "left", render: (d) => <input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggleSelect(d.id)} title={d.validityStatus === "已失效" ? "可批量删除，不能批量修改状态" : undefined} /> },
    { key: "defectCode", label: "缺陷编号", width: "120px", render: (d) => <span className="text-link" onClick={() => setDetailDefect(d)}>{d.defectCode}</span> },
    { key: "module", label: "模块", width: "160px", lineClamp: 2, render: (d) => d.module || "-" },
    { key: "externalProject", label: "外部项目", width: "170px", lineClamp: 1, render: (d) => d.externalProject || "-" },
    { key: "title", label: "标题", align: "left", lineClamp: 2, render: (d) => d.title },
    { key: "testCaseCodes", label: "用例标识", width: "140px", align: "left", render: (d) => {
      const codes = getTestCaseCodes(d);
      return codes.length ? (
        <span className="defect-case-codes" title={codes.join("、")}>
          {codes.slice(0, 2).map((code) => <span key={code}>{code}</span>)}
        </span>
      ) : "-";
    } },
    { key: "severity", label: "严重程度", width: "90px", render: (d) => <StatusPill tone={severityTone(d.severity)}>{d.severity}</StatusPill> },
    { key: "priority", label: "优先级", width: "76px", render: (d) => <StatusPill tone={priorityTone(d.priority)}>{d.priority}</StatusPill> },
    { key: "status", label: "状态", width: "96px", render: (d) => <StatusPill tone={statusTone(d.status)}>{d.status}</StatusPill> },
    { key: "validityStatus", label: "数据状态", width: "96px", render: (d) => <span title={d.invalidReason || ""}><StatusPill tone={d.validityStatus === "已失效" ? "amber" : "green"}>{d.validityStatus || "有效"}</StatusPill></span> },
    { key: "category", label: "缺陷类型", width: "108px", render: (d) => d.category || "-" },
    { key: "source", label: "来源", width: "80px", render: (d) => <StatusPill tone={sourceTone(d.source || "手工")}>{d.source || "手工"}</StatusPill> },
    { key: "reporter", label: "创建人", width: "80px", render: (d) => d.reporter || "-" },
    { key: "assignee", label: "指派人", width: "80px", render: (d) => d.assignee || "-" },
    { key: "resolution", label: "解决方案", width: "100px", render: (d) => d.resolution || "-" },
    { key: "createdAt", label: "创建时间", width: "140px", render: (d) => formatTime(d.createdAt) },
    { key: "actions", label: "操作", width: "120px", sticky: "right", align: "center", render: (d) => (
      <div className="inline-actions">
        <button className="text-button" type="button" onClick={() => openEdit(d)} disabled={mutationLocked || d.validityStatus === "已失效"} title={mutationLocked ? mutationLockMessage : undefined}>编辑</button>
        <button className="text-button" type="button" onClick={() => handleDelete(d)} disabled={mutationLocked} title={mutationLocked ? mutationLockMessage : undefined}>删除</button>
      </div>
    )},
  ];

  return (
    <div className="page-stack page-stack--spaced page-stack--fill">
      <SectionHeader
        title={"缺陷管理"}
        description={"管理测试过程中发现的缺陷，跟踪修复进度。"}
        meta={<>共 <strong>{defects.length}</strong> 个缺陷</>}
        actions={
          <div className="section-actions-stack">
            <div className="section-actions-row">
              {selectedValidDefectIds.length > 0 && ["确认", "修复中", "已修复", "已关闭"].map((s) => (
                <button key={s} className="ghost-button" type="button" disabled={mutationLocked} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => handleBatchStatus(s)}>{"批量" + s}</button>
              ))}
              {selectedIds.size > 0 && (
                <button className="ghost-button" type="button" disabled={mutationLocked || deleting} title={mutationLocked ? mutationLockMessage : undefined} onClick={handleBatchDelete}>{"批量删除"}</button>
              )}
              <button className="ghost-button" type="button" onClick={handleExport}><Download size={13} /> {"导出"}</button>
              <button className="ghost-button" type="button" onClick={handleDownloadTemplate}><Download size={13} /> {"下载模板"}</button>
              <button className="ghost-button" type="button" disabled={mutationLocked || traceLoading || traceApplying} title={mutationLocked ? mutationLockMessage : undefined} onClick={handleTraceabilityPreview}>
                {traceLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                {!tracePreviewLoaded ? "AI匹配用例" : lastTracePreview ? "查看匹配结果" : "AI匹配用例"}
              </button>
              <input
                ref={templateImportRef}
                type="file"
                accept=".xlsx,.csv"
                className="visually-hidden"
                onChange={(event) => handleImportFile(event.target.files?.[0], "模板导入")}
              />
              <input
                ref={externalImportRef}
                type="file"
                accept=".xlsx,.csv,.xml"
                className="visually-hidden"
                onChange={(event) => handleImportFile(event.target.files?.[0], "外部平台导入")}
              />
              <button className="ghost-button" type="button" disabled={mutationLocked || previewing || importing} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => templateImportRef.current?.click()}>
                {previewing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} {"模板导入"}
              </button>
              <button className="ghost-button" type="button" disabled={mutationLocked || previewing || importing} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => externalImportRef.current?.click()}>
                {previewing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} {"外部平台导入"}
              </button>
              <button className="primary-button" type="button" disabled={mutationLocked} title={mutationLocked ? mutationLockMessage : undefined} onClick={openCreate}><Plus size={13} /> {"新增缺陷"}</button>
            </div>
          </div>
        }
      />

      <section className="work-panel">
        {loading || initialLoading ? (
          <div className="empty-state"><Loader2 size={20} className="animate-spin text-muted" /><p className="empty-state__hint">{"加载中..."}</p></div>
        ) : defects.length === 0 ? (
          <div className="empty-state"><FileText size={20} className="text-muted" /><p>{"暂无缺陷，点击「新增缺陷」添加"}</p></div>
        ) : (
          <DataTable rows={defects} getRowKey={(d) => d.id} columns={columns} />
        )}
      </section>

      {/* Create/Edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editDefect ? "编辑缺陷 " + editDefect.defectCode : "新增缺陷"}
        width={1060}
        height="85vh"
        footer={
          <div className="form-actions">
            <button className="ghost-button" type="button" onClick={() => setShowForm(false)}>{"取消"}</button>
            <button className="primary-button" type="button" onClick={handleSave} disabled={mutationLocked || saving} title={mutationLocked ? mutationLockMessage : undefined}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        }
      >
        <DefectForm form={form} setForm={setForm} testCases={testCases} />
      </Modal>

      <Modal
        open={!!importPreview}
        onClose={() => { if (!importing) { setImportPreview(null); setImportFile(null); } }}
        title="缺陷导入预览"
        width={960}
        height="78vh"
        footer={
          <div className="form-actions">
            <button className="ghost-button" type="button" disabled={importing} onClick={() => { setImportPreview(null); setImportFile(null); }}>取消</button>
            <button className="primary-button" type="button" disabled={importing || !importPreview?.importable} onClick={confirmImportFile}>
              {importing ? <Loader2 size={13} className="animate-spin" /> : null}
              {importing ? "导入中..." : `确认导入 ${importPreview?.importable || 0} 条`}
            </button>
          </div>
        }
      >
        {importPreview && (
          <div className="panel-stack scroll-fill">
            <div className="detail-grid">
              <div className="detail-row"><span className="detail-label">来源</span><span>{importPreview.source}</span></div>
              <div className="detail-row"><span className="detail-label">识别数量</span><span>{importPreview.total}</span></div>
              <div className="detail-row"><span className="detail-label">可导入</span><span>{importPreview.importable}</span></div>
              <div className="detail-row"><span className="detail-label">匹配用例</span><span>{importPreview.matchedCases}</span></div>
            </div>
            {importPreview.warnings.length > 0 && <pre className="code-block code-block--muted">{importPreview.warnings.join("\n")}</pre>}
            <DataTable
              rows={importPreview.items}
              getRowKey={(row) => String(row.rowNumber)}
              columns={[
                { key: "rowNumber", label: "行号", width: "64px", render: (row) => row.rowNumber },
                { key: "externalCode", label: "外部编号", width: "110px", render: (row) => row.externalCode || "-" },
                { key: "externalProject", label: "外部项目", width: "160px", lineClamp: 1, render: (row) => row.externalProject || "-" },
                { key: "externalModule", label: "外部模块", width: "180px", lineClamp: 1, render: (row) => row.externalModule || row.module || "-" },
                { key: "title", label: "缺陷标题", align: "left", lineClamp: 2, render: (row) => row.title || "-" },
                { key: "severity", label: "严重程度", width: "90px", render: (row) => row.severity },
                { key: "priority", label: "优先级", width: "76px", render: (row) => row.priority },
                { key: "status", label: "状态", width: "90px", render: (row) => row.status },
                { key: "reporter", label: "创建人", width: "80px", render: (row) => row.reporter || "-" },
                { key: "assignee", label: "指派人", width: "80px", render: (row) => row.assignee || "-" },
                { key: "resolution", label: "解决方案", width: "100px", render: (row) => row.resolution || "-" },
                { key: "matchedCaseCode", label: "匹配用例", width: "130px", render: (row) => row.matchedCaseCode || "-" },
                { key: "warnings", label: "提示", align: "left", render: (row) => row.warnings?.join("；") || "-" },
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={traceChoiceOpen}
        onClose={() => { if (!traceLoading) setTraceChoiceOpen(false); }}
        title="AI 匹配用例"
        width={440}
        footer={
          <div className="form-actions">
            <button
              className="ghost-button"
              type="button"
              disabled={traceLoading}
              onClick={() => {
                if (!lastTracePreview) return;
                setTracePreview(lastTracePreview);
                setTraceChoiceOpen(false);
              }}
            >
              查看上一次匹配的结果
            </button>
            <button className="primary-button" type="button" disabled={traceLoading} onClick={runTraceabilityMatch}>
              {traceLoading ? <Loader2 size={13} className="animate-spin" /> : null}
              重新匹配
            </button>
          </div>
        }
      >
        <p className="modal-hint">当前项目已经有一次 AI 匹配用例结果，可以直接查看并手动确认，也可以重新发起匹配任务覆盖本次预览。</p>
      </Modal>

      <Modal
        open={!!tracePreview}
        onClose={() => { if (!traceApplying) setTracePreview(null); }}
        title="AI 匹配用例预览"
        width={1060}
        height="78vh"
        bodyOverflow="hidden"
        footer={<button className="ghost-button" type="button" disabled={traceApplying} onClick={() => setTracePreview(null)}>取消</button>}
      >
        {tracePreview && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--muted)" }}>
                <span>待匹配缺陷 <strong style={{ color: "var(--text)" }}>{tracePreview.total}</strong></span>
                <span>推荐关联 <strong style={{ color: "var(--text)" }}>{tracePreview.recommended}</strong></span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="ghost-button" type="button" disabled={traceLoading || traceApplying} onClick={() => { setTracePreview(null); runTraceabilityMatch(); }}>
                  {traceLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                  重新匹配
                </button>
                <button className="primary-button" type="button" disabled={traceApplying || !(tracePreview?.items || []).some((item) => item.recommended && item.testCaseId)} onClick={confirmTraceabilityApply}>
                  {traceApplying ? <Loader2 size={13} className="animate-spin" /> : null}
                  {traceApplying ? "关联中..." : `确认关联 ${tracePreview?.recommended || 0} 条`}
                </button>
              </div>
            </div>
            <section className="work-panel" style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <DataTable
                rows={tracePreview.items}
                getRowKey={(row) => row.defectId}
                columns={[
                  { key: "defectCode", label: "缺陷编号", width: "120px", render: (row) => row.defectCode },
                  { key: "defectTitle", label: "缺陷标题", align: "left", lineClamp: 2, render: (row) => row.defectTitle },
                  { key: "caseCode", label: "推荐用例", width: "140px", render: (row) => row.caseCode || "-" },
                  { key: "caseTitle", label: "用例标题", align: "left", lineClamp: 2, render: (row) => row.caseTitle || "-" },
                  { key: "score", label: "置信度", width: "90px", render: (row) => `${Math.round((row.score || 0) * 100)}%` },
                  { key: "source", label: "来源", width: "90px", render: (row) => row.source || "-" },
                  { key: "recommended", label: "状态", width: "118px", render: (row) => (
                    <button className="trace-status-button" type="button" disabled={!row.testCaseId || traceApplying} onClick={() => toggleTraceRecommended(row)} title={row.testCaseId ? "点击切换是否可关联" : "没有候选用例"}>
                      <StatusPill tone={row.recommended ? "green" : "amber"}>{row.recommended ? "可关联" : "需人工确认"}</StatusPill>
                    </button>
                  ) },
                  { key: "reason", label: "匹配理由", align: "left", lineClamp: 3, render: (row) => row.reason || "-" },
                  { key: "actions", label: "操作", width: "70px", sticky: "right", align: "center", render: (row) => <button className="text-button" type="button" onClick={() => setTraceDetail(row)}>查看</button> },
                ] as Column<any>[]}
              />
            </section>
          </div>
        )}
      </Modal>

      <Modal open={!!traceDetail} onClose={() => setTraceDetail(null)} title="匹配详情" width={700} height="70vh">
        {traceDetail && (
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">缺陷编号</span><span>{traceDetail.defectCode || "-"}</span></div>
            <div className="detail-row"><span className="detail-label">推荐用例</span><span>{traceDetail.caseCode || "-"}</span></div>
            <div className="detail-row detail-row--full"><span className="detail-label">缺陷标题</span><pre className="detail-pre">{traceDetail.defectTitle || "-"}</pre></div>
            <div className="detail-row detail-row--full"><span className="detail-label">用例标题</span><pre className="detail-pre">{traceDetail.caseTitle || "-"}</pre></div>
            <div className="detail-row"><span className="detail-label">置信度</span><span>{Math.round((traceDetail.score || 0) * 100)}%</span></div>
            <div className="detail-row"><span className="detail-label">来源</span><span>{traceDetail.source || "-"}</span></div>
            <div className="detail-row"><span className="detail-label">状态</span><StatusPill tone={traceDetail.recommended ? "green" : "amber"}>{traceDetail.recommended ? "可关联" : "需人工确认"}</StatusPill></div>
            <div className="detail-row detail-row--full"><span className="detail-label">匹配理由</span><pre className="detail-pre">{traceDetail.reason || "-"}</pre></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget || batchDeleteOpen}
        title={batchDeleteOpen ? "批量删除缺陷" : "删除缺陷"}
        message={batchDeleteOpen ? `确定删除选中的 ${selectedIds.size} 个缺陷吗？删除后将无法在当前列表继续查看。` : `确定删除缺陷「${deleteTarget?.defectCode || ""}」吗？删除后将无法在当前列表继续查看。`}
        confirmLabel="删除"
        confirmLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => { if (!deleting) { setDeleteTarget(null); setBatchDeleteOpen(false); } }}
      />

      {/* Detail modal */}
      <Modal open={!!detailDefect} onClose={() => setDetailDefect(null)} title={detailDefect ? detailDefect.defectCode + " - 缺陷详情" : "缺陷详情"} width={700} height="80vh">
        {detailDefect && (
          <div className="panel-stack scroll-fill">
            <div className="detail-grid">
              <div className="detail-row"><span className="detail-label">{"缺陷编号"}</span><span>{detailDefect.defectCode}</span></div>
              <div className="detail-row"><span className="detail-label">{"标题"}</span><span>{detailDefect.title}</span></div>
              <div className="detail-row"><span className="detail-label">{"严重程度"}</span><StatusPill tone={severityTone(detailDefect.severity)}>{detailDefect.severity}</StatusPill></div>
              <div className="detail-row"><span className="detail-label">{"优先级"}</span><StatusPill tone={priorityTone(detailDefect.priority)}>{detailDefect.priority}</StatusPill></div>
              <div className="detail-row"><span className="detail-label">{"状态"}</span><StatusPill tone={statusTone(detailDefect.status)}>{detailDefect.status}</StatusPill></div>
              <div className="detail-row"><span className="detail-label">{"数据状态"}</span><StatusPill tone={detailDefect.validityStatus === "已失效" ? "amber" : "green"}>{detailDefect.validityStatus || "有效"}</StatusPill></div>
              {detailDefect.invalidReason && <div className="detail-row"><span className="detail-label">{"失效原因"}</span><span>{detailDefect.invalidReason}</span></div>}
              <div className="detail-row"><span className="detail-label">{"缺陷类型"}</span><span>{detailDefect.category}</span></div>
              <div className="detail-row"><span className="detail-label">{"来源"}</span><StatusPill tone={sourceTone(detailDefect.source || "手工")}>{detailDefect.source || "手工"}</StatusPill></div>
              <div className="detail-row"><span className="detail-label">{"模块"}</span><span>{detailDefect.module || "-"}</span></div>
              <div className="detail-row"><span className="detail-label">{"发现人"}</span><span>{detailDefect.reporter || "-"}</span></div>
              <div className="detail-row"><span className="detail-label">{"指派人"}</span><span>{detailDefect.assignee || "-"}</span></div>
              <div className="detail-row"><span className="detail-label">{"环境信息"}</span><span>{detailDefect.environmentInfo || "-"}</span></div>
              <div className="detail-row">
                <span className="detail-label">{"关联用例"}</span>
                <span className="defect-linked-cases">
                  {getTestCaseTitles(detailDefect).length
                    ? getTestCaseTitles(detailDefect).map((text) => <span key={text}>{text}</span>)
                    : "-"}
                </span>
              </div>
              <div className="detail-row"><span className="detail-label">{"创建时间"}</span><span>{formatTime(detailDefect.createdAt)}</span></div>
            </div>
            {(detailDefect.externalCode || detailDefect.externalProject || detailDefect.externalModule || detailDefect.resolution || detailDefect.resolvedBy || detailDefect.closedBy) && (
              <div>
                <h4 className="panel-title">{"外部平台信息"}</h4>
                <div className="detail-grid">
                  <div className="detail-row"><span className="detail-label">{"外部编号"}</span><span>{detailDefect.externalCode || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"外部项目"}</span><span>{detailDefect.externalProject || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"外部模块"}</span><span>{detailDefect.externalModule || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"所属执行"}</span><span>{detailDefect.externalExecution || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"相关需求"}</span><span>{detailDefect.externalStory || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"相关任务"}</span><span>{detailDefect.externalTask || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"相关用例"}</span><span>{detailDefect.externalCase || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"关键词"}</span><span>{detailDefect.keywords || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"影响版本"}</span><span>{detailDefect.openedBuild || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"解决版本"}</span><span>{detailDefect.resolvedBuild || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"解决方案"}</span><span>{detailDefect.resolution || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"解决者"}</span><span>{detailDefect.resolvedBy || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"关闭人"}</span><span>{detailDefect.closedBy || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"解决时间"}</span><span>{formatTime(detailDefect.resolvedAt || undefined)}</span></div>
                  <div className="detail-row"><span className="detail-label">{"关闭时间"}</span><span>{formatTime(detailDefect.closedAt || undefined)}</span></div>
                  <div className="detail-row"><span className="detail-label">{"指派时间"}</span><span>{formatTime(detailDefect.assignedAt || undefined)}</span></div>
                  <div className="detail-row"><span className="detail-label">{"最后修改人"}</span><span>{detailDefect.lastEditedBy || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"最后修改时间"}</span><span>{formatTime(detailDefect.lastEditedAt || undefined)}</span></div>
                  <div className="detail-row"><span className="detail-label">{"确认状态"}</span><span>{detailDefect.confirmedStatus || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"激活次数"}</span><span>{detailDefect.activatedCount || 0}</span></div>
                  <div className="detail-row"><span className="detail-label">{"操作系统"}</span><span>{detailDefect.os || "-"}</span></div>
                  <div className="detail-row"><span className="detail-label">{"浏览器"}</span><span>{detailDefect.browser || "-"}</span></div>
                </div>
              </div>
            )}
            {detailDefect.stepsToReproduce && <div><h4 className="panel-title">{"复现步骤"}</h4><pre className="code-block">{detailDefect.stepsToReproduce}</pre></div>}
            {detailDefect.attachments && <div><h4 className="panel-title">{"附件"}</h4><pre className="code-block code-block--muted">{detailDefect.attachments}</pre></div>}
            {detailDefect.relatedBugs && <div><h4 className="panel-title">{"相关 Bug"}</h4><pre className="code-block code-block--muted">{detailDefect.relatedBugs}</pre></div>}
            {detailDefect.screenshotUrl && (
              <div>
                <h4 className="panel-title">{"执行失败截图"}</h4>
                <a href={detailDefect.screenshotUrl} target="_blank" rel="noreferrer" className="defect-screenshot-link">
                  <img src={detailDefect.screenshotUrl} alt="执行失败截图" className="defect-screenshot" />
                </a>
              </div>
            )}
            {detailDefect.remark && <div><h4 className="panel-title">{"备注"}</h4><pre className="code-block code-block--muted">{detailDefect.remark}</pre></div>}
            <div className="form-actions">
              <button className="ghost-button" type="button" disabled={mutationLocked || detailDefect.validityStatus === "已失效"} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => { setDetailDefect(null); openEdit(detailDefect); }}>{"编辑"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
