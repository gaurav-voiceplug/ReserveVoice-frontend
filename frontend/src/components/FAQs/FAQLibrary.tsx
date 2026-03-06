import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { type Column } from '../common/DataTable';
import { Search, RotateCcw, Plus } from 'lucide-react';
import LocationFilter from '../common/LocationFilter';

// Updated DUMMY_FAQS to include location_id field
const DUMMY_FAQS = [
    { id: '1', question: 'What is your return policy?', answer: 'You can return items within 30 days.', lastModified: '2026-03-01', location_id: 'loc_1' },
    { id: '2', question: 'Do you offer international shipping?', answer: 'Yes, we ship worldwide.', lastModified: '2026-02-28', location_id: 'loc_2' },
    { id: '3', question: 'How can I track my order?', answer: 'You can track your order using the tracking link sent to your email.', lastModified: '2026-02-25', location_id: 'loc_3' },
    { id: '4', question: 'What payment methods do you accept?', answer: 'We accept all major credit cards and PayPal.', lastModified: '2026-02-20', location_id: 'loc_4' },
    { id: '5', question: 'How do I contact customer support?', answer: 'You can contact us via email or phone.', lastModified: '2026-02-15', location_id: 'loc_5' },
];

export default function FAQLibrary(): JSX.Element {
    const navigate = useNavigate();
    const [faqs] = useState(DUMMY_FAQS);
    const [searchFilter, setSearchFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState<string[]>([]);
    const [resetSpinning, setResetSpinning] = useState(false);

    const handleReset = () => {
        setSearchFilter('');
        setLocationFilter([]);
        setResetSpinning(true);
        setTimeout(() => setResetSpinning(false), 300);
    };

    const filtered = faqs.filter((faq) => {
        const q = searchFilter.toLowerCase();
        const matchesSearch = !q || faq.question.toLowerCase().includes(q);
        const matchesLocation = locationFilter.length === 0 || locationFilter.includes(faq.location_id);
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
                    {/* Location filter */}
                    <LocationFilter value={locationFilter} onChange={setLocationFilter} />

                    {/* Search input */}
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
                            <input
                                type="text"
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                placeholder="Search questions, keywords, or answers..."
                                className="w-full pl-10 pr-4 rounded-lg text-slate-900 border border-slate-200 bg-slate-50 h-11 text-sm outline-none placeholder:text-slate-400 transition-all focus:border-gray-400 focus:shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Reset filters */}
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4 h-8">
                        <button
                            title="Reset filters"
                            className="p-2 text-slate-500 hover:text-primary transition-colors cursor-pointer"
                            onClick={handleReset}
                        >
                            <RotateCcw className={`w-6 h-6 transition-transform duration-300 ease-in-out ${resetSpinning ? '-rotate-180' : 'rotate-0'}`} />
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
