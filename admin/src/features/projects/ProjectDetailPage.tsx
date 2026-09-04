import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Toaster } from "sonner";
import { useStore } from "../../app/store";
import { aiApi } from "../../api/system.api";
import type { ProjectActivityLock } from "../../contracts/system";
import { useProjectData } from "./useProjectData";
import { DocGenerateTab } from "./detail/DocGenerateTab";
import { DocFusionTab } from "./detail/DocFusionTab";
import { ExecuteScriptsTab } from "./detail/ExecuteScriptsTab";
import { DefectsTab } from "./detail/DefectsTab";
import { FilesTab } from "./detail/FilesTab";
import { RequirementsTab } from "./detail/RequirementsTab";
import { RequirementReviewTab } from "./detail/RequirementReviewTab";
import { ScriptsTab } from "./detail/ScriptsTab";
import { OverviewTab } from "./detail/OverviewTab";
import { TestPointsTab } from "./detail/TestPointsTab";
import { TestCasesTab } from "./detail/TestCasesTab";
import { EnvironmentPage } from "../environment/EnvironmentPage";
import { NotificationBell } from "../../shared/components/NotificationBell";
import {
  getStoredProjectTab,
  isProjectDetailTabKey,
  persistProjectTab,
  projectDetailTabs as allTabs,
  type ProjectDetailTabKey as TabKey,
} from "./detail/projectDetail.config";
import { ProjectMutationLockProvider } from "./detail/ProjectMutationLockContext";

const tabComponents: Record<TabKey, FC<{ projectId: string }>> = {
  overview: OverviewTab,
  files: FilesTab,
  environment: EnvironmentPage,
  requirementReview: RequirementReviewTab,
  requirements: RequirementsTab,
  testPoints: TestPointsTab,
  testCases: TestCasesTab,
  scripts: ScriptsTab,
  executeScripts: ExecuteScriptsTab,
  defects: DefectsTab,
  docFusion: DocFusionTab,
  docGenerate: DocGenerateTab,
};

const taskDisplayName = (taskType: string) => {
  if (taskType === "需求评审") return "文档审查";
  return taskType;
};

const PROJECT_DETAIL_TOAST_FALLBACK_TOP = 120;
const PROJECT_DETAIL_TOAST_HEIGHT = 56;

function TabLoadingSkeleton() {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton-line" style={{ width: '40%', height: 20, borderRadius: 4, background: 'var(--line)' }} />
      <div className="skeleton-line" style={{ width: '70%', height: 14, borderRadius: 4, background: 'var(--line)' }} />
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton-card" style={{ flex: 1, height: 80, borderRadius: 'var(--radius-l1)', background: 'var(--line)', opacity: 0.5 }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {[72, 88, 64, 94, 78].map((width, index) => (
          <div key={index} className="skeleton-line" style={{ width: `${width}%`, height: 14, borderRadius: 4, background: 'var(--line)', opacity: 0.4 }} />
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loading } = useProjectData(id);
  const { state } = useStore();
  const prevIdRef = useRef<string | null | undefined>(null);
  const [activityLock, setActivityLock] = useState<ProjectActivityLock>({ locked: false, message: "" });
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    return getStoredProjectTab(id) ?? "overview";
  });
  const tabContentRef = useRef<HTMLDivElement>(null);
  const [projectToastTop, setProjectToastTop] = useState(PROJECT_DETAIL_TOAST_FALLBACK_TOP);
  const handleTabChange = (tab: TabKey) => { setActiveTab(tab); persistProjectTab(id, tab); };
  const refreshMutationLock = () => {
    if (!id) return;
    aiApi.activityLock(id)
      .then(setActivityLock)
      .catch(() => setActivityLock({ locked: false, message: "" }));
  };

  const syncProjectToastTop = useCallback(() => {
    const sectionHeader = tabContentRef.current?.querySelector<HTMLElement>(".section-header");
    if (!sectionHeader) {
      setProjectToastTop(PROJECT_DETAIL_TOAST_FALLBACK_TOP);
      return;
    }

    const rect = sectionHeader.getBoundingClientRect();
    const nextTop = Math.max(12, Math.round(rect.top + rect.height / 2 - PROJECT_DETAIL_TOAST_HEIGHT / 2));
    setProjectToastTop((currentTop) => (Math.abs(currentTop - nextTop) > 1 ? nextTop : currentTop));
  }, []);

  // 兼容热更新或旧本地状态：如果当前 activeTab 已被配置移除，回到项目概况。
  useEffect(() => {
    if (!isProjectDetailTabKey(activeTab)) {
      setActiveTab("overview");
      persistProjectTab(id, "overview");
    }
  }, [activeTab, id]);

  // 仅在项目 ID 真正切换时重置到项目概况页，页面刷新时恢复已保存的 tab
  useEffect(() => {
    if (prevIdRef.current !== null && prevIdRef.current !== id) {
      const nextTab = getStoredProjectTab(id) ?? "overview";
      setActiveTab(nextTab);
      persistProjectTab(id, nextTab);
    }
    prevIdRef.current = id;
  }, [id]);

  // 监听通知点击的 CustomEvent，实时切换 tab 并持久化
  useEffect(() => {
    const handler = (e: Event) => {
      const { tab, projectId } = (e as CustomEvent).detail;
      if (projectId === id && isProjectDetailTabKey(tab)) {
        setActiveTab(tab);
        persistProjectTab(id, tab);
      }
    };
    window.addEventListener("aitestlink:navigate-tab", handler);
    return () => window.removeEventListener("aitestlink:navigate-tab", handler);
  }, [id]);

  // tab 切换时通知所有 useProjectData 实例刷新数据
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("aitestlink:data-refresh", { detail: { projectId: id } }));
  }, [activeTab, id]);

  useEffect(() => {
    tabContentRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(syncProjectToastTop);
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, loading, project?.id, syncProjectToastTop]);

  useEffect(() => {
    const content = tabContentRef.current;
    if (!content) return;

    const update = () => syncProjectToastTop();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    const mutationObserver = typeof MutationObserver !== "undefined" ? new MutationObserver(update) : null;

    resizeObserver?.observe(content);
    mutationObserver?.observe(content, { childList: true, subtree: true });
    window.addEventListener("resize", update);

    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [activeTab, project?.id, syncProjectToastTop]);

  useEffect(() => {
    refreshMutationLock();
  }, [id, state.activeAITasks.join("|")]);

  useEffect(() => {
    if (!activityLock.locked || !id) return;
    const timer = window.setInterval(refreshMutationLock, 3000);
    return () => window.clearInterval(timer);
  }, [activityLock.locked, id]);

  const localActiveTaskType = useMemo(() => {
    if (!id) return "";
    const prefix = `${id}:`;
    const taskKey = state.activeAITasks.find((key) => key.startsWith(prefix));
    return taskKey ? taskKey.slice(prefix.length) : "";
  }, [id, state.activeAITasks]);
  const mutationLocked = Boolean(activityLock.locked || localActiveTaskType);
  const mutationLockMessage = activityLock.message || (localActiveTaskType ? `当前项目正在进行「${taskDisplayName(localActiveTaskType)}」，请等待完成后再操作。` : "当前项目有任务正在执行，请等待完成后再操作。");

  if (!project) {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="detail-header">
            <button className="ghost-button" type="button" onClick={() => navigate("/projects")}><ArrowLeft size={13} /> 返回</button>
            <div className="skeleton-line" style={{ width: 200, height: 24, borderRadius: 4, background: 'var(--line)' }} />
          </div>
          <div className="tab-bar">
            {allTabs.map((tab) => <div key={tab.key} className="skeleton-line" style={{ width: 60, height: 16, borderRadius: 4, background: 'var(--line)', opacity: 0.4 }} />)}
          </div>
          <div className="tab-content"><TabLoadingSkeleton /></div>
        </div>
      );
    }
    return <div className="page-stack page-stack--spaced page-stack--fill"><div className="empty-state"><p>项目不存在或已删除。</p><button className="primary-button" type="button" onClick={() => navigate("/projects")}>返回项目列表</button></div></div>;
  }

  const safeActiveTab: TabKey = isProjectDetailTabKey(activeTab) ? activeTab : "overview";
  const ActiveComponent = tabComponents[safeActiveTab];

  return (
    <ProjectMutationLockProvider value={{ lock: activityLock, mutationLocked, mutationLockMessage, refreshMutationLock }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Toaster
          className="project-detail-toaster"
          position="top-center"
          offset={{ top: projectToastTop }}
          richColors
          toastOptions={{
            style: {
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: 500,
            },
          }}
        />
        <div className="detail-header">
          <button className="ghost-button" type="button" onClick={() => navigate("/projects")}><ArrowLeft size={13} /> 返回</button>
          <div className="detail-header__title">
            <h2>{project.name}</h2>
          </div>
          <div className="detail-header__actions">
            {mutationLocked && (
              <div className="detail-header__task-status" title={mutationLockMessage}>
                <Loader2 size={14} className="animate-spin" style={{ flex: "0 0 auto" }} />
                <span>{mutationLockMessage}</span>
              </div>
            )}
            <NotificationBell />
          </div>
        </div>
        <div className="tab-bar">
          {allTabs.map((tab) => <button key={tab.key} type="button" className={`tab-button ${safeActiveTab === tab.key ? "tab-button--active" : ""}`} onClick={() => handleTabChange(tab.key)}>{tab.label}</button>)}
        </div>
        <div className="tab-content" ref={tabContentRef}>
          <ActiveComponent projectId={project.id} />
        </div>
      </div>
    </ProjectMutationLockProvider>
  );
}
