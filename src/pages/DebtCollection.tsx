import { useState } from "react"
import PageHeader from "../components/PageHeader"

const stages = [
  {
    id: 1,
    icon: "😊",
    label: "友好提醒",
    color: "#dcfce7",
    border: "#86efac",
    textColor: "#16a34a",
    desc: "通过友好沟通提醒债务人还款，维护良好合作关系",
    actions: [
      "发送催款提醒短信",
      "通过微信/电话友好提醒",
      "发送邮件通知",
      "发送催款函",
    ],
    tools: ["催款函模板", "短信模板"],
    ai: "整理沟通记录，生成友好提醒的关键信息。",
  },
  {
    id: 2,
    icon: "📋",
    label: "正式催收",
    color: "#fef9c3",
    border: "#fde047",
    textColor: "#ca8a04",
    desc: "发送正式法律文书，明确告知法律后果",
    actions: ["发送正式律师函", "录音保全证据", "查询债务人资产", "申请支付令"],
    tools: ["律师函模板", "证据清单", "资产查询"],
    ai: "归纳欠款事实与证据目录，辅助准备正式文书。",
  },
  {
    id: 3,
    icon: "⚖️",
    label: "最后通牒",
    color: "#fce7f3",
    border: "#f9a8d4",
    textColor: "#db2777",
    desc: "明确表示将采取法律行动，给予最后还款机会",
    actions: ["发送最后通牒函", "联系担保人", "申请财产保全", "协商分期还款"],
    tools: ["最后通牒模板", "保全申请书"],
    ai: "梳理催收时间线，提示需补充的关键记录。",
  },
  {
    id: 4,
    icon: "🔨",
    label: "法律诉讼",
    color: "#ede9fe",
    border: "#c4b5fd",
    textColor: "#7c3aed",
    desc: "通过司法途径追讨债务，强制执行",
    actions: ["提起民事诉讼", "申请强制执行", "查封冻结财产", "申请债务人失信"],
    tools: ["起诉状模板", "证据清单", "律师对接"],
    ai: "汇总案件材料与争议焦点，便于律师进一步研判。",
  },
]

export default function DebtCollection() {
  const [active, setActive] = useState(stages[0])

  return (
    <div className="min-h-screen bg-[#f8f6fc]">
      <PageHeader title="债务催收" />

      <div className="px-4 py-4 space-y-4 pb-6">
        {/* Stage selector */}
        <div className="grid grid-cols-4 gap-2">
          {stages.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className={`rounded-2xl p-2.5 text-center border transition-all ${
                active.id === s.id
                  ? "border-[#5b21b6] bg-purple-50 shadow-[0_2px_8px_rgba(91,33,182,.08)]"
                  : "bg-white border-transparent"
              }`}
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div
                className={`text-[10px] font-medium ${
                  active.id === s.id ? "text-[#5b21b6]" : "text-[#64748b]"
                }`}
              >
                {s.label}
              </div>
            </button>
          ))}
        </div>

        {/* Stage detail */}
        <div
          className="rounded-2xl p-4 border shadow-sm"
          style={{ background: active.color, borderColor: active.border }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{active.icon}</span>
            <span
              className="font-semibold text-sm"
              style={{ color: active.textColor }}
            >
              {active.label}阶段
            </span>
          </div>
          <p className="text-xs text-[#374151] leading-relaxed">
            {active.desc}
          </p>
          <p
            className="mt-2 border-t pt-2 text-[10px] leading-relaxed"
            style={{ color: active.textColor, borderColor: active.border }}
          >
            AI 可{active.ai}
          </p>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">
            建议行动
          </h3>
          <div className="space-y-2">
            {active.actions.map((a, i) => (
              <div key={a} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[11px] font-bold text-[#64748b] flex-none">
                  {i + 1}
                </span>
                <span className="text-xs text-[#374151]">{a}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">
            可用工具
          </h3>
          <div className="flex gap-2 flex-wrap">
            {active.tools.map((t) => (
              <button
                key={t}
                className="text-xs bg-purple-50 text-[#5b21b6] px-3 py-2 rounded-xl font-medium border border-purple-100 active:scale-95 transition-transform"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-[#5b21b6] mb-2">
            💡 催收小贴士
          </h3>
          <p className="mb-2 text-[10px] leading-relaxed text-purple-700">
            AI
            可协助归纳沟通记录、整理催收节点并匹配文书要点；涉诉策略请由律师确认。
          </p>
          <div className="space-y-1">
            {[
              "保留所有沟通记录作为证据",
              "不得使用骚扰、威胁等违法手段",
              "超过3年可能导致诉讼时效过期",
              "大额债务建议委托专业律师处理",
            ].map((t) => (
              <p key={t} className="text-xs text-purple-700">
                • {t}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
