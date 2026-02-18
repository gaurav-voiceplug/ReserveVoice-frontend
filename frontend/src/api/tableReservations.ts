import axiosInstance from '../utils/axiosInstance';

export type ApiReservation = Record<string, any>;

export function fetchActiveTableReservations(headers: Record<string, string>, cancelToken?: any): Promise<ApiReservation[]> {
	return axiosInstance
		.post('/table-reservation/getActiveTableReservation', {}, { headers, cancelToken })
		.then(r => r.data?.result?.active ?? r.data?.data ?? r.data ?? []);
}

export function fetchAcknowledgedTableReservations(headers: Record<string, string>, cancelToken?: any): Promise<ApiReservation[]> {
	return axiosInstance
		.post('/table-reservation/getAcknowledgedTableReservation', {}, { headers, cancelToken })
		.then(r => r.data?.data ?? r.data?.result ?? r.data ?? []);
}
