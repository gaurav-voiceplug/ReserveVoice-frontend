import { Volume2, VolumeX, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
//import { Plyr } from 'plyr-react';
//import 'plyr/dist/plyr.css';

type ApiOrder = Record<string, any>;

type Order = {
    id: string;
    callId?: string;
    dateTime: string;
    customer?: string;
    phone?: string;
    transcription?: string;
    items?: { name: string; qty: string; modifier?: string; size?: string }[];
    orderNo?: string;
    orderTotal?: string;
    prepTime?: string;
    status: 'Active' | 'Completed' | string;
    recording?: string;
    raw?: ApiOrder;
};

const ACTIVE_URL = 'https://vplite-stg.voiceplug.ai/api/orders/getActiveOrder';
const COMPLETED_URL = 'https://vplite-stg.voiceplug.ai/api/orders/getCompletedOrder';
const VALIDATE_URL = 'https://vplite-stg.voiceplug.ai/api/users/validateToken';

function getAuthHeaders(): Record<string, string> {
    const rawToken = localStorage.getItem('token') || localStorage.getItem('authToken') || (import.meta.env?.VITE_API_TOKEN as string | undefined);
    const rawRefresh = localStorage.getItem('refreshToken') || (import.meta.env?.VITE_REFRESH_TOKEN as string | undefined);
    const token = rawToken && rawToken !== 'undefined' ? rawToken : undefined;
    const refresh = rawRefresh && rawRefresh !== 'undefined' ? rawRefresh : undefined;
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
    if (token) headers['authorization'] = token;
    if (refresh) headers['x-refresh-token'] = refresh;
    return headers;
}

async function validateToken(headers: Record<string, string>, signal?: AbortSignal): Promise<boolean> {
    const keys = Object.keys(headers || {});
    const hasAuth = keys.some((k) => /authorization/i.test(k));
    const hasRefresh = keys.some((k) => /x-?refresh-?token/i.test(k));
    if (!hasAuth && !hasRefresh) return false;
    try {
        const res = await fetch(VALIDATE_URL, { method: 'POST', headers, signal });
        if (!res.ok) return false;
        const body = await res.json();
        return !!body && (body.message === 'Token is valid' || !!body.user);
    } catch (err: any) {
        if (err && err.name === 'AbortError') throw err;
        return false;
    }
}

function mapOrder(a: ApiOrder, status: Order['status']): Order {
    // use API fields from provided sample
    const dt = a.order_datetime || a.createdAt || a.updatedAt || '';
    const dateTime = dt ? new Date(dt).toLocaleString() : '';
    const customer = a.caller_id_name;
    const phone = a.phone_number;
    const transcription = a.text_transcript ?? a.transcription ?? '';
    const items = Array.isArray(a.order_details) ? a.order_details.map((it: any) => ({
        name: it.item_name ?? it.name ?? '',
        qty: it.item_quantity ?? it.quantity ?? '1',
        modifier: it.item_modifier ?? '',
        size: it.item_size ?? '',
    })) : [];
    return {
        id: a._id || a.id || '',
        callId: a.call_id,
        dateTime,
        customer,
        phone,
        transcription,
        items,
        orderNo: a.order_no ?? a.orderNo,
        orderTotal: a.order_total ?? a.orderTotal,
        prepTime: a.preparation_time ?? a.prepTime,
        status: a.order_status ?? status,
        recording: a.recording,
        raw: a,
    };
}

function statusBadge(status?: string) {
    // return background classes matching the screenshot (no dark variants)
    switch ((status || '').toLowerCase()) {
        case 'active':
            return 'bg-amber-50';
        case 'completed':
            return 'bg-green-50';
        case 'cancelled':
            return 'bg-red-50';
        default:
            return 'bg-gray-50';
    }
}

// new: text color class for the chip label (matches Clear All button color/weight in screenshot)
function statusText(status?: string) {
    switch ((status || '').toLowerCase()) {
        case 'active':
            return 'text-amber-600';
        case 'completed':
            return 'text-green-600';
        case 'cancelled':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
}

// new: dot color for the chip
function statusDot(status?: string) {
    switch ((status || '').toLowerCase()) {
        case 'active':
            return 'bg-amber-600';
        case 'completed':
            return 'bg-green-600';
        case 'cancelled':
            return 'bg-red-600';
        default:
            return 'bg-gray-600';
    }
}

// new: friendly uppercase label for the chip
function statusLabel(status?: string) {
    if (!status) return 'UNKNOWN';
    const s = status.toString().toLowerCase();
    if (s === 'active') return 'ACTIVE';
    if (s === 'completed') return 'COMPLETED';
    if (s === 'cancelled') return 'CANCELLED';
    if (s === 'arriving' || s === 'arriving soon') return 'ARRIVING SOON';
    return status.toUpperCase();
}

// localStorage keys used by auth prefetch
const PREFETCH_COMPLETED_KEY = 'prefetchedCompletedOrders';

export default function OrdersOverview(): JSX.Element {
    const [active, setActive] = useState<Order[]>([]);
    const [completed, setCompleted] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Order | null>(null);
    const [tab, setTab] = useState<'Active' | 'Completed'>('Active');

    // --- new: resolved audio URL + load state ---
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    // const [audioLoading, setAudioLoading] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);

    // audio player state / refs / handlers
    const audioRef = useRef<HTMLAudioElement | null>(null);
    // store last non-zero volume so mute/unmute can restore it
    const prevVolumeRef = useRef<number>(100);
    const [duration, setDuration] = useState<number>(0);
    const [curTime, setCurTime] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(100);

    // keep audio element in sync with resolved src
    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;
        if (audioSrc) {
            a.src = audioSrc;
            a.load();
        } else {
            a.removeAttribute('src');
            a.load();
            setDuration(0);
            setCurTime(0);
            setIsPlaying(false);
        }
    }, [audioSrc]);

    // attach audio events
    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;
        const onLoaded = () => setDuration(isFinite(a.duration) ? a.duration : 0);
        const onTime = () => setCurTime(a.currentTime || 0);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);

        a.addEventListener('loadedmetadata', onLoaded);
        a.addEventListener('timeupdate', onTime);
        a.addEventListener('play', onPlay);
        a.addEventListener('pause', onPause);
        a.addEventListener('ended', onEnded);

        return () => {
            a.removeEventListener('loadedmetadata', onLoaded);
            a.removeEventListener('timeupdate', onTime);
            a.removeEventListener('play', onPlay);
            a.removeEventListener('pause', onPause);
            a.removeEventListener('ended', onEnded);
        };
    }, [audioSrc]);

    // sync volume to element
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }, [volume]);

    const onSeek = useCallback((time: number) => {
        const a = audioRef.current;
        if (!a) return;
        a.currentTime = Math.max(0, Math.min(time, duration || a.duration || Infinity));
        setCurTime(a.currentTime);
    }, [duration]);

    const handleRewind = useCallback(() => {
        onSeek((audioRef.current?.currentTime || 0) - 5);
    }, [onSeek]);

    const handleForward = useCallback(() => {
        onSeek((audioRef.current?.currentTime || 0) + 5);
    }, [onSeek]);

    const togglePlay = useCallback(() => {
        const a = audioRef.current;
        if (!a) return;
        if (isPlaying) a.pause();
        else a.play().catch(() => { });
    }, [isPlaying]);

    const toggleMute = useCallback(() => {
        const a = audioRef.current;
        // If audio element exists, prefer muting/unmuting it and sync volume state.
        if (a) {
            if (a.muted || a.volume === 0) {
                // unmute: restore previous non-zero volume
                a.muted = false;
                const v = prevVolumeRef.current ?? 100;
                a.volume = Math.max(0, Math.min(1, v / 100));
                setVolume(v);
            } else {
                // mute: remember current volume and set to zero
                prevVolumeRef.current = Math.round((a.volume || 1) * 100);
                a.muted = true;
                a.volume = 0;
                setVolume(0);
            }
            return;
        }

        // Fallback when no audio element: toggle local volume state using prevVolumeRef
        if (volume === 0) {
            setVolume(prevVolumeRef.current ?? 100);
        } else {
            prevVolumeRef.current = volume || 100;
            setVolume(0);
        }
    }, [volume]);

    const formatTime = (secs?: number | null) => {
        const s = Math.max(0, Math.floor(secs || 0));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    function buildRecordingUrl(recording: string) {
        if (!recording) return '';
        if (/^https?:\/\//i.test(recording)) return recording;
        return `https://vplite-stg.voiceplug.ai/api/recordings/stg/orders/${recording}`;
    }

    // fetch and resolve audio URL (GET so we follow redirects / get final URL)
    useEffect(() => {
        const ac = new AbortController();
        async function fetchAudio() {
            setAudioSrc(null);
            setAudioError(null);
            if (!selected?.recording) return;
            const url = buildRecordingUrl(selected.recording);
            try {
                const headers = getAuthHeaders();
                const res = await fetch(url, { method: 'GET', headers, signal: ac.signal });
                if (!res.ok && res.status !== 304) throw new Error(`Audio ${res.status}`);
                setAudioSrc(res.url || url);
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
                setAudioError(err?.message ?? 'Failed to load recording');
                setAudioSrc(null);
            }
        }
        fetchAudio();
        return () => ac.abort();
    }, [selected?.recording]);

    // new: completed filters state matching required payload
    type CompletedFilters = {
        page: number;
        callUuid: string;
        dateStart: string | null;
        dateEnd: string | null;
        phoneNumber: string;
    };
    const defaultCompletedFilters: CompletedFilters = { page: 0, callUuid: '', dateStart: null, dateEnd: null, phoneNumber: '' };
    const [completedFilters, setCompletedFilters] = useState<CompletedFilters>(defaultCompletedFilters);

    // new: fetch completed orders with JSON payload (used at mount and when applying filters)
    async function fetchCompletedWithFilters(filters: CompletedFilters, signal?: AbortSignal) {
        setLoading(true);
        setError(null);
        try {
            const headers = getAuthHeaders();
            const valid = await validateToken(headers, signal);
            if (!valid) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                setError('Session expired or not authenticated. Please sign in again.');
                setCompleted([]);
                return;
            }

            const body = {
                page: filters.page,
                callUuid: filters.callUuid || '',
                dateStart: filters.dateStart ?? null,
                dateEnd: filters.dateEnd ?? null,
                phoneNumber: filters.phoneNumber ?? '',
            };

            const res = await fetch(COMPLETED_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal,
            });

            if (!res.ok) throw new Error(`Completed HTTP ${res.status}`);
            const json = await res.json();
            const array: ApiOrder[] = Array.isArray(json) ? json : (json?.data ?? json?.result ?? []);
            const mapped = (array || []).map((a) => mapOrder(a, 'Completed'));
            setCompleted(mapped);
        } catch (err: any) {
            if (err && err.name === 'AbortError') return;
            setError(err?.message ?? 'Failed to load completed orders');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const ac = new AbortController();
        async function fetchAll() {
            try {
                setLoading(true);
                setError(null);
                const headers = getAuthHeaders();
                const valid = await validateToken(headers, ac.signal);
                if (!valid) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    setError('Session expired or not authenticated. Please sign in again.');
                    setActive([]);
                    setCompleted([]);
                    setSelected(null);
                    return;
                }

                // fetch active and completed (completed using the filters payload)
                const actPromise = fetch(ACTIVE_URL, { method: 'POST', headers, signal: ac.signal })
                    .then(async (r) => {
                        if (!r.ok) throw new Error(`Active HTTP ${r.status}`);
                        const jb = await r.json();
                        return Array.isArray(jb) ? jb : (jb?.data ?? jb?.result ?? []);
                    });

                const compPromise = fetch(COMPLETED_URL, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        page: completedFilters.page,
                        callUuid: completedFilters.callUuid || '',
                        dateStart: completedFilters.dateStart ?? null,
                        dateEnd: completedFilters.dateEnd ?? null,
                        phoneNumber: completedFilters.phoneNumber ?? '',
                    }),
                    signal: ac.signal,
                }).then(async (r) => {
                    if (!r.ok) throw new Error(`Completed HTTP ${r.status}`);
                    const jb = await r.json();
                    return Array.isArray(jb) ? jb : (jb?.data ?? jb?.result ?? []);
                });

                const [actArray, compArray] = await Promise.all([actPromise, compPromise]) as [ApiOrder[], ApiOrder[]];

                const mappedActive = (actArray || []).map((a) => mapOrder(a, 'Active'));
                const mappedCompleted = (compArray || []).map((a) => mapOrder(a, 'Completed'));

                setActive(mappedActive);
                setCompleted(mappedCompleted);
                // do not auto-open any order on initial load
                setSelected(null);

            } catch (err: any) {
                if (err?.name !== 'AbortError') setError(err?.message ?? 'Failed to load orders');
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
        return () => ac.abort();
    }, []); // run once on mount

    // new: debounce completed-filters changes (500ms) and auto-fetch when on Completed tab
    useEffect(() => {
        if (tab !== 'Completed') return;
        const filtersAreDefault =
            completedFilters.page === defaultCompletedFilters.page &&
            (completedFilters.callUuid ?? '') === (defaultCompletedFilters.callUuid ?? '') &&
            (completedFilters.dateStart ?? null) === (defaultCompletedFilters.dateStart ?? null) &&
            (completedFilters.dateEnd ?? null) === (defaultCompletedFilters.dateEnd ?? null) &&
            (completedFilters.phoneNumber ?? '') === (defaultCompletedFilters.phoneNumber ?? '');

        const hasPrefetch = !!localStorage.getItem(PREFETCH_COMPLETED_KEY);
        if (filtersAreDefault && (completed.length > 0 || hasPrefetch)) {
            // skip network fetch when switching tab if we already have data
            return;
        }

        const ac = new AbortController();
        const id = setTimeout(() => {
            fetchCompletedWithFilters(completedFilters, ac.signal);
        }, 500);
        return () => {
            clearTimeout(id);
            ac.abort();
        };
    }, [completedFilters, tab, completed.length]);

    const shown = tab === 'Active' ? active : completed;

    const handleAccept = async (order: Order | null) => {
        if (!order) return;
        // TODO: call API to accept/update order status
        console.log('Accept', order.id);
        setSelected(null);
    };

    const handleDecline = async (order: Order | null) => {
        if (!order) return;
        // TODO: call API to decline/update order status
        console.log('Decline', order.id);
        setSelected(null);
    };

    return (
        <div className="flex w-full bg-background-light min-h-[calc(100vh-1rem)] gap-6">
            {/* Left: filters + table — add right margin when details panel is open so content collapses */}
            <div className={`flex-1 flex flex-col gap-4 px-10 py-8 transition-all duration-300 ${selected ? 'mr-[400px]' : ''}`}>
                {/* Page Heading (matched to provided HTML) */}
                <div className="flex flex-wrap justify-between items-end gap-3 mb-2">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[#0e101b] text-4xl font-black leading-tight tracking-[-0.033em]">Orders Overview</h1>
                        {/* heading count or skeleton */}
                        {/* {loading ? (
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        ) : (
                            <p className="text-[#505795] text-base font-semibold">{`${shown.length} ${tab.toLowerCase()} orders`}</p>
                        )} */}
                    </div>
                    {/* <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8e9f3] rounded-lg text-sm font-bold text-[#0e101b] hover:bg-[#f8f9fb] transition-colors">
                        <Download className="w-4 h-4 text-black" />
                        <span>Export CSV</span>
                    </button> */}
                </div>

                {/* Tabs & Filters — styled like attached image */}
                <div className="flex flex-col gap-4 bg-white rounded-xl border border-[#e8e9f3] p-4 mb-2">
                    {/* Tabs row: remove bottom border when Active */}
                    <div className="flex gap-8 border-b border-[#e8e9f3]">
                        <a
                            className={`flex items-center gap-1 border-b-2 pb-2 font-bold text-sm ${tab === 'Active' ? 'border-primary text-[#2437e0]' : 'border-transparent text-[#505795]'}`}
                            href="#"
                            onClick={(e) => { e.preventDefault(); setTab('Active'); setSelected(null); }}
                        >
                            <span>Active</span>
                            <span className="ml-1 inline-flex items-center justify-center px-2 py-0 rounded-full text-sm font-bold text-[#2437e0] bg-[#eef2ff]">
                                {active.length}
                            </span>
                        </a>
                        <a
                            className={`flex items-center gap-1 border-b-2 pb-2 font-bold text-sm ${tab === 'Completed' ? 'border-primary text-blue-700' : 'border-transparent text-[#505795]'}`}
                            href="#"
                            onClick={(e) => { e.preventDefault(); setTab('Completed'); setSelected(null); }}
                        >
                            <span>Completed</span>
                            <span className="ml-1 inline-flex items-center justify-center px-2 py-0 rounded-full text-sm font-bold text-[#0b875b] bg-[#ecfdf3]">
                                {completed.length}
                            </span>
                        </a>
                    </div>

                    {/* Filters row: only render for Completed to avoid extra space when Active */}
                    <div className="flex gap-3 flex-wrap">
                        {/* ...completed-only filters... */}
                        {loading ? (
                            <>
                                <div className="h-9 w-40 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-9 w-40 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-9 w-40 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-9 w-40 bg-gray-200 rounded animate-pulse"></div>
                                <div className="flex-1" />
                                <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </>
                        ) : (
                            <>
                                <input
                                    value={completedFilters.phoneNumber}
                                    onChange={(e) => setCompletedFilters({ ...completedFilters, phoneNumber: e.target.value })}
                                    placeholder="Phone number"
                                    className="h-9 px-3 rounded-lg border border-[#e8e9f3] bg-white text-sm text-[#0e101b]"
                                />
                                <input
                                    value={completedFilters.callUuid}
                                    onChange={(e) => setCompletedFilters({ ...completedFilters, callUuid: e.target.value })}
                                    placeholder="Call UUID"
                                    className="h-9 px-3 rounded-lg border border-[#e8e9f3] bg-white text-sm text-[#0e101b]"
                                />
                                <input
                                    type="date"
                                    value={completedFilters.dateStart ?? ''}
                                    onChange={(e) => setCompletedFilters({ ...completedFilters, dateStart: e.target.value || null })}
                                    className="h-9 px-3 rounded-lg border border-[#e8e9f3] bg-white text-sm text-[#0e101b]"
                                />
                                <input
                                    type="date"
                                    value={completedFilters.dateEnd ?? ''}
                                    onChange={(e) => setCompletedFilters({ ...completedFilters, dateEnd: e.target.value || null })}
                                    className="h-9 px-3 rounded-lg border border-[#e8e9f3] bg-white text-sm text-[#0e101b]"
                                />
                                <div className="flex-1" />
                                <button
                                    className="flex items-center gap-2 text-blue-700 text-sm font-bold cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setCompletedFilters(defaultCompletedFilters);
                                        fetchCompletedWithFilters(defaultCompletedFilters);
                                    }}
                                >
                                    Clear All
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Table (replaces card list) */}
                <div className="flex-1 @container">
                    <div className="flex overflow-hidden rounded-xl border border-[#d1d3e6] bg-white shadow-sm">
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-[#f8f9fb] border-b border-[#d1d3e6]">
                                    <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/4">Date/Time</th>
                                    <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/6">Customer</th>
                                    <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/12">Phone</th>
                                    <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/12">Status</th>
                                    <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/2">Items</th>
                                    {/* <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/12">Order #</th> */}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#d1d3e6]">
                                {error ? (
                                    <tr><td colSpan={6} className="px-6 py-6 text-center text-sm text-red-600">Error: {error}</td></tr>
                                ) : loading ? (
                                    // skeleton table rows
                                    <>
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <tr key={`skeleton-${i}`}>
                                                <td className="px-6 py-5">
                                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : shown.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-6 text-center text-sm text-[#505795]">No orders</td></tr>
                                ) : (
                                    shown.map((o) => {
                                        const isSelected = selected?.id === o.id;
                                        const itemsShort = (o.items || []).map(it => `${it.qty}× ${it.name}`).join(', ');
                                        return (
                                            <tr
                                                key={o.id}
                                                onClick={() => setSelected(o)}
                                                className={`hover:bg-primary/5 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-l-4 border-l-blue-700' : ''}`}
                                            >
                                                <td className="px-6 py-5 text-sm font-medium text-[#0e101b]">{o.dateTime}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-[#0e101b]">{o.customer}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-[#505795]">{o.phone ?? ''}</td>
                                                <td className="px-6 py-5">
                                                    <div className={`flex items-center gap-1.5 ${statusText(o.status)} ${statusBadge(o.status)} px-2 py-1 rounded-full w-fit`}>
                                                        <span className={`size-2 w-2 h-2 rounded-full ${statusDot(o.status)}`} />
                                                        <span className="text-xs font-bold uppercase">{statusLabel(o.status)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-[#505795] italic">{itemsShort || (o.transcription ? `${o.transcription.substring(0, 60)}…` : 'N/A')}</td>
                                                {/* <td className="px-6 py-5 text-sm text-[#505795] italic">{o.orderNo ?? '-'}</td> */}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Right: detail panel (only when selected) */}
            {selected && (
                <aside className="fixed right-0 top-0 bottom-0 w-[400px] border-l border-[#e8e9f3] bg-white overflow-hidden z-50">
                    <div className="flex flex-col h-full">
                        {/* scrollable content */}
                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            {/* header */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-extrabold text-[#0e101b]">Order Details</h3>
                                    <p className="text-xs text-[#505795] uppercase tracking-widest mt-1">{selected.orderNo ? `#${selected.orderNo}` : selected.id}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-[#f8f9fb] cursor-pointer" aria-label="Close">
                                    <X className="text-black" />
                                </button>
                            </div>

                            {/* customer card (fixed: prevent overflow, ensure avatar stays circular and text wraps) */}
                            {loading ? (
                                <div className="space-y-3">
                                    <div className="h-14 w-48 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-36 bg-gray-100 rounded animate-pulse" />
                                </div>
                            ) : (
                                <div className="bg-primary/5 rounded-xl p-5 border border-[#e8e9f3] overflow-hidden">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 h-14 w-14 rounded-full bg-blue-700 flex items-center justify-center text-white text-2xl font-black">
                                            {((selected.customer ?? 'G')
                                                .toString()
                                                .trim()
                                                .split(/\s+/)
                                                .filter(Boolean)
                                                .map(s => s.charAt(0).toUpperCase())
                                                .slice(0, 2)
                                                .join('')) || 'G'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-lg font-bold text-[#0e101b] break-words">{selected.customer}</div>
                                            <div className="text-sm text-[#505795]">{selected.phone ?? ''}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-[#505795] mt-4 break-words whitespace-normal">{selected.transcription}</div>
                                </div>
                            )}

                            {/* audio player block (always rendered; end timer starts at 0 until metadata loads) */}
                            <div className="w-full min-w-0 mb-3">
                                <audio ref={audioRef} preload="auto" className="hidden" />
                                {audioError && <div className="text-xs text-red-600 mt-2">Error loading recording</div>}

                                {/* always-rendered player container; controls disabled until audioSrc is ready */}
                                <div className="flex flex-col border border-[#e8e9f3] rounded-lg pt-6 p-3">
                                    {/* single-line: [current time] [progress bar (flex-1)] [duration] */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs text-slate-900 text-right tabular-nums">{formatTime(curTime)}</div>
                                        <div
                                            className={`flex-1 h-2 rounded-full cursor-pointer overflow-hidden ${audioSrc ? 'bg-blue-50' : 'bg-gray-100'}`}
                                            onClick={(e) => {
                                                if (!audioSrc) return;
                                                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                                                onSeek(pos * (duration || 0));
                                            }}
                                        >
                                            <div className="h-full bg-blue-700 rounded-full" style={{ width: `${duration ? (curTime / duration) * 100 : 0}%` }} />
                                        </div>
                                        <div className="text-xs text-slate-900 text-left tabular-nums">{formatTime(duration)}</div>
                                    </div>

                                    {/* controls row below: left buttons + right volume */}
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleRewind}
                                                aria-label="Rewind 5s"
                                                disabled={!audioSrc}
                                                className={`p-2 rounded-md ${audioSrc ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer' : 'text-slate-400 bg-transparent cursor-not-allowed'}`}
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6L11 18zM21 6v12l-8.5-6L21 6z" /></svg>
                                            </button>
                                            <button
                                                onClick={togglePlay}
                                                aria-label={isPlaying ? 'Pause' : 'Play'}
                                                disabled={!audioSrc}
                                                className={`p-2 rounded-md ${audioSrc ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer' : 'text-slate-400 bg-transparent cursor-not-allowed'}`}
                                            >
                                                {isPlaying ? (
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v18l15-9L5 3z" /></svg>
                                                )}
                                            </button>
                                            <button
                                                onClick={handleForward}
                                                aria-label="Forward 5s"
                                                disabled={!audioSrc}
                                                className={`p-2 rounded-md ${audioSrc ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer' : 'text-slate-400 bg-transparent cursor-not-allowed'}`}
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13 18V6l8.5 6L13 18zM3 6v12l8.5-6L3 6z" /></svg>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={toggleMute}
                                                aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                                                disabled={!audioSrc}
                                                className={`p-2 rounded-md ${audioSrc ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer' : 'text-slate-400 bg-transparent cursor-not-allowed'}`}
                                            >
                                                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                            </button>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                step={1}
                                                value={volume}
                                                onChange={(e) => setVolume(Number(e.target.value))}
                                                aria-label="volume"
                                                disabled={!audioSrc}
                                                className={`w-28 h-1 ${audioSrc ? 'accent-blue-600 cursor-pointer' : 'accent-slate-400 cursor-not-allowed'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* items list */}
                            <div className="py-2 border-b border-[#e8e9f3]">
                                <h4 className="font-semibold text-sm text-[#0e101b] mb-2">Items</h4>
                                <ul className="space-y-2 text-sm text-[#505795]">
                                    {(selected.items || []).map((it, idx) => (
                                        <li key={idx} className="flex justify-between">
                                            <span>{it.qty}× {it.name}{it.modifier ? ` (${it.modifier})` : ''}</span>
                                            <span className="text-[#0e101b] font-medium">{it.size ?? ''}</span>
                                        </li>
                                    ))}
                                    {selected.items?.length === 0 && <li className="italic">No items listed</li>}
                                </ul>
                            </div>

                            {/* details */}
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between items-center py-2 border-b border-[#e8e9f3]">
                                    <span className="text-sm text-[#505795]">Status</span>
                                    <div className="flex items-center gap-1">
                                        <div className={`flex items-center gap-1.5 ${statusText(selected.status)} ${statusBadge(selected.status)} px-2 py-1 rounded-lg w-fit`}>
                                            <span className={`size-2 w-2 h-2 rounded-full ${statusDot(selected.status)}`} />
                                            <span className="text-xs font-bold uppercase">{statusLabel(selected.status)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-[#505795]">Time</span>
                                    <span className="text-sm font-bold text-[#0e101b]">{selected.dateTime ?? '-'}</span>
                                </div>
                                {selected.prepTime && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e9f3]">
                                        <span className="text-sm text-[#505795]">Prep Time</span>
                                        <span className="text-sm font-bold text-[#0e101b]">{selected.prepTime}</span>
                                    </div>
                                )}
                                {selected.orderTotal && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-[#505795]">Total</span>
                                        <span className="text-sm font-bold text-[#0e101b]">${selected.orderTotal}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* footer pinned at bottom; never scrolls with content */}
                        <div className="border-t border-[#e8e9f3] bg-white p-6 grid grid-cols-2 gap-3">
                            {loading ? (
                                <>
                                    <div className="h-11 rounded-lg bg-gray-200 animate-pulse" />
                                    <div className="h-11 rounded-lg bg-gray-200 animate-pulse" />
                                </>
                            ) : (
                                // For Active orders show Decline / Accept. For Completed (or other statuses) show no actions.
                                <>
                                    {selected?.status?.toString().toLowerCase() === 'active' ? (
                                        <>
                                            <button
                                                onClick={() => handleDecline(selected)}
                                                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-red-500 cursor-pointer text-red-600 text-sm font-bold hover:bg-red-50"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={() => handleAccept(selected)}
                                                className="flex items-center justify-center gap-2 h-11 rounded-lg bg-blue-700 text-white cursor-pointer text-sm font-bold hover:bg-blue-800"
                                            >
                                                Accept
                                            </button>
                                        </>
                                    ) : (
                                        // no buttons for completed or non-active orders: render empty placeholders to preserve layout
                                        <>
                                            <div className="col-span-2" />
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </aside>
            )}
        </div>
    );
}


