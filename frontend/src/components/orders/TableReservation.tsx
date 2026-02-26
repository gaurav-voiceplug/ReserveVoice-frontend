import axios from 'axios';
import { useEffect, useState, type JSX } from 'react';
import { fetchAcknowledgedTableReservations, fetchActiveTableReservations, type ApiReservation } from '../../api/tableReservations';
import axiosInstance, { getAuthHeaders } from '../../utils/axiosInstance';
import DataTable, { type Column } from '../common/DataTable';
import DetailPanel from '../common/DetailPanel';
import FilterBar, { type TabDef } from '../common/FilterBar';
import PageHeader from '../common/PageHeader';
import { useAudioPlayer } from '../common/useAudioPlayer';
import { statusBadge, statusDot, statusLabel, statusText } from '../common/orderHelpers';

type Reservation = {
    id: string;
    date?: string;
    time?: string;
    name?: string;
    phone?: string;
    party?: string;
    status?: string;
    note?: string;
    callId?: string;
    raw?: any;
};

function mapReservation(a: ApiReservation): Reservation {
    return {
        id: a._id || a.id || '',
        date: a.reservation_date ?? a.createdAt,
        time: a.reservation_time ?? '',
        name: a.customer_name ?? a.caller_id_name ?? '',
        phone: a.customer_phone_number ?? a.phone_number ?? '',
        party: a.no_of_people ?? '',
        status: a.acknowledgement_status ?? 'new',
        note: a.reservation_note ?? '',
        callId: a.call_id,
        raw: a,
    };
}

function buildRecordingUrl(callId: string) {
    if (!callId) return '';
    if (/^https?:\/\//i.test(callId)) return callId;
    return `https://vplite-stg.voiceplug.ai/api/recordings/stg/calls/${callId}.mp3`;
}

const defaultFilters = {
    page: 0,
    callUuid: '',
    dateStart: null as string | null,
    dateEnd: null as string | null,
    phoneNumber: '',
};

export default function TableReservation(): JSX.Element {
    const [active, setActive] = useState<Reservation[]>([]);
    const [ack, setAck] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'Active' | 'Acknowledged'>('Active');
    const [selected, setSelected] = useState<Reservation | null>(null);
    const [locationIds, setLocationIds] = useState<string[]>([]);
    const [filters, setFilters] = useState(defaultFilters);

    const audio = useAudioPlayer();

    // Fetch and set audio blob URL when selected callId changes
    useEffect(() => {
        const source = axios.CancelToken.source();
        let blobUrl: string | null = null;
        audio.setAudioSrc(null);
        audio.setAudioError(null);
        if (!selected?.callId) return;
        const url = buildRecordingUrl(selected.callId);
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
            source.cancel('cleanup');
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [selected?.callId]);

    // Initial data fetch
    useEffect(() => {
        const source = axios.CancelToken.source();
        setLoading(true);
        setError(null);
        const headers = getAuthHeaders();
        const body = { locationIds };
        Promise.all([
            fetchActiveTableReservations(headers, source.token, body),
            fetchAcknowledgedTableReservations(headers, source.token, body),
        ])
            .then(([act, ackd]) => {
                setActive((act || []).map(mapReservation));
                setAck((ackd || []).map(mapReservation));
            })
            .catch((err) => {
                if (axios.isCancel(err)) return;
                setError(err?.message ?? 'Failed to load reservations');
            })
            .finally(() => setLoading(false));
        return () => source.cancel('unmount');
    }, []);

    const list = tab === 'Active' ? active : ack;

    const reservationColumns: Column<Reservation>[] = [
        {
            header: 'Date / Time',
            headerClassName: 'w-1/8',
            width: '12.5%',
            render: (r) => (
                <>
                    <div className="text-sm">{r.date ?? '-'}</div>
                    <div className="text-xs text-[#6b7280]">{r.time ?? ''}</div>
                </>
            ),
        },
        {
            header: 'Guest Name',
            headerClassName: 'w-1/8',
            width: '15%',
            render: (r) => <span className="text-sm font-semibold">{r.name ?? '-'}</span>,
        },
        {
            header: 'Phone Number',
            headerClassName: 'w-1/8',
            width: '15%',
            render: (r) => <span className="text-sm text-[#505795]">{r.phone ?? '-'}</span>,
        },
        {
            header: 'Party Size',
            headerClassName: 'w-1/10',
            width: '10%',
            render: (r) => <span className="text-sm text-[#374151]">{r.party ?? '-'}</span>,
        },
        {
            header: 'Status',
            headerClassName: 'w-1/8',
            width: '15%',
            render: (r) => (
                <div className={`flex items-center gap-1.5 ${statusText(r.status)} ${statusBadge(r.status)} px-2 py-1 rounded-lg w-fit`}>
                    <span className={`w-2 h-2 rounded-full ${statusDot(r.status)}`} />
                    <span className="text-xs font-bold uppercase">{statusLabel(r.status)}</span>
                </div>
            ),
        },
        {
            header: 'Note',
            headerClassName: 'w-1/4',
            width: '32.5%',
            render: (r) => <span className="text-sm text-[#4455a8] italic">{r.note ? r.note : 'N/A'}</span>,
        },
    ];

    const tabs: TabDef[] = [
        { key: 'Active', label: 'Active', count: active.length, badgeActiveClass: 'text-[#2437e0] bg-[#eef2ff]' },
        { key: 'Acknowledged', label: 'Acknowledged', count: ack.length, badgeActiveClass: 'text-[#0b875b] bg-[#ecfdf3]' },
    ];

    const handleTabChange = (t: string) => {
        setTab(t as 'Active' | 'Acknowledged');
        setSelected(null);
    };

    const handleClearAll = () => {
        setFilters(defaultFilters);
        setLocationIds([]);
    };

    // Detail panel rows for reservations
    const detailChildren = selected ? (
        <div className="py-2 border-b border-[#e8e9f3]">
            <div className="flex justify-between items-center py-3 border-b border-[#e8e9f3]">
                <span className="text-sm text-[#505795]">Date/Time:</span>
                <span className="text-sm font-bold text-[#0e101b]">{selected.date ?? '-'} {selected.time ?? '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#505795]">Party Size:</span>
                <span className="text-sm font-bold text-green-700">{selected.party ?? '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#505795]">Phone</span>
                <span className="text-sm font-bold text-[#0e101b]">{selected.phone ?? '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[#505795]">Status</span>
                <div className={`flex items-center gap-1.5 ${statusText(selected.status)} ${statusBadge(selected.status)} px-2 py-1 rounded-lg w-fit`}>
                    <span className={`w-2 h-2 rounded-full ${statusDot(selected.status)}`} />
                    <span className="text-xs font-bold uppercase">{statusLabel(selected.status)}</span>
                </div>
            </div>
        </div>
    ) : null;

    const detailFooter = selected?.status?.toString().toLowerCase() === 'new' ? (
        <>
            <button
                onClick={() => setSelected(null)}
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-red-500 text-red-600 text-sm font-bold hover:bg-red-50 cursor-pointer"
            >
                Decline
            </button>
            <button
                onClick={() => setSelected(null)}
                className="flex items-center justify-center gap-2 h-11 rounded-lg bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 cursor-pointer"
            >
                Acknowledge
            </button>
        </>
    ) : (
        <div className="col-span-2" />
    );

    return (
        <div className="flex w-full bg-background-light h-[calc(100vh-1rem)] overflow-hidden gap-6">
            <div className={`flex-1 min-h-0 flex flex-col gap-4 px-10 py-8 overflow-hidden transition-all duration-300 ${selected ? 'mr-[380px]' : ''}`}>
                <PageHeader title="Table Reservations" />

                <FilterBar
                    tabs={tabs}
                    activeTab={tab}
                    onTabChange={handleTabChange}
                    loading={loading}
                    dateStart={filters.dateStart}
                    dateEnd={filters.dateEnd}
                    onDateRangeChange={(start, end) => setFilters((f) => ({ ...f, dateStart: start, dateEnd: end }))}
                    locationIds={locationIds}
                    onLocationChange={setLocationIds}
                    phoneNumber={filters.phoneNumber}
                    onPhoneChange={(phone) => setFilters((f) => ({ ...f, phoneNumber: phone }))}
                    onClearAll={handleClearAll}
                />

                <DataTable
                    columns={reservationColumns}
                    rows={list}
                    loading={loading}
                    error={error}
                    selectedId={selected?.id ?? null}
                    onSelect={(r) => setSelected(r)}
                    emptyMessage="No reservations"
                />
            </div>

            {selected && (
                <DetailPanel
                    title="Reservation Details"
                    idLabel={`ID: ${selected.id}`}
                    onClose={() => setSelected(null)}
                    customer={{
                        name: selected.name,
                        phone: selected.phone,
                        note: selected.note,
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
