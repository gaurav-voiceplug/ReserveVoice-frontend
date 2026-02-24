import { MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Store {
	_id: string;
	address: { city: string };
	name: string;
}

interface LocationFilterProps {
	value: string[];
	onChange: (selected: string[]) => void;
}

function stripLeadingNumbers(name: string) {
	return name.replace(/^\d+\s*-\s*/, '').trim().toLowerCase();
}

const STORES: Store[] = [
	{ _id: 'loc_1', name: '1 - Downtown Branch', address: { city: 'CityA' } },
	{ _id: 'loc_2', name: '2 - Uptown Branch', address: { city: 'CityB' } },
	{ _id: 'loc_3', name: 'Central Kitchen', address: { city: 'CityC' } },
];

export default function LocationFilter({ value, onChange }: LocationFilterProps) {
	const stores: Store[] = STORES.slice().sort((a, b) =>
		stripLeadingNumbers(a.name).localeCompare(stripLeadingNumbers(b.name), undefined, { sensitivity: 'base' })
	);

	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [hasInteracted, setHasInteracted] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	const filteredStores = stores.filter(store =>
		store?.name.toLowerCase().includes(search.toLowerCase())
	);

	const initialAllSelected = value.length === 0 && !hasInteracted;
	const allSelected = initialAllSelected || value.length === stores.length;

	const isChecked = (storeId: string) => allSelected || value.includes(storeId);

	const handleSelect = (id: string) => {
		setHasInteracted(true);
		if (id === 'ALL') {
			if (allSelected) onChange([]);
			else onChange(stores.map(s => s._id));
			return;
		}
		if (value.includes(id)) onChange(value.filter(v => v !== id));
		else onChange([...value, id]);
	};

	return (
		<div className="relative" ref={ref}>
			<button
				className="flex items-center justify-between rounded-lg px-3 py-2 bg-[#f3f4f8] w-[180px] h-9 text-sm shadow-sm"
				onClick={() => setOpen(v => !v)}
				type="button"
			>
				<div className="flex items-center overflow-hidden">
					<MapPin className="w-4 h-4 text-[#0e101b] mr-2 flex-shrink-0" />
					<span className="block w-full text-left truncate">
						{allSelected
							? 'All Locations'
							: value.length === 0
								? 'Select Location'
								: stores.filter(s => value.includes(s._id)).map(s => s.name).join(', ')
					}
                    </span>
				</div>
				<svg className="ml-2 w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			{open && (
				<div className="absolute z-20 w-[300px] left-0 mt-2 bg-white rounded shadow-lg py-2 border border-gray-200">
					<div className="px-3 pb-2">
						<input
							type="text"
							placeholder="Search Location"
							className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
							value={search}
							onChange={e => setSearch(e.target.value)}
						/>
					</div>
					<div className="max-h-60 overflow-y-auto">
						<label className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 w-full">
							<input type="checkbox" checked={allSelected} onChange={() => handleSelect('ALL')} className="mr-2 accent-blue-600" />
							All Locations
						</label>
						{filteredStores.map(store => (
							<label key={store._id} className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 w-full">
								<input type="checkbox" checked={isChecked(store._id)} onChange={() => handleSelect(store._id)} className="mr-2 accent-blue-600" />
								<span className="truncate">{store.name}</span>
							</label>
						))}
						{filteredStores.length === 0 && <div className="px-4 py-2 text-gray-400 text-sm">No locations found</div>}
					</div>
				</div>
			)}
		</div>
	);
}
