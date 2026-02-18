export function statusBadge(status?: string) {
	switch ((status || '').toLowerCase()) {
		case 'active': return 'bg-amber-50';
		case 'completed': return 'bg-green-50';
		case 'cancelled': return 'bg-red-50';
		default: return 'bg-gray-50';
	}
}
export function statusText(status?: string) {
	switch ((status || '').toLowerCase()) {
		case 'active': return 'text-amber-600';
		case 'completed': return 'text-green-600';
		case 'cancelled': return 'text-red-600';
		default: return 'text-gray-600';
	}
}
export function statusDot(status?: string) {
	switch ((status || '').toLowerCase()) {
		case 'active': return 'bg-amber-600';
		case 'completed': return 'bg-green-600';
		case 'cancelled': return 'bg-red-600';
		default: return 'bg-gray-600';
	}
}
export function statusLabel(status?: string) {
	if (!status) return 'UNKNOWN';
	const s = status.toString().toLowerCase();
	if (s === 'active') return 'ACTIVE';
	if (s === 'completed') return 'COMPLETED';
	if (s === 'cancelled') return 'CANCELLED';
	if (s === 'arriving' || s === 'arriving soon') return 'ARRIVING SOON';
	return status.toUpperCase();
}
