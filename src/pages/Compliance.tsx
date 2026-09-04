import { useEffect, useMemo, useState } from "react"
import Icon from "../components/Icon"
import PageHeader from "../components/PageHeader"
import SectionHeader from "../components/SectionHeader"

const scanModules = [
  {
    id: "contract",
    label: "劳动合同",
    detail: "合同、试用期与续签",
    icon: "document" as const,
  },
  {
    id: "salary",
    label: "薪酬管理",
    detail: "工资、加班与工资条",
    icon: "briefcase" as const,
  },
  {
    id: "insurance",
    label: "社会保险",
    detail: "参保、基数与工伤",
    icon: "shield" as const,
  },
  {
    id: "hours",
    label: "工时管理",
    detail: "考勤、休假与审批",
    icon: "clock" as const,
  },
]

const checks = [
  {
    id: "contract",
    label: "劳动合同",
    items: [
      {
        title: "劳动合同签订率",
        detail: "员工合同信息已完整归档",
        status: "pass",
      },
      {
        title: "合同文本合规性",
        detail: "现行版本符合基础用工规则",
        status: "pass",
      },
      {
        title: "试用期约定",
        detail: "2 份合同的试用期约定需要复核",
        status: "risk",
        action: "核对合同期限与试用期条款",
      },
    ],
  },
  {
    id: "salary",
    label: "薪酬管理",
    items: [
      {
        title: "最低工资标准",
        detail: "薪酬基数已通过规则校验",
        status: "pass",
      },
      {
        title: "加班工资计算",
        detail: "1 个考勤周期的计算规则需要确认",
        status: "risk",
        action: "复核加班时长与工资计算口径",
      },
      { title: "工资条发放", detail: "工资条记录已完整归档", status: "pass" },
    ],
  },
  {
    id: "insurance",
    label: "社会保险",
    items: [
      { title: "五险缴纳", detail: "缴纳记录未发现异常", status: "pass" },
      { title: "缴费基数", detail: "基数信息已通过规则校验", status: "pass" },
      { title: "工伤保险覆盖", detail: "人员覆盖信息完整", status: "pass" },
    ],
  },
  {
    id: "hours",
    label: "工时管理",
    items: [
      {
        title: "标准工时制执行",
        detail: "部分员工考勤记录存在缺口",
        status: "risk",
        action: "补充缺失考勤并核对工时制度",
      },
      {
        title: "特殊工时审批",
        detail: "未发现有效审批记录",
        status: "risk",
        action: "确认特殊工时人员并补充审批材料",
      },
      { title: "休息休假安排", detail: "休假制度记录完整", status: "pass" },
    ],
  },
]

const scanSteps = [
  "正在核对企业检测范围",
  "正在解析已归档用工资料",
  "正在匹配劳动用工规则",
  "正在生成风险与整改建议",
]

type View = "setup" | "scanning" | "report"

export default function Compliance() {
  const [view, setView] = useState<View>("setup")
  const [selectedModules, setSelectedModules] = useState(
    scanModules.map((item) => item.id),
  )
  const [step, setStep] = useState(0)
  const [expanded, setExpanded] = useState<string | null>("contract")
  const [planItems, setPlanItems] = useState<string[]>([])
  const [planReady, setPlanReady] = useState(false)

  const selectedChecks = checks.filter((check) =>
    selectedModules.includes(check.id),
  )
  const selectedItems = selectedChecks.flatMap((check) => check.items)
  const passed = selectedItems.filter((item) => item.status === "pass").length
  const risks = selectedItems.filter((item) => item.status === "risk")
  const score = Math.max(62, 100 - risks.length * 6)

  useEffect(() => {
    if (view !== "scanning") return
    setStep(0)
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= scanSteps.length - 1) {
          window.clearInterval(timer)
          window.setTimeout(() => setView("report"), 520)
          return current
        }
        return current + 1
      })
    }, 760)
    return () => window.clearInterval(timer)
  }, [view])

  const toggleModule = (id: string) => {
    setSelectedModules((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    )
  }

  const addPlanItem = (item: string) => {
    setPlanItems((items) => (items.includes(item) ? items : [...items, item]))
  }

  const planSummary = useMemo(
    () =>
      planItems.length
        ? planItems
        : risks.map((risk) => risk.action!).filter(Boolean),
    [planItems, risks],
  )

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="用工合规"
        right={
          view === "report" ? (
            <button
              onClick={() => setView("setup")}
              className="text-xs font-semibold text-primary"
            >
              重新检测
            </button>
          ) : undefined
        }
      />

      {view === "setup" && (
        <main className="space-y-5 px-4 py-4 pb-6">
          <section className="app-card rounded-2xl bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                <Icon name="shield" className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-foreground">
                  开始一次合规检测
                </h1>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  AI 将按已选范围核验企业资料，生成待复核的风险清单与整改动作。
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3">
              <span className="rounded-xl bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                检测主体 <b className="ml-1 text-foreground">北京晨曦科技</b>
              </span>
              <span className="rounded-xl bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                已归档 <b className="ml-1 text-foreground">28 份材料</b>
              </span>
            </div>
          </section>

          <section>
            <SectionHeader
              title="选择检测范围"
              meta={`${selectedModules.length} 项已选`}
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {scanModules.map((module) => {
                const active = selectedModules.includes(module.id)
                return (
                  <button
                    key={module.id}
                    onClick={() => toggleModule(module.id)}
                    className={`pressable app-card relative min-h-[112px] rounded-2xl p-3 text-left ${
                      active ? "border-primary bg-[#fcfbff]" : "bg-card"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-xl ${
                        active
                          ? "bg-secondary text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon name={module.icon} className="h-4 w-4" />
                    </span>
                    <strong className="mt-3 block text-xs text-foreground">
                      {module.label}
                    </strong>
                    <small className="mt-1 block text-[10px] text-muted-foreground">
                      {module.detail}
                    </small>
                    <span
                      className={`absolute right-3 top-3 grid h-4 w-4 place-items-center rounded-full border ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-card text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-[#faf8ff] px-4 py-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <b className="text-primary">检测说明：</b>AI
              用于规则比对、资料归纳和风险提示；涉及事实认定与重大决策，请交由人事或专业律师复核。
            </p>
          </section>
          <button
            disabled={!selectedModules.length}
            onClick={() => setView("scanning")}
            className="pressable w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            开始智能检测
          </button>
        </main>
      )}

      {view === "scanning" && (
        <main className="flex min-h-[72dvh] flex-col items-center justify-center px-7 pb-12 text-center">
          <div className="relative grid h-40 w-40 place-items-center">
            <span className="review-orbit review-orbit-outer" />
            <span className="review-orbit review-orbit-inner" />
            <span className="scan-working grid h-20 w-20 place-items-center rounded-[28px] bg-secondary text-primary shadow-[0_14px_30px_rgba(91,33,182,.12)]">
              <Icon name="shield" className="h-9 w-9" />
            </span>
          </div>
          <h1 className="mt-7 text-lg font-bold text-foreground">
            正在检测用工合规
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            已选择 {selectedModules.length} 个检测范围
          </p>
          <div className="mt-8 w-full max-w-[280px] text-left">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-foreground">
                {scanSteps[step]}
              </span>
              <span className="text-primary">
                {step + 1}/{scanSteps.length}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <span
                className="review-progress block h-full rounded-full bg-primary"
                style={{ width: `${((step + 1) / scanSteps.length) * 100}%` }}
              />
            </div>
          </div>
          <p className="mt-5 text-[10px] leading-relaxed text-muted-foreground">
            正在对照劳动用工基础规则并整理需要您确认的资料。
          </p>
        </main>
      )}

      {view === "report" && (
        <main className="space-y-5 px-4 py-4 pb-6">
          <section className="app-card rounded-2xl bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="relative grid h-[82px] w-[82px] place-items-center">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f0edf4"
                    strokeWidth="9"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={score >= 80 ? "#2eaf78" : "#f59e0b"}
                    strokeWidth="9"
                    strokeDasharray={`${score * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xl font-bold text-foreground">
                  {score}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">
                  本次合规检测完成
                </p>
                <p
                  className={`mt-1 text-xs font-medium ${
                    risks.length ? "text-[#a56a00]" : "text-[#16845b]"
                  }`}
                >
                  {risks.length
                    ? `发现 ${risks.length} 项待整改风险`
                    : "未发现待整改风险"}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {passed}/{selectedItems.length} 项通过规则核验
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 border-t border-border pt-3 text-center">
              <span>
                <b className="block text-sm text-foreground">
                  {selectedModules.length}
                </b>
                <small className="text-[10px] text-muted-foreground">
                  检测模块
                </small>
              </span>
              <span className="border-x border-border">
                <b className="block text-sm text-[#a56a00]">{risks.length}</b>
                <small className="text-[10px] text-muted-foreground">
                  风险项
                </small>
              </span>
              <span>
                <b className="block text-sm text-primary">刚刚</b>
                <small className="text-[10px] text-muted-foreground">
                  检测时间
                </small>
              </span>
            </div>
          </section>

          <section>
            <SectionHeader
              title="检测明细"
              meta={`${selectedItems.length} 项规则`}
            />
            <div className="mt-3 space-y-3">
              {selectedChecks.map((check) => {
                const riskCount = check.items.filter(
                  (item) => item.status === "risk",
                ).length
                const open = expanded === check.id
                return (
                  <article
                    key={check.id}
                    className="app-card overflow-hidden rounded-2xl bg-card"
                  >
                    <button
                      onClick={() => setExpanded(open ? null : check.id)}
                      className="pressable flex w-full items-center gap-3 p-4 text-left"
                    >
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-xl ${
                          riskCount
                            ? "bg-[#fff5df] text-[#a56a00]"
                            : "bg-[#e9f8f0] text-[#16845b]"
                        }`}
                      >
                        <Icon
                          name={riskCount ? "shield" : "check"}
                          className="h-4 w-4"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-sm text-foreground">
                          {check.label}
                        </strong>
                        <small className="mt-1 block text-[11px] text-muted-foreground">
                          {riskCount
                            ? `${riskCount} 项待复核`
                            : "全部通过规则校验"}
                        </small>
                      </span>
                      <Icon
                        name="chevron"
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          open ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                    {open && (
                      <div className="expand-in space-y-3 border-t border-border px-4 py-3">
                        {check.items.map((item) => (
                          <div
                            key={item.title}
                            className="rounded-xl bg-muted px-3 py-2.5"
                          >
                            <div className="flex gap-2">
                              <span
                                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] ${
                                  item.status === "pass"
                                    ? "bg-[#e9f8f0] text-[#16845b]"
                                    : "bg-[#fff0f0] text-[#c44444]"
                                }`}
                              >
                                {item.status === "pass" ? "✓" : "!"}
                              </span>
                              <span className="min-w-0 flex-1">
                                <b className="block text-[11px] text-foreground">
                                  {item.title}
                                </b>
                                <small className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">
                                  {item.detail}
                                </small>
                                {item.action && (
                                  <button
                                    onClick={() => addPlanItem(item.action!)}
                                    className={`mt-2 text-[10px] font-semibold ${
                                      planItems.includes(item.action)
                                        ? "text-[#16845b]"
                                        : "text-primary"
                                    }`}
                                  >
                                    {planItems.includes(item.action)
                                      ? "已加入整改清单"
                                      : "加入整改清单"}
                                  </button>
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>

          <section className="app-card rounded-2xl bg-card p-4">
            <SectionHeader
              title="整改计划"
              meta={planReady ? "已生成" : `${planSummary.length} 项待处理`}
            />
            <div className="mt-3 space-y-2">
              {planSummary.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2.5"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-card text-[10px] font-bold text-primary">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-[11px] leading-relaxed text-foreground">
                    {item}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setPlanReady(true)}
              className="pressable mt-4 w-full rounded-xl bg-primary py-3 text-xs font-bold text-white"
            >
              {planReady ? "整改清单已生成" : "生成整改清单"}
            </button>
            {planReady && (
              <p className="mt-2 text-center text-[10px] text-[#16845b]">
                已生成待办，可在企业档案中继续跟进。
              </p>
            )}
          </section>
        </main>
      )}
    </div>
  )
}
