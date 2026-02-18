import axios from 'axios';
import axiosInstance from '../utils/axiosInstance';

export type ApiOrder = Record<string, any>;

export function validateTokenApi(headers: Record<string, string>, cancelToken?: any): Promise<boolean> {
	return axiosInstance
		.post('/users/validateToken', {}, { headers, cancelToken })
		.then((res) => {
			const body = res.data;
			return !!body && (body.message === 'Token is valid' || !!body.user);
		})
		.catch((err) => {
			if (axios.isCancel(err)) return Promise.reject(err);
			return false;
		});
}

export function fetchActiveOrders(headers: Record<string, string>, cancelToken?: any): Promise<ApiOrder[]> {
	return axiosInstance
		.post('/orders/getActiveOrder', {}, { headers, cancelToken })
		.then((r) => (Array.isArray(r.data) ? r.data : (r.data?.data ?? r.data?.result ?? [])));
}

export function fetchCompletedOrders(
	body: { page: number; callUuid: string; dateStart: string | null; dateEnd: string | null; phoneNumber: string },
	headers: Record<string, string>,
	cancelToken?: any
): Promise<ApiOrder[]> {
	return axiosInstance
		.post('/orders/getCompletedOrder', body, { headers, cancelToken })
		.then((r) => (Array.isArray(r.data) ? r.data : (r.data?.data ?? r.data?.result ?? [])));
}
