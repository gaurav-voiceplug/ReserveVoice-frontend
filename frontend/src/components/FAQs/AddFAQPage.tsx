import { ArrowLeft } from 'lucide-react';
import { type JSX } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

type AddFAQFormData = {
    location_id: string;
    category: string;
    question: string;
    answer: string;
};

const LOCATIONS = [
    { id: '1', name: 'Downtown Branch', city: 'New York' },
    { id: '2', name: 'Midtown Outlet', city: 'New York' },
    { id: '3', name: 'West Side Kitchen', city: 'Chicago' },
    { id: '4', name: 'North Park Diner', city: 'Chicago' },
    { id: '5', name: 'Sunset Bistro', city: 'Los Angeles' },
    { id: '6', name: 'Hollywood Eats', city: 'Los Angeles' },
    { id: '7', name: 'Harbor View', city: 'San Diego' },
    { id: '8', name: 'Mission Hills Café', city: 'San Diego' },
    { id: '9', name: 'Riverfront Lounge', city: 'Houston' },
    { id: '10', name: 'Galleria Spot', city: 'Houston' },
];

const FAQ_CATEGORIES = [
    'General',
    'Reservations',
    'Menu & Dietary',
    'Orders & Delivery',
    'Payments & Billing',
    'Events & Catering',
    'Policies',
    'Other',
];

const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-3.5 rounded-lg border ${hasError ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary'} text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all bg-white`;

export default function AddFAQPage(): JSX.Element {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AddFAQFormData>({
        mode: 'onChange',
        defaultValues: {
            location_id: '',
            category: '',
            question: '',
            answer: '',
        },
    });

    const onSubmit = (data: AddFAQFormData) => {
        console.log('New FAQ:', data);
        navigate('/faqs');
    };

    return (
        <div className="flex w-full bg-background-light h-[calc(100vh-1rem)] overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col gap-5 px-10 py-8 overflow-hidden">

                {/* Top bar */}
                <div className="flex-shrink-0 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-[#100e1b] leading-tight">Add New FAQ</h1>
                        <p className="text-sm text-[#575095] mt-0.5">Create a new FAQ entry for your AI knowledge base.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/faqs')}
                        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white text-gray-500 text-sm font-bold border border-gray-300 hover:bg-gray-50 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back To FAQs
                    </button>
                </div>

                {/* Card */}
                <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">

                        {/* Scrollable body */}
                        <div className="flex-1 min-h-0 w-full overflow-y-auto px-10 py-8 [scrollbar-width:thin] [scrollbar-color:#d1d3e6_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#d1d3e6] [&::-webkit-scrollbar-thumb]:rounded-full">
                            <div className="max-w-full space-y-6">

                                {/* Location */}
                                <div className='flex gap-6 items-start'>
                                    <div className="flex-1">
                                        <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                            Location <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                {...register('location_id', { required: 'Please select a location' })}
                                                className={`${inputClass(!!errors.location_id)} appearance-none pr-10`}
                                            >
                                                <option value="">Select a location</option>
                                                {LOCATIONS.map((loc) => (
                                                    <option key={loc.id} value={loc.id}>
                                                        {loc.name} — {loc.city}
                                                    </option>
                                                ))}
                                            </select>
                                            <svg
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                                            </svg>
                                        </div>
                                        <p className="text-xs text-red-500 mt-1.5 h-2">{errors.location_id?.message ?? ''}</p>
                                    </div>

                                    {/* Category */}
                                    <div className="flex-1">
                                        <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                {...register('category', { required: 'Please select a category' })}
                                                className={`${inputClass(!!errors.category)} appearance-none pr-10`}
                                            >
                                                <option value="">Select a category</option>
                                                {FAQ_CATEGORIES.map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>
                                            <svg
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                                            </svg>
                                        </div>
                                        <p className="text-xs text-red-500 mt-1.5 h-2">{errors.category?.message ?? ''}</p>
                                    </div>
                                </div>
                                {/* Question */}
                                <div>
                                    <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                        Question <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register('question', { required: 'Question is required' })}
                                        placeholder="e.g. What are your opening hours?"
                                        className={inputClass(!!errors.question)}
                                    />
                                    <p className="text-xs text-red-500 mt-1.5 h-2">{errors.question?.message ?? ''}</p>
                                </div>

                                {/* Answer */}
                                <div>
                                    <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                        Answer <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        {...register('answer', { required: 'Answer is required' })}
                                        rows={5}
                                        placeholder="Provide a clear and concise answer..."
                                        className={`${inputClass(!!errors.answer)} resize-none`}
                                    />
                                    <p className="text-xs text-red-500 h-2">{errors.answer?.message ?? ''}</p>
                                </div>

                            </div>
                        </div>

                        {/* Sticky footer */}
                        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-10 py-5 border-t border-gray-100 bg-gray-50/50">
                            <button
                                type="button"
                                onClick={() => navigate('/faqs')}
                                className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-700/20 transition-all cursor-pointer"
                            >
                                Add FAQ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
