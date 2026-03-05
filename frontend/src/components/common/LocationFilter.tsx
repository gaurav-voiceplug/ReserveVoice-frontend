import { MapPin } from 'lucide-react';

const STORES = [
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
    value: string;
    onChange: (id: string) => void;
}

export default function LocationFilter({ value, onChange }: LocationFilterProps) {
    return (
        <div className="flex flex-col min-w-[240px]">
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-10 pr-10 rounded-lg text-slate-900 border border-slate-200 bg-slate-50 focus:ring-primary focus:border-primary h-11 text-sm appearance-none outline-none"
                >
                    <option value="">All Locations</option>
                    {STORES.map((store) => (
                        <option key={store._id} value={store._id}>{store.name}</option>
                    ))}
                </select>
                <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                </svg>
            </div>
        </div>
    );
}
