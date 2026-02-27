import { Eye, EyeOff, LockKeyhole, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axios/instance';
import { useSnackbar } from '../snackbar/Snackbar';
import { useAuth } from './AuthContext';

type LoginFormInputs = {
    username: string;
    password: string;
};

const Login = () => {
    const { showSnackbar } = useSnackbar();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
    const { login } = useAuth();
    const navigate = useNavigate();

    const onSubmit = (data: LoginFormInputs) => {
        setLoading(true);
        axiosInstance.post('users/userLogin', {
            user: {
                name: data.username,
                password: data.password,
            }
        })
            .then((response) => {
                const token = response.data?.token;
                // try common refresh token fields returned by backend
                const refreshToken = response.data?.refreshToken ?? response.data?.refresh_token ?? response.data?.refresh;
                const user = response.data?.user;
                if (token && user) {
                    // ensure auth context receives the token and refreshToken as part of the user object
                    login({ ...user, token, ...(refreshToken ? { refreshToken } : {}) });
                    showSnackbar('Login successful!', 'success');
                    navigate('/orders');
                } else {
                    showSnackbar(response.data.message || 'Sign in failed', 'error');
                }
            })
            .catch((err) => {
                showSnackbar(err.message || 'Sign in failed', 'error');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 bg-background-light">
            {/* Top Navigation */}
            <div className="absolute top-0 left-0 right-0 px-6 py-8 md:px-12 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className='flex items-center gap-2'>
                        <img src="/VoicePlug_Logo.svg" alt="Voiceplug Logo" className="w-10 h-10" />
                    </div>
                    <h2 className="text-[#0e101b] text-xl font-bold leading-tight tracking-[-0.015em]">ReserveVOICE</h2>
                </div>
            </div>
            {/* Login Container */}
            <div className="w-full max-w-[440px] z-10">
                <div className="text-center mb-10">
                    <h1 className="text-[#0e101b] tracking-tight text-3xl font-bold leading-tight mb-2">Welcome Back !</h1>
                    <p className="text-slate-600 text-base font-normal">Manage your restaurant's AI reservations</p>
                </div>
                <div className="bg-white shadow-xl shadow-blue-500/5 rounded-xl border border-[#e8e9f3] p-8 sm:p-10 transition-all">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        {/* Email Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#0e101b] text-sm font-medium leading-normal">Username</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px]">
                                    <User className="w-5 h-5 text-black" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Enter your username"
                                    className={`form-input flex w-full rounded-lg text-[#0e101b] focus:outline-0 bg-[#f8f9fb] h-12 pl-12 pr-4 placeholder:text-[#505795] text-sm font-normal transition-all ${errors.username ? 'border border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border border-[#d1d3e6] focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
                                    {...register('username', {
                                        required: 'Username is required',
                                        minLength: { value: 1, message: 'Username must be at least 1 character' },
                                        // pattern: {
                                        //     value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        //     message: 'Invalid username format',
                                        // },
                                    })}
                                />
                            </div>
                        </div>
                        {/* Password Field */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[#0e101b] text-sm font-medium leading-normal">Password</label>
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px]">
                                    <LockKeyhole className="w-5 h-5 text-black" />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    className={`form-input flex w-full rounded-lg text-[#0e101b] focus:outline-0 bg-[#f8f9fb] h-12 pl-12 pr-12 placeholder:text-[#505795] text-sm font-normal transition-all ${errors.password ? 'border border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border border-[#d1d3e6] focus:border-primary focus:ring-1 focus:ring-gray-700'}`}
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 1, message: 'Password must be at least 1 character' },
                                    })}
                                />
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <span className="text-[20px]">
                                        {showPassword ? <Eye className="w-5 h-5 text-black" /> : <EyeOff className="w-5 h-5 text-black" />}
                                    </span>
                                </button>
                                {errors.password && <span className="absolute left-0 -bottom-5 text-xs text-red-500">{errors.password.message}</span>}
                            </div>
                        </div>
                        {/* Action Button */}
                        <div className="pt-2">
                            <button
                                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-blue-700 text-white text-sm font-bold leading-normal tracking-wide hover:bg-blue-900 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                type="submit"
                                disabled={loading}
                            >
                                {loading && (
                                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                )}
                                <span className="truncate">{loading ? 'Signing in...' : 'Sign In'}</span>
                            </button>
                        </div>
                    </form>
                    {/* Footer of Card */}

                </div>
            </div>
            {/* Decorative background elements */}
            <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        </div>
    );
};

export default Login;