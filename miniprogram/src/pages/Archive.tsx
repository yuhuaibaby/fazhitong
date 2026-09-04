import { useState } from "react"
import CategoryTabs from "../components/CategoryTabs"
import PageHeader from "../components/PageHeader"

const contracts = [
  {
    name: "2024年软件服务合同",
    party: "北京云启科技有限公司",
    expire: "2024-12-31",
    status: "正常",
    daysLeft: 328,
  },
  {
    name: "办公室租赁合同",
    party: "建国门商业物业",
    expire: "2024-03-15",
    status: "即将到期",
    daysLeft: 38,
  },
  {
    name: "张伟劳动合同",
    party: "张伟",
    expire: "2024-02-15",
    status: "即将到期",
    daysLeft: 8,
  },
  {
    name: "原材料采购框架协议",
    party: "成都利达供应链",
    expire: "2025-06-30",
    status: "正常",
    daysLeft: 512,
  },
]

const licenses = [
  {
    name: "营业执照",
    number: "91110105XXXXXXXX",
    expire: "长期有效",
    status: "有效",
  },
  {
    name: "食品经营许可证",
    number: "JY1101XXXXXXXX",
    expire: "2025-08-20",
    status: "有效",
  },
  {
    name: "增值税专用发票资质",
    number: "TX110105XXXX",
    expire: "长期有效",
    status: "有效",
  },
]

const todos = [
  { title: "劳动合同续签", desc: "张伟合同8天后到期", priority: "high" },
  {
    title: "办公室租赁续租谈判",
    desc: "38天后到期，建议尽快联系房东",
    priority: "medium",
  },
  {
    title: "营业执照年检",
    desc: "6月30日截止，需提交相关材料",
    priority: "low",
  },
]

export default function Archive() {
  const [tab, setTab] = useState<"contracts" | "licenses" | "todos">(
    "contracts",
  )

  return (
    <div className="min-h-screen bg-[#f8f6fc]">
      <PageHeader
        title="企业档案"
        right={
          <button className="text-[#5b21b6] text-xs font-medium">+ 新增</button>
        }
      />

      <div className="px-4">
        <CategoryTabs
          variant="segmented"
          options={[
            { value: "contracts", label: "合同" },
            { value: "licenses", label: "证照" },
            { value: "todos", label: "待办" },
          ]}
          value={tab}
          onChange={(value) =>
            setTab(value as "contracts" | "licenses" | "todos")
          }
        />
      </div>

      <div className="px-4 py-4 space-y-3 pb-6">
        {tab === "contracts" &&
          contracts.map((c) => (
            <div key={c.name} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm font-medium text-[#0f172a]">
                  {c.name}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-none ml-2 ${
                    c.status === "正常"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <p className="text-xs text-[#64748b]">{c.party}</p>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-[#5b21b6]">
                <span>✦</span> AI 监测到期与续签节点
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[#94a3b8]">到期：{c.expire}</span>
                <span
                  className={`text-xs font-medium ${
                    c.daysLeft <= 30
                      ? "text-red-600"
                      : c.daysLeft <= 60
                        ? "text-amber-600"
                        : "text-[#94a3b8]"
                  }`}
                >
                  {c.daysLeft <= 0 ? "已到期" : `剩余 ${c.daysLeft} 天`}
                </span>
              </div>
            </div>
          ))}

        {tab === "licenses" &&
          licenses.map((l) => (
            <div key={l.name} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{l.name}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{l.number}</p>
                  <p className="text-xs text-[#64748b] mt-1">
                    有效期：{l.expire}
                  </p>
                </div>
                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full">
                  {l.status}
                </span>
              </div>
            </div>
          ))}

        {tab === "todos" &&
          todos.map((t) => (
            <div
              key={t.title}
              className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                t.priority === "high"
                  ? "border-red-500"
                  : t.priority === "medium"
                    ? "border-amber-400"
                    : "border-purple-400"
              }`}
            >
              <p className="text-sm font-medium text-[#0f172a]">{t.title}</p>
              <p className="text-xs text-[#64748b] mt-0.5">{t.desc}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    t.priority === "high"
                      ? "bg-red-50 text-red-700"
                      : t.priority === "medium"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-purple-50 text-purple-700"
                  }`}
                >
                  {t.priority === "high"
                    ? "紧急"
                    : t.priority === "medium"
                      ? "重要"
                      : "一般"}
                </span>
                <button className="ml-auto text-xs text-[#5b21b6]">
                  处理 →
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
