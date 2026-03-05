import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, Download, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState, type JSX } from 'react';
import CustomCalendar from './CustomCalendar';
import LocationFilter from './LocationFilter';

type SelectOption = { value: string; label: string };

function MultiSelectFilter({ label, options, values, onChange }: {
    label: string;
    options: SelectOption[];
    values: string[];
    onChange: (values: string[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggle = (val: string) =>
        onChange(values.includes(val) ? values.filter((v) => v !== val) : [...values, val]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className={`h-11 px-3 min-w-[240px] rounded-lg text-sm flex items-center justify-between gap-1.5 border transition-all duration-200 ${values.length > 0 ? 'bg-primary/10 border-primary/30 text-primary font-semibold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
            >
                <span>{label}{values.length > 0 ? ` (${values.length})` : ''}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute top-12 left-0 z-50 bg-white border border-slate-200 rounded-sm shadow-lg min-w-[240px] py-1">
                    {options.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm text-[#0e101b]">
                            <input
                                type="checkbox"
                                checked={values.includes(opt.value)}
                                onChange={() => toggle(opt.value)}
                                className="w-3.5 h-3.5 rounded border-gray-300 accent-primary"
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

export type TabDef = {
    key: string;
    label: string;
    count: number;
    /** Badge classes when this tab is active (text + bg), e.g. 'text-[#2437e0] bg-[#eef2ff]' */
    badgeActiveClass: string;
};

interface FilterBarProps {
    /** Tabs row — omit entirely if no tabs needed */
    tabs?: TabDef[];
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    loading?: boolean;
    /** Date range filter — omit if not needed */
    dateStart?: string | null;
    dateEnd?: string | null;
    onDateRangeChange?: (start: string | null, end: string | null) => void;
    /** Location filter — omit if not needed */
    locationId?: string;
    onLocationChange?: (id: string) => void;
    /** Phone filter — omit if not needed */
    phoneNumber?: string;
    onPhoneChange?: (phone: string) => void;
    /** Name search filter — omit if not needed */
    name?: string;
    onNameChange?: (name: string) => void;
    /** Status multiselect — omit if not needed */
    statusValues?: string[];
    onStatusChange?: (values: string[]) => void;
    statusOptions?: SelectOption[];
    /** Role multiselect — omit if not needed */
    roleValues?: string[];
    onRoleChange?: (values: string[]) => void;
    roleOptions?: SelectOption[];
    /** Clear All button — omit if not needed */
    onClearAll?: () => void;
}

export default function FilterBar({
    tabs,
    activeTab,
    onTabChange,
    loading = false,
    dateStart,
    dateEnd,
    onDateRangeChange,
    locationId,
    onLocationChange,
    phoneNumber,
    onPhoneChange,
    name,
    onNameChange,
    statusValues,
    onStatusChange,
    statusOptions,
    roleValues,
    onRoleChange,
    roleOptions,
    onClearAll,
}: FilterBarProps): JSX.Element {
    const [calOpen, setCalOpen] = useState(false);
    const [tmpStart, setTmpStart] = useState<string | null>(dateStart ?? null);
    const [tmpEnd, setTmpEnd] = useState<string | null>(dateEnd ?? null);

    useEffect(() => { setTmpStart(dateStart ?? null); }, [dateStart]);
    useEffect(() => { setTmpEnd(dateEnd ?? null); }, [dateEnd]);

    const hasFilters = !!(onDateRangeChange || onLocationChange || onPhoneChange || onNameChange || onStatusChange || onRoleChange || onClearAll);

    return (
        <div className="flex flex-col gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">

            {/* Tabs row — only rendered if tabs are provided */}
            {tabs && tabs.length > 0 && (
                <div className="flex gap-8 border-b border-slate-200">
                    {tabs.map((t) => {
                        const isActive = activeTab === t.key;
                        return (
                            <a
                                key={t.key}
                                href="#"
                                className={`flex items-center gap-1 border-b-2 px-0.5 pb-2 font-bold text-sm transition-all duration-200 ${isActive ? 'border-primary text-[#2437e0]' : 'border-transparent text-[#505795]'}`}
                                onClick={(e) => { e.preventDefault(); onTabChange?.(t.key); }}
                            >
                                <span>{t.label}</span>
                                <span className={`ml-1 inline-flex items-center justify-center px-2 py-0 rounded-full text-sm font-bold ${t.badgeActiveClass}`}>
                                    {t.count}
                                </span>
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Filters row — only rendered if at least one filter is present */}
            {hasFilters && (
                <div className="flex gap-4 flex-wrap items-center">
                    {loading ? (
                        <>
                            {onNameChange && <div className="h-11 w-64 bg-gray-200 rounded-lg animate-pulse" />}
                            {onStatusChange && <div className="h-11 w-40 bg-gray-200 rounded-lg animate-pulse" />}
                            {onRoleChange && <div className="h-11 w-36 bg-gray-200 rounded-lg animate-pulse" />}
                            {onDateRangeChange && <div className="h-11 w-40 bg-gray-200 rounded-lg animate-pulse" />}
                            {onLocationChange && <div className="h-11 w-[240px] bg-gray-200 rounded-lg animate-pulse" />}
                            {onPhoneChange && <div className="h-11 w-40 bg-gray-200 rounded-lg animate-pulse" />}
                            <div className="flex-1" />
                            {onClearAll && <div className="h-9 w-24 bg-gray-200 rounded-full animate-pulse" />}
                        </>
                    ) : (
                        <>
                            {/* Name search */}
                            {onNameChange !== undefined && (
                                <div className="relative flex-1 min-w-[260px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
                                    <input
                                        value={name ?? ''}
                                        onChange={(e) => onNameChange(e.target.value)}
                                        placeholder="Search by name or email"
                                        className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:ring-primary focus:border-primary outline-none placeholder:text-slate-400"
                                    />
                                </div>
                            )}

                            {/* Status multiselect */}
                            {onStatusChange !== undefined && statusOptions && (
                                <MultiSelectFilter
                                    label="Status"
                                    options={statusOptions}
                                    values={statusValues ?? []}
                                    onChange={onStatusChange}
                                />
                            )}

                            {/* Role multiselect */}
                            {onRoleChange !== undefined && roleOptions && (
                                <MultiSelectFilter
                                    label="Role"
                                    options={roleOptions}
                                    values={roleValues ?? []}
                                    onChange={onRoleChange}
                                />
                            )}

                            {/* Date range picker */}
                            {onDateRangeChange !== undefined && (
                                <div className="relative min-w-[180px]">
                                    <button
                                        type="button"
                                        onClick={() => setCalOpen((s) => !s)}
                                        className="h-11 px-3 min-w-[240px] rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 flex items-center gap-2"
                                    >
                                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-medium">
                                            {tmpStart ? format(new Date(tmpStart), 'MMM d') : 'Start'}
                                            <span className="mx-2 text-slate-400">•</span>
                                            <span className="text-slate-600">{tmpEnd ? format(new Date(tmpEnd), 'MMM d') : 'End'}</span>
                                        </span>
                                    </button>
                                    {calOpen && (
                                        <CustomCalendar
                                            startIso={tmpStart}
                                            endIso={tmpEnd}
                                            onSelect={(s, e) => {
                                                setTmpStart(s);
                                                setTmpEnd(e);
                                                onDateRangeChange(s, e);
                                                setCalOpen(false);
                                            }}
                                            onClose={() => setCalOpen(false)}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Location filter */}
                            {onLocationChange !== undefined && (
                                <LocationFilter
                                    value={locationId ?? ''}
                                    onChange={onLocationChange}
                                />
                            )}

                            {/* Phone filter */}
                            {onPhoneChange !== undefined && (
                                <input
                                    value={phoneNumber ?? ''}
                                    onChange={(e) => onPhoneChange(e.target.value)}
                                    placeholder="Phone number"
                                    className="h-11 min-w-[240px] px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                />
                            )}

                            <div className="flex-1" />

                            {/* Clear All */}
                            {onClearAll !== undefined && (
                                <button
                                    className="text-blue-600 text-sm font-semibold underline-offset-2 hover:underline"
                                    onClick={(e) => { e.preventDefault(); onClearAll(); }}
                                >
                                    Clear All
                                </button>
                            )}

                            {/* View action icons */}
                            <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                                <button className="p-2 text-slate-500 hover:text-primary transition-colors rounded-md hover:bg-slate-100">
                                    <SlidersHorizontal className="w-[22px] h-[22px]" />
                                </button>
                                <button className="p-2 text-slate-500 hover:text-primary transition-colors rounded-md hover:bg-slate-100">
                                    <Download className="w-[22px] h-[22px]" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
