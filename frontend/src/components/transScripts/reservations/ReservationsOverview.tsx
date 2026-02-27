import { Calendar, Download, Filter, MapPin, Star, Users, X } from 'lucide-react';
import { useEffect, useState, type JSX } from 'react';

type ApiReservation = {
	_id: string;
	location_id?: string;
	customer_name?: string;
	customer_phone_number?: string;
	no_of_people?: string;
	reservation_date?: string; // "12-09-2024"
	reservation_time?: string; // "14:00"
	reservation_note?: string;
	acknowledgement_status?: string;
	createdAt?: string;
	updatedAt?: string;
	call_id?: string;
	// ...other fields
};

type Reservation = {
	id: string;
	dateTime: string;
	name: string;
	partySize: number;
	status?: string;
	aiNote?: string;
	vip?: boolean;
	tags?: string[];
	table?: string;
	email?: string;
	phone?: string;
	raw?: ApiReservation;
};

const API_URL = 'https://vplite-stg.voiceplug.ai/api/table-reservation/getActiveTableReservation';
const VALIDATE_URL = 'https://vplite-stg.voiceplug.ai/api/users/validateToken';

function getAuthHeaders(): Record<string, string> {
	// Try common storage keys and Vite env fallbacks. Do not hardcode secrets.
	const rawToken = localStorage.getItem('token') || localStorage.getItem('authToken') || (import.meta.env?.VITE_API_TOKEN as string | undefined);
	const rawRefresh = localStorage.getItem('refreshToken') || (import.meta.env?.VITE_REFRESH_TOKEN as string | undefined);
	const token = rawToken && rawToken !== 'undefined' ? rawToken : undefined;
	const refresh = rawRefresh && rawRefresh !== 'undefined' ? rawRefresh : undefined;
	const headers: Record<string, string> = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
	};
	// backend/portal logs show Authorization sent as the raw token (no "Bearer " prefix)
	if (token) headers['authorization'] = token;
	if (refresh) headers['x-refresh-token'] = refresh;
	return headers;
}

async function validateToken(headers: Record<string, string>, signal?: AbortSignal): Promise<boolean> {
	// detect presence of auth / refresh headers case-insensitively
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
		// If the request was aborted, propagate so caller can handle it (avoid clearing tokens)
		if (err && err.name === 'AbortError') throw err;
		// network or other issue => treat as invalid but don't crash
		return false;
	}
}

function statusBadge(status?: string) {
	switch (status) {
		case 'confirmed':
		case 'Confirmed':
			return 'text-green-600 bg-green-50';
		case 'cancelled':
		case 'Cancelled':
			return 'text-red-600 bg-red-50';
		case 'arriving':
		case 'Arriving Soon':
			return 'text-amber-600 bg-amber-50';
		default:
			return 'text-gray-600 bg-gray-50';
	}
}

export default function ReservationsOverview(): JSX.Element {
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selected, setSelected] = useState<Reservation | null>(null);
	const [tab, setTab] = useState<'All' | 'Upcoming' | 'Past'>('All');

	useEffect(() => {
		const ac = new AbortController();
		async function fetchReservations() {
			try {
				setLoading(true);
				setError(null);
				// build headers and validate token first
				const headers = getAuthHeaders();
				const valid = await validateToken(headers, ac.signal);
				if (!valid) {
					// clear stored tokens and surface error so user can re-authenticate
					localStorage.removeItem('token');
					localStorage.removeItem('refreshToken');
					setError('Session expired or not authenticated. Please sign in again.');
					setReservations([]);
					setSelected(null);
					return;
				}
				// token validated — call reservations endpoint (POST like the portal)
				const res = await fetch(API_URL, {
					method: 'POST',
					headers,
					signal: ac.signal,
				});
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const body = await res.json();
				const active: ApiReservation[] = (body?.result?.active) ?? [];
				const mapped: Reservation[] = active.map((a) => {
					const date = a.reservation_date ?? '';
					const time = a.reservation_time ?? '';
					const dateTime = date && time ? `${date}, ${time}` : `${date} ${time}`.trim();
					return {
						id: a._id,
						dateTime: dateTime || (a.createdAt ?? ''),
						name: a.customer_name ?? 'Guest',
						partySize: Number(a.no_of_people ?? 1) || 1,
						status: a.acknowledgement_status ?? 'new',
						aiNote: a.reservation_note ?? undefined,
						phone: a.customer_phone_number,
						raw: a,
					};
				});
				setReservations(mapped);
				if (mapped.length > 0) setSelected(mapped[0]);
			} catch (err: any) {
				if (err.name !== 'AbortError') setError(err.message ?? 'Failed to load');
			} finally {
				setLoading(false);
			}
		}
		fetchReservations();
		return () => ac.abort();
	}, []);

	return (
		<div className="flex w-full bg-slate-100 min-h-[calc(100vh-1rem)] gap-6">
			{/* Left: filters + table (auto-expands) */}
			<div className="flex-1 flex flex-col gap-4 px-6 py-2 transition-all">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h1 className="text-4xl font-black text-[#0e101b] leading-tight tracking-[-0.033em]">Reservations Overview</h1>
						<p className="text-sm text-[#505795]">{loading ? 'Loading…' : `${reservations.length} bookings`}</p>
					</div>
					<button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8e9f3] rounded-lg text-sm font-bold text-[#0e101b] hover:bg-[#f8f9fb] transition-colors">
						<Download className="w-4 h-4 text-black" />
						<span>Export CSV</span>
					</button>
				</div>

				{/* Tabs */}
				<div className="flex items-center gap-3 mb-3">
					<button onClick={() => setTab('All')} className={`px-3 py-2 rounded ${tab === 'All' ? 'bg-blue-700 text-white' : 'bg-[#f1f3f8]'}`}>All Bookings</button>
					<button onClick={() => setTab('Upcoming')} className={`px-3 py-2 rounded ${tab === 'Upcoming' ? 'bg-blue-700 text-white' : 'bg-[#f1f3f8]'}`}>Upcoming</button>
					<button onClick={() => setTab('Past')} className={`px-3 py-2 rounded ${tab === 'Past' ? 'bg-blue-700 text-white' : 'bg-[#f1f3f8]'}`}>Past</button>
					<div className="ml-auto flex gap-2">
						<button className="flex h-9 items-center justify-center gap-x-2 rounded-lg bg-[#e8e9f3] px-4 hover:bg-primary/10 transition-colors">
							<Calendar className="w-4 h-4 text-black" />
							<p className="text-[#0e101b] text-sm font-medium">Today</p>
						</button>
						<button className="flex h-9 items-center justify-center gap-x-2 rounded-lg bg-[#e8e9f3] px-4 hover:bg-primary/10 transition-colors">
							<MapPin className="w-4 h-4 text-black" />
							<p className="text-[#0e101b] text-sm font-medium">Location</p>
						</button>
						<button className="flex h-9 items-center justify-center gap-x-2 rounded-lg bg-[#e8e9f3] px-4 hover:bg-primary/10 transition-colors">
							<Filter className="w-4 h-4 text-black" />
							<p className="text-[#0e101b] text-sm font-medium">Status: All</p>
						</button>
						<button className="flex h-9 items-center justify-center gap-x-2 rounded-lg bg-[#e8e9f3] px-4 hover:bg-primary/10 transition-colors">
							<Users className="w-4 h-4 text-black" />
							<p className="text-[#0e101b] text-sm font-medium">Party Size</p>
						</button>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-hidden rounded-xl border bg-white">
					<table className="min-w-full">
						<thead className="bg-[#f8f9fb]">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-bold text-[#0e101b] uppercase">Date/Time</th>
								<th className="px-4 py-3 text-left text-xs font-bold text-[#0e101b] uppercase">Guest Name</th>
								<th className="px-4 py-3 text-left text-xs font-bold text-[#0e101b] uppercase">Party Size</th>
								<th className="px-4 py-3 text-left text-xs font-bold text-[#0e101b] uppercase">Status</th>
								<th className="px-4 py-3 text-left text-xs font-bold text-[#0e101b] uppercase">Note</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{error ? (
								<tr><td colSpan={5} className="p-6 text-center text-sm text-red-600">Error: {error}</td></tr>
							) : loading ? (
								<tr><td colSpan={5} className="p-6 text-center text-sm text-[#505795]">Loading reservations…</td></tr>
							) : reservations.length === 0 ? (
								<tr><td colSpan={5} className="p-6 text-center text-sm text-[#505795]">No active reservations</td></tr>
							) : (
								reservations.map((r) => {
									const selectedRow = selected?.id === r.id;
									return (
										<tr key={r.id} onClick={() => setSelected(r)} className={`cursor-pointer ${selectedRow ? 'bg-primary/5' : ''}`}>
											<td className="px-4 py-4 text-sm text-[#0e101b]">{r.dateTime}</td>
											<td className="px-4 py-4 text-sm text-[#0e101b]">{r.name}</td>
											<td className="px-4 py-4 text-sm text-[#505795]">{r.partySize} Guests</td>
											<td className="px-4 py-4">
												<span className={`inline-flex items-center px-2 py-1 rounded ${statusBadge(r.status)}`}>{r.status ?? 'New'}</span>
											</td>
											<td className="px-4 py-4 text-sm italic text-[#505795]">{r.aiNote ?? 'N/A'}</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
 
			{/* Right: details — render only when a reservation is selected */}
			{selected && (
				<aside className="w-[380px] border-l border-[#e8e9f3] bg-white h-full overflow-y-auto flex flex-col transition-all">
					<div className="p-6 flex flex-col gap-6">
						<div className="flex items-start justify-between">
							<div className="flex flex-col">
								<h3 className="text-xl font-bold text-[#0e101b]">Reservation Details</h3>
								<p className="text-xs font-medium text-[#505795] uppercase tracking-widest mt-1">{selected?.id ?? '-'}</p>
							</div>
							<button
								onClick={() => setSelected(null)}
								className="p-2 rounded-lg hover:bg-[#f8f9fb]"
								aria-label="Close"
							>
								<X className="text-black" />
							</button>
						</div>

						{/* Guest Profile Summary */}
						<div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
							<div className="flex items-center gap-4 mb-4">
								<div className="size-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-black">
									{selected ? (selected.name.split(' ').map(s => s[0]).slice(0,2).join('')) : '—'}
								</div>
								<div className="flex flex-col">
									<span className="text-lg font-bold text-[#0e101b]">{selected?.name ?? '-'}</span>
									<span className="text-sm text-[#505795]">{selected?.email ?? ''}</span>
									<span className="text-sm text-[#505795]">{selected?.phone ?? ''}</span>
								</div>
							</div>
						</div>

						{/* AI Insights */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-2">
								<Star className="w-4 h-4 text-black" />
								<h4 className="font-bold text-sm text-[#0e101b]">AI Insights</h4>
							</div>
							<div className="space-y-3">
								<div className="p-3 bg-white border border-[#e8e9f3] rounded-lg">
									<p className="text-sm leading-relaxed text-[#505795]">
										{selected?.aiNote ? `${selected.aiNote}` : 'No AI notes available for this reservation.'}
									</p>
								</div>
							</div>
						</div>

						{/* Booking Info List */}
						<div className="space-y-4 pt-2">
							<div className="flex justify-between items-center py-2 border-b border-[#e8e9f3]">
								<span className="text-sm text-[#505795]">Party Size</span>
								<span className="text-sm font-bold text-[#0e101b]">{selected ? `${selected.partySize} Adults` : '-'}</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-[#e8e9f3]">
								<span className="text-sm text-[#505795]">Time Slot</span>
								<span className="text-sm font-bold text-[#0e101b]">{selected?.dateTime ?? '-'}</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-[#e8e9f3]">
								<span className="text-sm text-[#505795]">Table Assignment</span>
								<span className="text-sm font-bold text-primary underline">{selected?.table ?? 'TBD'}</span>
							</div>
							<div className="flex justify-between items-center py-2">
								<span className="text-sm text-[#505795]">Status</span>
								<div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${selected ? statusBadge(selected.status) : ''}`}>
									<span className="text-[11px] font-bold uppercase">{selected?.status ?? '-'}</span>
								</div>
							</div>
						</div>

						{/* Actions */}
						<div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-[#e8e9f3]">
							<button className="flex items-center justify-center gap-2 h-11 rounded-lg border border-[#e8e9f3] text-[#0e101b] text-sm font-bold hover:bg-[#f8f9fb] transition-all">
								Modify
							</button>
							<button className="flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all">
								Check-in
							</button>
						</div>
					</div>
				</aside>
			)}
		</div>
	);
}
