import { useNavigate } from "react-router"
import { useState } from "react"
import CategoryTabs from "../components/CategoryTabs"
import Icon from "../components/Icon"
import LawFirmCard from "../components/LawFirmCard"
import SectionHeader from "../components/SectionHeader"

const firms = [
  {
    id: "1",
    name: "北京金杜律师事务所",
    tag: "综合型",
    rating: 4.9,
    cases: 2841,
    area: "北京 · 朝阳",
    logo: "⚖️",
    lawyers: 320,
    founded: 1988,
  },
  {
    id: "2",
    name: "上海锦天城律师事务所",
    tag: "商业法务",
    rating: 4.8,
    cases: 1923,
    area: "上海 · 浦东",
    logo: "🏛️",
    lawyers: 210,
    founded: 1995,
  },
  {
    id: "3",
    name: "广州广强律师事务所",
    tag: "劳动纠纷",
    rating: 4.7,
    cases: 1456,
    area: "广州 · 天河",
    logo: "⚖️",
    lawyers: 85,
    founded: 2003,
  },
]
const lawyers = [
  {
    id: "1",
    name: "陈建国",
    title: "高级合伙人",
    spec: "劳动争议",
    exp: 15,
    rating: "4.9",
    firm: "金杜律师",
  },
  {
    id: "2",
    name: "李梦瑶",
    title: "资深律师",
    spec: "商业合同",
    exp: 10,
    rating: "4.8",
    firm: "锦天城",
  },
  {
    id: "3",
    name: "王强",
    title: "专业律师",
    spec: "企业合规",
    exp: 8,
    rating: "4.7",
    firm: "鹏程律师",
  },
]
const articles = [
  {
    title: "劳动法修订后，企业最容易忽略的三个节点",
    tag: "劳动用工",
    reads: "3,241",
    time: "2 天前",
  },
  {
    title: "中小企业合同风险管理完全指南",
    tag: "合同管理",
    reads: "2,189",
    time: "3 天前",
  },
  {
    title: "收到员工仲裁申请后，第一周应该做什么",
    tag: "争议处理",
    reads: "1,876",
    time: "5 天前",
  },
]

export default function Discover() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<"firms" | "lawyers" | "knowledge">("firms")
  const [spec, setSpec] = useState("全部")
  const shownLawyers =
    spec === "全部"
      ? lawyers
      : lawyers.filter((lawyer) => lawyer.spec.includes(spec))

  return (
    <div className="relative min-h-full overflow-hidden px-4 pb-6 pt-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          专业资源
        </h1>
      </header>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        精选律所、律师与企业经营所需的法律知识。
      </p>
      <CategoryTabs
        className="mt-5"
        variant="segmented"
        options={[
          { value: "firms", label: "律所" },
          { value: "lawyers", label: "律师" },
          { value: "knowledge", label: "知识" },
        ]}
        value={tab}
        onChange={(value) => setTab(value as "firms" | "lawyers" | "knowledge")}
      />
      {tab === "firms" && (
        <section className="mt-5">
          <div className="mb-3">
            <SectionHeader
              title="推荐律所"
              meta={`${firms.length} 家推荐`}
              action={
                <button
                  onClick={() => navigate("/law-firms")}
                  className="text-xs font-semibold text-primary"
                >
                  全部律所
                </button>
              }
            />
          </div>
          <div className="space-y-3">
            {firms.map((firm, index) => (
              <LawFirmCard
                key={firm.id}
                firm={firm}
                onClick={() => navigate(`/law-firm/${firm.id}`)}
                description={
                  index === 0
                    ? "企业法律服务与重大商事项目优先推荐"
                    : "覆盖企业经营、争议解决及专项法律服务"
                }
              />
            ))}
          </div>
        </section>
      )}
      {tab === "lawyers" && (
        <section className="mt-5">
          <CategoryTabs
            className="mb-3"
            options={["全部", "劳动", "商业", "企业"].map((item) => ({
              label: item,
              value: item,
            }))}
            value={spec}
            onChange={setSpec}
          />
          <div className="mb-3">
            <SectionHeader
              title="专业律师"
              meta={`${shownLawyers.length} 位可选`}
            />
          </div>
          <div className="space-y-3">
            {shownLawyers.map((lawyer) => (
              <article
                key={lawyer.id}
                className="app-card rounded-2xl bg-card p-3.5"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-sm font-bold text-primary">
                    {lawyer.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-foreground">
                          {lawyer.name}
                          <small className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                            {lawyer.title}
                          </small>
                        </h2>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {lawyer.firm} · {lawyer.exp} 年执业经验
                        </p>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-[#a56a00]">
                        ★ {lawyer.rating}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                      <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-medium text-primary">
                        {lawyer.spec}
                      </span>
                      <button
                        onClick={() => navigate(`/booking/${lawyer.id}`)}
                        className="pressable rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-white"
                      >
                        预约
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {tab === "knowledge" && (
        <section className="mt-5">
          <div className="mb-3">
            <SectionHeader
              title="精选法律知识"
              meta={`${articles.length} 篇内容`}
            />
          </div>
          <div className="space-y-3">
            {articles.map((article, index) => (
              <button
                key={article.title}
                onClick={() => navigate("/chat/ai")}
                className="pressable app-card flex w-full gap-3 rounded-2xl bg-card p-3.5 text-left"
              >
                <span className="grid h-10 w-8 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-bold text-primary">
                  0{index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <i className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium not-italic text-primary">
                    {article.tag}
                  </i>
                  <strong className="mt-2 block pr-2 text-sm leading-relaxed text-foreground">
                    {article.title}
                  </strong>
                  <small className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{article.reads} 阅读</span>
                    <i className="h-3 w-px bg-border" />
                    <span>{article.time}</span>
                    <Icon
                      name="chevron"
                      className="ml-auto h-3.5 w-3.5 text-muted-foreground"
                    />
                  </small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
