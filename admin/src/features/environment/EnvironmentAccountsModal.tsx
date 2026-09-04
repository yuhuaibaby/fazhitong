import { useEffect, useRef, useState, type MouseEvent } from "react";
import { KeyRound, Plus, Users, Download, Upload, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { environmentApi, type EnvironmentConfig, type TestAccount, type UISnapshot } from "../../api/environment.api";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { DataTable } from "../../shared/components/DataTable";
import { Modal } from "../../shared/components/Modal";
import { StatusPill } from "../../shared/components/StatusPill";
import { formatDateTime } from "../../shared/utils/dateTime";

interface EnvironmentAccountsModalProps {
  environment: EnvironmentConfig | null;
  onClose: () => void;
  onAdd: (environmentId: string) => void;
  onEdit: (account: TestAccount) => void;
  onDelete: (account: TestAccount) => void;
  onRecognize: (account: TestAccount, headed?: boolean) => Promise<void>;
  onViewResult: (account: TestAccount) => void;
  recognizingAccountIds?: Set<string>;
  onImported?: () => void;
  mutationLocked?: boolean;
  mutationLockMessage?: string;
}

function formatTime(iso: string | undefined): string {
  return formatDateTime(iso);
}

type DuplicateAccount = { department: string; name: string; username: string; role: string };

function formatDuplicateAccountLine(item: DuplicateAccount, index: number): string {
  return `${index + 1}. 部门：${item.department || "未填部门"}；用户名：${item.name || "未填用户名"}；账号：${item.username || "未填账号"}；角色：${item.role || "未填角色"}`;
}

function measureToastTextWidth(lines: string[]): number {
  if (typeof document === "undefined") return 560;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return 560;
  context.font = "500 14px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  return Math.ceil(Math.max(...lines.map((line) => context.measureText(line).width), 0));
}

function getDuplicateAccountsToastWidth(created: number, skipped: number, duplicates: DuplicateAccount[] | undefined): number {
  const visibleDuplicates = duplicates ?? [];
  const lines = [
    `发现 ${skipped} 条重复数据，已跳过`,
    `已导入 ${created} 个账号，以下重复数据已跳过：`,
    ...visibleDuplicates.map(formatDuplicateAccountLine),
  ];
  if (skipped > visibleDuplicates.length && visibleDuplicates.length > 0) {
    lines.push(`还有 ${skipped - visibleDuplicates.length} 条重复数据未展示。`);
  }

  const contentWidth = measureToastTextWidth(lines);
  const chromeWidth = 112;
  const viewportWidth = typeof window === "undefined" ? 640 : window.innerWidth;
  const maxWidth = Math.max(360, viewportWidth - 48);
  return Math.min(maxWidth, Math.max(420, contentWidth + chromeWidth));
}

function getDuplicateAccountsToastDuration(skipped: number): number {
  return skipped > 5 ? 8000 : 6000;
}

function renderDuplicateAccountsDescription(created: number, skipped: number, duplicates: DuplicateAccount[] | undefined) {
  const visibleDuplicates = duplicates ?? [];

  return (
    <div style={{ display: "grid", gap: 8, lineHeight: 1.6, maxWidth: "100%", overflowX: "auto" }}>
      <div>已导入 {created} 个账号，以下重复数据已跳过：</div>
      {visibleDuplicates.length > 0 ? (
        <div style={{ display: "grid", gap: 4 }}>
          {visibleDuplicates.map((item, index) => (
            <div key={`${item.department}-${item.name}-${item.username}-${item.role}-${index}`} style={{ whiteSpace: "nowrap" }}>
              {formatDuplicateAccountLine(item, index)}
            </div>
          ))}
        </div>
      ) : (
        <div>重复数据共 {skipped} 条。</div>
      )}
      {skipped > visibleDuplicates.length && visibleDuplicates.length > 0 && (
        <div>还有 {skipped - visibleDuplicates.length} 条重复数据未展示。</div>
      )}
    </div>
  );
}

export function EnvironmentAccountsModal({
  environment,
  onClose,
  onAdd,
  onEdit,
  onDelete,
  onRecognize,
  onViewResult,
  recognizingAccountIds = new Set(),
  onImported,
  mutationLocked = false,
  mutationLockMessage = "",
}: EnvironmentAccountsModalProps) {
  const accounts = environment?.accounts ?? [];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState<TestAccount | null>(null);
  const [recognitionStates, setRecognitionStates] = useState<Record<string, UISnapshot | null>>({});
  const [moreAccount, setMoreAccount] = useState<{ account: TestAccount; top: number; left: number } | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const moreTriggerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!moreAccount) return;
    // 捕获阶段监听不会被表格、弹窗等组件的 stopPropagation 阻断。
    // 仅菜单和当前触发按钮内的点击保留菜单，其他任意空白处点击立即关闭。
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || moreMenuRef.current?.contains(target) || moreTriggerRef.current?.contains(target)) return;
      setMoreAccount(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreAccount(null);
    };
    document.addEventListener("pointerdown", closeOnOutside, true);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreAccount]);
  useEffect(() => {
    if (!environment) { setRecognitionStates({}); return; }
    void Promise.all(environment.accounts.map(async (account) => {
      try {
        const result = await environmentApi.getUISnapshot(environment.id, account.id);
        return [account.id, "status" in result ? result : null] as const;
      } catch { return [account.id, null] as const; }
    })).then((entries) => setRecognitionStates(Object.fromEntries(entries)));
  }, [environment]);
  const allSelected = accounts.length > 0 && accounts.every((a) => selectedIds.has(a.id));
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(accounts.map((a) => a.id)));
  const toggleSelect = (id: string) => setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBatchDelete = async () => {
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    const ids = [...selectedIds];
    for (const id of ids) {
      try { await environmentApi.deleteAccount(id); } catch { /* skip */ }
    }
    toast.success(`已删除 ${ids.length} 个账号`);
    setSelectedIds(new Set());
    setShowBatchDeleteConfirm(false);
    onImported?.();
  };

  // 下载模板（调用后端 openpyxl 生成）
  const handleDownloadTemplate = async () => {
    if (!environment) return;
    try {
      const blob = await environmentApi.downloadAccountsTemplate(environment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${environment.name || "测试账号"}-账号导入模板.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("模板已下载");
    } catch {
      toast.error("模板下载失败");
    }
  };

  // 导入账号（直接上传文件，后端解析）
  const handleImport = () => {
    if (!environment) return;
    if (mutationLocked) { toast.warning(mutationLockMessage); return; }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xlsx,.xls";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const result = await environmentApi.importAccounts(environment.id, file);
        const skipped = result.skippedDuplicates ?? result.skipped ?? 0;
        if (skipped > 0) {
          const toastWidth = getDuplicateAccountsToastWidth(result.created, skipped, result.duplicates);
          toast.warning(`发现 ${skipped} 条重复数据，已跳过`, {
            description: renderDuplicateAccountsDescription(result.created, skipped, result.duplicates),
            duration: getDuplicateAccountsToastDuration(skipped),
            style: {
              width: `${toastWidth}px`,
              maxWidth: "calc(100vw - 48px)",
            },
          });
        } else {
          toast.success(`已导入 ${result.created} 个账号`);
        }
        onImported?.();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "导入失败";
        toast.error(msg);
      }
    };
    input.click();
  };

  const handleExport = async () => {
    if (!environment) return;
    try {
      const blob = await environmentApi.exportAccounts(environment.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${environment.name || "测试账号"}-账号导出.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("账号已导出，可直接通过导入账号回导");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "账号导出失败");
    }
  };

  return (
    <Modal
      open={!!environment}
      onClose={onClose}
      title={environment ? `账号管理 · ${environment.name}` : "账号管理"}
      width={1180}
      height="84vh"
      bodyOverflow="hidden"
      footer={<button className="ghost-button" type="button" onClick={onClose}>关闭</button>}
    >
      {environment && (
        <div className="environment-accounts-modal page-stack page-stack--fill">
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
            <div style={{ marginRight: "auto", minWidth: 0, color: "var(--muted)", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {environment.environmentType === "APP" ? "APP 端地址" : "PC 端地址"}：<span style={{ color: "var(--text)", fontWeight: 600 }}>{(environment.environmentType === "APP" ? environment.appUrl : environment.webUrl) || "未配置"}</span>
            </div>
              {selectedIds.size > 0 && (
                <button className="ghost-button text-button--danger" type="button" disabled={mutationLocked} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => setShowBatchDeleteConfirm(true)}>
                  <Trash2 size={13} /> 批量删除（{selectedIds.size}）
                </button>
              )}
              <button className="ghost-button" type="button" onClick={handleDownloadTemplate}>
                <Download size={13} /> 下载模板
              </button>
              <button className="ghost-button" type="button" disabled={mutationLocked} title={mutationLocked ? mutationLockMessage : undefined} onClick={handleImport}>
                <Upload size={13} /> 导入账号
              </button>
              <button className="ghost-button" type="button" onClick={handleExport}>
                <Download size={13} /> 导出账号
              </button>
              <button className="primary-button" type="button" disabled={mutationLocked} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => onAdd(environment.id)}>
                <Plus size={14} /> 添加账号
              </button>
          </div>

          <section className="work-panel environment-accounts-table">
            {accounts.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 260 }}>
                <Users size={36} style={{ color: "var(--muted)", marginBottom: 10 }} />
                <p>当前环境还没有测试账号</p>
                <p style={{ color: "var(--muted)", fontSize: 13 }}>添加的账号只会绑定到“{environment.name}”。</p>
                <button className="primary-button" type="button" disabled={mutationLocked} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => onAdd(environment.id)}>
                  <Plus size={14} /> 添加第一个账号
                </button>
              </div>
            ) : (
              <DataTable<TestAccount>
                rows={accounts}
                getRowKey={(account) => account.id}
                columns={[
                  { key: "select", label: <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />, width: "40px", sticky: "left" as const, render: (account) => <input type="checkbox" checked={selectedIds.has(account.id)} onChange={() => toggleSelect(account.id)} /> },
                  { key: "department", label: "部门", width: "84px", align: "center", render: (account) => account.department || <span style={{ color: "var(--muted)" }}>-</span> },
                  { key: "name", label: "用户名", width: "88px", align: "center", render: (account) => <strong>{account.name}</strong> },
                  { key: "username", label: "账号", width: "118px", align: "center", render: (account) => account.username },
                  { key: "password", label: "密码", width: "88px", align: "center", render: (account) => account.hasPassword ? (
                    <span title="密码已加密保存，不回显明文" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <KeyRound size={13} /> ••••••••
                    </span>
                  ) : <StatusPill tone="slate">未配置</StatusPill> },
                  { key: "role", label: "角色", width: "96px", align: "center", render: (account) => account.role || <span style={{ color: "var(--muted)" }}>-</span> },
                  { key: "recognition", label: "识别状态", width: "92px", align: "center", render: (account) => {
                    if (recognizingAccountIds.has(account.id)) return <StatusPill tone="blue">识别中</StatusPill>;
                    const snapshot = recognitionStates[account.id];
                    if (!snapshot) return <StatusPill tone="slate">未识别</StatusPill>;
                    return <StatusPill tone={snapshot.status === "成功" ? "green" : "red"}>{snapshot.status === "成功" ? "已识别" : "识别失败"}</StatusPill>;
                  } },
                  { key: "createdAt", label: "创建时间", width: "132px", align: "center", render: (account) => formatTime(account.createdAt) },
                  { key: "actions", label: "操作", width: "150px", sticky: "right", align: "center", render: (account) => (
                    <div className="inline-actions">
                      <button className="text-button" type="button" disabled={mutationLocked} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => onEdit(account)}>编辑</button>
                      <button className="text-button text-button--danger" type="button" disabled={mutationLocked} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => setDeleteAccountConfirm(account)}>删除</button>
                      <button className="text-button" type="button" disabled={mutationLocked || recognizingAccountIds.has(account.id)} title={mutationLocked ? mutationLockMessage : recognizingAccountIds.has(account.id) ? "该账号识别中" : "更多识别操作"} onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation(); const rect = event.currentTarget.getBoundingClientRect();
                        moreTriggerRef.current = event.currentTarget;
                        setMoreAccount((current) => current?.account.id === account.id ? null : { account, top: rect.bottom + 4, left: rect.right - 148 });
                      }}><MoreHorizontal size={15} /></button>
                    </div>
                  ) },
                ]}
              />
            )}
          </section>
        </div>
      )}
      <ConfirmDialog
        open={showBatchDeleteConfirm}
        title="批量删除账号"
        message={`确定删除选中的 ${selectedIds.size} 个账号？此操作不可撤销。`}
        confirmLabel="删除"
        onConfirm={handleBatchDelete}
        onCancel={() => setShowBatchDeleteConfirm(false)}
      />
      {moreAccount && <div ref={moreMenuRef} className="environment-more-menu" style={{ top: moreAccount.top, left: moreAccount.left, position: "fixed", zIndex: 2000 }} onClick={(event) => event.stopPropagation()}>
        <button className="environment-more-menu__item" type="button" disabled={mutationLocked || recognizingAccountIds.has(moreAccount.account.id)} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => { const account = moreAccount.account; void onRecognize(account).then(async () => { const result = await environmentApi.getUISnapshot(account.environmentId, account.id); if ("status" in result) setRecognitionStates((prev) => ({ ...prev, [account.id]: result })); }); setMoreAccount(null); }}>{recognizingAccountIds.has(moreAccount.account.id) ? "识别中..." : "识别系统"}</button>
        <button className="environment-more-menu__item" type="button" disabled={mutationLocked || recognizingAccountIds.has(moreAccount.account.id)} title={mutationLocked ? mutationLockMessage : undefined} onClick={() => { const account = moreAccount.account; void onRecognize(account, true).then(async () => { const result = await environmentApi.getUISnapshot(account.environmentId, account.id); if ("status" in result) setRecognitionStates((prev) => ({ ...prev, [account.id]: result })); }); setMoreAccount(null); }}>可视化识别系统</button>
        <button className="environment-more-menu__item" type="button" disabled={recognizingAccountIds.has(moreAccount.account.id)} onClick={() => { onViewResult(moreAccount.account); setMoreAccount(null); }}>识别结果</button>
      </div>}
      <ConfirmDialog
        open={!!deleteAccountConfirm}
        title="删除账号"
        message={`确定要删除账号「${deleteAccountConfirm?.name || ""}」吗？此操作不可撤销。`}
        confirmLabel="删除"
        onConfirm={() => {
          if (deleteAccountConfirm) onDelete(deleteAccountConfirm);
          setDeleteAccountConfirm(null);
        }}
        onCancel={() => setDeleteAccountConfirm(null)}
      />
    </Modal>
  );
}
