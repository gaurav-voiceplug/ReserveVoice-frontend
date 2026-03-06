import { ArrowLeft } from 'lucide-react';
import { useState, type JSX } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

const TABS = ['General', 'Operating Hours', 'Reservation Rules', 'Holiday Overrides'] as const;

type LocationStatus = 'active' | 'inactive';

type DayHours = {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
};

type LocationFormData = {
    name: string;
    status: LocationStatus;
    phone: string;
    city: string;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_HOURS: Record<string, DayHours> = Object.fromEntries(
    DAYS.map((d) => [d, { isOpen: true, openTime: '09:00', closeTime: '22:00' }])
);

const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-3.5 rounded-lg border ${hasError ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary'} text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all bg-white`;

export default function AddLocationPage(): JSX.Element {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<typeof TABS[number]>('General');
    const [hours, setHours] = useState<Record<string, DayHours>>(DEFAULT_HOURS);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LocationFormData>({
        mode: 'onChange',
        defaultValues: {
            name: '',
            status: 'active',
            phone: '',
            city: '',
        },
    });

    const toggleDay = (day: string) =>
        setHours((prev) => ({ ...prev, [day]: { ...prev[day], isOpen: !prev[day].isOpen } }));

    const updateTime = (day: string, field: 'openTime' | 'closeTime', value: string) =>
        setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

    const setAllDays = (isOpen: boolean) =>
        setHours((prev) =>
            Object.fromEntries(Object.entries(prev).map(([d, v]) => [d, { ...v, isOpen }]))
        );

    const onSubmit = (data: LocationFormData) => {
        navigate('/locations', { state: { newLocation: { ...data, hours } } });
    };

    return (
        <div className="flex w-full bg-background-light h-[calc(100vh-1rem)] overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col gap-5 px-10 py-8 overflow-hidden">

                {/* Top bar */}
                <div className="flex-shrink-0 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-[#100e1b] leading-tight">Add New Location</h1>
                        <p className="text-sm text-[#575095] mt-0.5">Set up a new location for your restaurant.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/locations')}
                        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white text-gray-500 text-sm font-bold border border-gray-300 hover:bg-gray-50 cursor-pointer transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back To Locations
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 pb-3">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-sm cursor-pointer font-semibold pb-2 transition-all ${
                                activeTab === tab
                                    ? 'text-blue-700 border-b-2 border-blue-700'
                                    : 'text-gray-500 hover:text-blue-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col flex-1 min-h-0 overflow-hidden">

                        {/* Scrollable body */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-10 py-8 [scrollbar-width:thin] [scrollbar-color:#d1d3e6_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#d1d3e6] [&::-webkit-scrollbar-thumb]:rounded-full">

                            {/* General Tab */}
                            {activeTab === 'General' && (
                                <div className="max-w-2xl space-y-6">
                                    <div>
                                        <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                            Location Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            {...register('name', { required: 'Location name is required' })}
                                            placeholder="e.g. Downtown Branch"
                                            className={inputClass(!!errors.name)}
                                        />
                                        <p className="text-xs text-red-500 mt-1.5 h-4">{errors.name?.message ?? ''}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                                City <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                {...register('city', { required: 'City is required' })}
                                                placeholder="e.g. New York"
                                                className={inputClass(!!errors.city)}
                                            />
                                            <p className="text-xs text-red-500 mt-1.5 h-4">{errors.city?.message ?? ''}</p>
                                        </div>
                                        <div>
                                            <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                                Status
                                            </label>
                                            <select
                                                {...register('status')}
                                                className={inputClass()}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                            <p className="h-4" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            {...register('phone', { required: 'Phone number is required' })}
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            className={inputClass(!!errors.phone)}
                                        />
                                        <p className="text-xs text-red-500 mt-1.5 h-4">{errors.phone?.message ?? ''}</p>
                                    </div>
                                </div>
                            )}

                            {/* Operating Hours Tab */}
                            {activeTab === 'Operating Hours' && (
                                <div className="max-w-2xl">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-[#505795]">Set open and close times for each day</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button type="button" onClick={() => setAllDays(true)}
                                                className="text-sm text-primary font-semibold hover:underline">
                                                Open All
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button type="button" onClick={() => setAllDays(false)}
                                                className="text-sm text-gray-500 font-semibold hover:underline">
                                                Close All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                                        {DAYS.map((day, idx) => {
                                            const h = hours[day];
                                            return (
                                                <div
                                                    key={day}
                                                    className={`flex items-center gap-4 px-5 py-4 transition-all ${idx !== DAYS.length - 1 ? 'border-b border-gray-100' : ''} ${h.isOpen ? 'bg-white' : 'bg-gray-50'}`}
                                                >
                                                    <div className="w-28 flex-shrink-0">
                                                        <span className={`text-sm font-semibold ${h.isOpen ? 'text-[#100e1b]' : 'text-gray-400'}`}>
                                                            {day}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDay(day)}
                                                        className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${h.isOpen ? 'bg-blue-700' : 'bg-gray-300'}`}
                                                    >
                                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${h.isOpen ? 'left-5' : 'left-0.5'}`} />
                                                    </button>
                                                    <span className={`text-xs font-semibold w-12 flex-shrink-0 ${h.isOpen ? 'text-blue-700' : 'text-gray-400'}`}>
                                                        {h.isOpen ? 'Open' : 'Closed'}
                                                    </span>
                                                    {h.isOpen ? (
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <span className="text-xs text-gray-400 font-medium w-10">From</span>
                                                                <input
                                                                    type="time"
                                                                    value={h.openTime}
                                                                    onChange={(e) => updateTime(day, 'openTime', e.target.value)}
                                                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <span className="text-xs text-gray-400 font-medium w-10">To</span>
                                                                <input
                                                                    type="time"
                                                                    value={h.closeTime}
                                                                    onChange={(e) => updateTime(day, 'closeTime', e.target.value)}
                                                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1">
                                                            <span className="text-xs text-gray-400">Closed all day</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Placeholder for other tabs */}
                            {activeTab === 'Reservation Rules' && (
                                <div className="max-w-2xl">
                                    <p className="text-sm text-gray-500">Reservation Rules content goes here.</p>
                                </div>
                            )}
                            {activeTab === 'Holiday Overrides' && (
                                <div className="max-w-2xl">
                                    <p className="text-sm text-gray-500">Holiday Overrides content goes here.</p>
                                </div>
                            )}
                        </div>

                        {/* Sticky footer */}
                        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-10 py-5 border-t border-gray-100 bg-gray-50/50">
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-700/20 transition-all cursor-pointer"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
