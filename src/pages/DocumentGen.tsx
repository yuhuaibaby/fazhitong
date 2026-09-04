import { useState } from "react"
import CategoryTabs from "../components/CategoryTabs"
import PageHeader from "../components/PageHeader"
import Icon from "../components/Icon"
import {
  createStampRequest,
  getStampRequest,
  type StampRequest,
} from "../lib/stampRequests"

const templates = [
  {
    id: "dunning",
    icon: "document" as const,
    name: "催款函",
    desc: "正式商业催款通知",
    category: "债权债务",
    fields: ["债务人名称", "欠款金额", "还款期限", "联系地址"],
  },
  {
    id: "labor",
    icon: "briefcase" as const,
    name: "劳动合同",
    desc: "标准劳动用工合同",
    category: "劳动用工",
    fields: ["员工姓名", "岗位名称", "薪资待遇", "合同期限"],
  },
  {
    id: "lease",
    icon: "building" as const,
    name: "租赁合同",
    desc: "房屋/场地租赁合同",
    category: "经营管理",
    fields: ["出租方", "承租方", "租赁地址", "月租金"],
  },
  {
    id: "iou",
    icon: "document" as const,
    name: "欠条",
    desc: "借款欠条凭证",
    category: "债权债务",
    fields: ["借款人", "出借人", "借款金额", "还款日期"],
  },
  {
    id: "cooperation",
    icon: "scale" as const,
    name: "合作协议",
    desc: "商业合作框架协议",
    category: "经营管理",
    fields: ["甲方名称", "乙方名称", "合作内容", "分润比例"],
  },
  {
    id: "nda",
    icon: "shield" as const,
    name: "保密协议",
    desc: "NDA 保密协议",
    category: "经营管理",
    fields: ["披露方", "接收方", "保密内容", "保密期限"],
  },
]

const firms = [
  { id: "1", name: "北京金杜律师事务所" },
  { id: "2", name: "上海锦天城律师事务所" },
  { id: "3", name: "广州广强律师事务所" },
]
const initialRecords = [
  {
    id: "FZT-2024-018",
    templateId: "labor",
    name: "劳动合同",
    date: "今天 10:28",
    status: "已生成",
  },
  {
    id: "FZT-2024-017",
    templateId: "dunning",
    name: "催款函",
    date: "昨天 16:40",
    status: "待盖章",
  },
  {
    id: "FZT-2024-016",
    templateId: "lease",
    name: "租赁合同",
    date: "2024-01-18",
    status: "已完成",
  },
]

export default function DocumentGen() {
  const [view, setView] = useState<"records" | "form" | "report">("records")
  const [templateDialogPhase, setTemplateDialogPhase] =
    useState<"open" | "closing" | "closed">("closed")
  const [templateQuery, setTemplateQuery] = useState("")
  const [templateCategory, setTemplateCategory] = useState("全部")
  const [selected, setSelected] = useState<typeof templates[number] | null>(
    null,
  )
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [records, setRecords] = useState(initialRecords)
  const [stampPanelOpen, setStampPanelOpen] = useState(false)
  const [firmId, setFirmId] = useState("1")
  const [stampRequest, setStampRequest] = useState<StampRequest | null>(() =>
    getStampRequest(),
  )

  const openTemplateDialog = () => setTemplateDialogPhase("open")
  const closeTemplateDialog = () => setTemplateDialogPhase("closing")
  const chooseTemplate = (template: typeof templates[number]) => {
    setSelected(template)
    setFormData({})
    closeTemplateDialog()
    setTemplateQuery("")
    setTemplateCategory("全部")
    setView("form")
  }
  const openRecord = (record: typeof initialRecords[number]) => {
    setSelected(
      templates.find((template) => template.id === record.templateId) ??
        templates[0],
    )
    setStampRequest(getStampRequest())
    setView("report")
  }
  const generate = () => {
    if (!selected) return
    setRecords((items) => [
      {
        id: `FZT-2024-${String(items.length + 19).padStart(3, "0")}`,
        templateId: selected.id,
        name: selected.name,
        date: "刚刚",
        status: "已生成",
      },
      ...items,
    ])
    setView("report")
  }
  const submitStampRequest = () => {
    if (!selected) return
    const firm = firms.find((item) => item.id === firmId) ?? firms[0]
    setStampRequest(
      createStampRequest({
        documentName: selected.name,
        firmId: firm.id,
        firmName: firm.name,
      }),
    )
    setStampPanelOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={
          view === "form"
            ? "填写文书信息"
            : view === "report"
              ? "文书详情"
              : "文书生成"
        }
        onBack={
          view === "form" || view === "report"
            ? () => setView("records")
            : undefined
        }
        right={
          view === "records" ? (
            <button
              onClick={openTemplateDialog}
              className="pressable rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              + 新建文书
            </button>
          ) : undefined
        }
      />
      {view === "records" && (
        <main className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                文书生成、盖章与下载均可在此继续处理
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">
              共 {records.length} 份
            </span>
          </div>
          <section className="mt-5 app-card overflow-hidden rounded-2xl bg-card">
            {records.map((record, index) => (
              <button
                key={record.id}
                onClick={() => openRecord(record)}
                className={`pressable flex w-full items-center gap-3 px-4 py-4 text-left ${
                  index < records.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon name="document" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm text-foreground">
                    {record.name}
                  </strong>
                  <small className="mt-1 block text-[11px] text-muted-foreground">
                    {record.id} · {record.date}
                  </small>
                </span>
                <span
                  className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium ${
                    record.status === "待盖章"
                      ? "bg-[#fff5df] text-[#9a6503]"
                      : "bg-[#e9f8f0] text-[#16845b]"
                  }`}
                >
                  {record.status}
                </span>
                <Icon
                  name="chevron"
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
              </button>
            ))}
          </section>
        </main>
      )}

      {view === "form" && selected && (
        <main className="px-4 py-4">
          <div className="app-card flex items-center gap-3 rounded-2xl bg-card p-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary">
              <Icon name={selected.icon} className="h-4 w-4" />
            </span>
            <span>
              <strong className="block text-sm text-foreground">
                {selected.name}
              </strong>
              <small className="block text-[11px] text-muted-foreground">
                {selected.desc}
              </small>
              <small className="mt-1 flex items-center gap-1 text-[10px] font-medium text-primary">
                <Icon name="spark" className="h-3 w-3" filled />
                AI 补全基础条款结构
              </small>
            </span>
            <button
              onClick={openTemplateDialog}
              className="ml-auto text-xs text-primary"
            >
              更换
            </button>
          </div>
          <section className="mt-4 app-card space-y-4 rounded-2xl bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">填写信息</h2>
            {selected.fields.map((field) => (
              <label
                key={field}
                className="block text-xs text-muted-foreground"
              >
                {field}
                <input
                  value={formData[field] ?? ""}
                  onChange={(event) =>
                    setFormData({ ...formData, [field]: event.target.value })
                  }
                  placeholder={`请输入${field}`}
                  className="document-field mt-1.5 w-full rounded-xl border border-border bg-[#f8fafc] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#c8afe8] focus:bg-white"
                />
              </label>
            ))}
            <label className="block text-xs text-muted-foreground">
              备注说明（可选）
              <textarea
                rows={3}
                placeholder="其他需要说明的事项..."
                className="document-field mt-1.5 w-full resize-none rounded-xl border border-border bg-[#f8fafc] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#c8afe8] focus:bg-white"
              />
            </label>
          </section>
          <button
            onClick={generate}
            className="pressable mt-4 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white"
          >
            生成文书
          </button>
        </main>
      )}

      {view === "report" && selected && (
        <main className="space-y-4 px-4 py-4 pb-6">
          <article className="app-card rounded-2xl bg-card p-5">
            <div className="mb-5 text-center">
              <h1 className="text-base font-bold text-foreground">
                {selected.name}
              </h1>
              <p className="mt-1 text-[11px] text-muted-foreground">
                编号：FZT-2024-001 · 生成时间：
                {new Date().toLocaleDateString("zh-CN")}
              </p>
            </div>
            <div className="space-y-3 text-sm leading-7 text-[#374151]">
              <p>
                甲方（{selected.fields[0]}）：
                {formData[selected.fields[0]] || "_______________"}
              </p>
              <p>
                乙方（{selected.fields[1]}）：
                {formData[selected.fields[1]] || "_______________"}
              </p>
              <p>
                根据《中华人民共和国民法典》及相关法律法规，甲乙双方本着平等自愿、诚实信用的原则，经协商一致，签订本
                {selected.name}如下：
              </p>
              <p>
                <strong>一、基本条款</strong>
              </p>
              <p>
                {selected.fields[2]}：
                {formData[selected.fields[2]] || "_______________"}
              </p>
              <p>
                {selected.fields[3]}：
                {formData[selected.fields[3]] || "_______________"}
              </p>
              <p>
                <strong>二、双方权利与义务</strong>
              </p>
              <p>甲乙双方应按照约定履行相应义务，不得无故违约。</p>
            </div>
          </article>
          <div className="flex gap-3">
            <button
              onClick={() => setView("form")}
              className="flex-1 rounded-xl border border-primary py-3 text-sm font-semibold text-primary"
            >
              重新编辑
            </button>
            <button className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white">
              下载文书
            </button>
          </div>
          <section className="app-card rounded-2xl bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Icon name="building" className="h-4 w-4" />
              </span>
              <span>
                <strong className="block text-sm text-foreground">
                  申请律所盖章版本
                </strong>
                <small className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                  发送给合作律所盖章，完成后回传企业。
                </small>
              </span>
            </div>
            {!stampRequest && !stampPanelOpen && (
              <button
                onClick={() => setStampPanelOpen(true)}
                className="pressable mt-3 w-full rounded-xl border border-primary py-2.5 text-xs font-semibold text-primary"
              >
                选择律所并发起申请
              </button>
            )}
            {stampPanelOpen && (
              <div className="expand-in mt-3 border-t border-purple-100 pt-3">
                <p className="mb-2 text-xs font-medium text-foreground">
                  选择受理律所
                </p>
                {firms.map((firm) => (
                  <button
                    key={firm.id}
                    onClick={() => setFirmId(firm.id)}
                    className={`mb-2 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs ${
                      firm.id === firmId
                        ? "border-primary bg-purple-50 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {firm.name}
                    {firm.id === firmId && (
                      <Icon name="check" className="h-4 w-4" />
                    )}
                  </button>
                ))}
                <button
                  onClick={submitStampRequest}
                  className="mt-1 w-full rounded-xl bg-primary py-3 text-xs font-semibold text-white"
                >
                  提交盖章申请
                </button>
              </div>
            )}
            {stampRequest?.status === "pending" && (
              <div className="mt-3 rounded-xl bg-[#fff5df] px-3 py-2.5 text-xs text-[#9a6503]">
                <b>已发送至 {stampRequest.firmName}</b>
                <p className="mt-1">等待律所盖章并回传。</p>
              </div>
            )}
            {stampRequest?.status === "approved" && (
              <div className="mt-3 rounded-xl bg-[#e9f8f0] px-3 py-2.5 text-xs text-[#16845b]">
                <b>律所已盖章并回传</b>
                <p className="mt-1">回传时间：{stampRequest.returnedAt}</p>
              </div>
            )}
          </section>
        </main>
      )}

      {templateDialogPhase !== "closed" && (
        <div
          className={`fixed inset-y-0 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 items-end bg-[#28133f]/35 ${
            templateDialogPhase === "closing"
              ? "sheet-scrim-out"
              : "sheet-scrim-in"
          }`}
          onClick={closeTemplateDialog}
        >
          <section
            className={`flex h-[78dvh] max-h-[640px] w-full flex-col overflow-hidden rounded-t-[26px] bg-card shadow-[0_-16px_50px_rgba(40,19,63,.18)] ${
              templateDialogPhase === "closing" ? "sheet-out" : "sheet-in"
            }`}
            onClick={(event) => event.stopPropagation()}
            onAnimationEnd={(event) => {
              if (
                templateDialogPhase === "closing" &&
                event.currentTarget === event.target
              )
                setTemplateDialogPhase("closed")
            }}
          >
            <div className="shrink-0 px-4 pb-3 pt-3">
              <div className="mx-auto h-1 w-10 rounded-full bg-border" />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h2 className="mt-1 text-lg font-bold text-foreground">
                    选择文书模板
                  </h2>
                </div>
                <button
                  aria-label="关闭"
                  onClick={closeTemplateDialog}
                  className="grid h-8 w-8 place-items-center rounded-full bg-muted text-lg leading-none text-muted-foreground"
                >
                  ×
                </button>
              </div>
              <div className="relative mt-4">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                />
                <input
                  value={templateQuery}
                  onChange={(event) => setTemplateQuery(event.target.value)}
                  placeholder="搜索催款函、劳动合同等"
                  className="document-field w-full rounded-xl border border-border bg-[#f8fafc] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c8afe8] focus:bg-white"
                />
              </div>
              <CategoryTabs
                className="mt-4"
                options={["全部", "劳动用工", "债权债务", "经营管理"].map(
                  (category) => ({ label: category, value: category }),
                )}
                value={templateCategory}
                onChange={setTemplateCategory}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-1">
              <div className="grid grid-cols-2 gap-3">
                {templates
                  .filter(
                    (template) =>
                      (templateCategory === "全部" ||
                        template.category === templateCategory) &&
                      `${template.name}${template.desc}${template.category}`.includes(
                        templateQuery,
                      ),
                  )
                  .map((template) => (
                    <button
                      key={template.id}
                      onClick={() => chooseTemplate(template)}
                      className="pressable app-card relative min-h-[108px] rounded-2xl bg-card p-2.5 text-left"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-secondary text-primary">
                        <Icon name={template.icon} className="h-4 w-4" />
                      </span>
                      <span className="absolute right-3 top-3 rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                        {template.category}
                      </span>
                      <strong className="mt-2 block text-sm text-foreground">
                        {template.name}
                      </strong>
                      <small className="mt-1 block pr-2 text-[10px] leading-relaxed text-muted-foreground">
                        {template.desc}
                      </small>
                      <small className="mt-1 flex items-center gap-1 text-[9px] font-medium text-primary">
                        <Icon name="spark" className="h-2.5 w-2.5" filled />
                        AI 辅助起草
                      </small>
                    </button>
                  ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
