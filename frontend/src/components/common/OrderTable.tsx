import type { JSX } from 'react';
import { statusBadge, statusDot, statusLabel, statusText } from './orderHelpers';

type Order = any;

export default function OrderTable({
	orders,
	loading,
	error,
	selectedId,
	onSelect,
}: {
	orders: Order[];
	loading: boolean;
	error: string | null;
	selectedId?: string | null;
	onSelect: (o: Order) => void;
}): JSX.Element {
	return (
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
						</tr>
					</thead>
					<tbody className="divide-y divide-[#d1d3e6]">
						{error ? (
							<tr><td colSpan={6} className="px-6 py-6 text-center text-sm text-red-600">Error: {error}</td></tr>
						) : loading ? (
							<>
								{Array.from({ length: 6 }).map((_, i) => (
									<tr key={`skeleton-${i}`}>
										<td className="px-6 py-5"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-6 py-5"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-6 py-5"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-6 py-5"><div className="h-6 w-20 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-6 py-5"><div className="h-4 w-full bg-gray-200 rounded animate-pulse" /></td>
									</tr>
								))}
							</>
						) : orders.length === 0 ? (
							<tr><td colSpan={6} className="px-6 py-6 text-center text-sm text-[#505795]">No orders</td></tr>
						) : (
							orders.map((o: Order) => {
								const isSelected = selectedId === o.id;
								const itemsShort = (o.items || []).map((it: any) => `${it.qty}× ${it.name}`).join(', ');
								return (
									<tr
										key={o.id}
										onClick={() => onSelect(o)}
										className={`hover:bg-primary/5 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-l-4 border-l-blue-700' : ''}`}
									>
										<td className="px-6 py-5 text-sm font-medium text-[#0e101b]">{o.dateTime}</td>
										<td className="px-6 py-5"><div className="flex items-center gap-2"><span className="text-sm font-semibold text-[#0e101b]">{o.customer}</span></div></td>
										<td className="px-6 py-5 text-sm text-[#505795]">{o.phone ?? ''}</td>
										<td className="px-6 py-5">
											<div className={`flex items-center gap-1.5 ${statusText(o.status)} ${statusBadge(o.status)} px-2 py-1 rounded-full w-fit`}>
												<span className={`size-2 w-2 h-2 rounded-full ${statusDot(o.status)}`} />
												<span className="text-xs font-bold uppercase">{statusLabel(o.status)}</span>
											</div>
										</td>
										<td className="px-6 py-5 text-sm text-[#505795] italic">{itemsShort || (o.transcription ? `${o.transcription.substring(0, 60)}…` : 'N/A')}</td>
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
