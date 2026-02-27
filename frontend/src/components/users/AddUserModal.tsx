import { Eye, EyeOff, X } from 'lucide-react';
import { useState, type JSX } from 'react';
import { useForm } from 'react-hook-form';

type UserRole = 'brand_admin' | 'store_admin' | 'store_operations';

export type AddUserFormData = {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
    assigned_locations: string[];
};

interface AddUserModalProps {
    onClose: () => void;
    onAdd: (data: AddUserFormData) => void;
}

const LOCATIONS = [
    { id: 'loc_1', name: 'Downtown Branch',  city: 'New York'  },
    { id: 'loc_2', name: 'Uptown Branch',    city: 'Brooklyn'  },
    { id: 'loc_3', name: 'Central Kitchen',  city: 'Queens'    },
];

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
    { value: 'brand_admin',      label: 'Brand Admin',      description: 'Full access to all brands and locations'           },
    { value: 'store_admin',      label: 'Store Admin',      description: 'Full control for assigned locations only'          },
    { value: 'store_operations', label: 'Store Operations', description: 'Operational features only for assigned locations'  },
];

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-sm text-red-500 mt-1">{message}</p>;
}

const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-3.5 rounded-lg border ${hasError ? 'border-red-400' : 'border-gray-200'} text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all`;

export default function AddUserModal({ onClose, onAdd }: AddUserModalProps): JSX.Element {
    const [step, setStep] = useState<1 | 2>(1);
    const [showPassword, setShowPassword] = useState(false);
    const [locSearch, setLocSearch] = useState('');

    const {
        register,
        handleSubmit,
        trigger,
        watch,
        setValue,
        formState: { errors },
    } = useForm<AddUserFormData>({
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

    const role = watch('role');
    const assignedLocations = watch('assigned_locations');

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
        if (role === 'brand_admin') {
            data.assigned_locations = [];
        }
        onAdd(data);
        onClose();
    };

    const filteredLocs = LOCATIONS.filter((l) =>
        l.name.toLowerCase().includes(locSearch.toLowerCase())
    );

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Modal card */}
            <div className="relative w-full max-w-[640px] mx-4 bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-[#100e1b]">Add New User</h2>
                        <p className="text-sm text-[#575095] mt-1">
                            {step === 1 ? 'Enter personal details' : 'Set role and location access'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-3 px-8 py-4 border-b border-gray-100 flex-shrink-0">
                    {[1, 2].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                                ${step === s ? 'bg-primary text-white' : step > s ? 'bg-[#ecfdf3] text-[#0b875b]' : 'bg-gray-100 text-gray-400'}`}>
                                {step > s ? '✓' : s}
                            </div>
                            <span className={`text-sm font-semibold ${step === s ? 'text-primary' : 'text-gray-400'}`}>
                                {s === 1 ? 'Basic Info' : 'Role & Access'}
                            </span>
                            {s < 2 && <div className="w-10 h-px bg-gray-200 mx-1" />}
                        </div>
                    ))}
                </div>

                {/* Form body — scrollable */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col flex-1 min-h-0 overflow-hidden"
                >
                    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 [scrollbar-width:thin] [scrollbar-color:#d1d3e6_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#d1d3e6] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">

                        {/* ── Step 1: Basic Info ── */}
                        {step === 1 && (
                            <>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            {...register('first_name', { required: 'First name is required' })}
                                            placeholder="Enter first name"
                                            className={inputClass(!!errors.first_name)}
                                        />
                                        <FieldError message={errors.first_name?.message} />
                                    </div>
                                    <div>
                                        <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            {...register('last_name', { required: 'Last name is required' })}
                                            placeholder="Enter last name"
                                            className={inputClass(!!errors.last_name)}
                                        />
                                        <FieldError message={errors.last_name?.message} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-base font-semibold text-[#100e1b] mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                                        })}
                                        type="email"
                                        placeholder="user@example.com"
                                        className={inputClass(!!errors.email)}
                                    />
                                    <FieldError message={errors.email?.message} />
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
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <FieldError message={errors.password?.message} />
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
                            </>
                        )}

                        {/* ── Step 2: Role & Access ── */}
                        {step === 2 && (
                            <>
                                {/* Role selector */}
                                <div>
                                    <label className="block text-base font-semibold text-[#100e1b] mb-3">
                                        Role Assignment
                                    </label>
                                    <div className="space-y-2.5">
                                        {ROLE_OPTIONS.map((opt) => (
                                            <label
                                                key={opt.value}
                                                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${role === opt.value ? 'border-primary bg-[#eef2ff]' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    {...register('role')}
                                                    value={opt.value}
                                                    className="mt-0.5 accent-primary"
                                                />
                                                <div>
                                                    <p className={`text-sm font-bold ${role === opt.value ? 'text-primary' : 'text-[#100e1b]'}`}>
                                                        {opt.label}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-0.5">{opt.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Location assignment */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-base font-semibold text-[#100e1b]">
                                            Location Assignment
                                            {role !== 'brand_admin' && (
                                                <span className="ml-1.5 text-gray-400 font-normal text-sm">(one or more)</span>
                                            )}
                                        </label>
                                        {role !== 'brand_admin' && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setValue(
                                                        'assigned_locations',
                                                        assignedLocations.length === LOCATIONS.length ? [] : LOCATIONS.map((l) => l.id)
                                                    )
                                                }
                                                className="text-sm text-primary font-semibold hover:underline"
                                            >
                                                {assignedLocations.length === LOCATIONS.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        )}
                                    </div>

                                    {role === 'brand_admin' ? (
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
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm mb-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            />
                                            <div className="space-y-2 max-h-44 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#d1d3e6_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#d1d3e6] [&::-webkit-scrollbar-thumb]:rounded-full">
                                                {filteredLocs.length === 0 ? (
                                                    <p className="text-sm text-gray-400 px-1 py-2">No locations found</p>
                                                ) : (
                                                    filteredLocs.map((loc) => {
                                                        const checked = assignedLocations.includes(loc.id);
                                                        return (
                                                            <label
                                                                key={loc.id}
                                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors
                                                                    ${checked ? 'border-primary bg-[#eef2ff]' : 'border-gray-200 hover:bg-gray-50'}`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleLocation(loc.id)}
                                                                    className="accent-primary"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-[#100e1b] truncate">
                                                                        {loc.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">{loc.city}</p>
                                                                </div>
                                                            </label>
                                                        );
                                                    })
                                                )}
                                            </div>
                                            {assignedLocations.length === 0 && (
                                                <p className="text-sm text-red-500 mt-2">
                                                    Please select at least one location
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 flex justify-end items-center gap-3 px-8 py-6 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                            >
                                Back
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        {step === 1 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer"
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={role !== 'brand_admin' && assignedLocations.length === 0}
                                className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add User
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
