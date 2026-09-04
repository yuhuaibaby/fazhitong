import { useState } from "react"
import { useNavigate } from "react-router"
import PageHeader from "../components/PageHeader"
import Icon from "../components/Icon"
import MobileModal from "../components/MobileModal"

const risks = [
  {
    level: "高",
    title: "违约金条款不合理",
    desc: "第8条违约金约定过高，超出法律上限，存在被认定无效的风险",
    tag: "⚠️",
  },
  {
    level: "中",
    title: "不可抗力范围过窄",
    desc: "第12条未覆盖疫情、政策变化等情形，建议扩展范围",
    tag: "📌",
  },
  {
    level: "低",
    title: "交货验收标准模糊",
    desc: "第5条验收标准不够具体，建议增加量化指标",
    tag: "ℹ️",
  },
]

const passed = [
  "付款方式约定完整",
  "保密条款规范",
  "管辖条款明确",
  "签章要求合规",
]
const recommendedLawyers = [
  {
    id: "2",
    name: "李梦瑶",
    specialty: "商业合同",
    experience: "10年执业",
    initials: "李",
  },
  {
    id: "4",
    name: "张静怡",
    specialty: "债权债务",
    experience: "12年执业",
    initials: "张",
  },
  {
    id: "1",
    name: "陈建国",
    specialty: "劳动与商事",
    experience: "15年执业",
    initials: "陈",
  },
]

export default function ContractResult() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<number | null>(null)
  const [lawyerDialogOpen, setLawyerDialogOpen] = useState(false)
  const [lawyerQuery, setLawyerQuery] = useState("")
  const filteredLawyers = recommendedLawyers.filter((lawyer) =>
    `${lawyer.name}${lawyer.specialty}`.includes(lawyerQuery.trim()),
  )
  return (
    <div className="min-h-screen bg-[#f8f6fc]">
      <PageHeader
        title="审查报告"
        onBack={() => navigate("/contract-review")}
      />

      <div className="px-4 py-4 space-y-4 pb-6">
        {/* Score */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-5">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="10"
                strokeDasharray={`${72 * 2.51} ${251}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[#0f172a]">72</span>
              <span className="text-[10px] text-[#94a3b8]">分</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">综合风险评分</p>
            <p className="text-xs text-amber-600 mt-0.5 font-medium">
              ⚠️ 中等风险
            </p>
            <p className="text-[11px] text-[#64748b] mt-2">
              发现 1 个高风险、1 个中风险、1 个低风险条款
            </p>
          </div>
        </div>

        {/* Risk details */}
        <div>
          <h2 className="text-sm font-semibold text-[#0f172a] mb-2.5">
            风险详情
          </h2>
          <div className="space-y-2">
            {risks.map((r, i) => (
              <div
                key={r.title}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <span
                    className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center flex-none ${
                      r.level === "高"
                        ? "bg-red-100 text-red-700"
                        : r.level === "中"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {r.level}
                  </span>
                  <span className="flex-1 text-sm font-medium text-[#0f172a]">
                    {r.title}
                  </span>
                  <span
                    className={`text-[#94a3b8] transition-transform ${
                      expanded === i ? "rotate-90" : ""
                    }`}
                  >
                    ›
                  </span>
                </button>
                {expanded === i && (
                  <div className="expand-in px-4 pb-4 pt-0">
                    <p className="text-xs text-[#64748b] leading-relaxed">
                      {r.desc}
                    </p>
                    <button className="mt-3 text-xs bg-purple-50 text-[#5b21b6] px-3 py-1.5 rounded-lg font-medium">
                      查看修改建议
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Passed */}
        <div>
          <h2 className="text-sm font-semibold text-[#0f172a] mb-2.5">
            已通过项目
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            {passed.map((p) => (
              <div key={p} className="flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs flex-none">
                  ✓
                </span>
                <span className="text-xs text-[#374151]">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setLawyerDialogOpen(true)}
            className="pressable flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5b21b6] py-3.5 text-sm font-semibold text-white"
          >
            <Icon name="message" className="h-4 w-4" />
            咨询律师
          </button>
          <button className="pressable flex-1 rounded-xl bg-secondary py-3.5 text-sm font-medium text-primary">
            下载 PDF
          </button>
        </div>
      </div>

      <MobileModal
        open={lawyerDialogOpen}
        onClose={() => setLawyerDialogOpen(false)}
        panelClassName="flex h-[72dvh] max-h-[580px] w-full flex-col overflow-hidden rounded-t-[26px] bg-card shadow-[0_-16px_50px_rgba(40,19,63,.18)]"
      >
        <div className="shrink-0 px-4 pb-3 pt-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-border" />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h2 className="mt-1 text-lg font-bold text-foreground">
                选择咨询律师
              </h2>
            </div>
            <button
              aria-label="关闭"
              onClick={() => setLawyerDialogOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full bg-muted text-lg leading-none text-muted-foreground"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            优先推荐擅长合同风险与商事争议的律师
          </p>
          <div className="relative mt-4">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
            />
            <input
              value={lawyerQuery}
              onChange={(event) => setLawyerQuery(event.target.value)}
              placeholder="搜索律师姓名或擅长领域"
              className="document-field w-full rounded-xl border border-border bg-[#f8fafc] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c8afe8] focus:bg-white"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="space-y-3">
            {filteredLawyers.map((lawyer) => (
              <article
                key={lawyer.id}
                className="app-card flex items-center gap-3 rounded-2xl bg-card p-3"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-primary">
                  {lawyer.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm text-foreground">
                    {lawyer.name}
                    <em className="ml-2 not-italic text-[10px] font-medium text-[#16845b]">
                      在线
                    </em>
                  </strong>
                  <small className="mt-1 block text-[11px] text-muted-foreground">
                    {lawyer.specialty} · {lawyer.experience}
                  </small>
                </span>
                <button
                  onClick={() =>
                    navigate("/chat/lawyer", {
                      state: {
                        lawyer,
                        report:
                          "合同审查报告：综合风险 72 分，发现 1 个高风险、1 个中风险、1 个低风险条款。",
                      },
                    })
                  }
                  className="pressable shrink-0 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-white"
                >
                  咨询
                </button>
              </article>
            ))}
            {filteredLawyers.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                未找到匹配的律师
              </p>
            )}
          </div>
        </div>
      </MobileModal>
    </div>
  )
}
