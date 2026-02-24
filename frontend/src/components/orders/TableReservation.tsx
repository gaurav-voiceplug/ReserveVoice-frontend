import axios from 'axios';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Volume2, VolumeX, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { fetchAcknowledgedTableReservations, fetchActiveTableReservations, type ApiReservation } from '../../api/tableReservations';
import axiosInstance, { getAuthHeaders } from '../../utils/axiosInstance';
import ReservationTable from '../common/ReservationTable';
import LocationFilter from '../common/LocationFilter';
import CustomCalendar from '../common/CustomCalendar';
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

export default function TableReservation(): JSX.Element {
    const [active, setActive] = useState<Reservation[]>([]);
    const [ack, setAck] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'Active' | 'Acknowledged'>('Active');
    const [selected, setSelected] = useState<Reservation | null>(null);
    const [locationIds, setLocationIds] = useState<string[]>([]);

    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [audioError, setAudioError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const prevVolumeRef = useRef<number>(100);
    const [duration, setDuration] = useState<number>(0);
    const [curTime, setCurTime] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(100);

    // derived progress percent for visual needle/dot
    const progressPercent = duration ? Math.max(0, Math.min(100, (curTime / duration) * 100)) : 0;

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

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }, [volume]);

    const onSeek = useCallback((time: number) => {
        const a = audioRef.current;
        if (!a) return;
        a.currentTime = Math.max(0, Math.min(time, duration || a.duration || Infinity));
        setCurTime(a.currentTime);
    }, [duration]);

    const handleRewind = useCallback(() => { onSeek((audioRef.current?.currentTime || 0) - 5); }, [onSeek]);
    const handleForward = useCallback(() => { onSeek((audioRef.current?.currentTime || 0) + 5); }, [onSeek]);

    const togglePlay = useCallback(() => {
        const a = audioRef.current;
        if (!a) return;
        if (isPlaying) a.pause();
        else a.play().catch(() => { });
    }, [isPlaying]);

    const toggleMute = useCallback(() => {
        const a = audioRef.current;
        if (a) {
            if (a.muted || a.volume === 0) {
                a.muted = false;
                const v = prevVolumeRef.current ?? 100;
                a.volume = Math.max(0, Math.min(1, v / 100));
                setVolume(v);
            } else {
                prevVolumeRef.current = Math.round((a.volume || 1) * 100);
                a.muted = true;
                a.volume = 0;
                setVolume(0);
            }
            return;
        }
        if (volume === 0) setVolume(prevVolumeRef.current ?? 100);
        else { prevVolumeRef.current = volume || 100; setVolume(0); }
    }, [volume]);

    const formatTime = (secs?: number | null) => {
        const s = Math.max(0, Math.floor(secs || 0));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

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

    useEffect(() => {
        const source = axios.CancelToken.source();
        let blobUrl: string | null = null;
        setAudioSrc(null);
        setAudioError(null);
        if (!selected?.callId) return;
        const url = buildRecordingUrl(selected.callId);
        const headers = getAuthHeaders();
        axiosInstance.get(url, { headers, cancelToken: source.token, responseType: 'blob' })
            .then(res => {
                if (res.status >= 400) throw new Error(`Audio ${res.status}`);
                blobUrl = URL.createObjectURL(res.data);
                setAudioSrc(blobUrl);
            })
            .catch(err => {
                if (axios.isCancel(err)) return;
                setAudioError(err?.message ?? 'Failed to load recording');
                setAudioSrc(null);
            });
        return () => {
            source.cancel('cleanup');
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [selected?.callId]);

    const defaultFilters = { page: 0, callUuid: '', dateStart: null as string | null, dateEnd: null as string | null, phoneNumber: '' };
    const [filters, setFilters] = useState(defaultFilters);
    const [calOpen, setCalOpen] = useState(false);
    const [tmpStart, setTmpStart] = useState<string | null>(filters.dateStart);
    const [tmpEnd, setTmpEnd] = useState<string | null>(filters.dateEnd);

    const applyRange = (s: string | null, e: string | null) => {
        setFilters(f => ({ ...f, dateStart: s, dateEnd: e }));
    };

    const list = tab === 'Active' ? active : ack;

    return (
        <div className="flex w-full bg-background-light min-h-[calc(100vh-1rem)] gap-6">
            <div className={`flex-1 flex flex-col gap-4 px-10 py-8 transition-all duration-300 ${selected ? 'mr-[400px]' : ''}`}>
                <div className="flex flex-wrap justify-between items-end gap-3 mb-2">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[#0e101b] text-4xl font-black leading-tight tracking-[-0.033em]">Table Reservations</h1>
                        {/* <p className="text-[#505795] text-base font-semibold">{`${list.length} ${tab.toLowerCase()}`}</p> */}
                    </div>
                    <div />
                </div>

                <div className="flex flex-col gap-4 bg-white rounded-xl border border-[#e8e9f3] p-4 mb-2">
                    <div className="flex gap-8 border-b border-[#e8e9f3]">
                        <a className={`flex items-center gap-1 border-b-2 pb-2 font-bold text-sm ${tab === 'Active' ? 'border-primary text-[#2437e0]' : 'border-transparent text-[#505795]'}`} href="#" onClick={(e) => { e.preventDefault(); setTab('Active'); setSelected(null); }}>
                            <span>Active</span>
                            <span className="ml-1 inline-flex items-center justify-center px-2 py-0 rounded-full text-sm font-bold text-[#2437e0] bg-[#eef2ff]">{active.length}</span>
                        </a>
                        <a className={`flex items-center gap-1 border-b-2 pb-2 font-bold text-sm ${tab === 'Acknowledged' ? 'border-primary text-blue-700' : 'border-transparent text-[#505795]'}`} href="#" onClick={(e) => { e.preventDefault(); setTab('Acknowledged'); setSelected(null); }}>
                            <span>Acknowledged</span>
                            <span className="ml-1 inline-flex items-center justify-center px-2 py-0 rounded-full text-sm font-bold text-[#0b875b] bg-[#ecfdf3]">{ack.length}</span>
                        </a>
                    </div>

                    <div className="flex gap-3 flex-wrap items-center">
                        {loading ? (
                            <>
                                <div className="h-9 w-40 bg-gray-200 rounded-full animate-pulse"></div>
                                <div className="h-9 w-40 bg-gray-200 rounded-full animate-pulse"></div>
                                <div className="flex-1" />
                                <div className="h-9 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <button type="button" onClick={() => { setCalOpen(s => !s); }} className="h-9 px-3 rounded-full bg-[#f3f4f8] text-sm text-[#0e101b] flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-[#505075]" />
                                        <span className="text-sm font-medium">
                                            {tmpStart ? format(new Date(tmpStart), 'MMM d') : 'Start'}
                                            <span className="mx-2 text-gray-400">•</span>
                                            <span className="text-gray-600">{tmpEnd ? format(new Date(tmpEnd), 'MMM d') : 'End'}</span>
                                        </span>
                                    </button>
                                    {calOpen && (
                                        <CustomCalendar startIso={tmpStart} endIso={tmpEnd} onSelect={(s, e) => { setTmpStart(s); setTmpEnd(e); applyRange(s, e); setCalOpen(false); }} onClose={() => setCalOpen(false)} />
                                    )}
                                </div>
                                <LocationFilter value={locationIds} onChange={(ids) => setLocationIds(ids)} />

                                <input value={filters.phoneNumber} onChange={(e) => setFilters({ ...filters, phoneNumber: e.target.value })} placeholder="Phone number" className="h-9 px-3 rounded-lg border border-[#e8e9f3] bg-white text-sm text-[#0e101b]" />
                                <div className="flex-1" />
                                <button className="text-blue-600 text-sm font-semibold underline-offset-2 hover:underline" onClick={(e) => { e.preventDefault(); setFilters(defaultFilters); }}>
                                    Clear All
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 @container">
                    <ReservationTable reservations={list} loading={loading} error={error} selectedId={selected?.id ?? null} onSelect={(r) => setSelected(r)} />
                </div>
            </div>

            {selected && (
                <aside className="fixed right-0 top-0 bottom-0 w-[400px] border-l border-[#e8e9f3] bg-white overflow-hidden z-50">
                    <div className="flex flex-col h-full">
                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-extrabold text-[#0e101b]">Reservation Details</h3>
                                    <p className="text-xs text-[#505795] tracking-widest mt-1">ID: {selected.id}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-[#f8f9fb]" aria-label="Close"><X /></button>
                            </div>

                            <div className="bg-primary/5 rounded-xl p-5 border border-[#e8e9f3] overflow-hidden">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 h-14 w-14 rounded-full bg-blue-700 flex items-center justify-center text-white text-2xl font-black">
                                        {((selected.name ?? 'G').toString().trim().split(/\s+/).filter(Boolean).map(s => s.charAt(0).toUpperCase()).slice(0, 2).join('')) || 'G'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-lg font-bold text-[#0e101b] break-words">{selected.name}</div>
                                        <div className="text-sm text-[#505795]">{selected.phone ?? ''}</div>
                                    </div>
                                </div>
                                <div className="text-sm text-[#505795] mt-4 break-words whitespace-normal">{selected.note}</div>
                            </div>

                            <div className="w-full min-w-0 mb-3">
                                <audio ref={audioRef} preload="auto" className="hidden" />
                                {audioError && <div className="text-xs text-red-600 mt-2">Error loading recording</div>}
                                <div className="flex flex-col border border-[#e8e9f3] rounded-lg pt-6 p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs text-slate-900 text-right tabular-nums">{formatTime(curTime)}</div>

                                        {/* progress bar with moving needle + dot */}
                                        <div
                                            className={`relative flex-1 h-2 rounded-full cursor-pointer overflow-hidden ${audioSrc ? 'bg-blue-50' : 'bg-gray-100'}`}
                                            onClick={(e) => {
                                                if (!audioSrc) return;
                                                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                                                onSeek(pos * (duration || 0));
                                            }}
                                        >
                                            {/* filled portion */}
                                            <div className="h-full bg-blue-700 rounded-full" style={{ width: `${progressPercent}%` }} />

                                            {/* vertical needle line */}
                                            <div
                                                aria-hidden="true"
                                                style={{ left: `${progressPercent}%`, top: '-6px', height: '14px', width: '2px', transform: 'translateX(-50%)' }}
                                                className="absolute bg-black opacity-90"
                                            />

                                            {/* moving dot */}
                                            <div
                                                aria-hidden="true"
                                                style={{ left: `${progressPercent}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                                                className="absolute w-3.5 h-3.5 rounded-full bg-black shadow-md"
                                            />
                                        </div>

                                        <div className="text-xs text-slate-900 text-left tabular-nums">{formatTime(duration)}</div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={handleRewind} aria-label="Rewind 5s" disabled={!audioSrc} className={`p-2 rounded-md ${audioSrc ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' : 'text-slate-400'}`}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6L11 18zM21 6v12l-8.5-6L21 6z" /></svg></button>
                                            <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} disabled={!audioSrc} className={`p-2 rounded-md ${audioSrc ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' : 'text-slate-400'}`}>{isPlaying ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v18l15-9L5 3z" /></svg>}</button>
                                            <button onClick={handleForward} aria-label="Forward 5s" disabled={!audioSrc} className={`p-2 rounded-md ${audioSrc ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' : 'text-slate-400'}`}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13 18V6l8.5 6L13 18zM3 6v12l8.5-6L3 6z" /></svg></button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={toggleMute} aria-label={volume === 0 ? 'Unmute' : 'Mute'} disabled={!audioSrc} className={`p-2 rounded-md ${audioSrc ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' : 'text-slate-400'}`}>{volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
                                            <input type="range" min={0} max={100} step={1} value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="volume" disabled={!audioSrc} className={`w-28 h-1 ${audioSrc ? 'accent-blue-600' : 'accent-slate-400'}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="py-2 border-b border-[#e8e9f3]">
                                <div className="flex justify-between items-center py-3 border-b border-[#e8e9f3]">
                                    <span className="text-sm text-[#505795]">Date/Time:</span>
                                    <span className="text-sm font-bold text-[#0e101b]">{selected.date ?? '-'} {selected.time ?? '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 ">
                                    <span className="text-sm text-[#505795]">Party Size:</span>
                                    <span className="text-sm font-bold text-green-700">{selected.party ?? '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-sm text-[#505795]">Phone</span>
                                    <span className="text-sm font-bold text-[#0e101b]">{selected.phone ?? '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-[#505795]">Status</span>
                                    <div className="flex items-center gap-1">
                                        <div className={`flex items-center gap-1.5 ${statusText(selected.status)} ${statusBadge(selected.status)} px-2 py-1 rounded-lg w-fit`}>
                                            <span className={`size-2 w-2 h-2 rounded-full ${statusDot(selected.status)}`} />
                                            <span className="text-xs font-bold uppercase">{statusLabel(selected.status)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-[#e8e9f3] bg-white p-6 grid grid-cols-2 gap-3">
                            {selected?.status?.toString().toLowerCase() === 'new' ? (
                                <>
                                    <button onClick={() => setSelected(null)} className="flex items-center justify-center gap-2 h-11 rounded-lg border border-red-500 text-red-600 text-sm font-bold hover:bg-red-50">Decline</button>
                                    <button onClick={() => setSelected(null)} className="flex items-center justify-center gap-2 h-11 rounded-lg bg-blue-700 text-white text-sm font-bold hover:bg-blue-800">Acknowledge</button>
                                </>
                            ) : (
                                <div className="col-span-2" />
                            )}
                        </div>
                    </div>
                </aside>
            )}
        </div>
    );
}
