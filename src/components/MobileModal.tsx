import type { ReactNode } from "react"

type MobileModalProps = {
  children: ReactNode
  onClose: () => void
  open: boolean
  panelClassName: string
  variant?: "dialog" | "sheet"
}

export default function MobileModal({
  children,
  onClose,
  open,
  panelClassName,
  variant = "sheet",
}: MobileModalProps) {
  if (!open) return null

  const position =
    variant === "dialog" ? "items-center justify-center p-4" : "items-end"
  const motion = variant === "dialog" ? "dialog-in" : "sheet-in"

  return (
    <div
      className={`fixed inset-y-0 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 bg-[#28133f]/35 sheet-scrim-in ${position}`}
      onClick={onClose}
    >
      <section
        className={`${motion} ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  )
}
