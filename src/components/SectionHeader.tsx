import type { ReactNode } from "react"

type SectionHeaderProps = {
  action?: ReactNode
  eyebrow?: string
  meta?: ReactNode
  title: string
}

export default function SectionHeader({
  action,
  eyebrow,
  meta,
  title,
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold tracking-[.14em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2
          className={
            eyebrow
              ? "mt-1 text-base font-bold text-foreground"
              : "text-sm font-bold text-foreground"
          }
        >
          {title}
        </h2>
      </div>
      {(meta || action) && (
        <div className="flex shrink-0 items-center gap-3">
          {meta && (
            <span className="text-[11px] text-muted-foreground">{meta}</span>
          )}
          {action}
        </div>
      )}
    </div>
  )
}
