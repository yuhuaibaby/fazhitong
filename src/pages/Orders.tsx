import { useNavigate, useSearchParams } from "react-router"
import PageHeader from "../components/PageHeader"
import Icon from "../components/Icon"
import CategoryTabs from "../components/CategoryTabs"
import SectionHeader from "../components/SectionHeader"

const orders = [
  {
    id: "O240115001",
    type: "律师咨询",
    party: "陈建国律师",
    mode: "图文咨询",
    date: "2024-01-15 10:30",
    status: "已完成",
    needsReview: true,
    icon: "scale" as const,
    statusTone: "bg-[#e9f8f0] text-[#16845b]",
    iconTone: "bg-secondary text-primary",
  },
  {
    id: "O240112002",
    type: "律师咨询",
    party: "李梦瑶律师",
    mode: "电话咨询",
    date: "2024-01-12 14:00",
    status: "进行中",
    icon: "message" as const,
    statusTone: "bg-secondary text-primary",
    iconTone: "bg-[#eef5ff] text-[#3266a8]",
  },
  {
    id: "O240108003",
    type: "合同审查",
    party: "AI 智能审查",
    mode: "在线审查",
    date: "2024-01-08 09:15",
    status: "已完成",
    icon: "scan" as const,
    statusTone: "bg-[#e9f8f0] text-[#16845b]",
    iconTone: "bg-[#f0eafd] text-primary",
  },
  {
    id: "O240105004",
    type: "律师咨询",
    party: "王强律师",
    mode: "视频咨询",
    date: "2024-01-05 16:30",
    status: "已取消",
    icon: "video" as const,
    statusTone: "bg-muted text-muted-foreground",
    iconTone: "bg-muted text-muted-foreground",
  },
  {
    id: "O240103005",
    type: "企业档案整理",
    party: "企业法律服务中心",
    mode: "材料核验",
    date: "2024-01-03 11:20",
    status: "待处理",
    icon: "folder" as const,
    statusTone: "bg-[#fff5df] text-[#9a6503]",
    iconTone: "bg-[#fff5df] text-[#a56a00]",
  },
  {
    id: "O240102006",
    type: "文书盖章申请",
    party: "北京金杜律师事务所",
    mode: "盖章确认",
    date: "2024-01-02 15:45",
    status: "待处理",
    icon: "document" as const,
    statusTone: "bg-[#fff5df] text-[#9a6503]",
    iconTone: "bg-secondary text-primary",
  },
]
const tabs = ["全部", "待处理", "进行中", "已完成", "待评价", "已取消"]

export default function Orders() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get("status") ?? "全部"
  const filtered =
    tab === "全部"
      ? orders
      : tab === "待评价"
        ? orders.filter((order) => order.needsReview)
        : orders.filter((order) => order.status === tab)
  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-background">
      <PageHeader title="订单中心" onBack={() => navigate("/profile")} />
      <div className="shrink-0 px-4 py-4">
        <CategoryTabs
          options={tabs.map((item) => ({ label: item, value: item }))}
          value={tab}
          onChange={(item) =>
            setSearchParams(item === "全部" ? {} : { status: item })
          }
        />
      </div>
      <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <div className="pb-3 pt-1">
          <SectionHeader title="我的服务" meta={`${filtered.length} 个订单`} />
        </div>
        <section className="space-y-3">
          {filtered.map((order) => (
            <article
              key={order.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/order/${order.id}`)}
              onKeyDown={(event) =>
                (event.key === "Enter" || event.key === " ") &&
                navigate(`/order/${order.id}`)
              }
              className="pressable app-card cursor-pointer rounded-2xl bg-card p-4 text-left"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${order.iconTone}`}
                >
                  <Icon name={order.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <strong className="truncate text-sm text-foreground">
                      {order.type}
                    </strong>
                    <i
                      className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium not-italic ${order.statusTone}`}
                    >
                      {order.needsReview ? "待评价" : order.status}
                    </i>
                  </span>
                  <small className="mt-1 block text-[11px] text-muted-foreground">
                    {order.party} · {order.mode}
                  </small>
                  <small className="mt-2 block text-[10px] text-muted-foreground">
                    {order.date} · 订单号 {order.id}
                  </small>
                </span>
                <Icon
                  name="chevron"
                  className="mt-3 h-4 w-4 shrink-0 text-muted-foreground"
                />
              </div>
              {order.status === "已完成" && (
                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate("/law-firms")
                    }}
                    className="pressable flex-1 rounded-lg bg-secondary py-2 text-xs font-semibold text-primary"
                  >
                    再次预约
                  </button>
                  <button
                    onClick={(event) => event.stopPropagation()}
                    className="pressable flex-1 rounded-lg bg-muted py-2 text-xs font-semibold text-muted-foreground"
                  >
                    写评价
                  </button>
                </div>
              )}
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary">
                <Icon name="folder" className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                暂无相关订单
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                可切换其他状态查看服务记录
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
