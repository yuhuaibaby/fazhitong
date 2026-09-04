import { useRef, useState } from "react";
import { FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "../../../app/store";
import { testCasesApi } from "../../../api/test-design.api";
import { useProjectData } from "../useProjectData";
import { useUnsavedChanges } from "../../../shared/hooks/useUnsavedChanges";
import { DataTable, type Column } from "../../../shared/components/DataTable";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusPill } from "../../../shared/components/StatusPill";
import { Modal } from "../../../shared/components/Modal";
import { formatTestStepsForDisplay } from "../../../shared/utils/formatTestSteps";
import { formatProjectTime as formatTime, priorityTone, reviewTone } from "./projectDetail.config";
import { validityTone } from "../../../shared/utils/statusTone";
import { useProjectMutationLock } from "./ProjectMutationLockContext";

type ExecutionImportPreview = Awaited<ReturnType<typeof testCasesApi.previewExecutionImport>>;

// ═══════════════════════════════════════
// 测试结果（最终测试用例执行结果展示）
// ═══════════════════════════════════════

export function DocFusionTab({ projectId }: { projectId: string }) {
  const { dispatch } = useStore();
  const { testCases, scripts, refresh } = useProjectData(projectId);
  const { mutationLocked, mutationLockMessage } = useProjectMutationLock();
  const [manualResults, setManualResults] = useState<Record<string, string>>({});
  const manualResultRef = useRef<HTMLInputElement>(null);
  const allResultRef = useRef<HTMLInputElement>(null);
  const [viewCase, setViewCase] = useState<typeof testCases[0] | null>(null);
  const [editCase, setEditCase] = useState<typeof testCases[0] | null>(null);
  const [editActual, setEditActual] = useState("");
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ExecutionImportPreview | null>(null);
  const execDirty = useUnsavedChanges("实测结果");

  const handleUploadResult = async (e: React.ChangeEvent<HTMLInputElement>, source: "手动测试结果" | "所有测试结果") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }

    setPreviewing(true);
    try {
      const preview = await testCasesApi.previewExecutionImport(projectId, file, source);
      setImportFile(file);
      setImportPreview(preview);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "识别预览失败");
    } finally {
      setPreviewing(false);
      if (manualResultRef.current) manualResultRef.current.value = "";
      if (allResultRef.current) allResultRef.current.value = "";
    }
  };

  const confirmImport = async () => {
    if (!importFile) return;
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    setImporting(true);
    try {
      const result = await testCasesApi.importExecutionResults(projectId, importFile, importPreview?.source || "手动测试结果");
      const warningText = result.warnings?.length ? `，${result.warnings.length} 条需关注` : "";
      toast.success(`补录完成：成功 ${result.imported} 条，跳过 ${result.skipped} 条${warningText}`);
      setImportFile(null);
      setImportPreview(null);
      setManualResults({});
      await refresh();
      window.dispatchEvent(new Event("aitestlink:data-refresh"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "补录失败");
    } finally {
      setImporting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editCase) return;
    try {
      const updated = await testCasesApi.update(editCase.id, { actualResult: editActual } as any);
      dispatch({ type: "UPDATE_TEST_CASE", payload: { ...editCase, actualResult: updated.actualResult, createdAt: updated.createdAt, updatedAt: updated.updatedAt } });
      toast.success("保存成功");
      execDirty.markClean();
      setEditCase(null);
    } catch { toast.error("保存失败"); }
  };

  const getScriptTime = (tc: typeof testCases[0]) => {
    const script = scripts.find((s) => s.testCaseId === tc.id);
    return script ? formatTime(script.updatedAt) : "-";
  };
  const resultTone = (value: string) => value === "通过" ? "green" : value === "失败" || value === "不通过" || value === "未通过" || value === "阻塞" ? "red" : value === "跳过" ? "amber" : "slate";
  const displayPassed = (value?: string) => value === "失败" ? "不通过" : value || "未执行";

  return (
    <div className="page-stack page-stack--spaced page-stack--fill">
      <SectionHeader title="测试结果" description="展示最终测试用例结果；自动化执行结果自动带入，人工执行结果可上传补录。" meta={<>共 <strong>{testCases.length}</strong> 条用例</>}
        actions={
          <div className="section-actions-row">
            <input ref={manualResultRef} type="file" accept=".xlsx,.csv" className="visually-hidden" onChange={(event) => handleUploadResult(event, "手动测试结果")} />
            <input ref={allResultRef} type="file" accept=".xlsx,.csv" className="visually-hidden" onChange={(event) => handleUploadResult(event, "所有测试结果")} />
            <button className="ghost-button" type="button" disabled={mutationLocked || previewing || importing} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => manualResultRef.current?.click()}>
              {previewing ? <Loader2 size={13} className="animate-spin" /> : <FileUp size={13} />} 上传手动测试结果
            </button>
            <button className="primary-button" type="button" disabled={mutationLocked || previewing || importing} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => allResultRef.current?.click()}>
              {previewing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} 上传所有测试结果
            </button>
          </div>
        } />
      <section className="work-panel">
        {testCases.length === 0 ? <div className="empty-state"><p>暂无测试用例数据</p></div> : (
          <DataTable rows={testCases} getRowKey={(r) => r.id} columns={[
            { key: "module", label: "模块", render: (r) => r.module },
            { key: "caseCode", label: "用例标识", render: (r) => r.caseCode },
            { key: "feature", label: "测试点", align: "left", lineClamp: 3, render: (r) => <span title={r.feature}>{r.feature}</span> },
            { key: "title", label: "用例标题", align: "left", lineClamp: 3, render: (r) => <span title={r.title}>{r.title}</span> },
            { key: "targetPlatform", label: "测试端", width: "72px", align: "center", render: (r) => r.targetPlatform || "PC" },
            { key: "priority", label: "优先级", align: "center", render: (r) => <StatusPill tone={priorityTone(r.priority)}>{r.priority}</StatusPill> },
            { key: "testType", label: "测试类型", align: "center", render: (r) => r.testType || "功能测试" },
            { key: "steps", label: "测试步骤", align: "left", lineClamp: 3, render: (r) => <span className="test-steps-preview" title={r.steps}>{formatTestStepsForDisplay(r.steps)}</span> },
            { key: "expectedResult", label: "预期结果", align: "left", lineClamp: 3, render: (r) => <span title={r.expectedResult}>{r.expectedResult}</span> },
            { key: "actualResult", label: "实测结果", align: "left", lineClamp: 3, render: (r) => {
              const display = r.actualResult || manualResults[r.caseCode] || "-";
              return <span style={{ fontSize: 12 }}>{display}</span>;
            }},
            { key: "passed", label: "是否通过", align: "center", render: (r) => {
              const value = displayPassed(r.passed);
              return <StatusPill tone={resultTone(value)}>{value}</StatusPill>;
            }},
            { key: "defectCode", label: "缺陷编号", align: "center", render: (r) => r.defectCode || "-" },
            { key: "reviewStatus", label: "评审状态", align: "center", render: (r) => <StatusPill tone={r.reviewStatus === "已通过" ? "green" : "slate"}>{r.reviewStatus || "待评审"}</StatusPill> },
            { key: "validityStatus", label: "数据状态", align: "center", render: (r) => <span title={r.invalidReason || ""}><StatusPill tone={validityTone(r.validityStatus)}>{r.validityStatus || "有效"}</StatusPill></span> },
            { key: "automation", label: "是否自动化", align: "center", render: (r) => r.automation === "是" ? "是" : "否" },
            { key: "testTime", label: "更新时间", render: (r) => <span>{getScriptTime(r)}</span> },
            { key: "actions", label: "操作", width: "100px", sticky: "right" as const, align: "center", render: (r) => (
              <div className="inline-actions">
                <button className="text-button" type="button" onClick={() => setViewCase(r)}>查看</button>
                <button className="text-button" type="button" onClick={() => { setEditCase(r); setEditActual(r.actualResult || ""); }}>编辑</button>
              </div>
            ) },
          ]} />
        )}
      </section>

      {/* 查看弹窗 - 字段与表格一致 */}
      <Modal open={!!viewCase} onClose={() => setViewCase(null)} title="用例详情" width={640}>
        {viewCase && (() => {
          const viewActual = viewCase.actualResult || manualResults[viewCase.caseCode] || "";
          const viewPassed = displayPassed(viewCase.passed);
          return (
            <div className="detail-grid">
              <div className="detail-row"><span className="detail-label">模块</span><span>{viewCase.module}</span></div>
              <div className="detail-row"><span className="detail-label">用例标识</span><span>{viewCase.caseCode}</span></div>
              <div className="detail-row detail-row--full"><span className="detail-label">测试点</span><span>{viewCase.feature}</span></div>
              <div className="detail-row detail-row--full"><span className="detail-label">用例标题</span><span>{viewCase.title}</span></div>
              <div className="detail-row"><span className="detail-label">测试端</span><span>{viewCase.targetPlatform || "PC"}</span></div>
              <div className="detail-row"><span className="detail-label">优先级</span><StatusPill tone={priorityTone(viewCase.priority)}>{viewCase.priority}</StatusPill></div>
              <div className="detail-row"><span className="detail-label">测试类型</span><span>{viewCase.testType || "功能测试"}</span></div>
              <div className="detail-row detail-row--full"><span className="detail-label">测试步骤</span><pre className="detail-pre">{viewCase.steps || "-"}</pre></div>
              <div className="detail-row detail-row--full"><span className="detail-label">预期结果</span><pre className="detail-pre">{viewCase.expectedResult || "-"}</pre></div>
              <div className="detail-row detail-row--full"><span className="detail-label">实测结果</span><pre className="detail-pre">{viewActual || "-"}</pre></div>
              <div className="detail-row"><span className="detail-label">是否通过</span><StatusPill tone={resultTone(viewPassed)}>{viewPassed}</StatusPill></div>
              <div className="detail-row"><span className="detail-label">缺陷编号</span><span>{viewCase.defectCode || "-"}</span></div>
              <div className="detail-row"><span className="detail-label">数据状态</span><span title={viewCase.invalidReason || ""}><StatusPill tone={validityTone(viewCase.validityStatus)}>{viewCase.validityStatus || "有效"}</StatusPill></span></div>
              <div className="detail-row"><span className="detail-label">是否自动化</span><span>{viewCase.automation === "是" ? "是" : "否"}</span></div>
              <div className="detail-row"><span className="detail-label">更新时间</span><span>{getScriptTime(viewCase)}</span></div>
            </div>
          );
        })()}
      </Modal>

      {/* 编辑弹窗 - 只能编辑实测结果，是否通过自动计算 */}
      <Modal open={!!editCase} onClose={() => execDirty.requestClose(() => setEditCase(null))} title="编辑实测结果" width={640}
        footer={<>
          <button className="ghost-button" type="button" onClick={() => execDirty.requestClose(() => setEditCase(null))}>取消</button>
          <button className="primary-button" type="button" onClick={handleSaveEdit}>保存</button>
        </>}
      >
        {editCase && (
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">模块</span><span>{editCase.module}</span></div>
            <div className="detail-row"><span className="detail-label">用例标识</span><span>{editCase.caseCode}</span></div>
            <div className="detail-row detail-row--full"><span className="detail-label">测试点</span><span>{editCase.feature}</span></div>
            <div className="detail-row detail-row--full"><span className="detail-label">用例标题</span><span>{editCase.title}</span></div>
            <div className="detail-row"><span className="detail-label">优先级</span><StatusPill tone={priorityTone(editCase.priority)}>{editCase.priority}</StatusPill></div>
            <div className="detail-row"><span className="detail-label">测试类型</span><span>{editCase.testType || "功能测试"}</span></div>
            <div className="detail-row detail-row--full"><span className="detail-label">测试步骤</span><span>{editCase.steps || "-"}</span></div>
            <div className="detail-row detail-row--full"><span className="detail-label">预期结果</span><span>{editCase.expectedResult || "-"}</span></div>
            <div className="detail-row detail-row--full"><span className="detail-label">实测结果</span><textarea className="form-textarea" style={{ flex: 1 }} rows={5} value={editActual} onChange={(e) => { setEditActual(e.target.value); execDirty.markDirty(); }} placeholder="输入实际测试结果" /></div>
            <div className="detail-row"><span className="detail-label">是否通过</span><StatusPill tone={resultTone(displayPassed(editCase.passed))}>{displayPassed(editCase.passed)}</StatusPill></div>
            <div className="detail-row"><span className="detail-label">缺陷编号</span><span>{editCase.defectCode || "-"}</span></div>
            <div className="detail-row"><span className="detail-label">数据状态</span><span title={editCase.invalidReason || ""}><StatusPill tone={validityTone(editCase.validityStatus)}>{editCase.validityStatus || "有效"}</StatusPill></span></div>
            <div className="detail-row"><span className="detail-label">是否自动化</span><span>{editCase.automation === "是" ? "是" : "否"}</span></div>
            <div className="detail-row"><span className="detail-label">更新时间</span><span>{getScriptTime(editCase)}</span></div>

          </div>
        )}
      </Modal>
      <Modal
        open={!!importPreview}
        onClose={() => { if (!importing) { setImportPreview(null); setImportFile(null); } }}
        title="执行结果补录预览"
        width={980}
        height="78vh"
        bodyOverflow="hidden"
        footer={<button className="ghost-button" type="button" disabled={importing} onClick={() => { setImportPreview(null); setImportFile(null); }}>取消</button>}
      >
        {importPreview && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--muted)" }}>
                <span>识别数量 <strong style={{ color: "var(--text)" }}>{importPreview.total}</strong></span>
                <span>可补录 <strong style={{ color: "var(--text)" }}>{importPreview.importable}</strong></span>
                <span>匹配缺陷 <strong style={{ color: "var(--text)" }}>{importPreview.matchedDefects}</strong></span>
              </div>
              <button className="primary-button" type="button" disabled={importing || !importPreview.importable} onClick={confirmImport}>
                {importing ? <Loader2 size={13} className="animate-spin" /> : null}
                {importing ? "补录中..." : `确认补录 ${importPreview.importable || 0} 条`}
              </button>
            </div>
            {importPreview.warnings.length > 0 && <pre className="code-block code-block--muted" style={{ marginBottom: 12, flexShrink: 0 }}>{importPreview.warnings.join("\n")}</pre>}
            <section className="work-panel" style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <DataTable
                rows={importPreview.items}
                getRowKey={(row) => String(row.rowNumber)}
                columns={[
                  { key: "rowNumber", label: "行号", width: "64px", render: (row) => row.rowNumber },
                  { key: "matchCase", label: "匹配用例", width: "100px", render: (row) => row.matchedCaseCode || "-" },
                  { key: "title", label: "用例标题", width: "200px", align: "left", lineClamp: 2, render: (row) => row.matchedCaseTitle || row.title || "-" },
                  { key: "passed", label: "是否通过", width: "90px", render: (row) => <StatusPill tone={resultTone(row.passed)}>{displayPassed(row.passed)}</StatusPill> },
                  { key: "defect", label: "缺陷编号", width: "80px", render: (row) => row.defectCode || "-" },
                ] as Column<any>[]}
              />
            </section>
          </div>
        )}
      </Modal>
      {execDirty.confirmDialog}
    </div>
  );
}
