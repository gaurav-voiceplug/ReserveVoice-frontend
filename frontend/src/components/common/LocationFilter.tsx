import { MapPin, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const LOCATION_STORES = [
    { _id: 'loc_1', name: 'Downtown Branch', city: 'New York' },
    { _id: 'loc_2', name: 'Midtown Outlet', city: 'New York' },
    { _id: 'loc_3', name: 'West Side Kitchen', city: 'Chicago' },
    { _id: 'loc_4', name: 'North Park Diner', city: 'Chicago' },
    { _id: 'loc_5', name: 'Sunset Bistro', city: 'Los Angeles' },
    { _id: 'loc_6', name: 'Hollywood Eats', city: 'Los Angeles' },
    { _id: 'loc_7', name: 'Harbor View', city: 'San Diego' },
    { _id: 'loc_8', name: 'Mission Hills Café', city: 'San Diego' },
    { _id: 'loc_9', name: 'Riverfront Lounge', city: 'Houston' },
    { _id: 'loc_10', name: 'Galleria Spot', city: 'Houston' },
];

interface LocationFilterProps {
    value: string[];
    onChange: (ids: string[]) => void;
}

export default function LocationFilter({ value, onChange }: LocationFilterProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = LOCATION_STORES.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const allSelected = value.length === 0 || value.length === LOCATION_STORES.length;

    const toggle = (id: string) => {
        if (value.includes(id)) onChange(value.filter((v) => v !== id));
        else onChange([...value, id]);
    };

    const toggleAll = () => {
        if (allSelected) onChange(LOCATION_STORES.map((s) => s._id));
        else onChange([]);
    };

    const label =
        value.length === 0 || value.length === LOCATION_STORES.length
            ? 'All Locations'
            : `${value.length} Location${value.length > 1 ? 's' : ''} selected`;

    return (
        <div ref={ref} className="relative min-w-[240px]">
            {/* Trigger — matches FAQLibrary select style */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full h-11 pl-10 pr-10 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm text-left appearance-none outline-none flex items-center transition-all focus:border-gray-400 focus:shadow-sm"
            >
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
                <span className="truncate">{label}</span>
                <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-12 left-0 z-50 w-[280px] bg-white border border-slate-200 rounded-lg shadow-lg py-2">
                    {/* Search */}
                    <div className="px-3 pb-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search locations..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* All Locations toggle */}
                    <label className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50 text-sm font-semibold text-slate-700 border-b border-slate-100">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="w-3.5 h-3.5 rounded border-gray-300 accent-primary"
                        />
                        All Locations
                    </label>

                    {/* Location list */}
                    <div className="max-h-52 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#d1d3e6_transparent]">
                        {filtered.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-slate-400">No locations found</p>
                        ) : (
                            filtered.map((store) => (
                                <label
                                    key={store._id}
                                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50 text-sm text-slate-700"
                                >
                                    <input
                                        type="checkbox"
                                        checked={value.includes(store._id)}
                                        onChange={() => toggle(store._id)}
                                        className="w-3.5 h-3.5 rounded border-gray-300 accent-primary"
                                    />
                                    <span className="truncate">{store.name}</span>
                                    <span className="ml-auto text-xs text-slate-400 flex-shrink-0">{store.city}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
