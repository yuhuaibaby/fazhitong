import { useNavigate } from "react-router";
import Icon from "./Icon";

interface Props {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
}

export default function PageHeader({ title, right, onBack }: Props) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 bg-background/95 px-4 pb-3.5 pt-8 backdrop-blur-xl">
      <button aria-label="返回上一页" onClick={onBack ?? (() => navigate(-1))} className="pressable w-9 h-9 flex items-center justify-center rounded-full bg-[#f3eff8] text-[#5b21b6]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h1 className="flex-1 text-[17px] font-bold tracking-[.01em] text-foreground">{title}</h1>
      {right}
    </div>
  );
}
