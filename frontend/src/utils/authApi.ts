import axios from 'axios';
import axiosInstance from './axiosInstance';

export function validateTokenApi(headers: Record<string, string>, cancelToken?: any): Promise<boolean> {
	return axiosInstance
		.post('/users/validateToken', {}, { headers, cancelToken })
		.then((res) => {
			const body = res.data;
			return !!body && (body.message === 'Token is valid' || !!body.user);
		})
		.catch((err) => {
			if (axios.isCancel(err)) return Promise.reject(err);
			if (err?.response?.status === 401) return false;
			return false;
		});
}
