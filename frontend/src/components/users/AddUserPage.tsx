import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState, type JSX } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { type AddUserFormData } from './AddUserModal';

type UserRole = 'brand_admin' | 'store_admin' | 'store_operations';

const LOCATIONS = [
    { id: 'loc_1', name: 'Downtown Branch', city: 'New York' },
    { id: 'loc_2', name: 'Uptown Branch', city: 'Brooklyn' },
    { id: 'loc_3', name: 'Central Kitchen', city: 'Queens' },
];

const ROLE_OPTIONS: { value: UserRole; label: string; description: string; scope: string }[] = [
    {
        value: 'brand_admin',
        label: 'Brand Admin',
        description: 'Full access to all brands and locations',
        scope: 'Brand Level',
    },
    {
        value: 'store_admin',
        label: 'Store Admin',
        description: 'Full control for assigned locations only',
        scope: 'Location Scoped',
    },
    {
        value: 'store_operations',
        label: 'Store Operations',
        description: 'Operational features only for assigned locations',
        scope: 'Location Scoped',
    },
];

const STEPS = ['Basic Info', 'Role & Access'] as const;

const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-3.5 rounded-lg border ${hasError ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary'} text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all bg-white`;


export default function AddUserPage(): JSX.Element {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [showPassword, setShowPassword] = useState(false);
    const [locSearch, setLocSearch] = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const {
        register,
        handleSubmit,
        trigger,
        watch,
        setValue,
        formState: { errors },
    } = useForm<AddUserFormData>({
        mode: 'onChange',
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            phone: '',
            role: 'store_admin',
            assigned_locations: [],
        },
    });

    const role = watch('role') as UserRole;
    const assignedLocations = watch('assigned_locations');
    const needsLocation = role === 'store_admin' || role === 'store_operations';

    const handleNext = async () => {
        const valid = await trigger(['first_name', 'last_name', 'email', 'password']);
        if (valid) setStep(2);
    };

    const toggleLocation = (id: string) => {
        const next = assignedLocations.includes(id)
            ? assignedLocations.filter((v) => v !== id)
            : [...assignedLocations, id];
        setValue('assigned_locations', next);
    };

    const onSubmit = (data: AddUserFormData) => {
        if (needsLocation && assignedLocations.length === 0) return;
        if (!needsLocation) {
            data.assigned_locations = [];
        }
        navigate('/users', { state: { newUser: data } });
    };

    const filteredLocs = LOCATIONS.filter((l) =>
        l.name.toLowerCase().includes(locSearch.toLowerCase())
    );

    return (
        <div className="flex w-full bg-background-light h-[calc(100vh-1rem)] overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col gap-5 px-10 py-8 overflow-hidden">

                {/* Top bar: back nav + title + step indicator */}
                <div className="flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div>
                            <h1 className="text-2xl font-bold text-[#100e1b] leading-tight">Add New User</h1>
                            <p className="text-sm text-[#575095] mt-0.5">
                                {step === 1 ? 'Enter personal details for the new user.' : 'Assign a role and location access.'}
                            </p>
                        </div>
                    </div>
                     <button
                        type="button"
                        onClick={() => navigate('/users')}
                        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white text-gray-500 text-sm font-bold border border-gray-300 hover:bg-gray-50 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back To Users
                    </button>

                  
                </div>

                {/* Card — fills remaining height */}
                <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                     {/* Step indicator */}
                    <div className="flex items-center pt-5 pb-3 pl-8 gap-3">
                        {STEPS.map((label, idx) => {
                            const s = (idx + 1) as 1 | 2;
                            const isDone = step > s;
                            const isActive = step === s;
                            return (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                        ${isActive ? 'bg-blue-700 text-white' : isDone ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                        {isDone ? '✓' : s}
                                    </div>
                                    <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-blue-700' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                                        {label}
                                    </span>
                                    {s < STEPS.length && <div className="w-12 h-px bg-gray-200 mx-1" />}
                                </div>
                            );
                        })}
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">

                        {/* Scrollable body */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-10 py-8 [scrollbar-width:thin] [scrollbar-color:#d1d3e6_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#d1d3e6] [&::-webkit-scrollbar-thumb]:rounded-full">

                            {/* ── Step 1: Basic Info ── */}
                            {step === 1 && (
                                <div className="max-w-full space-y-6">
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                                First Name <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    {...register('first_name', { required: 'First name is required' })}
                                                    placeholder="Enter first name"
                                                    className={inputClass(!!errors.first_name)}
                                                />
                                                {errors.first_name && <span className="absolute left-0 -bottom-5 text-xs text-red-500">{errors.first_name.message}</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                                Last Name <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    {...register('last_name', { required: 'Last name is required' })}
                                                    placeholder="Enter last name"
                                                    className={inputClass(!!errors.last_name)}
                                                />
                                                {errors.last_name && <span className="absolute left-0 -bottom-5 text-xs text-red-500">{errors.last_name.message}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...register('email', {
                                                    required: 'Email is required',
                                                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                                                })}
                                                type="email"
                                                placeholder="user@example.com"
                                                className={inputClass(!!errors.email)}
                                            />
                                            {errors.email && <span className="absolute left-0 -bottom-5 text-xs text-red-500">{errors.email.message}</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...register('password', {
                                                    required: 'Password is required',
                                                    minLength: { value: 8, message: 'Must be at least 8 characters' },
                                                })}
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Min. 8 characters"
                                                className={inputClass(!!errors.password)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            {errors.password && <span className="absolute left-0 -bottom-5 text-xs text-red-500">{errors.password.message}</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                            Phone Number{' '}
                                            <span className="text-gray-400 font-normal text-sm">(optional)</span>
                                        </label>
                                        <input
                                            {...register('phone')}
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            className={inputClass()}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── Step 2: Role & Access — two-column layout ── */}
                            {step === 2 && (
                                <div className="grid grid-cols-2 gap-8 h-full">

                                    {/* Left: Role selector */}
                                    <div>
                                        <label className="block text-base font-semibold text-[#100e1b] mb-3">
                                            Role Assignment
                                        </label>
                                        <div className="space-y-2.5">
                                            {ROLE_OPTIONS.map((opt) => (
                                                <label
                                                    key={opt.value}
                                                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${role === opt.value ? 'border-primary bg-[#eef2ff]' : 'border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        {...register('role')}
                                                        value={opt.value}
                                                        className="mt-1 accent-primary"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-sm font-bold ${role === opt.value ? 'text-primary' : 'text-[#100e1b]'}`}>
                                                                {opt.label}
                                                            </p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role === opt.value ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                                                                {opt.scope}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-0.5">{opt.description}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right: Location assignment */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-base font-semibold text-[#100e1b]">
                                                Location Assignment
                                                {needsLocation && (
                                                    <span className="ml-1.5 text-gray-400 font-normal text-sm">(one or more)</span>
                                                )}
                                            </label>
                                            {needsLocation && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setValue(
                                                            'assigned_locations',
                                                            assignedLocations.length === LOCATIONS.length
                                                                ? []
                                                                : LOCATIONS.map((l) => l.id)
                                                        )
                                                    }
                                                    className="text-sm text-primary font-semibold hover:underline"
                                                >
                                                    {assignedLocations.length === LOCATIONS.length ? 'Deselect All' : 'Select All'}
                                                </button>
                                            )}
                                        </div>

                                        {!needsLocation ? (
                                            <div className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-[#ecfdf3] border border-[#bbf7d0]">
                                                <span className="w-2 h-2 rounded-full bg-[#0b875b] flex-shrink-0" />
                                                <p className="text-sm text-[#0b875b] font-medium">
                                                    Brand Admins have access to all locations automatically
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder="Search locations…"
                                                    value={locSearch}
                                                    onChange={(e) => setLocSearch(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm mb-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                                                />
                                                <div className="space-y-2 max-h-64 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#d1d3e6_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#d1d3e6] [&::-webkit-scrollbar-thumb]:rounded-full">
                                                    {filteredLocs.length === 0 ? (
                                                        <p className="text-sm text-gray-400 px-1 py-2">No locations found</p>
                                                    ) : (
                                                        filteredLocs.map((loc) => {
                                                            const checked = assignedLocations.includes(loc.id);
                                                            return (
                                                                <label
                                                                    key={loc.id}
                                                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${checked ? 'border-primary bg-[#eef2ff]' : 'border-gray-200 hover:bg-gray-50'}`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => toggleLocation(loc.id)}
                                                                        className="accent-primary"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-[#100e1b] truncate">{loc.name}</p>
                                                                        <p className="text-xs text-gray-500">{loc.city}</p>
                                                                    </div>
                                                                </label>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                                {submitAttempted && assignedLocations.length === 0 && (
                                                    <p className="text-sm text-red-500 mt-2">
                                                        Please select at least one location
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky footer */}
                        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-10 py-5 border-t border-gray-100 bg-gray-50/50">
                            {step === 2 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                                >
                                    ← Back
                                </button>
                            )}
                            {step === 1 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-700/20 transition-all cursor-pointer"
                                >
                                    Next →
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    onClick={() => setSubmitAttempted(true)}
                                    className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-700/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add User
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
