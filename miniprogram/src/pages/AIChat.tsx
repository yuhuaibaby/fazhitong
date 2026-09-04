import { useState, useRef, useEffect } from "react"
import PageHeader from "../components/PageHeader"
import { useNavigate } from "react-router"
import Icon from "../components/Icon"

interface Msg {
  role: "user" | "ai"
  text: string
  time: string
}

const quickQ = [
  "试用期最长多久？",
  "不签合同有什么风险？",
  "供应商违约如何索赔？",
]

const aiReplies: Record<string, string> = {
  "试用期最长多久？":
    "根据《劳动合同法》第19条，试用期期限由合同期限决定：合同不满1年的，试用期不超过1个月；1年以上不满3年的，试用期不超过2个月；3年以上及无固定期限的，试用期不超过6个月。同一用人单位同一劳动者只能约定一次试用期。",
  default:
    "感谢您的咨询！根据您描述的情况，建议您从以下几个角度分析：\n\n1. 核实相关证据材料是否充分\n2. 明确法律关系及责任归属\n3. 考虑通过协商、调解或诉讼方式解决\n\n如问题较为复杂，建议转接专业律师进行详细分析。",
}

function now() {
  return new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AIChat() {
  const navigate = useNavigate()
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      text: "您好！我是法智通 AI 法律助手。\n\n我可以协助梳理合同、劳动用工、债权债务等常见问题，提取关键信息并提示处理方向。涉及重大决策或复杂争议时，我会建议您进一步咨询律师。",
      time: now(),
    },
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs, typing])

  const send = (text: string) => {
    if (!text.trim()) return
    const q = text.trim()
    setMsgs((m) => [...m, { role: "user", text: q, time: now() }])
    setInput("")
    setTyping(true)
    setTimeout(() => {
      const reply = aiReplies[q] ?? aiReplies.default
      setTyping(false)
      setMsgs((m) => [...m, { role: "ai", text: reply, time: now() }])
    }, 1500)
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8f6fc]">
      <PageHeader
        title="AI 智能咨询"
        right={
          <button
            onClick={() => navigate("/chat/human")}
            className="text-xs bg-[#f59e0b] text-white px-3 py-1.5 rounded-lg font-medium"
          >
            转人工
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2 ${
              m.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {m.role === "ai" && (
              <div className="w-8 h-8 bg-[#5b21b6] rounded-full flex items-center justify-center text-white flex-none">
                <Icon name="spark" className="h-4 w-4" filled />
              </div>
            )}
            <div
              className={`max-w-[75%] ${
                m.role === "user" ? "items-end" : "items-start"
              } flex flex-col gap-1`}
            >
              <div
                className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  m.role === "ai"
                    ? "bg-white text-[#0f172a] rounded-tl-sm shadow-sm"
                    : "bg-[#5b21b6] text-white rounded-tr-sm"
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-[#94a3b8] px-1">{m.time}</span>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-[#5b21b6] rounded-full flex items-center justify-center text-white">
              <Icon name="spark" className="h-4 w-4" filled />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="typing-dot w-1.5 h-1.5 bg-[#94a3b8] rounded-full"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div className="px-4 py-2 space-y-1.5">
        {quickQ.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="pressable flex w-full items-center justify-between rounded-xl border border-purple-100 bg-purple-50 px-3 py-2 text-left text-xs text-purple-700"
          >
            <span>{q}</span>
            <Icon name="chevron" className="h-3.5 w-3.5 shrink-0" />
          </button>
        ))}
        <p className="px-1 pt-0.5 text-[10px] leading-relaxed text-[#94a3b8]">
          AI 回答仅供法律信息参考，不构成正式法律意见。
        </p>
      </div>

      {/* Input */}
      <div
        className="bg-white border-t border-[#f1f5f9] px-4 py-3 flex gap-2"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="输入法律问题..."
          className="flex-1 bg-[#f1f5f9] rounded-xl px-4 py-2.5 text-sm outline-none"
        />
        <button
          onClick={() => send(input)}
          className="w-10 h-10 bg-[#5b21b6] rounded-xl flex items-center justify-center flex-none"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={2}
            className="w-4 h-4"
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
