import { MapPinPlus } from 'lucide-react';
import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { type Column } from '../common/DataTable';
import FilterBar from '../common/FilterBar';
import PageHeader from '../common/PageHeader';

type Location = {
    id: string;
    name: string;
    city: string;
    status: 'active' | 'inactive';
    phone: string;
};

const STATUS_CHIP: Record<Location['status'], { label: string; text: string; bg: string; dot: string }> = {
    active:   { label: 'Active',   text: 'text-[#0b875b]', bg: 'bg-[#ecfdf3]', dot: 'bg-[#0b875b]' },
    inactive: { label: 'Inactive', text: 'text-slate-500',  bg: 'bg-slate-100', dot: 'bg-slate-400'  },
};

const DUMMY_LOCATIONS: Location[] = [
    { id: '1',  name: 'Downtown Branch',      city: 'New York',    status: 'active',   phone: '+1 212-555-0101' },
    { id: '2',  name: 'Midtown Outlet',        city: 'New York',    status: 'active',   phone: '+1 212-555-0182' },
    { id: '3',  name: 'West Side Kitchen',     city: 'Chicago',     status: 'active',   phone: '+1 312-555-0234' },
    { id: '4',  name: 'North Park Diner',      city: 'Chicago',     status: 'inactive', phone: '+1 312-555-0317' },
    { id: '5',  name: 'Sunset Bistro',         city: 'Los Angeles', status: 'active',   phone: '+1 310-555-0456' },
    { id: '6',  name: 'Hollywood Eats',        city: 'Los Angeles', status: 'inactive', phone: '+1 323-555-0521' },
    { id: '7',  name: 'Harbor View',           city: 'San Diego',   status: 'active',   phone: '+1 619-555-0643' },
    { id: '8',  name: 'Mission Hills Café',    city: 'San Diego',   status: 'active',   phone: '+1 619-555-0778' },
    { id: '9',  name: 'Riverfront Lounge',     city: 'Houston',     status: 'active',   phone: '+1 713-555-0892' },
    { id: '10', name: 'Galleria Spot',         city: 'Houston',     status: 'inactive', phone: '+1 713-555-0965' },
];

const AVATAR_COLORS = [
    { from: '#2437e0', to: '#6b7aff' }, // blue
    { from: '#7c3aed', to: '#a78bfa' }, // violet
    { from: '#0891b2', to: '#67e8f9' }, // cyan
    { from: '#059669', to: '#6ee7b7' }, // emerald
    { from: '#d97706', to: '#fcd34d' }, // amber
    { from: '#dc2626', to: '#fca5a5' }, // red
    { from: '#db2777', to: '#f9a8d4' }, // pink
    { from: '#0284c7', to: '#7dd3fc' }, // sky
];

const getAvatarColor = (name: string) => {
    const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export default function LocationManagement(): JSX.Element {
    const navigate = useNavigate();
    const [locations] = useState<Location[]>(DUMMY_LOCATIONS);
    const [loading] = useState(false);
    const [error] = useState<string | null>(null);
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);

    const filtered = locations.filter((l) => {
        const q = nameFilter.toLowerCase();
        const matchesSearch = !q || l.name.toLowerCase().includes(q);
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(l.status);
        return matchesSearch && matchesStatus;
    });

    const locationColumns: Column<Location>[] = [
        {
            header: 'Location Name',
            width: '30%',
            render: (l) => {
                const initials = l.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase();
                const color = getAvatarColor(l.name);
                return (
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
                        >
                            <span className="text-[10px] font-bold text-white tracking-wide">{initials}</span>
                        </div>
                        <span className="text-sm font-semibold text-[#0e101b]">{l.name}</span>
                    </div>
                );
            },
        },
        {
            header: 'City',
            width: '22%',
            render: (l) => <span className="text-sm text-[#505795]">{l.city}</span>,
        },
        {
            header: 'Status',
            width: '18%',
            render: (l) => {
                const c = STATUS_CHIP[l.status];
                return (
                    <div className={`inline-flex items-center gap-1.5 ${c.text} ${c.bg} px-2.5 py-1 rounded-full w-fit`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        <span className="text-xs font-bold">{c.label}</span>
                    </div>
                );
            },
        },
        {
            header: 'Phone Number',
            width: '30%',
            render: (l) => <span className="text-sm text-[#505795]">{l.phone}</span>,
        },
    ];

    return (
        <div className="flex w-full bg-background-light h-[calc(100vh-1rem)] overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col gap-4 px-10 py-8 overflow-hidden">
                <PageHeader title="Location Management" subtitle="Manage your restaurant branches and their settings.">
                    <button
                        className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg h-12 px-6 bg-blue-700 text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all active:scale-95 cursor-pointer"
                        onClick={() => navigate('/locations/add')}
                    >
                        <MapPinPlus className="w-5 h-5" />
                        Add New Location
                    </button>
                </PageHeader>

                <FilterBar
                    loading={loading}
                    name={nameFilter}
                    onNameChange={setNameFilter}
                    statusValues={statusFilter}
                    onStatusChange={setStatusFilter}
                    statusOptions={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                    ]}
                    onClearAll={() => { setNameFilter(''); setStatusFilter([]); }}
                />

                <DataTable
                    columns={locationColumns}
                    rows={filtered}
                    loading={loading}
                    error={error}
                    onSelect={() => {}}
                    emptyMessage="No locations found"
                />
            </div>
        </div>
    );
}
