import { Bell, Eye, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../../api/client";
import { useStore, useUnreadCount } from "../../app/store";
import type { AppNotification } from "../types/platform";
import { formatDateTime } from "../utils/dateTime";
import {
  getProjectTabFromTask,
  persistProjectTab,
} from "../../features/projects/detail/projectDetail.config";
import { Modal } from "./Modal";

function taskDisplayLabel(taskType: string) {
  return taskType === "需求评审" ? "文档审查" : taskType;
}

export function NotificationBell() {
  const { state, dispatch } = useStore();
  const unreadCount = useUnreadCount();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifDetail, setNotifDetail] = useState<{ title: string; content: string } | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleNotificationClick = (notification: AppNotification) => {
    const tab = getProjectTabFromTask(notification.taskType);
    persistProjectTab(notification.projectId, tab);
    window.dispatchEvent(new CustomEvent("aitestlink:navigate-tab", { detail: { tab, projectId: notification.projectId } }));
    navigate(notification.targetPath || `/projects/${notification.projectId}`);
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: notification.id });
    notificationsApi.markRead(notification.id).catch(() => {});
    setShowNotifications(false);
  };

  useEffect(() => {
    if (!showNotifications) return;
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifications]);

  return (
    <div className="notif-wrapper" ref={notifRef}>
      <button
        className="icon-button"
        type="button"
        title="通知"
        onClick={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications) {
            state.notifications.forEach((n) => {
              if (!n.read) dispatch({ type: "MARK_NOTIFICATION_READ", payload: n.id });
            });
            notificationsApi.markAllRead().catch(() => {});
          }
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      {showNotifications && (
        <div className="notif-panel">
          <div className="notif-panel__header">
            <span>通知</span>
            {state.notifications.length > 0 && (
              <button className="text-button" type="button" onClick={() => { dispatch({ type: "CLEAR_NOTIFICATIONS" }); notificationsApi.clear().catch(() => {}); }}>
                清空
              </button>
            )}
          </div>
          <div className="notif-panel__list">
            {state.notifications.length === 0 ? (
              <div className="notif-panel__empty">暂无通知</div>
            ) : (
              state.notifications.slice(0, 20).map((n: AppNotification) => (
                <div key={n.id} className={`notif-item ${n.type === "任务失败" ? "notif-item--error" : "notif-item--success"}`} onClick={() => handleNotificationClick(n)}>
                  <div className="notif-item__icon">{n.type === "任务完成" ? "✓" : "✕"}</div>
                  <div className="notif-item__body">
                    <div className="notif-item__title">{n.displayLabel || taskDisplayLabel(n.taskType)} · {n.projectName}</div>
                    <div className="notif-item__desc">{n.message}</div>
                    <div className="notif-item__time">{formatDateTime(n.createdAt)}</div>
                  </div>
                  <div className="notif-item__actions">
                    {n.detail && (
                      <button
                        className="notif-item__view"
                        type="button"
                        title="查看详情"
                        aria-label="查看详情"
                        onClick={(event) => {
                          event.stopPropagation();
                          setShowNotifications(false);
                          setNotifDetail({ title: `${n.displayLabel || taskDisplayLabel(n.taskType)} · ${n.projectName}`, content: n.detail! });
                        }}
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    <button
                      className="notif-item__clear"
                      type="button"
                      title="清除通知"
                      aria-label="清除通知"
                      onClick={(event) => {
                        event.stopPropagation();
                        dispatch({ type: "DELETE_NOTIFICATION", payload: n.id });
                        notificationsApi.delete(n.id).catch(() => {});
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <Modal
        open={!!notifDetail}
        onClose={() => setNotifDetail(null)}
        title="通知详情"
        width={600}
        footer={<button className="primary-button" type="button" onClick={() => setNotifDetail(null)}>关闭</button>}
      >
        {notifDetail && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text, #1e293b)", marginBottom: 12 }}>{notifDetail.title}</div>
            <div style={{ borderTop: "1px solid var(--line, #e2e8f0)", paddingTop: 12, fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary, #475569)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "60vh", overflow: "auto" }}>
              {notifDetail.content}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
