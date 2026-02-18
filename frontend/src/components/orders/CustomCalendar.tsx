import { useEffect, useState } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isAfter,
  isBefore
} from 'date-fns';

type Props = {
  startIso?: string | null;
  endIso?: string | null;
  onSelect: (startIso: string | null, endIso: string | null) => void;
  onClose: () => void;
};

export default function CustomCalendar({ startIso, endIso, onSelect, onClose }: Props) {
  const parseIso = (s?: string | null) => (s ? new Date(s) : null);
  const [currentMonth, setCurrentMonth] = useState<Date>(parseIso(startIso) ?? new Date());
  const [selStart, setSelStart] = useState<Date | null>(parseIso(startIso));
  const [selEnd, setSelEnd] = useState<Date | null>(parseIso(endIso));

  useEffect(() => {
    setSelStart(parseIso(startIso));
    setSelEnd(parseIso(endIso));
    if (startIso) setCurrentMonth(parseIso(startIso) as Date);
  }, [startIso, endIso]);

  const getCalendarDates = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const days: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  };

  const onDayClick = (d: Date) => {
    // simple range selection: first click = start, second = end (swap if needed)
    if (!selStart || (selStart && selEnd)) {
      setSelStart(d);
      setSelEnd(null);
      return;
    }
    // second click
    if (isAfter(selStart, d)) {
      setSelEnd(selStart);
      setSelStart(d);
    } else {
      setSelEnd(d);
    }
  };

  const isInRange = (d: Date) => {
    if (!selStart) return false;
    if (!selEnd) return isSameDay(selStart, d);
    return (isAfter(d, selStart) || isSameDay(d, selStart)) && (isBefore(d, selEnd) || isSameDay(d, selEnd));
  };

  const handleDone = () => {
    const s = selStart ? selStart.toISOString().slice(0, 10) : null;
    const e = selEnd ? selEnd.toISOString().slice(0, 10) : null;
    onSelect(s, e);
    onClose();
  };

  const handleClear = () => {
    setSelStart(null);
    setSelEnd(null);
    onSelect(null, null);
    onClose();
  };

  return (
    <div className="absolute z-50 mt-2 w-[300px] bg-white border border-[#e8e9f3] rounded-lg shadow-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1">‹</button>
        <div className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</div>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-center text-slate-400 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {getCalendarDates().map((d, i) => {
          const isCurrentMonth = isSameMonth(d, currentMonth);
          const selected = isInRange(d);
          const isStart = selStart && isSameDay(selStart, d);
          const isEnd = selEnd && isSameDay(selEnd, d);

          let cls = 'h-8 rounded-md';
          if (selected && isStart && isEnd) cls += ' bg-blue-700 text-white';
          else if (isStart) cls += ' bg-blue-700 text-white rounded-l-md';
          else if (isEnd) cls += ' bg-blue-700 text-white rounded-r-md';
          else if (selected) cls += ' bg-blue-50 text-blue-700';
          else if (!isCurrentMonth) cls += ' text-slate-300';
          else cls += ' hover:bg-blue-50';

          return (
            <button key={i} onClick={() => onDayClick(d)} className={`${cls} w-full`}>
              {String(d.getDate())}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3">
        <button className="text-sm text-blue-700" onClick={handleClear}>Clear</button>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={onClose}>Close</button>
          <button className="px-3 py-1 bg-blue-700 text-white rounded text-sm" onClick={handleDone}>Done</button>
        </div>
      </div>
    </div>
  );
}
