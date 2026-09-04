import { useNavigate } from "react-router"
import { useState } from "react"
import CategoryTabs from "../components/CategoryTabs"
import LawFirmCard from "../components/LawFirmCard"
import PageHeader from "../components/PageHeader"
import Icon from "../components/Icon"
import SectionHeader from "../components/SectionHeader"

const firms = [
  {
    id: "1",
    name: "北京金杜律师事务所",
    tag: "综合型",
    rating: 4.9,
    cases: 2841,
    logo: "⚖️",
    area: "北京·朝阳",
    lawyers: 320,
    founded: 1988,
  },
  {
    id: "2",
    name: "上海锦天城律师事务所",
    tag: "商业法务",
    rating: 4.8,
    cases: 1923,
    logo: "🏛️",
    area: "上海·浦东",
    lawyers: 210,
    founded: 1995,
  },
  {
    id: "3",
    name: "广州广强律师事务所",
    tag: "劳动纠纷",
    rating: 4.7,
    cases: 1456,
    logo: "⚖️",
    area: "广州·天河",
    lawyers: 85,
    founded: 2003,
  },
  {
    id: "4",
    name: "深圳鹏程律师事务所",
    tag: "企业合规",
    rating: 4.8,
    cases: 987,
    logo: "🏢",
    area: "深圳·南山",
    lawyers: 120,
    founded: 2001,
  },
  {
    id: "5",
    name: "成都天府律师事务所",
    tag: "民商事务",
    rating: 4.6,
    cases: 734,
    logo: "🏦",
    area: "成都·锦江",
    lawyers: 60,
    founded: 2008,
  },
]

const areas = ["全部", "北京", "上海", "广州", "深圳", "成都"]
const specs = ["全部", "综合型", "劳动纠纷", "商业法务", "企业合规"]

export default function LawFirms() {
  const navigate = useNavigate()
  const [area, setArea] = useState("全部")
  const [spec, setSpec] = useState("全部")
  const [query, setQuery] = useState("")
  const filtered = firms.filter(
    (firm) =>
      (area === "全部" || firm.area.startsWith(area)) &&
      (spec === "全部" || firm.tag === spec) &&
      `${firm.name}${firm.area}${firm.tag}`.includes(query.trim()),
  )

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="律所列表" />
      <main className="px-4 pb-6 pt-3">
        <div className="relative">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索律所、城市或业务领域"
            className="document-field w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c8afe8]"
          />
        </div>
        <section className="mt-5">
          <div className="flex items-center gap-2">
            <span className="w-7 text-[10px] font-bold tracking-wide text-primary">
              城市
            </span>
            <CategoryTabs
              className="min-w-0 flex-1"
              options={areas.map((item) => ({ label: item, value: item }))}
              value={area}
              onChange={setArea}
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-7 text-[10px] font-bold tracking-wide text-primary">
              领域
            </span>
            <CategoryTabs
              className="min-w-0 flex-1"
              options={specs.map((item) => ({ label: item, value: item }))}
              value={spec}
              onChange={setSpec}
            />
          </div>
        </section>
        <div className="mt-6">
          <SectionHeader title="推荐律所" meta={`${filtered.length} 家结果`} />
        </div>
        <section className="mt-3 space-y-3">
          {filtered.map((firm, index) => (
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
          {filtered.length === 0 && (
            <div className="py-14 text-center">
              <span className="grid mx-auto h-10 w-10 place-items-center rounded-2xl bg-secondary text-primary">
                <Icon name="search" className="h-4 w-4" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                未找到匹配律所
              </p>
              <button
                onClick={() => {
                  setArea("全部")
                  setSpec("全部")
                  setQuery("")
                }}
                className="mt-2 text-xs font-semibold text-primary"
              >
                清除筛选
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
