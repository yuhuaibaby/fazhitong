import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { ApiTestCase } from "../../../api/client";
import { useProjectData } from "../useProjectData";
import { testCasesApi } from "../../../api/test-design.api";
import { DataTable, type Column } from "../../../shared/components/DataTable";
import { MenuSelect, type MenuSelectOption } from "../../../shared/components/MenuSelect";
import { Modal } from "../../../shared/components/Modal";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusPill } from "../../../shared/components/StatusPill";
import { formatTestStepsForDisplay } from "../../../shared/utils/formatTestSteps";
import { priorityTone, reviewTone, validityTone } from "../../../shared/utils/statusTone";
import { useProjectMutationLock } from "./ProjectMutationLockContext";

// ═══════════════════════════════════════
// 测试汇总
// ═══════════════════════════════════════

const EXECUTION_SOURCE_OPTIONS: MenuSelectOption<string>[] = ["执行结果补录", "禅道导入", "TAPD导入", "Jira导入", "外部平台导入"].map((v) => ({ value: v, label: v }));
type ExecutionImportPreview = Awaited<ReturnType<typeof testCasesApi.previewExecutionImport>>;

export function SummaryTab({ projectId }: { projectId: string }) {
  const { testCases, refresh, loading, initialLoading } = useProjectData(projectId);
  const { mutationLocked, mutationLockMessage } = useProjectMutationLock();
  const [executionSource, setExecutionSource] = useState("执行结果补录");
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ExecutionImportPreview | null>(null);
  const executionImportRef = useRef<HTMLInputElement>(null);

  const total = testCases.length;

  const handleDownloadExecutionTemplate = async () => {
    try {
      const blob = await testCasesApi.downloadExecutionTemplate(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "执行结果补录模板.xlsx"; a.click();
      URL.revokeObjectURL(url); toast.success("模板已下载");
    } catch (err) { toast.error(err instanceof Error ? err.message : "下载模板失败"); }
  };

  const handleImportExecution = async (file: File | undefined) => {
    if (!file) return;
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    setPreviewing(true);
    try {
      const preview = await testCasesApi.previewExecutionImport(projectId, file, executionSource);
      setImportFile(file);
      setImportPreview(preview);
    } catch (err) { toast.error(err instanceof Error ? err.message : "识别预览失败"); }
    finally {
      setPreviewing(false);
      if (executionImportRef.current) executionImportRef.current.value = "";
    }
  };

  const confirmImportExecution = async () => {
    if (!importFile) return;
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    setImporting(true);
    try {
      const result = await testCasesApi.importExecutionResults(projectId, importFile, importPreview?.source || executionSource);
      const warningText = result.warnings?.length ? `，${result.warnings.length} 条需关注` : "";
      toast.success(`补录完成：成功 ${result.imported} 条，跳过 ${result.skipped} 条${warningText}`);
      setImportFile(null);
      setImportPreview(null);
      await refresh();
      window.dispatchEvent(new Event("aitestlink:data-refresh"));
    } catch (err) { toast.error(err instanceof Error ? err.message : "导入失败"); }
    finally {
      setImporting(false);
    }
  };

  const resultTone = (value: string) => value === "通过" ? "green" : value === "失败" || value === "不通过" || value === "未通过" || value === "阻塞" ? "red" : value === "跳过" ? "amber" : "slate";
  const displayPassed = (value?: string) => value === "失败" ? "不通过" : value || "未执行";
  const caseColumns: Column<ApiTestCase>[] = [
    { key: "caseCode", label: "用例标识", width: "130px", sticky: "left", render: (c) => c.caseCode },
    { key: "module", label: "模块", width: "120px", render: (c) => c.module || "-" },
    { key: "feature", label: "测试点", align: "left", lineClamp: 2, render: (c) => c.feature || "-" },
    { key: "title", label: "用例标题", align: "left", lineClamp: 2, render: (c) => c.title },
    { key: "priority", label: "优先级", width: "76px", align: "center", render: (c) => <StatusPill tone={priorityTone(c.priority)}>{c.priority}</StatusPill> },
    { key: "targetPlatform", label: "测试端", width: "76px", align: "center", render: (c) => c.targetPlatform || "PC" },
    { key: "testType", label: "测试类型", width: "96px", align: "center", render: (c) => c.testType || "功能测试" },
    { key: "steps", label: "测试步骤", align: "left", lineClamp: 3, render: (c) => <span title={c.steps}>{formatTestStepsForDisplay(c.steps)}</span> },
    { key: "expectedResult", label: "预期结果", align: "left", lineClamp: 3, render: (c) => c.expectedResult || "-" },
    { key: "actualResult", label: "实测结果", align: "left", lineClamp: 3, render: (c) => c.actualResult || "-" },
    { key: "passed", label: "是否通过", width: "96px", align: "center", render: (c) => <StatusPill tone={resultTone(displayPassed(c.passed))}>{displayPassed(c.passed)}</StatusPill> },
    { key: "defectCode", label: "缺陷编号", width: "120px", align: "center", render: (c) => (c as any).defectCode || "-" },
    { key: "tester", label: "执行人", width: "90px", render: (c) => c.tester || "-" },
    { key: "testDate", label: "执行时间", width: "120px", align: "center", render: (c) => c.testDate || "-" },
    { key: "reviewStatus", label: "评审状态", width: "96px", align: "center", render: (c) => <StatusPill tone={reviewTone(c.reviewStatus)}>{c.reviewStatus || "待评审"}</StatusPill> },
    { key: "validityStatus", label: "数据状态", width: "96px", align: "center", render: (c) => <span title={c.invalidReason || ""}><StatusPill tone={validityTone(c.validityStatus)}>{c.validityStatus || "有效"}</StatusPill></span> },
    { key: "automation", label: "自动化", width: "76px", align: "center", render: (c) => c.automation === "是" ? "是" : "否" },
    { key: "remark", label: "备注", align: "left", lineClamp: 2, render: (c) => c.remark || "-" },
  ];

  return (
    <div className="page-stack page-stack--spaced page-stack--fill">
      <SectionHeader
        title="数据汇总"
        description="展示最终测试用例明细，并支持补录外部执行结果。"
        meta={<>共 <strong>{total}</strong> 条用例</>}
        actions={
          <div className="section-actions-row">
            <button className="ghost-button" type="button" onClick={handleDownloadExecutionTemplate}><Download size={13} /> 下载模板</button>
            <MenuSelect className="filter-menu-select" size="compact" value={executionSource} options={EXECUTION_SOURCE_OPTIONS} onChange={setExecutionSource} />
            <input
              ref={executionImportRef}
              type="file"
              accept=".xlsx,.csv"
              className="visually-hidden"
              onChange={(event) => handleImportExecution(event.target.files?.[0])}
            />
            <button className="primary-button" type="button" disabled={mutationLocked || previewing || importing} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => executionImportRef.current?.click()}>
              {previewing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} 补录执行结果
            </button>
          </div>
        }
      />

      <section className="work-panel">
        {loading || initialLoading ? (
          <div className="empty-state"><Loader2 size={20} className="animate-spin text-muted" /><p className="text-muted">加载中...</p></div>
        ) : testCases.length === 0 ? (
          <div className="empty-state"><p>暂无测试用例</p></div>
        ) : (
          <DataTable rows={testCases} getRowKey={(c) => c.id} columns={caseColumns} />
        )}
      </section>

      <Modal
        open={!!importPreview}
        onClose={() => { if (!importing) { setImportPreview(null); setImportFile(null); } }}
        title="执行结果补录预览"
        width={980}
        height="78vh"
        footer={
          <div className="form-actions">
            <button className="ghost-button" type="button" disabled={importing} onClick={() => { setImportPreview(null); setImportFile(null); }}>取消</button>
            <button className="primary-button" type="button" disabled={importing || !importPreview?.importable} onClick={confirmImportExecution}>
              {importing ? <Loader2 size={13} className="animate-spin" /> : null}
              {importing ? "补录中..." : `确认补录 ${importPreview?.importable || 0} 条`}
            </button>
          </div>
        }
      >
        {importPreview && (
          <div className="panel-stack scroll-fill">
            <div className="detail-grid">
              <div className="detail-row"><span className="detail-label">来源</span><span>{importPreview.source}</span></div>
              <div className="detail-row"><span className="detail-label">识别数量</span><span>{importPreview.total}</span></div>
              <div className="detail-row"><span className="detail-label">可补录</span><span>{importPreview.importable}</span></div>
              <div className="detail-row"><span className="detail-label">匹配缺陷</span><span>{importPreview.matchedDefects}</span></div>
            </div>
            {importPreview.warnings.length > 0 && <pre className="code-block code-block--muted">{importPreview.warnings.join("\n")}</pre>}
            <DataTable
              rows={importPreview.items}
              getRowKey={(row) => String(row.rowNumber)}
              columns={[
                { key: "rowNumber", label: "行号", width: "64px", render: (row) => row.rowNumber },
                { key: "matchedCaseCode", label: "匹配用例", width: "130px", render: (row) => row.matchedCaseCode || "-" },
                { key: "title", label: "用例标题", align: "left", lineClamp: 2, render: (row) => row.matchedCaseTitle || row.title || "-" },
                { key: "passed", label: "是否通过", width: "90px", render: (row) => <StatusPill tone={resultTone(displayPassed(row.passed))}>{displayPassed(row.passed)}</StatusPill> },
                { key: "defectCode", label: "缺陷编号", width: "120px", render: (row) => row.defectCode || "-" },
                { key: "warnings", label: "提示", align: "left", render: (row) => row.warnings?.join("；") || "-" },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
