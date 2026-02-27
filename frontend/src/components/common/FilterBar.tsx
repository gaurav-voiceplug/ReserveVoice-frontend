import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
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
                className={`h-9 px-3 min-w-[120px] rounded-full text-sm flex items-center justify-between gap-1.5 border shadow-sm transition-all duration-200 ${values.length > 0 ? 'bg-primary/10 border-primary/30 text-primary font-semibold' : 'bg-[#f3f4f8] border-transparent text-[#0e101b]'}`}
            >
                <span>{label}{values.length > 0 ? ` (${values.length})` : ''}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#505795] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute top-10 left-0 z-50 bg-white border border-[#e8e9f3] rounded-xl shadow-lg min-w-[160px] py-1">
                    {options.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm text-[#0e101b]">
                            <input
                                type="checkbox"
                                checked={values.includes(opt.value)}
                                onChange={() => toggle(opt.value)}
                                className="w-4 h-4 rounded border-gray-300 accent-primary"
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
    locationIds?: string[];
    onLocationChange?: (ids: string[]) => void;
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
    locationIds,
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
        <div className="flex flex-col gap-4 bg-white rounded-xl border border-[#e8e9f3] p-4 mb-2">

            {/* Tabs row — only rendered if tabs are provided */}
            {tabs && tabs.length > 0 && (
                <div className="flex gap-8 border-b border-[#e8e9f3]">
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
                <div className="flex gap-3 flex-wrap items-center">
                    {loading ? (
                        <>
                            {onNameChange && <div className="h-9 w-44 bg-gray-200 rounded-lg animate-pulse" />}
                            {onStatusChange && <div className="h-9 w-28 bg-gray-200 rounded-full animate-pulse" />}
                            {onRoleChange && <div className="h-9 w-28 bg-gray-200 rounded-full animate-pulse" />}
                            {onDateRangeChange && <div className="h-9 w-40 bg-gray-200 rounded-full animate-pulse" />}
                            {onLocationChange && <div className="h-9 w-40 bg-gray-200 rounded-full animate-pulse" />}
                            {onPhoneChange && <div className="h-9 w-40 bg-gray-200 rounded-lg animate-pulse" />}
                            <div className="flex-1" />
                            {onClearAll && <div className="h-9 w-24 bg-gray-200 rounded-full animate-pulse" />}
                        </>
                    ) : (
                        <>
                            {/* Name search */}
                            {onNameChange !== undefined && (
                                <input
                                    value={name ?? ''}
                                    onChange={(e) => onNameChange(e.target.value)}
                                    placeholder="Search by name or email"
                                    className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm text-[#0e101b] min-w-[200px]"
                                />
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
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setCalOpen((s) => !s)}
                                        className="h-9 px-3 rounded-full bg-[#f3f4f8] text-sm text-[#0e101b] flex items-center gap-2 border border-transparent shadow-sm"
                                    >
                                        <CalendarIcon className="w-4 h-4 text-[#505075]" />
                                        <span className="text-sm font-medium">
                                            {tmpStart ? format(new Date(tmpStart), 'MMM d') : 'Start'}
                                            <span className="mx-2 text-gray-400">•</span>
                                            <span className="text-gray-600">{tmpEnd ? format(new Date(tmpEnd), 'MMM d') : 'End'}</span>
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
                                    value={locationIds ?? []}
                                    onChange={onLocationChange}
                                />
                            )}

                            {/* Phone filter */}
                            {onPhoneChange !== undefined && (
                                <input
                                    value={phoneNumber ?? ''}
                                    onChange={(e) => onPhoneChange(e.target.value)}
                                    placeholder="Phone number"
                                    className="h-9 px-3 rounded-lg border border-[#e8e9f3] bg-white text-sm text-[#0e101b]"
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
