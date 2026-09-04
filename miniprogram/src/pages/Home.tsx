import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import Icon from "../components/Icon"
import { statsAPI, todoAPI, userAPI } from "../lib/api"

const services = [
  {
    label: "合同审查",
    ai: "识别风险条款",
    badge: "AI",
    icon: "scan" as const,
    path: "/contract-review",
    tone: "bg-[#f0eafd] text-[#5b21b6]",
  },
  {
    label: "文书生成",
    ai: "补全基础条款",
    badge: "模板",
    icon: "document" as const,
    path: "/document",
    tone: "bg-[#e7f6f0] text-[#16845b]",
  },
  {
    label: "法律咨询",
    ai: "梳理问题重点",
    badge: "在线",
    icon: "message" as const,
    path: "/chat/lawyer",
    tone: "bg-[#fff2df] text-[#b56d00]",
  },
  {
    label: "用工合规",
    ai: "核验用工规则",
    badge: "检测",
    icon: "shield" as const,
    path: "/compliance",
    tone: "bg-[#e8f0ff] text-[#3567b7]",
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [todos, setTodos] = useState<any[]>([])

  useEffect(() => {
    // 从后端获取数据
    userAPI.getProfile().then(res => setUser(res.user)).catch(() => {})
    statsAPI.get().then(res => setStats(res.stats)).catch(() => {})
    todoAPI.list().then(res => setTodos(res.todos || [])).catch(() => {})
  }, [])

  const pendingTodos = todos.filter(t => t.status === 'pending')
  const todayTasks = pendingTodos.length

  return (
    <div className="min-h-full px-4 pb-6 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="mt-1 text-[22px] font-bold tracking-tight text-foreground">
            企业法律事务
          </h1>
        </div>
        <button
          onClick={() => navigate("/messages")}
          aria-label="消息中心"
          className="pressable relative grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary"
        >
          <Icon name="bell" className="h-5 w-5" />
          <i className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e05b58]" />
        </button>
      </header>
      <section className="mt-6 rounded-2xl bg-[#42107a] p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-purple-200">{user?.company || '加载中...'}</p>
            <h2 className="mt-2 text-2xl font-bold">今日事务 {String(todayTasks).padStart(2, '0')}</h2>
            <p className="mt-1 text-xs text-purple-200">
              优先处理即将到期的合同节点
            </p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#d9b4ff]">
            <Icon name="briefcase" className="h-5 w-5" />
          </span>
        </div>
        <button
          onClick={() => navigate("/archive")}
          className="mt-5 flex items-center gap-1 text-xs font-bold text-white"
        >
          进入企业档案 <Icon name="chevron" className="h-3.5 w-3.5" />
        </button>
      </section>
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">常用服务</h2>
          <span className="text-xs font-semibold text-primary">查看全部</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {services.map((service) => (
            <button
              key={service.label}
              onClick={() => navigate(service.path)}
              className="pressable app-card relative min-h-[126px] overflow-hidden rounded-2xl bg-card p-3 text-left"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl ${service.tone}`}
                >
                  <Icon name={service.icon} className="h-4 w-4" />
                </span>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-muted-foreground">
                  {service.badge}
                </span>
              </div>
              <div className="mt-3">
                <b className="block text-xs text-foreground">{service.label}</b>
                <span className="mt-1.5 flex items-center justify-between gap-1">
                  <small className="flex min-w-0 items-center gap-1 text-[10px] font-medium text-primary">
                    <Icon name="spark" className="h-3 w-3 shrink-0" filled />
                    <span className="truncate">AI {service.ai}</span>
                  </small>
                  <Icon
                    name="chevron"
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">优先处理</h2>
          <button
            onClick={() => navigate("/archive")}
            className="text-xs font-semibold text-primary"
          >
            查看全部
          </button>
        </div>
        <div className="app-card overflow-hidden rounded-2xl bg-card">
          {pendingTodos.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              暂无待办事项
            </div>
          ) : (
            pendingTodos.slice(0, 3).map((task, index) => (
              <button
                key={task.id}
                onClick={() => navigate("/archive")}
                className={`pressable flex w-full items-center gap-3 px-4 py-4 text-left ${
                  index ? "border-t border-border" : ""
                }`}
              >
                <span
                  className={`h-8 w-1 rounded-full ${
                    task.priority === 'high' ? "bg-[#e05b58]" : "bg-[#d19518]"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <b className="block text-xs text-foreground">{task.title}</b>
                  <small className="mt-1 block text-[11px] text-muted-foreground">
                    {task.due_date ? `截止: ${task.due_date}` : ''}
                  </small>
                </span>
                <span className={`rounded-md px-1.5 py-1 text-[10px] font-medium ${
                  task.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-muted text-muted-foreground'
                }`}>
                  {task.priority === 'high' ? '紧急' : task.priority === 'medium' ? '待跟进' : '普通'}
                </span>
                <Icon
                  name="chevron"
                  className="h-3.5 w-3.5 text-muted-foreground"
                />
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
