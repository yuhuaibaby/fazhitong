import type { ReactNode } from "react"

export type IconName = "home" | "compass" | "message" | "user" | "search" | "bell" | "scan" | "document" | "scale" | "briefcase" | "shield" | "chevron" | "spark" | "building" | "clock" | "check" | "folder" | "phone" | "video" | "task-inbox" | "in-progress" | "completed-file" | "feedback"

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" />
    </>
  ),
  message: (
    <path d="M20 11.5a7.5 7.5 0 0 1-8 7.48 8.7 8.7 0 0 1-3.3-.65L4 20l1.32-3.55A7.43 7.43 0 0 1 4 12a8 8 0 0 1 16-.5Z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m16 16 4.2 4.2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M7 12h10" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M8 13h8M8 17h6" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18M5 6h14M4 6l-2 6h5L4 6Zm16 0-3 6h5l-2-6ZM8 21h8" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  spark: (
    <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
  ),
  building: (
    <>
      <path d="M4 21h16M6 21V5l6-2v18M18 21V9l-6-2M9 7h1M9 11h1M9 15h1M14 11h1M14 15h1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  folder: (
    <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  ),
  phone: (
    <path d="M8.2 3.7 5.5 5.1c-1 .5-.9 3.1.5 5.9 1.6 3.2 4.8 6.4 8 7.9 2.8 1.4 5.3 1.5 5.9.5l1.4-2.7-3.8-2.3-1.7 1.6c-1.5-.7-3.3-2.5-4-4l1.6-1.7-2.3-3.8Z" />
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </>
  ),
  "task-inbox": (
    <>
      <path d="M4 5.5h16v12.8A2.7 2.7 0 0 1 17.3 21H6.7A2.7 2.7 0 0 1 4 18.3V5.5Z" />
      <path d="M4 14h4l1.6 2h4.8l1.6-2h4M8 5.5V3.8h8v1.7" />
    </>
  ),
  "in-progress": (
    <>
      <path d="M19.2 8.1A8 8 0 1 0 20 13" />
      <path d="M19.2 4.8v3.3h-3.3M12 8v4.5l2.9 1.8" />
    </>
  ),
  "completed-file": (
    <>
      <path d="M6.2 3.5h7.4l4.2 4.2v12.1a1.7 1.7 0 0 1-1.7 1.7H6.2a1.7 1.7 0 0 1-1.7-1.7V5.2a1.7 1.7 0 0 1 1.7-1.7Z" />
      <path d="M13.6 3.5v4.2h4.2M8.2 14l2.2 2.2 4.6-4.6" />
    </>
  ),
  feedback: (
    <>
      <path d="M20 11.2a7.8 7.8 0 0 1-8 7.6 9 9 0 0 1-3.1-.6L4 20l1.4-3.6A7.5 7.5 0 0 1 4.2 12 7.8 7.8 0 0 1 12 4.2a7.8 7.8 0 0 1 8 7Z" />
      <path d="m12 8 .9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3L12 8Z" />
    </>
  ),
}

export default function Icon({
  name,
  className = "w-5 h-5",
  filled = false,
}: {
  name: IconName
  className?: string
  filled?: boolean
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
