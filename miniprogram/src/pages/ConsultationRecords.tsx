import { useState } from "react"
import { useNavigate } from "react-router"
import PageHeader from "../components/PageHeader"
import Icon from "../components/Icon"
import CategoryTabs from "../components/CategoryTabs"
import SectionHeader from "../components/SectionHeader"
import { consultationRecords } from "../data/consultations"

const filters = ["全部", "AI", "人工", "律师"]

export default function ConsultationRecords() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState("全部")
  const shownRecords =
    filter === "全部"
      ? consultationRecords
      : consultationRecords.filter((record) => record.type === filter)
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="咨询记录" />
      <main className="px-4 py-4 pb-6">
        <CategoryTabs
          options={filters.map((item) => ({
            label:
              item === "全部" ? `全部 ${consultationRecords.length}` : item,
            value: item,
          }))}
          value={filter}
          onChange={setFilter}
        />
        <div className="mt-4 mb-3">
          <SectionHeader
            title="全部咨询"
            meta={`${shownRecords.length} 条记录`}
          />
        </div>
        <section className="app-card overflow-hidden rounded-2xl bg-card">
          {shownRecords.map((record, index) => (
            <button
              key={record.id}
              onClick={() => navigate(record.path)}
              className={`pressable flex w-full items-center gap-3 px-4 py-4 text-left ${
                index < shownRecords.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                  record.type === "AI"
                    ? "bg-secondary text-primary"
                    : record.type === "人工"
                      ? "bg-[#fff5df] text-[#a56a00]"
                      : "bg-[#eef5ff] text-[#3266a8]"
                }`}
              >
                <Icon
                  name={record.icon}
                  className="h-4 w-4"
                  filled={record.icon === "spark"}
                />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm text-foreground">
                  {record.title}
                </strong>
                <small className="mt-1 block truncate text-[11px] text-muted-foreground">
                  {record.summary}
                </small>
              </span>
              <span className="shrink-0 text-right">
                <i
                  className={`block text-[10px] font-medium not-italic ${
                    record.type === "AI"
                      ? "text-primary"
                      : record.type === "人工"
                        ? "text-[#a56a00]"
                        : "text-[#3266a8]"
                  }`}
                >
                  {record.type}咨询
                </i>
                <small className="mt-1 block text-[10px] text-muted-foreground">
                  {record.time}
                </small>
              </span>
              <Icon
                name="chevron"
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              />
            </button>
          ))}
        </section>
      </main>
    </div>
  )
}
