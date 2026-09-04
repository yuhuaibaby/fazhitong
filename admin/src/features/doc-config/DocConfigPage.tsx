import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Download, X, RotateCcw, Upload } from "lucide-react";
import { renderAsync } from "docx-preview";
import { Modal } from "../../shared/components/Modal";
import { StatusPill } from "../../shared/components/StatusPill";
import { DataTable } from "../../shared/components/DataTable";
import { DataPanel } from "../../shared/components/DataPanel";
import { DataPanelSkeleton } from "../../shared/components/DataPanelSkeleton";
import { MenuSelect } from "../../shared/components/MenuSelect";
import { docConfigApi, type ApiDocConfig } from "../../api/client";
import { TOKEN_KEY } from "../../shared/config/storage";
import { useDataPagination } from "../../shared/hooks/useDataPagination";
import { formatDateTime } from "../../shared/utils/dateTime";

const DOC_CATEGORY_MAP: Record<string, string> = {
  "tpl-plan": "测试计划",
  "tpl-spec": "测试说明",
  "tpl-report": "测试报告",
  "tpl-pc": "PC端操作手册",
  "tpl-app": "APP端操作手册",
};

// 从文件名提取扩展名并映射成可读的文档类型；无文件时返回空串（列里展示 -）
const EXT_TYPE_MAP: Record<string, string> = {
  docx: "Word",
  doc: "Word",
  pdf: "PDF",
  xlsx: "Excel",
  xls: "Excel",
  csv: "CSV",
  md: "Markdown",
  txt: "文本",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
};

const DOC_TONE_MAP: Record<string, string> = {
  "tpl-plan": "blue",
  "tpl-spec": "green",
  "tpl-report": "purple",
  "tpl-pc": "amber",
  "tpl-app": "red",
};
const MIN_CONFIG_LOADING_MS = 240;

// 根据实际上传的模板文件名提取文档类型（如 软件测试计划模板.docx → Word）；无文件返回空
function docTypeFromFileName(fileName: string): string {
  if (!fileName) return "";
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return EXT_TYPE_MAP[ext] || (ext ? ext.toUpperCase() : "");
}

export function DocConfigPage() {
  const [configs, setConfigs] = useState<ApiDocConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewConfig, setPreviewConfig] = useState<ApiDocConfig | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [searchName, setSearchName] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    const startedAt = Date.now();
    setLoading(true);
    try {
      const data = await docConfigApi.list();
      if (data) setConfigs(data);
    } catch (error) {
      console.error("Failed to load doc configs:", error);
    } finally {
      const remaining = MIN_CONFIG_LOADING_MS - (Date.now() - startedAt);
      window.setTimeout(() => setLoading(false), Math.max(0, remaining));
    }
  };

  const filteredConfigs = useMemo(() => {
    return configs.filter((c) => {
      const matchName = !searchName || c.name.toLowerCase().includes(searchName.toLowerCase());
      const matchCategory = filterCategory === "all" || c.configKey === filterCategory;
      return matchName && matchCategory;
    });
  }, [configs, searchName, filterCategory]);
  const { page, pageSize, pageItems: paginatedConfigs, setPage, setPageSize } = useDataPagination(filteredConfigs, [searchName, filterCategory]);

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const keys = [...new Set(configs.map((c) => c.configKey))];
    return keys.map((k) => ({ key: k, label: DOC_CATEGORY_MAP[k] || k }));
  }, [configs]);

  const resetFilters = () => {
    setSearchName("");
    setFilterCategory("all");
  };

  const handlePreview = useCallback(async (config: ApiDocConfig) => {
    if (!config.templateFile) {
      toast.warning("该模板暂无文件");
      return;
    }
    setPreviewConfig(config);
    setPreviewLoading(true);
    try {
      const response = await fetch(docConfigApi.downloadUrl(config.id), {
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ""}` },
      });
      if (!response.ok) throw new Error("下载失败");
      const blob = await response.blob();
      if (previewRef.current) {
        previewRef.current.innerHTML = "";
        await renderAsync(blob, previewRef.current, undefined, {
          className: "docx-preview",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: true,
        });
      }
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("预览加载失败");
    } finally {
      setPreviewLoading(false);
    }
  }, []);



  const handleDownloadFile = useCallback(async (config: ApiDocConfig) => {
    if (!config.templateFile) return;
    try {
      const response = await fetch(docConfigApi.downloadUrl(config.id), {
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ""}` },
      });
      if (!response.ok) throw new Error("下载失败");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = config.templateFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("下载失败");
    }
  }, []);

  const handleUploadFile = useCallback(async (config: ApiDocConfig, file?: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.warning("请上传 .docx 模板文件");
      return;
    }
    setUploadingId(config.id);
    try {
      await docConfigApi.upload(config.id, file);
      toast.success(`已更新「${config.name}」模板`);
      await loadConfigs();
    } catch (error: any) {
      console.error("Upload template error:", error);
      toast.error(error?.message || "模板上传失败");
    } finally {
      setUploadingId(null);
    }
  }, []);

  return (
    <div className="page-stack">
      {loading ? (
        <DataPanelSkeleton filters={3} actions={0} columns={7} rows={8} />
      ) : (
      <DataPanel
        search={
          <div className="search-form">
            <div className="search-form__field">
              <label className="search-form__label">模板名称</label>
              <input
                className="search-form__input"
                type="text"
                placeholder="搜索模板名称"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              {searchName && (
                <button className="search-form__clear" type="button" onClick={() => setSearchName("")}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="search-form__field">
              <label className="search-form__label">分类</label>
              <MenuSelect
                className="search-form__menu-select"
                size="compact"
                value={filterCategory}
                options={[{ value: "all", label: "全部分类" }, ...categories.map((cat) => ({ value: cat.key, label: cat.label }))]}
                onChange={setFilterCategory}
              />
            </div>
            <button className="ghost-button toolbar-button toolbar-ghost-button" type="button" onClick={resetFilters}>
              <RotateCcw size={14} />
              重置
            </button>
          </div>
        }
        total={filteredConfigs.length}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      >
        <DataTable
          rows={paginatedConfigs}
          getRowKey={(row) => row.id}
          columns={[
            {
              key: "name",
              label: "模板名称",
              width: "15%",
              lineClamp: 3,
              render: (row) => <span style={{ fontSize: 14 }}>{row.name}</span>,
            },
            {
              key: "configKey",
              label: "分类",
              width: "10%",
              align: "center",
              render: (row) => (
                <StatusPill tone={(DOC_TONE_MAP[row.configKey] || "slate") as any}>
                  {DOC_CATEGORY_MAP[row.configKey] || "其他"}
                </StatusPill>
              ),
            },
            {
              key: "docType",
              label: "文档类型",
              width: "10%",
              align: "center",
              render: (row) => {
                const docType = docTypeFromFileName(row.templateFile || "");
                return docType ? <StatusPill tone="slate">{docType}</StatusPill> : <span style={{ color: "var(--muted)" }}>-</span>;
              },
            },
            {
              key: "description",
              label: "说明",
              width: "18%",
              align: "left",
              lineClamp: 3,
              render: (row) => <span style={{ fontSize: 13 }}>{row.description || "-"}</span>,
            },
            {
              key: "parseStatus",
              label: "解析状态",
              width: "12%",
              align: "center",
              render: (row) => {
                const status = row.parseStatus || (row.templateFile ? "未解析" : "无模板");
                if (status === "已解析") return <StatusPill tone="green">已解析</StatusPill>;
                if (status === "解析失败" || status === "文件不存在") return <StatusPill tone="red">{status}</StatusPill>;
                if (!row.templateFile) return <StatusPill tone="slate">无模板</StatusPill>;
                return <StatusPill tone="amber">{status}</StatusPill>;
              },
            },
            {
              key: "updatedAt",
              label: "上传时间",
              width: "15%",
              align: "center",
              render: (row) => <span style={{ fontSize: 13 }}>{formatDateTime(row.updatedAt)}</span>,
            },
            {
              key: "actions",
              label: "操作",
              width: "15%",
              sticky: "right" as const,
              align: "center",
              render: (row) => (
                <div className="inline-actions">
                  <label className={`text-button ${uploadingId === row.id ? "is-disabled" : ""}`} style={{ cursor: uploadingId === row.id ? "not-allowed" : "pointer" }}>
                    <Upload size={14} />
                    {uploadingId === row.id ? "上传中" : "上传"}
                    <input
                      type="file"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      style={{ display: "none" }}
                      disabled={uploadingId === row.id}
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        e.currentTarget.value = "";
                        void handleUploadFile(row, file);
                      }}
                    />
                  </label>
                  <button
                    className="text-button"
                    type="button"
                    disabled={!row.templateFile}
                    onClick={() => handlePreview(row)}
                  >
                    查看
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    disabled={!row.templateFile}
                    onClick={() => handleDownloadFile(row)}
                  >
                    下载
                  </button>
                </div>
              ),
            },
          ]}
        />
      </DataPanel>
      )}

      {/* 预览弹窗 */}
      <Modal
        open={!!previewConfig}
        onClose={() => { setPreviewConfig(null); if (previewRef.current) previewRef.current.innerHTML = ""; }}
        title={`预览模板 - ${previewConfig?.name}`}
        width={1100}
        height="90vh"
        flushTop
        footer={<>
          <button
            className="ghost-button"
            type="button"
            onClick={() => { setPreviewConfig(null); if (previewRef.current) previewRef.current.innerHTML = ""; }}
          >
            关闭
          </button>
          {previewConfig?.templateFile && (
            <button
              className="primary-button"
              type="button"
              onClick={() => handleDownloadFile(previewConfig)}
            >
              <Download size={16} /> 下载模板
            </button>
          )}
        </>}
      >
        <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          {previewLoading && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px" }}>
              <Loader2 size={24} className="animate-spin" style={{ marginRight: 8 }} />
              <span>加载文档中...</span>
            </div>
          )}
          <div
            ref={previewRef}
            style={{
              flex: 1,
              overflow: "auto",
              background: "#fff",
              borderRadius: 8,
              padding: "0 16px 0 16px",
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
