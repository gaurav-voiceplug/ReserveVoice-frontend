export type ApiOrder = Record<string, any>;

export type Order = {
	id: string;
	callId?: string;
	dateTime: string;
	customer?: string;
	phone?: string;
	transcription?: string;
	items?: { name: string; qty: string; modifier?: string; size?: string }[];
	orderNo?: string;
	orderTotal?: string;
	prepTime?: string;
	status: 'Active' | 'Completed' | string;
	recording?: string;
	raw?: ApiOrder;
};
