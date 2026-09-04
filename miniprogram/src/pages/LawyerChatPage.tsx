import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import PageHeader from "../components/PageHeader"

const lawyers = [
  {
    id: "1",
    name: "陈建国",
    spec: "劳动纠纷",
    exp: 15,
    rating: 4.9,
    online: true,
  },
  {
    id: "2",
    name: "李梦瑶",
    spec: "商业合同",
    exp: 10,
    rating: 4.8,
    online: true,
  },
  {
    id: "3",
    name: "王强",
    spec: "企业合规",
    exp: 8,
    rating: 4.7,
    online: false,
  },
  {
    id: "4",
    name: "张静怡",
    spec: "债权债务",
    exp: 12,
    rating: 4.9,
    online: true,
  },
]

type LawyerContext = {
  lawyer?: {
    id: string
    name: string
    specialty: string
    experience: string
    rate: string
  }
  report?: string
}
type Message = { role: "lawyer" | "user" text: string time: string }
const now = () =>
  new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })

export default function LawyerChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const context = (location.state ?? {}) as LawyerContext
  const inConversation = Boolean(context.lawyer && context.report)
  const [messages, setMessages] = useState<Message[]>(() =>
    inConversation
      ? [
          {
            role: "lawyer",
            text: `您好，我是${context.lawyer?.name}律师，已收到您的合同审查报告。`,
            time: now(),
          },
          { role: "user", text: context.report ?? "", time: now() },
        ]
      : [],
  )
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return
    setMessages((items) => [...items, { role: "user", text, time: now() }])
    setInput("")
    setTyping(true)
    window.setTimeout(() => {
      setTyping(false)
      setMessages((items) => [
        ...items,
        {
          role: "lawyer",
          text: "已收到。我会结合合同原文与审查结论进一步核对，稍后为您说明重点风险和可执行的修改方案。",
          time: now(),
        },
      ])
    }, 1100)
  }

  if (inConversation) {
    const lawyer = context.lawyer!
    return (
      <div className="flex h-screen flex-col bg-[#f8f6fc]">
        <PageHeader title="律师咨询" />
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-xs text-amber-700">
            {lawyer.name}律师 · {lawyer.specialty} · 在线
          </span>
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.time}-${index}`}
                className={`flex gap-2 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {message.role === "lawyer" && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-400 text-xs font-bold text-white">
                    {lawyer.name[0]}
                  </span>
                )}
                <span
                  className={`flex max-w-[75%] flex-col gap-1 ${
                    message.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <span
                    className={`whitespace-pre-line rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "rounded-tr-sm bg-[#5b21b6] text-white"
                        : "rounded-tl-sm bg-white text-[#0f172a] shadow-sm"
                    }`}
                  >
                    {message.text}
                  </span>
                  <small className="px-1 text-[10px] text-[#94a3b8]">
                    {message.time}
                  </small>
                </span>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-400 text-xs font-bold text-white">
                  {lawyer.name[0]}
                </span>
                <span className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((item) => (
                    <i
                      key={item}
                      className="typing-dot h-1.5 w-1.5 rounded-full bg-[#94a3b8]"
                      style={{ animationDelay: `${item * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </main>
        <div
          className="flex gap-2 border-t border-[#f1f5f9] bg-white px-4 py-3"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            placeholder="输入问题..."
            className="flex-1 rounded-xl bg-[#f1f5f9] px-4 py-2.5 text-sm outline-none"
          />
          <button
            onClick={sendMessage}
            aria-label="发送"
            className="pressable grid h-10 w-10 place-items-center rounded-xl bg-[#5b21b6] text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19V5m0 0l-7 7m7-7l7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="律师咨询" />
      <main className="px-4 py-4 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="mt-1 text-base font-bold text-foreground">
              匹配专业律师
            </h1>
          </div>
          <button
            onClick={() => navigate("/law-firms")}
            className="text-xs font-semibold text-primary"
          >
            查看全部
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          按您的法律事项选择合适的执业律师，在线即可发起咨询。
        </p>
        <section className="mt-5 space-y-3">
          {lawyers.map((lawyer, index) => (
            <article
              key={lawyer.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/lawyer/${lawyer.id}`)}
              onKeyDown={(event) =>
                (event.key === "Enter" || event.key === " ") &&
                navigate(`/lawyer/${lawyer.id}`)
              }
              className="pressable app-card cursor-pointer overflow-hidden rounded-2xl bg-card"
            >
              <div className="flex items-start gap-3 px-4 pb-3 pt-4">
                <div className="relative shrink-0">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-base font-bold text-primary">
                    {lawyer.name[0]}
                  </span>
                  {lawyer.online && (
                    <i className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#2eaf78]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-foreground">
                        {lawyer.name}
                      </h2>
                      <span
                        className={`shrink-0 text-[10px] font-medium ${
                          lawyer.online
                            ? "text-[#16845b]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {lawyer.online ? "当前可咨询" : "暂未在线"}
                      </span>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        navigate(`/booking/${lawyer.id}`)
                      }}
                      className="pressable shrink-0 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-white"
                    >
                      预约
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lawyer.spec} · {lawyer.exp} 年执业经验
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[11px]">
                    <span className="font-semibold text-[#a56a00]">
                      ★ {lawyer.rating}
                    </span>
                    <span className="h-3 w-px bg-border" />
                    <span className="text-muted-foreground">
                      {index === 0 ? "合同风险优先推荐" : "企业服务律师"}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
