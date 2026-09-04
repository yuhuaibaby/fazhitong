import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

const DATE_PICKER_OPEN_EVENT = "aitestlink:date-picker-open";
const DAY_MS = 24 * 60 * 60 * 1000;
const MENU_WIDTH = 320;
const MENU_ESTIMATED_HEIGHT = 306;
const VIEWPORT_GAP = 12;
const MENU_GAP = 6;

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildMonthDays(viewDate: Date) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const start = new Date(first.getTime() - first.getDay() * DAY_MS);
  return Array.from({ length: 42 }, (_, index) => new Date(start.getTime() + index * DAY_MS));
}

export function DatePicker({ value, onChange, placeholder = "请选择日期", disabled = false }: DatePickerProps) {
  const selectedDate = parseDateValue(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`date-picker-${Math.random().toString(36).slice(2)}`);
  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => buildMonthDays(viewDate), [viewDate]);

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [value]);

  useEffect(() => {
    const closeOtherPickers = (event: Event) => {
      const currentId = (event as CustomEvent<string>).detail;
      if (currentId !== idRef.current) setOpen(false);
    };
    window.addEventListener(DATE_PICKER_OPEN_EVENT, closeOtherPickers);
    return () => window.removeEventListener(DATE_PICKER_OPEN_EVENT, closeOtherPickers);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(MENU_WIDTH, window.innerWidth - VIEWPORT_GAP * 2);
      const left = Math.min(Math.max(VIEWPORT_GAP, rect.left), window.innerWidth - width - VIEWPORT_GAP);
      const menuHeight = menuRef.current?.offsetHeight || MENU_ESTIMATED_HEIGHT;
      const belowSpace = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_GAP;
      const aboveSpace = rect.top - MENU_GAP - VIEWPORT_GAP;
      const nextPlacement = belowSpace >= menuHeight || belowSpace >= aboveSpace ? "bottom" : "top";
      const availableHeight = Math.max(160, nextPlacement === "bottom" ? belowSpace : aboveSpace);
      const top = nextPlacement === "bottom" ? rect.bottom + MENU_GAP : rect.top - Math.min(menuHeight, availableHeight) - MENU_GAP;

      setPlacement(nextPlacement);
      setMenuStyle({
        left,
        top: Math.max(VIEWPORT_GAP, top),
        width,
        maxHeight: Math.min(menuHeight, availableHeight),
      });
    };

    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("click", close, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("click", close, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const displayValue = value || placeholder;

  const menu = open ? createPortal(
    <div className={`date-picker__menu date-picker__menu--${placement}`} ref={menuRef} style={menuStyle} onClick={(event) => event.stopPropagation()}>
      <div className="date-picker__head">
        <button className="date-picker__nav-button" type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} title="上个月">
          <ChevronLeft size={16} />
        </button>
        <strong>{viewDate.getFullYear()}年{pad(viewDate.getMonth() + 1)}月</strong>
        <button className="date-picker__nav-button" type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} title="下个月">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="date-picker__week">
        {["日", "一", "二", "三", "四", "五", "六"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="date-picker__grid">
        {days.map((day) => {
          const inMonth = day.getMonth() === viewDate.getMonth();
          const selected = selectedDate ? sameDay(day, selectedDate) : false;
          const isToday = sameDay(day, today);
          return (
            <button
              key={toDateValue(day)}
              className={[
                "date-picker__day",
                inMonth ? "" : "date-picker__day--muted",
                selected ? "date-picker__day--selected" : "",
                isToday ? "date-picker__day--today" : "",
              ].filter(Boolean).join(" ")}
              type="button"
              onClick={() => {
                onChange(toDateValue(day));
                setOpen(false);
              }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      <div className="date-picker__footer">
        <button className="date-picker__text-button" type="button" onClick={() => onChange("")}>清除</button>
        <button
          className="date-picker__text-button"
          type="button"
          onClick={() => {
            const next = new Date();
            onChange(toDateValue(next));
            setViewDate(next);
            setOpen(false);
          }}
        >
          今天
        </button>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="date-picker" ref={rootRef}>
      <button
        className={open ? "date-picker__trigger date-picker__trigger--open" : "date-picker__trigger"}
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) return;
          setOpen((current) => {
            if (!current) window.dispatchEvent(new CustomEvent(DATE_PICKER_OPEN_EVENT, { detail: idRef.current }));
            return !current;
          });
        }}
      >
        <span className={value ? "date-picker__value" : "date-picker__placeholder"}>{displayValue}</span>
        <span className="date-picker__actions">
          {value ? (
            <span
              className="date-picker__clear"
              role="button"
              tabIndex={-1}
              title="清除"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
              }}
            >
              <X size={14} />
            </span>
          ) : null}
          <Calendar size={16} className="date-picker__icon" />
        </span>
      </button>
      {menu}
    </div>
  );
}
