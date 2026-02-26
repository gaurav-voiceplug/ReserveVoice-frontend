import axios, { type CancelToken } from 'axios';
import { useEffect, useState, type JSX } from 'react';
import client from '../../lib/axiosClient';
import axiosInstance, { getAuthHeaders } from '../../utils/axiosInstance';
import DataTable, { type Column } from '../common/DataTable';
import DetailPanel from '../common/DetailPanel';
import FilterBar, { type TabDef } from '../common/FilterBar';
import PageHeader from '../common/PageHeader';
import { useAudioPlayer } from '../common/useAudioPlayer';
import { statusBadge, statusDot, statusLabel, statusText } from '../common/orderHelpers';

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

function buildAxiosConfig(headers: Record<string, string>, cancelToken?: any) {
    const cfg: Record<string, any> = { headers };
    if (cancelToken) {
        const maybe = cancelToken as any;
        if (maybe && (maybe.aborted !== undefined || typeof maybe.aborted === 'boolean')) {
            cfg.signal = cancelToken as AbortSignal;
        } else {
            cfg.cancelToken = cancelToken;
        }
    }
    return cfg;
}

function mapOrder(a: ApiOrder, status: Order['status']): Order {
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

function buildRecordingUrl(recording: string) {
    if (!recording) return '';
    if (/^https?:\/\//i.test(recording)) return recording;
    return `https://vplite-stg.voiceplug.ai/api/recordings/stg/orders/${recording}`;
}

const PREFETCH_COMPLETED_KEY = 'prefetchedCompletedOrders';

type CompletedFilters = {
    page: number;
    callUuid: string;
    dateStart: string | null;
    dateEnd: string | null;
    phoneNumber: string;
    locationIds?: string[];
};

const defaultCompletedFilters: CompletedFilters = {
    page: 0,
    callUuid: '',
    dateStart: null,
    dateEnd: null,
    phoneNumber: '',
    locationIds: [],
};

export default function OrdersOverview(): JSX.Element {
    const [active, setActive] = useState<Order[]>([]);
    const [completed, setCompleted] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Order | null>(null);
    const [tab, setTab] = useState<'Active' | 'Completed'>('Active');
    const [completedFilters, setCompletedFilters] = useState<CompletedFilters>(defaultCompletedFilters);

    const audio = useAudioPlayer();

    // Fetch and set audio blob URL when selected recording changes
    useEffect(() => {
        const source = axios.CancelToken.source();
        let blobUrl: string | null = null;
        audio.setAudioSrc(null);
        audio.setAudioError(null);
        if (!selected?.recording) return;
        const url = buildRecordingUrl(selected.recording);
        const headers = getAuthHeaders();

        axiosInstance
            .get(url, { headers, cancelToken: source.token, responseType: 'blob' })
            .then((res) => {
                if (res.status >= 400) throw new Error(`Audio ${res.status}`);
                blobUrl = URL.createObjectURL(res.data);
                audio.setAudioSrc(blobUrl);
            })
            .catch((err) => {
                if (axios.isCancel(err)) return;
                audio.setAudioError(err?.message ?? 'Failed to load recording');
                audio.setAudioSrc(null);
            });

        return () => {
            source.cancel('audio effect cleanup');
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [selected?.recording]);

    function fetchCompletedWithFilters(filters: CompletedFilters, cancelToken?: CancelToken | AbortSignal) {
        setLoading(true);
        setError(null);

        const headers = getAuthHeaders();
        const body = {
            page: filters.page,
            callUuid: filters.callUuid || '',
            dateStart: filters.dateStart ?? null,
            dateEnd: filters.dateEnd ?? null,
            phoneNumber: filters.phoneNumber ?? '',
            locationIds: filters.locationIds ?? [],
        };
        const cfg = buildAxiosConfig(headers, cancelToken);

        return client.post('/orders/getCompletedOrder', body, cfg)
            .then((res) => {
                const json = res.data;
                const array: ApiOrder[] = Array.isArray(json) ? json : (json?.data ?? json?.result ?? []);
                setCompleted((array || []).map((a) => mapOrder(a, 'Completed')));
            })
            .catch((err) => {
                if (axios.isCancel(err)) return;
                if (err?.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    setError('Session expired or not authenticated. Please sign in again.');
                    setCompleted([]);
                    return;
                }
                setError(err?.message ?? 'Failed to load completed orders');
            })
            .finally(() => setLoading(false));
    }

    // Initial data fetch
    useEffect(() => {
        const source = axios.CancelToken.source();
        setLoading(true);
        setError(null);

        const headers = getAuthHeaders();
        const actPromise = axiosInstance
            .post('/orders/getActiveOrder', {}, { headers, cancelToken: source.token })
            .then((r) => (r.status >= 400 ? Promise.reject(new Error(`Active HTTP ${r.status}`)) : (Array.isArray(r.data) ? r.data : (r.data?.data ?? r.data?.result ?? []))));
        const compBody = {
            page: completedFilters.page,
            callUuid: completedFilters.callUuid || '',
            dateStart: completedFilters.dateStart ?? null,
            dateEnd: completedFilters.dateEnd ?? null,
            phoneNumber: completedFilters.phoneNumber ?? '',
            locationIds: completedFilters.locationIds ?? [],
        };
        const compPromise = axiosInstance
            .post('/orders/getCompletedOrder', compBody, { headers, cancelToken: source.token })
            .then((r) => (r.status >= 400 ? Promise.reject(new Error(`Completed HTTP ${r.status}`)) : (Array.isArray(r.data) ? r.data : (r.data?.data ?? r.data?.result ?? []))));

        Promise.all([actPromise, compPromise])
            .then((res) => {
                const [actArray, compArray] = res as [ApiOrder[], ApiOrder[]];
                setActive((actArray || []).map((a) => mapOrder(a, 'Active')));
                setCompleted((compArray || []).map((a) => mapOrder(a, 'Completed')));
                setSelected(null);
            })
            .catch((err) => {
                if (axios.isCancel(err)) return;
                if (err?.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    setError('Session expired or not authenticated. Please sign in again.');
                    setActive([]);
                    setCompleted([]);
                    setSelected(null);
                    return;
                }
                setError(err?.message ?? 'Failed to load orders');
            })
            .finally(() => setLoading(false));

        return () => source.cancel('component unmounted');
    }, []);

    // Debounced re-fetch when completed filters change
    useEffect(() => {
        if (tab !== 'Completed') return;
        const filtersAreDefault =
            completedFilters.page === defaultCompletedFilters.page &&
            (completedFilters.callUuid ?? '') === (defaultCompletedFilters.callUuid ?? '') &&
            (completedFilters.dateStart ?? null) === (defaultCompletedFilters.dateStart ?? null) &&
            (completedFilters.dateEnd ?? null) === (defaultCompletedFilters.dateEnd ?? null) &&
            (completedFilters.phoneNumber ?? '') === (defaultCompletedFilters.phoneNumber ?? '');

        const hasPrefetch = !!localStorage.getItem(PREFETCH_COMPLETED_KEY);
        if (filtersAreDefault && (completed.length > 0 || hasPrefetch)) return;

        const source = axios.CancelToken.source();
        const id = setTimeout(() => {
            fetchCompletedWithFilters(completedFilters, source.token);
        }, 500);
        return () => {
            clearTimeout(id);
            source.cancel('debounce cleanup');
        };
    }, [completedFilters, tab, completed.length]);

    const shown = tab === 'Active' ? active : completed;

    const orderColumns: Column<Order>[] = [
        {
            header: 'Date/Time',
            headerClassName: 'w-1/4',
            width: '25%',
            render: (o) => <span className="text-sm font-medium text-[#0e101b]">{o.dateTime}</span>,
        },
        {
            header: 'Customer',
            headerClassName: 'w-1/6',
            width: '16.67%',
            render: (o) => <span className="text-sm font-semibold text-[#0e101b]">{o.customer}</span>,
        },
        {
            header: 'Phone',
            headerClassName: 'w-1/12',
            width: '8.33%',
            render: (o) => <span className="text-sm text-[#505795]">{o.phone ?? ''}</span>,
        },
        {
            header: 'Status',
            headerClassName: 'w-1/12',
            width: '8.33%',
            render: (o) => (
                <div className={`flex items-center gap-1.5 ${statusText(o.status)} ${statusBadge(o.status)} px-2 py-1 rounded-full w-fit`}>
                    <span className={`w-2 h-2 rounded-full ${statusDot(o.status)}`} />
                    <span className="text-xs font-bold uppercase">{statusLabel(o.status)}</span>
                </div>
            ),
        },
        {
            header: 'Items',
            headerClassName: 'w-1/2',
            width: '41.67%',
            render: (o) => {
                const itemsShort = (o.items || []).map((it: any) => `${it.qty}× ${it.name}`).join(', ');
                return <span className="text-sm text-[#505795] italic">{itemsShort || (o.transcription ? `${o.transcription.substring(0, 60)}…` : 'N/A')}</span>;
            },
        },
    ];

    const tabs: TabDef[] = [
        { key: 'Active', label: 'Active', count: active.length, badgeActiveClass: 'text-[#2437e0] bg-[#eef2ff]' },
        { key: 'Completed', label: 'Completed', count: completed.length, badgeActiveClass: 'text-[#0b875b] bg-[#ecfdf3]' },
    ];

    const handleTabChange = (t: string) => {
        setTab(t as 'Active' | 'Completed');
        setSelected(null);
    };

    const handleDateRangeChange = (start: string | null, end: string | null) => {
        const updated = { ...completedFilters, dateStart: start, dateEnd: end };
        setCompletedFilters(updated);
        if (tab === 'Completed') fetchCompletedWithFilters(updated);
    };

    const handleClearAll = () => {
        setCompletedFilters(defaultCompletedFilters);
        fetchCompletedWithFilters(defaultCompletedFilters);
    };

    // Detail panel parts
    const detailChildren = selected ? (
        <>
            {/* Items list */}
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

            {/* Meta rows */}
            <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-[#e8e9f3]">
                    <span className="text-sm text-[#505795]">Status</span>
                    <div className={`flex items-center gap-1.5 ${statusText(selected.status)} ${statusBadge(selected.status)} px-2 py-1 rounded-lg w-fit`}>
                        <span className={`w-2 h-2 rounded-full ${statusDot(selected.status)}`} />
                        <span className="text-xs font-bold uppercase">{statusLabel(selected.status)}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-[#505795]">Time</span>
                    <span className="text-sm font-bold text-[#505795] italic">{selected.dateTime ?? '-'}</span>
                </div>
                {selected.prepTime && (
                    <div className="flex justify-between items-center pb-2 border-b border-[#e8e9f3]">
                        <span className="text-sm text-[#505795]">Prep Time</span>
                        <span className="text-sm font-bold text-[#505795] italic">{selected.prepTime}</span>
                    </div>
                )}
                {selected.orderTotal && (
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-[#505795]">Total</span>
                        <span className="text-sm font-bold text-[#0e101b]">${selected.orderTotal}</span>
                    </div>
                )}
            </div>
        </>
    ) : null;

    const detailFooter = selected?.status?.toString().toLowerCase() === 'active' ? (
        <>
            <button
                onClick={() => setSelected(null)}
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-red-500 cursor-pointer text-red-600 text-sm font-bold hover:bg-red-50"
            >
                Decline
            </button>
            <button
                onClick={() => setSelected(null)}
                className="flex items-center justify-center gap-2 h-11 rounded-lg bg-blue-700 text-white cursor-pointer text-sm font-bold hover:bg-blue-800"
            >
                Accept
            </button>
        </>
    ) : (
        <div className="col-span-2" />
    );

    return (
        <div className="flex w-full bg-background-light h-[calc(100vh-1rem)] overflow-hidden gap-6">
            <div className={`flex-1 min-h-0 flex flex-col gap-4 px-10 py-8 overflow-hidden transition-all duration-300 ${selected ? 'mr-[380px]' : ''}`}>
                <PageHeader title="Orders Overview" />

                <FilterBar
                    tabs={tabs}
                    activeTab={tab}
                    onTabChange={handleTabChange}
                    loading={loading}
                    dateStart={completedFilters.dateStart}
                    dateEnd={completedFilters.dateEnd}
                    onDateRangeChange={handleDateRangeChange}
                    locationIds={completedFilters.locationIds ?? []}
                    onLocationChange={(ids) => setCompletedFilters((p) => ({ ...p, locationIds: ids }))}
                    phoneNumber={completedFilters.phoneNumber}
                    onPhoneChange={(phone) => setCompletedFilters((p) => ({ ...p, phoneNumber: phone }))}
                    onClearAll={handleClearAll}
                />

                <DataTable
                    columns={orderColumns}
                    rows={shown}
                    loading={loading}
                    error={error}
                    selectedId={selected?.id ?? null}
                    onSelect={(o) => setSelected(o)}
                    emptyMessage="No orders"
                />
            </div>

            {selected && (
                <DetailPanel
                    title="Order Details"
                    idLabel={selected.orderNo ? `#${selected.orderNo}` : selected.id}
                    onClose={() => setSelected(null)}
                    customer={{
                        name: selected.customer,
                        phone: selected.phone,
                        note: selected.transcription,
                    }}
                    loading={loading}
                    audio={audio}
                    footer={detailFooter}
                >
                    {detailChildren}
                </DetailPanel>
            )}
        </div>
    );
}
