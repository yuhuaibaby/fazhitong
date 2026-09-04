import Icon from "./Icon"

type LawFirm = {
  area: string
  cases: number
  founded: number
  id: string
  lawyers: number
  logo: string
  name: string
  rating: number
  tag: string
}

type LawFirmCardProps = {
  description: string
  firm: LawFirm
  onClick: () => void
}

export default function LawFirmCard({
  description,
  firm,
  onClick,
}: LawFirmCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) =>
        (event.key === "Enter" || event.key === " ") && onClick()
      }
      className="pressable app-card cursor-pointer rounded-2xl bg-card p-4 text-left"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl">
          {firm.logo}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-foreground">
                {firm.name}
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {firm.area} · 成立于 {firm.founded} 年
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {firm.tag}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px]">
            <span className="font-semibold text-[#a56a00]">
              ★ {firm.rating}
            </span>
            <span className="text-muted-foreground">{firm.lawyers} 位律师</span>
            <span className="text-muted-foreground">
              {firm.cases.toLocaleString()} 案例
            </span>
            <Icon
              name="chevron"
              className="ml-auto h-3.5 w-3.5 text-muted-foreground"
            />
          </div>
        </div>
      </div>
      <p className="mt-3 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
        {description}
      </p>
    </article>
  )
}
