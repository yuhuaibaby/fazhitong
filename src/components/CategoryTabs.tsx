type CategoryOption = {
  label: string
  value: string
}

type CategoryTabsProps = {
  className?: string
  onChange: (value: string) => void
  options: CategoryOption[]
  value: string
  variant?: "pills" | "segmented"
}

export default function CategoryTabs({
  className = "",
  onChange,
  options,
  value,
  variant = "pills",
}: CategoryTabsProps) {
  if (variant === "segmented") {
    return (
      <div
        role="tablist"
        className={`flex w-full border-b border-border ${className}`}
      >
        {options.map((option) => {
          const active = value === option.value
          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              className={`pressable -mb-px min-w-0 flex-1 border-b-2 px-2 py-3 text-sm font-semibold transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              <span className="block truncate">{option.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      role="tablist"
      className={`scrollbar-hidden flex gap-2 overflow-x-auto py-1 ${className}`}
    >
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`pressable shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? "border-primary bg-primary text-white shadow-[0_2px_7px_rgba(91,33,182,.18)]"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
