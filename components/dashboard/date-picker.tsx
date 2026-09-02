"use client"

import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/i18n"

type DatePickerProps = {
  value: string
  min?: string
  max?: string
  id?: string
  name?: string
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"]

function parseDateValue(value: string, fallback = new Date()) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return new Date(fallback.getFullYear(), fallback.getMonth(), 1)
  return new Date(year, month - 1, day)
}

function formatDateValue(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-")
}

function monthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth()
}

export function DatePicker({ value, min, max, id, name, onChange, ariaLabel, className }: DatePickerProps) {
  const { t } = useLocale()
  const [open, setOpen] = React.useState(false)
  const [displayedMonth, setDisplayedMonth] = React.useState(() => parseDateValue(value))
  const selectedDate = value ? parseDateValue(value) : undefined
  const minimumDate = min ? parseDateValue(min) : undefined
  const maximumDate = max ? parseDateValue(max) : undefined

  const days = React.useMemo(() => {
    const firstDay = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1)
    const leadingDays = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0).getDate()
    return Array.from({ length: 42 }, (_, index) => {
      const dayNumber = index - leadingDays + 1
      return dayNumber > 0 && dayNumber <= daysInMonth
        ? new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), dayNumber)
        : undefined
    })
  }, [displayedMonth])

  const canGoPrevious = minimumDate ? monthKey(displayedMonth) > monthKey(minimumDate) : true
  const canGoNext = maximumDate ? monthKey(displayedMonth) < monthKey(maximumDate) : true
  const firstYear = minimumDate?.getFullYear() ?? new Date().getFullYear() - 10
  const lastYear = maximumDate?.getFullYear() ?? new Date().getFullYear() + 10
  const years = Array.from({ length: Math.max(1, lastYear - firstYear + 1) }, (_, index) => firstYear + index)
  const displayLabel = selectedDate
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(selectedDate)
    : t("common.selectDate")

  return (
    <Popover open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (nextOpen) setDisplayedMonth(parseDateValue(value)); }}>
      <PopoverTrigger
        aria-label={ariaLabel}
        render={
          <button
            type="button"
            id={id}
            className={cn(
              "flex h-8 items-center justify-between gap-2 rounded-full border border-border bg-card px-3 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20",
              className
            )}
          />
        }
      >
        <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate">{displayLabel}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[18rem] rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <p className="text-[13px] font-medium">
              {new Intl.DateTimeFormat(undefined, { month: "long" }).format(displayedMonth)}
            </p>
            <Select
              value={String(displayedMonth.getFullYear())}
              onValueChange={(year) => {
                if (year) setDisplayedMonth(new Date(Number(year), displayedMonth.getMonth(), 1))
              }}
            >
              <SelectTrigger size="sm" className="h-7 w-[5.75rem] rounded-full border-border bg-muted/40 px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t("common.previousMonth")}
              disabled={!canGoPrevious}
              onClick={() => setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1))}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label={t("common.nextMonth")}
              disabled={!canGoNext}
              onClick={() => setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1))}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
          {WEEKDAYS.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dateValue = day ? formatDateValue(day) : ""
            const disabled = !day || (min ? dateValue < min : false) || (max ? dateValue > max : false)
            const selected = dateValue === value
            const today = day && dateValue === formatDateValue(new Date())

            return (
              <button
                type="button"
                key={day ? dateValue : `empty-${index}`}
                disabled={disabled}
                onClick={() => {
                  if (!day || disabled) return
                  onChange(dateValue)
                  setOpen(false)
                }}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-full text-[11px] transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-0",
                  selected && "bg-muted font-medium text-foreground",
                  today && !selected && "ring-1 ring-inset ring-foreground/25"
                )}
              >
                {day?.getDate()}
              </button>
            )
          })}
        </div>
      </PopoverContent>
      {name && <input type="hidden" name={name} value={value} />}
    </Popover>
  )
}
