import { useRef, useState } from "react"
import { useNavigate } from "react-router"
import PageHeader from "../components/PageHeader"
import Icon from "../components/Icon"
import MobileModal from "../components/MobileModal"

const steps = [
  "正在读取文件结构",
  "正在识别关键条款",
  "正在评估潜在风险",
  "正在生成审查建议",
]
const reviewRecords = [
  {
    id: "CR-2024-036",
    name: "供应商服务合同_2024.pdf",
    risk: "中风险",
    score: 72,
    date: "今天 09:42",
  },
  {
    id: "CR-2024-035",
    name: "办公场地租赁合同.docx",
    risk: "低风险",
    score: 91,
    date: "昨天 16:08",
  },
  {
    id: "CR-2024-034",
    name: "品牌合作协议.pdf",
    risk: "高风险",
    score: 58,
    date: "2024-01-15",
  },
]

export default function ContractReview() {
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const [newReviewOpen, setNewReviewOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<"list" | "processing">("list")
  const [step, setStep] = useState(0)

  const selectFile = (file?: File) => {
    if (!file) return
    setSelectedFile(file)
  }

  const startReview = () => {
    if (!selectedFile) return
    setNewReviewOpen(false)
    setPhase("processing")
    setStep(0)
    let current = 0
    const timer = window.setInterval(() => {
      current += 1
      setStep(current)
      if (current === steps.length) {
        window.clearInterval(timer)
        window.setTimeout(() => navigate("/contract-result"), 420)
      }
    }, 820)
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="合同审查"
        onBack={() => navigate("/")}
        right={
          phase === "list" ? (
            <button
              onClick={() => setNewReviewOpen(true)}
              className="pressable rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              + 新建审查
            </button>
          ) : undefined
        }
      />

      {phase === "list" && (
        <main className="px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              查看合同审查进度与风险报告
            </p>
            <span className="text-[11px] text-muted-foreground">
              共 {reviewRecords.length} 份
            </span>
          </div>
          <section className="mt-5 app-card overflow-hidden rounded-2xl bg-card">
            {reviewRecords.map((record, index) => (
              <button
                key={record.id}
                onClick={() => navigate("/contract-result")}
                className={`pressable flex w-full items-center gap-3 px-4 py-4 text-left ${
                  index < reviewRecords.length - 1
                    ? "border-b border-border"
                    : ""
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon name="document" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="truncate block text-sm text-foreground">
                    {record.name}
                  </strong>
                  <small className="mt-1 block text-[11px] text-muted-foreground">
                    {record.id} · {record.date}
                  </small>
                  <small className="mt-1 block text-[10px] text-primary">
                    AI 已提炼风险条款与审查摘要
                  </small>
                </span>
                <span className="shrink-0 text-right">
                  <b
                    className={`inline-block rounded-md px-2 py-1 text-[10px] font-medium ${
                      record.risk === "低风险"
                        ? "bg-[#e9f8f0] text-[#16845b]"
                        : record.risk === "高风险"
                          ? "bg-[#fff0f0] text-[#c44444]"
                          : "bg-[#fff5df] text-[#9a6503]"
                    }`}
                  >
                    {record.risk}
                  </b>
                  <small className="mt-1 block text-[11px] font-semibold text-foreground">
                    {record.score} 分
                  </small>
                </span>
                <Icon
                  name="chevron"
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
              </button>
            ))}
          </section>
        </main>
      )}

      {phase === "processing" && (
        <main className="flex min-h-[66dvh] flex-col items-center justify-center px-7 pb-16 text-center">
          <div className="relative grid h-44 w-44 place-items-center">
            <span className="review-orbit review-orbit-outer" />
            <span className="review-orbit review-orbit-inner" />
            <span className="review-scan grid h-20 w-20 place-items-center rounded-[28px] bg-secondary text-primary shadow-[0_14px_30px_rgba(91,33,182,.12)]">
              <Icon name="scan" className="h-9 w-9" />
            </span>
          </div>
          <h2 className="mt-2 text-lg font-bold text-foreground">
            正在审查合同
          </h2>
          <p className="mt-2 max-w-[260px] truncate text-xs text-muted-foreground">
            {selectedFile?.name}
          </p>
          <div className="mt-8 w-full max-w-[280px]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-foreground">
                {step >= steps.length ? "审查完成，正在生成报告" : steps[step]}
              </span>
              <span className="text-primary">
                {Math.min(step + 1, steps.length)}/{steps.length}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <span
                className="review-progress block h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(((step + 1) / steps.length) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
          <p className="mt-5 text-[11px] text-muted-foreground">
            AI 正在比对合同条款与常见风险规则；报告生成后将自动打开
          </p>
        </main>
      )}

      <MobileModal
        open={newReviewOpen}
        onClose={() => setNewReviewOpen(false)}
        panelClassName="w-full rounded-t-[26px] bg-card px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_50px_rgba(40,19,63,.18)]"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-border" />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h2 className="mt-1 text-lg font-bold text-foreground">
              新建合同审查
            </h2>
          </div>
          <button
            aria-label="关闭"
            onClick={() => setNewReviewOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted text-lg leading-none text-muted-foreground"
          >
            ×
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          className="hidden"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
        <button
          onClick={() => fileInput.current?.click()}
          className={`pressable mt-5 flex w-full flex-col items-center rounded-2xl border border-dashed px-4 py-6 ${
            selectedFile
              ? "border-[#c8afe8] bg-[#faf8ff]"
              : "border-[#d8c7f2] bg-[#fcfbff]"
          }`}
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
            <Icon
              name={selectedFile ? "check" : "document"}
              className="h-5 w-5"
            />
          </span>
          <strong className="mt-3 max-w-full truncate text-sm text-foreground">
            {selectedFile ? selectedFile.name : "选择合同文件"}
          </strong>
          <small className="mt-1 text-[11px] text-muted-foreground">
            {selectedFile
              ? `${Math.max(1, Math.ceil(selectedFile.size / 1024))} KB · 点击重新选择`
              : "支持 PDF、Word 和图片格式"}
          </small>
        </button>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraInput.current?.click()}
            className="pressable flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-xs font-semibold text-primary"
          >
            <Icon name="scan" className="h-4 w-4" />
            拍照上传
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="pressable flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-xs font-semibold text-primary"
          >
            <Icon name="folder" className="h-4 w-4" />
            文件上传
          </button>
        </div>
        <button
          disabled={!selectedFile}
          onClick={startReview}
          className="pressable mt-4 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          开始智能审查
        </button>
      </MobileModal>
    </div>
  )
}
