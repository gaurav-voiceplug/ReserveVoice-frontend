import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useState, type JSX } from 'react';
import CustomCalendar from './CustomCalendar';
import LocationFilter from './LocationFilter';

export type TabDef = {
    key: string;
    label: string;
    count: number;
    /** Badge classes when this tab is active (text + bg), e.g. 'text-[#2437e0] bg-[#eef2ff]' */
    badgeActiveClass: string;
};

interface FilterBarProps {
    tabs: TabDef[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    loading: boolean;
    dateStart: string | null;
    dateEnd: string | null;
    onDateRangeChange: (start: string | null, end: string | null) => void;
    locationIds: string[];
    onLocationChange: (ids: string[]) => void;
    phoneNumber: string;
    onPhoneChange: (phone: string) => void;
    onClearAll: () => void;
}

export default function FilterBar({
    tabs,
    activeTab,
    onTabChange,
    loading,
    dateStart,
    dateEnd,
    onDateRangeChange,
    locationIds,
    onLocationChange,
    phoneNumber,
    onPhoneChange,
    onClearAll,
}: FilterBarProps): JSX.Element {
    const [calOpen, setCalOpen] = useState(false);
    const [tmpStart, setTmpStart] = useState<string | null>(dateStart);
    const [tmpEnd, setTmpEnd] = useState<string | null>(dateEnd);

    // Sync calendar display when parent resets filter values (e.g. clear all)
    useEffect(() => { setTmpStart(dateStart); }, [dateStart]);
    useEffect(() => { setTmpEnd(dateEnd); }, [dateEnd]);

    return (
        <div className="flex flex-col gap-4 bg-white rounded-xl border border-[#e8e9f3] p-4 mb-2">
            {/* Tabs row */}
            <div className="flex gap-8 border-b border-[#e8e9f3]">
                {tabs.map((t) => {
                    const isActive = activeTab === t.key;
                    return (
                        <a
                            key={t.key}
                            href="#"
                            className={`flex items-center gap-1 border-b-2 px-0.5 pb-2 font-bold text-sm ${isActive ? 'border-primary text-[#2437e0]' : 'border-transparent text-[#505795]'}`}
                            onClick={(e) => { e.preventDefault(); onTabChange(t.key); }}
                        >
                            <span>{t.label}</span>
                            <span className={`ml-1 inline-flex items-center justify-center px-2 py-0 rounded-full text-sm font-bold ${t.badgeActiveClass}`}>
                                {t.count}
                            </span>
                        </a>
                    );
                })}
            </div>

            {/* Filters row */}
            <div className="flex gap-3 flex-wrap items-center">
                {loading ? (
                    <>
                        <div className="h-9 w-40 bg-gray-200 rounded-full animate-pulse" />
                        <div className="h-9 w-40 bg-gray-200 rounded-full animate-pulse" />
                        <div className="h-9 w-40 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex-1" />
                        <div className="h-9 w-24 bg-gray-200 rounded-full animate-pulse" />
                    </>
                ) : (
                    <>
                        {/* Date range picker */}
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

                        <LocationFilter
                            value={locationIds}
                            onChange={onLocationChange}
                        />

                        <input
                            value={phoneNumber}
                            onChange={(e) => onPhoneChange(e.target.value)}
                            placeholder="Phone number"
                            className="h-9 px-3 rounded-lg border border-[#e8e9f3] bg-white text-sm text-[#0e101b]"
                        />

                        <div className="flex-1" />

                        <button
                            className="text-blue-600 text-sm font-semibold underline-offset-2 hover:underline"
                            onClick={(e) => { e.preventDefault(); onClearAll(); }}
                        >
                            Clear All
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
