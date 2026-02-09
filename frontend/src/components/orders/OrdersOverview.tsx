import { Calendar, Download, Filter, MapPin, X } from 'lucide-react';
import { useEffect, useState, type JSX } from 'react';

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
    switch ((status || '').toLowerCase()) {
        case 'active':
            return 'text-amber-600 bg-amber-50';
        case 'completed':
            return 'text-green-600 bg-green-50';
        case 'cancelled':
            return 'text-red-600 bg-red-50';
        default:
            return 'text-gray-600 bg-gray-50';
    }
}

// new: return dot color class for the small indicator
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

export default function OrdersOverview(): JSX.Element {
    const [active, setActive] = useState<Order[]>([]);
    const [completed, setCompleted] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Order | null>(null);
    const [tab, setTab] = useState<'Active' | 'Completed'>('Active');

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

                // fetch active and completed (both as POST to match portal)
                const [actRes, compRes] = await Promise.all([
                    fetch(ACTIVE_URL, { method: 'POST', headers, signal: ac.signal }),
                    fetch(COMPLETED_URL, { method: 'POST', headers, signal: ac.signal }),
                ]);

                if (!actRes.ok) throw new Error(`Active HTTP ${actRes.status}`);
                if (!compRes.ok) throw new Error(`Completed HTTP ${compRes.status}`);

                const actBody = await actRes.json();
                const compBody = await compRes.json();

                // active might be an array; completed might be { data: [...] }
                const actArray: ApiOrder[] = Array.isArray(actBody) ? actBody : (actBody?.data ?? actBody?.result ?? []);
                const compArray: ApiOrder[] = Array.isArray(compBody) ? compBody : (compBody?.data ?? compBody?.result ?? []);

                const mappedActive = (actArray || []).map((a) => mapOrder(a, 'Active'));
                const mappedCompleted = (compArray || []).map((a) => mapOrder(a, 'Completed'));

                setActive(mappedActive);
                setCompleted(mappedCompleted);
                if (mappedActive.length > 0) setSelected(mappedActive[0]);
            } catch (err: any) {
                if (err.name !== 'AbortError') setError(err.message ?? 'Failed to load orders');
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
        return () => ac.abort();
    }, []);

    const shown = tab === 'Active' ? active : completed;

    return (
        <div className="flex w-full bg-background-light min-h-[calc(100vh-1rem)] gap-6">
            {/* Left: filters + table — add right margin when details panel is open so content collapses */}
            <div className={`flex-1 flex flex-col gap-4 px-10 py-8 transition-all duration-300 ${selected ? 'mr-[400px]' : ''}`}>
                {/* Page Heading (matched to provided HTML) */}
                <div className="flex flex-wrap justify-between items-end gap-3 mb-2">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[#0e101b] text-4xl font-black leading-tight tracking-[-0.033em]">Orders</h1>
                        <p className="text-[#505795] text-base font-semibold">{loading ? 'Loading…' : `${shown.length} ${tab.toLowerCase()} orders`}</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8e9f3] rounded-lg text-sm font-bold text-[#0e101b] hover:bg-[#f8f9fb] transition-colors">
                        <Download className="w-4 h-4 text-black" />
                        <span>Export CSV</span>
                    </button>
                </div>

                {/* Tabs & Filters — styled like attached image */}
                <div className="flex flex-col gap-4 bg-white rounded-xl border border-[#e8e9f3] p-4 mb-6">
                    {/* Tabs row */}
                    <div className="flex border-b border-[#e8e9f3] gap-8">
                        <a className={`flex items-center border-b-2 pb-3 pt-2 font-bold text-sm ${tab === 'Active' ? 'border-primary text-blue-700' : 'border-transparent text-[#505795]'}`} href="#" onClick={(e) => { e.preventDefault(); setTab('Active'); }}>
                            Active
                        </a>
                        <a className={`flex items-center border-b-2 pb-3 pt-2 font-bold text-sm ${tab === 'Completed' ? 'border-primary text-blue-700' : 'border-transparent text-[#505795]'}`} href="#" onClick={(e) => { e.preventDefault(); setTab('Completed'); }}>
                            Completed
                        </a>
                    </div>

                    {/* Filters row */}
                    <div className="flex gap-3 flex-wrap">
                        <button className="flex h-9 items-center justify-center gap-x-2 rounded-lg bg-[#e8e9f3] px-4 hover:bg-primary/10 transition-colors">
                            <Calendar className="w-4 h-4 text-black" />
                            <p className="text-[#0e101b] text-sm font-medium">Today</p>
                            <span className="text-[18px]">▾</span>
                        </button>
                        <button className="flex h-9 items-center justify-center gap-x-2 rounded-lg bg-[#e8e9f3] px-4 hover:bg-primary/10 transition-colors">
                            <MapPin className="w-4 h-4 text-black" />
                            <p className="text-[#0e101b] text-sm font-medium">Location</p>
                            <span className="text-[18px]">▾</span>
                        </button>
                        <button className="flex h-9 items-center justify-center gap-x-2 rounded-lg bg-[#e8e9f3] px-4 hover:bg-primary/10 transition-colors">
                            <Filter className="w-4 h-4 text-black" />
                            <p className="text-[#0e101b] text-sm font-medium">Status: All</p>
                            <span className="text-[18px]">▾</span>
                        </button>
                        {/* <button className="flex h-9 items-center justify-center gap-x-2 rounded-lg bg-[#e8e9f3] px-4 hover:bg-primary/10 transition-colors">
                            <Users className="w-4 h-4 text-black" />
                            <p className="text-[#0e101b] text-sm font-medium">Party Size: All</p>
                            <span className="text-[18px]">▾</span>
                        </button> */}

                        <div className="flex-1" />
                        <button className="flex items-center gap-2 text-blue-700 text-sm font-bold">Clear All</button>
                    </div>
                </div>

                {/* Table (replaces card list) */}
                <div className="flex-1 @container">
                    <div className="flex overflow-hidden rounded-xl border border-[#d1d3e6] bg-white shadow-sm">
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-[#f8f9fb] border-b border-[#d1d3e6]">
                                    <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/6">Date/Time</th>
                                    <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/6">Customer</th>
                                    <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/12">Phone</th>
                                    <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/2">Items</th>
                                    <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/12">Status</th>
                                    <th className="px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider w-1/12">Order #</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#d1d3e6]">
                                {error ? (
                                    <tr><td colSpan={6} className="px-6 py-6 text-center text-sm text-red-600">Error: {error}</td></tr>
                                ) : loading ? (
                                    <tr><td colSpan={6} className="px-6 py-6 text-center text-sm text-[#505795]">Loading orders…</td></tr>
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
                                                <td className="px-6 py-5 text-sm text-[#505795] italic">{itemsShort || (o.transcription ? `${o.transcription.substring(0, 60)}…` : 'N/A')}</td>
                                                <td className="px-6 py-5">
                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${statusBadge(o.status)}`}>
                                                        <span className="size-2 rounded-full" style={{ backgroundColor: statusDot(o.status).replace('bg-', '') ? undefined : undefined }} />
                                                        <span className="text-xs font-bold uppercase">{statusLabel(o.status)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-[#505795] italic">{o.orderNo ?? '-'}</td>
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
                <aside className="fixed right-0 top-0 h-screen w-[400px] border-l border-[#e8e9f3] bg-white overflow-hidden z-50">
                    {/* non-scrollable content area (clipped if too tall) */}
                    <div className="p-6 flex flex-col gap-6 h-full overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-[#0e101b]">Order Details</h3>
                                <p className="text-xs text-[#505795] uppercase tracking-widest mt-1">{selected.orderNo ? `#${selected.orderNo}` : selected.id}</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-[#f8f9fb]" aria-label="Close">
                                <X className="text-black" />
                            </button>
                        </div>

                        <div className="bg-[#f1f5f9] rounded-xl p-5 border border-primary/10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="size-16 rounded-full bg-blue-700 flex items-center justify-center text-white text-2xl font-black">
                                    {(selected.customer || 'G').split(' ').map((s) => s[0]).slice(0, 2).join('')}
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-[#0e101b]">{selected.customer}</div>
                                    <div className="text-sm text-[#505795]">{selected.phone ?? ''}</div>
                                    {selected.recording && <a className="text-sm text-primary underline block mt-1" href={selected.recording} target="_blank" rel="noreferrer">Play recording</a>}
                                </div>
                            </div>
                            <div className="text-sm text-[#505795]">{selected.transcription}</div>
                        </div>

                        <div className="pt-2">
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

                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center py-2 border-b border-[#e8e9f3]">
                                <span className="text-sm text-[#505795]">Status</span>
                                <span className="text-sm font-bold text-[#0e101b]">{selected.status}</span>
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

                        {/* spacer prevents content from overlapping footer */}
                        <div className="flex-1" />
                    </div>

                    {/* footer pinned to bottom, always visible */}
                    <div className="absolute left-0 right-0 bottom-0 p-6 border-t border-[#e8e9f3] bg-white grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 h-11 rounded-lg border border-gray-500 text-[#0e101b] text-sm font-bold hover:bg-[#f8f9fb]">
                            Modify
                        </button>
                        <button className="flex items-center justify-center gap-2 h-11 rounded-lg bg-blue-700 text-white text-sm font-bold hover:bg-primary/90">
                            Mark Done
                        </button>
                    </div>
                </aside>
            )}
        </div>
    );
}
