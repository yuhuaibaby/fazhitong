import { useNavigate } from "react-router"
import { useState } from "react"
import Icon from "../components/Icon"
import MobileModal from "../components/MobileModal"
import SectionHeader from "../components/SectionHeader"
import {
  consultationTypes,
  recentConsultationRecords,
} from "../data/consultations"

export default function Chat() {
  const navigate = useNavigate()
  const [newConsultOpen, setNewConsultOpen] = useState(false)
  return (
    <div className="min-h-full pb-6">
      <header className="bg-[#42107a] px-4 pb-6 pt-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="mt-1 text-lg font-bold text-white">法律咨询</h1>
          </div>
          <button
            onClick={() => setNewConsultOpen(true)}
            className="pressable mt-0.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-primary"
          >
            + 新建
          </button>
        </div>
        <p className="mt-2 text-[11px] text-purple-100">
          选择适合的咨询方式，获得专业支持。
        </p>
      </header>
      <main className="space-y-5 px-4 pt-4">
        <section>
          <div className="mb-2.5">
            <SectionHeader
              title="最近咨询"
              action={
                <button
                  onClick={() => navigate("/consultations")}
                  className="text-xs font-semibold text-primary"
                >
                  查看更多
                </button>
              }
            />
          </div>
          <div className="app-card overflow-hidden rounded-2xl bg-card">
            {recentConsultationRecords.map((item, index) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`pressable flex w-full items-center gap-3 px-4 py-3.5 text-left ${
                  index < recentConsultationRecords.length - 1
                    ? "border-b border-border"
                    : ""
                }`}
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary">
                  <Icon
                    name={item.icon}
                    className="h-4 w-4"
                    filled={item.icon === "spark"}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {item.time} · {item.type} 咨询
                  </p>
                </div>
                <Icon
                  name="chevron"
                  className="h-4 w-4 text-muted-foreground"
                />
              </button>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-2.5">
            <SectionHeader title="常见问题" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              "劳动合同必须签订吗？",
              "员工旷工如何处理？",
              "公司注销流程是什么？",
              "合同违约责任怎么追究？",
            ].map((question) => (
              <button
                key={question}
                onClick={() => navigate("/chat/ai")}
                className="pressable app-card min-h-20 rounded-2xl bg-card p-3 text-left text-xs leading-relaxed text-foreground"
              >
                <span className="mb-2 block text-[10px] font-bold tracking-wide text-primary">
                  AI 问答
                </span>
                {question}
              </button>
            ))}
          </div>
        </section>
      </main>
      <MobileModal
        open={newConsultOpen}
        onClose={() => setNewConsultOpen(false)}
        variant="dialog"
        panelClassName="max-h-[calc(100dvh-48px)] w-full max-w-[344px] overflow-y-auto rounded-3xl bg-card p-4 shadow-[0_22px_60px_rgba(40,19,63,.24)]"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mt-1 text-lg font-bold text-foreground">
              选择咨询类型
            </h2>
          </div>
          <button
            aria-label="关闭"
            onClick={() => setNewConsultOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted text-lg leading-none text-muted-foreground"
          >
            ×
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          根据问题复杂程度选择合适的服务方式。
        </p>
        <div className="mt-4 space-y-2.5">
          {consultationTypes.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="pressable app-card flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left"
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.tone}`}
              >
                <Icon
                  name={item.icon}
                  className="h-5 w-5"
                  filled={item.icon === "spark"}
                />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm text-foreground">
                  {item.title}
                </strong>
                <small className="mt-1 block text-[11px] text-muted-foreground">
                  {item.desc}
                </small>
              </span>
              <i className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] not-italic text-muted-foreground">
                {item.label}
              </i>
              <Icon
                name="chevron"
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              />
            </button>
          ))}
        </div>
      </MobileModal>
    </div>
  )
}
