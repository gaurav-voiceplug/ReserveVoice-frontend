import { type JSX } from 'react';

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

export default function ReservationTable({
	reservations,
	loading,
	error,
	selectedId,
	onSelect,
}: {
	reservations: Reservation[];
	loading: boolean;
	error: string | null;
	selectedId?: string | null;
	onSelect: (r: Reservation) => void;
}): JSX.Element {
	return (
		<div className="flex-1 @container">
			<div className="flex overflow-hidden rounded-xl border border-[#d1d3e6] bg-white shadow-sm">
				<table className="min-w-full text-left">
					<thead>
						<tr className="bg-[#f8f9fb] border-b border-[#d1d3e6]">
							<th className="px-6 py-4 text-xs font-bold uppercase w-1/6">Date</th>
							<th className="px-6 py-4 text-xs font-bold uppercase w-1/6">Time</th>
							<th className="px-6 py-4 text-xs font-bold uppercase w-1/4">Customer</th>
							<th className="px-6 py-4 text-xs font-bold uppercase w-1/6">Phone</th>
							<th className="px-6 py-4 text-xs font-bold uppercase w-1/12">Party</th>
							<th className="px-6 py-4 text-xs font-bold uppercase w-1/6">Status</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[#d1d3e6]">
						{error ? (
							<tr><td colSpan={6} className="px-6 py-6 text-center text-sm text-red-600">Error: {error}</td></tr>
						) : loading ? (
							<>
								{Array.from({ length: 6 }).map((_, i) => (
									<tr key={i}>
										<td className="px-6 py-5"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-6 py-5"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-6 py-5"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-6 py-5"><div className="h-4 w-28 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-6 py-5"><div className="h-4 w-12 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-6 py-5"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></td>
									</tr>
								))}
							</>
						) : reservations.length === 0 ? (
							<tr><td colSpan={6} className="px-6 py-6 text-center text-sm text-[#505795]">No reservations</td></tr>
						) : (
							reservations.map((r) => {
								const isSelected = selectedId === r.id;
								return (
									<tr
										key={r.id}
										onClick={() => onSelect(r)}
										className={`hover:bg-primary/5 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-l-4 border-l-blue-700' : ''}`}
									>
										<td className="px-6 py-5 text-sm">{r.date ?? '-'}</td>
										<td className="px-6 py-5 text-sm">{r.time ?? '-'}</td>
										<td className="px-6 py-5 text-sm font-semibold">{r.name ?? '-'}</td>
										<td className="px-6 py-5 text-sm">{r.phone ?? '-'}</td>
										<td className="px-6 py-5 text-sm">{r.party ?? '-'}</td>
										<td className="px-6 py-5 text-sm">{(r.status ?? '').toString().toUpperCase()}</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
