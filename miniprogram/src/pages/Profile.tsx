import { useNavigate } from "react-router"
import Icon from "../components/Icon"

const menuItems = [
  {
    icon: "folder" as const,
    label: "订单中心",
    sub: "2 个服务进行中",
    path: "/orders",
    badge: "2",
    tone: "bg-secondary text-primary",
  },
  {
    icon: "building" as const,
    label: "企业档案",
    sub: "合同、证照与到期提醒",
    path: "/archive",
    tone: "bg-[#eef5ff] text-[#3266a8]",
  },
  {
    icon: "bell" as const,
    label: "消息中心",
    sub: "5 条未读服务通知",
    path: "/messages",
    badge: "5",
    tone: "bg-[#fff5df] text-[#a56a00]",
  },
  {
    icon: "scale" as const,
    label: "律师收藏",
    sub: "已收藏 4 位专业律师",
    path: "/discover",
    tone: "bg-[#e9f8f0] text-[#16845b]",
  },
]
const stats = [
  { value: "12", label: "合同" },
  { value: "08", label: "文书" },
  { value: "23", label: "咨询" },
  { value: "03", label: "委托" },
]
const progress = [
  {
    icon: "task-inbox" as const,
    label: "待处理",
    value: "2",
    status: "待处理",
    tone: "bg-[#fff5df] text-[#bd7800]",
  },
  {
    icon: "in-progress" as const,
    label: "进行中",
    value: "1",
    status: "进行中",
    tone: "bg-secondary text-primary",
  },
  {
    icon: "completed-file" as const,
    label: "已完成",
    value: "2",
    status: "已完成",
    tone: "bg-[#e9f8f0] text-[#16845b]",
  },
  {
    icon: "feedback" as const,
    label: "待评价",
    value: "1",
    status: "待评价",
    tone: "bg-[#f1edff] text-[#7357cc]",
  },
]

export default function Profile() {
  const navigate = useNavigate()
  return (
    <div className="min-h-full bg-background pb-6">
      <header className="bg-[#42107a] px-4 pb-14 pt-8 text-white">
        <div className="mt-3 flex min-w-0 items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#fbbf24]">
            <Icon name="building" className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold">
              北京晨曦科技有限公司
            </h1>
            <p className="mt-1 truncate text-xs text-purple-200">
              法定代表人：张建国
            </p>
            <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-purple-100">
              企业法律服务中心
            </span>
          </div>
        </div>
      </header>
      <main className="-mt-10 space-y-5 px-4 pb-1">
        <section className="app-card grid grid-cols-4 divide-x divide-border rounded-2xl bg-card px-1 py-4">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 px-1 text-center">
              <p className="text-[17px] font-bold leading-none tracking-tight text-primary">
                {stat.value}
              </p>
              <p className="mt-2 truncate text-[10px] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </section>
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <h2 className="mt-1 text-sm font-bold text-foreground">
                服务进度
              </h2>
            </div>
            <button
              onClick={() => navigate("/orders")}
              className="text-xs font-semibold text-primary"
            >
              全部订单
            </button>
          </div>
          <div className="app-card grid grid-cols-4 rounded-2xl bg-card px-2 pb-4 pt-4">
            {progress.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(`/orders?status=${item.status}`)}
                className="pressable flex min-w-0 flex-col items-center rounded-xl py-1"
              >
                <span className="relative">
                  <Icon name={item.icon} className="h-7 w-7 text-foreground" />
                  <strong className="absolute -right-2 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-card bg-[#ff6b22] px-1 text-[9px] font-bold leading-none text-white shadow-[0_2px_5px_rgba(255,107,34,.28)]">
                    {item.value}
                  </strong>
                </span>
                <span className="mt-2.5 w-full truncate text-center text-[11px] font-medium text-foreground">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-2.5">
            <h2 className="mt-1 text-sm font-bold text-foreground">企业服务</h2>
          </div>
          <div className="app-card overflow-hidden rounded-2xl bg-card">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`pressable flex w-full min-w-0 items-center gap-3 px-4 py-3.5 text-left ${
                  index < menuItems.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.tone}`}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-foreground">
                    {item.label}
                  </strong>
                  <small className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                    {item.sub}
                  </small>
                </span>
                <Icon
                  name="chevron"
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
