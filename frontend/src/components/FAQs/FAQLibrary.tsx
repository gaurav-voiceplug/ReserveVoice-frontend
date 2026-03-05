import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { type Column } from '../common/DataTable';
import { MapPin, Search, SlidersHorizontal, Download, Plus } from 'lucide-react';

interface Location {
    location_id: string;
    name: string;
    city: string;
    status: 'active' | 'inactive';
    phone: string;
}

// Updated DUMMY_FAQS to include location_id field
const DUMMY_FAQS = [
    { id: '1', question: 'What is your return policy?', answer: 'You can return items within 30 days.', lastModified: '2026-03-01', location_id: '1' },
    { id: '2', question: 'Do you offer international shipping?', answer: 'Yes, we ship worldwide.', lastModified: '2026-02-28', location_id: '2' },
    { id: '3', question: 'How can I track my order?', answer: 'You can track your order using the tracking link sent to your email.', lastModified: '2026-02-25', location_id: '3' },
    { id: '4', question: 'What payment methods do you accept?', answer: 'We accept all major credit cards and PayPal.', lastModified: '2026-02-20', location_id: '4' },
    { id: '5', question: 'How do I contact customer support?', answer: 'You can contact us via email or phone.', lastModified: '2026-02-15', location_id: '5' },
];

const DUMMY_LOCATIONS: Location[] = [
    { location_id: '1', name: 'Downtown Branch', city: 'New York', status: 'active', phone: '+1 212-555-0101' },
    { location_id: '2', name: 'Midtown Outlet', city: 'New York', status: 'active', phone: '+1 212-555-0182' },
    { location_id: '3', name: 'West Side Kitchen', city: 'Chicago', status: 'active', phone: '+1 312-555-0234' },
    { location_id: '4', name: 'North Park Diner', city: 'Chicago', status: 'inactive', phone: '+1 312-555-0317' },
    { location_id: '5', name: 'Sunset Bistro', city: 'Los Angeles', status: 'active', phone: '+1 310-555-0456' },
    { location_id: '6', name: 'Hollywood Eats', city: 'Los Angeles', status: 'inactive', phone: '+1 323-555-0521' },
    { location_id: '7', name: 'Harbor View', city: 'San Diego', status: 'active', phone: '+1 619-555-0643' },
    { location_id: '8', name: 'Mission Hills Café', city: 'San Diego', status: 'active', phone: '+1 619-555-0778' },
    { location_id: '9', name: 'Riverfront Lounge', city: 'Houston', status: 'active', phone: '+1 713-555-0892' },
    { location_id: '10', name: 'Galleria Spot', city: 'Houston', status: 'inactive', phone: '+1 713-555-0965' },
];

export default function FAQLibrary(): JSX.Element {
    const navigate = useNavigate();
    const [faqs] = useState(DUMMY_FAQS);
    const [searchFilter, setSearchFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState<string | null>(null);

    const filtered = faqs.filter((faq) => {
        const q = searchFilter.toLowerCase();
        const matchesSearch = !q || faq.question.toLowerCase().includes(q);
        const matchesLocation = !locationFilter || faq.location_id === locationFilter;
        return matchesSearch && matchesLocation;
    });

    const faqColumns: Column<typeof DUMMY_FAQS[number]>[] = [
        {
            header: 'Question',
            width: '40%',
            render: (faq) => <span className="text-sm font-semibold text-[#0e101b]">{faq.question}</span>,
        },
        {
            header: 'Answer',
            width: '40%',
            render: (faq) => <span className="text-sm text-[#505795]">{faq.answer}</span>,
        },
        {
            header: 'Last Modified',
            width: '20%',
            render: (faq) => <span className="text-sm text-[#505795]">{faq.lastModified}</span>,
        },
    ];

    return (
        <div className="flex w-full bg-background-light h-[calc(100vh-1rem)] overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col gap-4 px-10 py-8 overflow-hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-slate-900 text-3xl font-black leading-tight tracking-tight">FAQ Library</h1>
                        <p className="text-slate-500 text-base font-normal">Manage the AI knowledge base for your restaurant reservations.</p>
                    </div>
                    <button
                        className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg h-12 px-6 bg-blue-700 text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all active:scale-95 cursor-pointer"
                        onClick={() => navigate('/faqs/add')}
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add FAQ</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4 shadow-sm">
                    {/* Location select */}
                    <div className="flex flex-col min-w-[240px]">
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
                            <select
                                value={locationFilter || ''}
                                onChange={(e) => setLocationFilter(e.target.value || null)}
                                className="w-full pl-10 pr-10 rounded-lg text-slate-900 border border-slate-200 bg-slate-50 focus:ring-primary focus:border-primary h-11 text-sm appearance-none outline-none"
                            >
                                <option value="">All Locations</option>
                                {DUMMY_LOCATIONS.map((location) => (
                                    <option key={location.location_id} value={location.location_id}>{location.name}</option>
                                ))}
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 15l5 5 5-5M7 9l5-5 5 5" /></svg>
                        </div>
                    </div>

                    {/* Search input */}
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
                            <input
                                type="text"
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                placeholder="Search questions, keywords, or answers..."
                                className="w-full pl-10 pr-4 rounded-lg text-slate-900 border border-slate-200 bg-slate-50 focus:ring-primary focus:border-primary h-11 text-sm outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* View options */}
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4 h-8">
                        <button className="p-2 text-slate-500 hover:text-primary transition-colors rounded-md hover:bg-slate-100">
                            <SlidersHorizontal className="w-[22px] h-[22px]" />
                        </button>
                        <button className="p-2 text-slate-500 hover:text-primary transition-colors rounded-md hover:bg-slate-100">
                            <Download className="w-[22px] h-[22px]" />
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <DataTable
                    columns={faqColumns}
                    rows={filtered}
                    loading={false}
                    error={null}
                    onSelect={() => { }}
                    emptyMessage="No FAQs found"
                />
            </div>
        </div>
    );
}
