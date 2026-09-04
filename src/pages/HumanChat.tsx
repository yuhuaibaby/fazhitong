import { useState, useRef, useEffect } from "react";
import PageHeader from "../components/PageHeader";

interface Msg { role: "user" | "agent"; text: string; time: string }

function now() { return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }); }

export default function HumanChat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "agent", text: "您好！我是法智通专业客服王小美 👩‍💼\n\n当前工作时间（9:00-18:00），为您实时服务。请问有什么可以帮您的？", time: now() },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMsgs((m) => [...m, { role: "user", text: q, time: now() }]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "agent", text: "收到您的问题，我来为您查询一下相关法规，请稍候...\n\n针对您的情况，建议您提供更多材料（合同原件、沟通记录等），我们会尽快为您提供专业建议。如问题复杂，可以为您推荐专业律师进行深度咨询。", time: now() }]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8f6fc]">
      <PageHeader title="人工客服" />
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs text-amber-700">王小美 · 在线 · 今日已服务 47 人</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "agent" && (
              <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-sm flex-none">👩‍💼</div>
            )}
            <div className={`max-w-[75%] flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${m.role === "agent" ? "bg-white text-[#0f172a] rounded-tl-sm shadow-sm" : "bg-[#5b21b6] text-white rounded-tr-sm"}`}>
                {m.text}
              </div>
              <span className="text-[10px] text-[#94a3b8] px-1">{m.time}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-[#f1f5f9] px-4 py-3 flex gap-2" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="输入问题..."
          className="flex-1 bg-[#f1f5f9] rounded-xl px-4 py-2.5 text-sm outline-none"
        />
        <button onClick={send} className="w-10 h-10 bg-[#5b21b6] rounded-xl flex items-center justify-center flex-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
