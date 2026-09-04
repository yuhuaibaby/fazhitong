import { useState } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";

const messages = [
  { id: "1", type: "system", icon: "🔔", title: "预约确认通知", preview: "您与陈建国律师的图文咨询已确认，请于...", time: "10分钟前", unread: true },
  { id: "2", type: "order", icon: "📦", title: "订单状态更新", preview: "您的订单 O240115001 已完成，请评价本次服务", time: "2小时前", unread: true },
  { id: "3", type: "remind", icon: "⏰", title: "合同到期提醒", preview: "张伟的劳动合同将于8天后到期，请及时处理", time: "昨天", unread: true },
  { id: "4", type: "system", icon: "🎁", title: "优惠活动通知", preview: "限时特惠：专业版首年优惠50%，截止2024-02-01", time: "2天前", unread: false },
  { id: "5", type: "order", icon: "📦", title: "预约提交通知", preview: "您的咨询订单已生成，律师将尽快确认", time: "3天前", unread: false },
  { id: "6", type: "system", icon: "📢", title: "法规更新提醒", preview: "2024年最新劳动法修订内容已更新，点击查看", time: "5天前", unread: false },
];

export default function Messages() {
  const [readIds, setReadIds] = useState<string[]>([]);
  const allRead = () => setReadIds(messages.map((message) => message.id));
  return (
    <div className="min-h-screen bg-[#f8f6fc]">
      <PageHeader title="消息中心" right={<button onClick={allRead} className="text-xs font-semibold text-[#5b21b6]">全部已读</button>} />

      <div className="px-4 py-4 space-y-2">
        {messages.map((m) => {
          const unread = m.unread && !readIds.includes(m.id);
          return <button key={m.id} onClick={() => setReadIds((ids) => ids.includes(m.id) ? ids : [...ids, m.id])} className="app-card pressable w-full bg-white rounded-2xl p-4 flex items-start gap-3 relative text-left">
            {unread && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full" />}
            <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center text-[#5b21b6] flex-none"><Icon name={m.type === "remind" ? "clock" : m.type === "order" ? "folder" : "bell"} className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${unread ? "text-[#0f172a]" : "text-[#64748b]"}`}>{m.title}</span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5 truncate">{m.preview}</p>
              <p className="text-[11px] text-[#cbd5e1] mt-1">{m.time}</p>
            </div>
          </button>;
        })}
      </div>
    </div>
  );
}
