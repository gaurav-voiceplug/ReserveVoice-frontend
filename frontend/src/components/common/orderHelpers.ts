export function statusBadge(status?: string) {
    switch ((status || '').toLowerCase()) {
        case 'new':
        case 'pending':
            return 'bg-blue-50';
        case 'active':
        case 'arriving':
        case 'arriving soon':
        case 'arriving_soon':
        case 'more_info':
            return 'bg-amber-50';
        case 'confirmed':
        case 'completed':
        case 'acknowledged':
            return 'bg-green-50';
        case 'cancelled':
        case 'canceled':
        case 'declined':
            return 'bg-red-50';
        default:
            return 'bg-gray-50';
    }
}
export function statusText(status?: string) {
    switch ((status || '').toLowerCase()) {
        case 'new':
        case 'pending':
            return 'text-blue-600';
        case 'active':
        case 'arriving':
        case 'arriving soon':
        case 'arriving_soon':
        case 'more_info':
            return 'text-amber-600';
        case 'confirmed':
        case 'completed':
        case 'acknowledged':
            return 'text-green-600';
        case 'cancelled':
        case 'canceled':
        case 'declined':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
}
export function statusDot(status?: string) {
    switch ((status || '').toLowerCase()) {
        case 'new':
        case 'pending':
            return 'bg-blue-600';
        case 'active':
        case 'arriving':
        case 'arriving soon':
        case 'arriving_soon':
        case 'more_info':
            return 'bg-amber-600';
        case 'confirmed':
        case 'completed':
        case 'acknowledged':
            return 'bg-green-600';
        case 'cancelled':
        case 'canceled':
        case 'declined':
            return 'bg-red-600';
        default:
            return 'bg-gray-600';
    }
}
export function statusLabel(status?: string) {
    if (!status) return 'UNKNOWN';
    const s = status.toString().toLowerCase().trim();
    if (s === 'new' || s === 'pending') return 'NEW';
    if (s === 'active') return 'ACTIVE';
    if (s === 'confirmed' || s === 'confirm') return 'CONFIRMED';
    if (s === 'completed' || s === 'acknowledged') return 'COMPLETED';
    if (s === 'cancelled' || s === 'canceled' || s === 'declined') return 'CANCELLED';
    if (s === 'arriving' || s === 'arriving soon' || s === 'arriving_soon') return 'ARRIVING SOON';
    return status.toUpperCase();
}
