import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import PageHeader from "../components/PageHeader"
import Icon from "../components/Icon"

const modes = [
  { id: "text", icon: "💬", label: "图文咨询", desc: "文字与图片材料" },
  { id: "phone", icon: "📞", label: "电话咨询", desc: "30 分钟通话" },
  { id: "video", icon: "📹", label: "视频咨询", desc: "面对面沟通" },
]
const lawyers: Record<string, { name: string title: string spec: string }> = {
  "1": { name: "陈建国", title: "高级合伙人", spec: "劳动纠纷" },
  "2": { name: "李梦瑶", title: "资深律师", spec: "商业合同" },
  "3": { name: "王强", title: "专业律师", spec: "企业合规" },
  "4": { name: "张静怡", title: "资深律师", spec: "债权债务" },
}
const times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]
const days = Array.from({ length: 7 }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() + index + 1)
  return {
    date: date.toLocaleDateString("zh-CN", {
      month: "numeric",
      day: "numeric",
    }),
    day: ["日", "一", "二", "三", "四", "五", "六"][date.getDay()],
  }
})

export default function Booking() {
  const navigate = useNavigate()
  const { lawyerId } = useParams()
  const lawyer = lawyers[lawyerId ?? ""] ?? lawyers["1"]
  const [mode, setMode] = useState(modes[0])
  const [day, setDay] = useState(0)
  const [time, setTime] = useState("")
  const [description, setDescription] = useState("")
  const [step, setStep] = useState<"form" | "confirm" | "success">("form")

  const submitBooking = () => window.setTimeout(() => setStep("success"), 450)

  if (step === "success")
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-secondary text-primary">
          <Icon name="check" className="h-9 w-9" />
        </div>
        <h2 className="mt-6 text-xl font-bold text-foreground">预约已提交</h2>
        <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          {lawyer.name}律师将在 24 小时内确认安排，请留意消息通知。
        </p>
        <section className="mt-8 w-full max-w-sm rounded-2xl bg-card p-4 text-left shadow-[0_10px_24px_rgba(52,26,83,.05)]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-sm font-bold text-primary">
              {lawyer.name[0]}
            </span>
            <span>
              <strong className="block text-sm text-foreground">
                {lawyer.name}律师
              </strong>
              <small className="text-[11px] text-muted-foreground">
                {mode.label} · {days[day].date} {time}
              </small>
            </span>
          </div>
        </section>
        <div className="mt-6 flex w-full max-w-sm gap-3">
          <button
            onClick={() => navigate("/orders")}
            className="pressable flex-1 rounded-xl border border-primary py-3 text-sm font-semibold text-primary"
          >
            查看订单
          </button>
          <button
            onClick={() => navigate("/")}
            className="pressable flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white"
          >
            返回首页
          </button>
        </div>
      </div>
    )

  if (step === "confirm")
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="确认预约" onBack={() => setStep("form")} />
        <main className="px-4 py-4">
          <section className="app-card rounded-2xl bg-card p-4">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-base font-bold text-primary">
                {lawyer.name[0]}
              </span>
              <span>
                <strong className="block text-sm text-foreground">
                  {lawyer.name}律师
                </strong>
                <small className="text-[11px] text-muted-foreground">
                  {lawyer.title} · {lawyer.spec}
                </small>
              </span>
            </div>
            <dl className="mt-1 divide-y divide-border text-sm">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-muted-foreground">咨询方式</dt>
                <dd className="font-medium text-foreground">
                  {mode.icon} {mode.label}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-muted-foreground">预约时间</dt>
                <dd className="font-medium text-foreground">
                  {days[day].date} {time}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="shrink-0 text-muted-foreground">问题描述</dt>
                <dd className="max-w-[65%] text-right font-medium leading-relaxed text-foreground">
                  {description || "暂未填写"}
                </dd>
              </div>
            </dl>
          </section>
          <button
            onClick={submitBooking}
            className="pressable mt-5 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white"
          >
            提交预约
          </button>
          <button
            onClick={() => setStep("form")}
            className="mt-2 w-full py-2 text-sm text-muted-foreground"
          >
            返回修改
          </button>
        </main>
      </div>
    )

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="预约咨询" />
      <main className="px-4 py-4 pb-6">
        <section className="flex items-center gap-3 rounded-2xl bg-[#42107a] px-4 py-4 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-base font-bold">
            {lawyer.name[0]}
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm">{lawyer.name}律师</strong>
            <small className="mt-1 block text-[11px] text-purple-100">
              {lawyer.title} · {lawyer.spec}
            </small>
          </span>
          <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] text-purple-50">
            在线
          </span>
        </section>
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-secondary text-[10px] font-bold text-primary">
              1
            </span>
            <h2 className="text-sm font-bold text-foreground">选择咨询方式</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {modes.map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item)}
                className={`pressable rounded-2xl px-2 py-3 text-center ${
                  mode.id === item.id
                    ? "bg-secondary text-primary shadow-[inset_0_0_0_1px_rgba(91,33,182,.18)]"
                    : "bg-card text-foreground shadow-[0_5px_16px_rgba(52,26,83,.04)]"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <strong className="mt-1.5 block text-xs">{item.label}</strong>
                <small className="mt-1 block text-[10px] leading-tight text-muted-foreground">
                  {item.desc}
                </small>
              </button>
            ))}
          </div>
        </section>
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-secondary text-[10px] font-bold text-primary">
              2
            </span>
            <h2 className="text-sm font-bold text-foreground">选择日期</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {days.map((item, index) => (
              <button
                key={item.date}
                onClick={() => setDay(index)}
                className={`pressable rounded-2xl py-2.5 text-center ${
                  day === index
                    ? "bg-primary text-white"
                    : "bg-card text-foreground shadow-[0_5px_16px_rgba(52,26,83,.04)]"
                }`}
              >
                <small
                  className={`block text-[10px] ${
                    day === index ? "text-purple-100" : "text-muted-foreground"
                  }`}
                >
                  周{item.day}
                </small>
                <strong className="mt-1 block text-sm">
                  {item.date.split("/")[1]}
                </strong>
              </button>
            ))}
          </div>
        </section>
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-secondary text-[10px] font-bold text-primary">
              3
            </span>
            <h2 className="text-sm font-bold text-foreground">选择时间</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {times.map((item) => (
              <button
                key={item}
                onClick={() => setTime(item)}
                className={`pressable rounded-xl py-2.5 text-xs font-medium ${
                  time === item
                    ? "bg-primary text-white"
                    : "bg-card text-foreground shadow-[0_4px_12px_rgba(52,26,83,.04)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-secondary text-[10px] font-bold text-primary">
              4
            </span>
            <h2 className="text-sm font-bold text-foreground">
              补充说明{" "}
              <small className="font-normal text-muted-foreground">
                （可选）
              </small>
            </h2>
          </div>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="简要描述您的法律问题，帮助律师提前了解..."
            className="document-field w-full resize-none rounded-2xl border border-border bg-card px-3 py-3 text-sm outline-none focus:border-[#c8afe8]"
          />
        </section>
        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          {time
            ? `${days[day].date} · ${time} · ${mode.label}`
            : "请选择预约时间"}
        </p>
        <button
          onClick={() => setStep("confirm")}
          disabled={!time}
          className="pressable mt-2 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          确认预约
        </button>
      </main>
    </div>
  )
}
