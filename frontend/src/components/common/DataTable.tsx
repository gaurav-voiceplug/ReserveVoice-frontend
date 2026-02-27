import type { JSX, ReactNode } from 'react';

export type Column<T> = {
    header: string;
    /** Extra classes applied to the <th> */
    headerClassName?: string;
    /**
     * Explicit column width for <colgroup> (e.g. '25%', '10%').
     * Required so the header table and body table stay aligned when split.
     */
    width?: string;
    render: (row: T) => ReactNode;
};

interface DataTableProps<T extends { id: string }> {
    columns: Column<T>[];
    rows: T[];
    loading: boolean;
    error: string | null;
    selectedId?: string | null;
    onSelect: (row: T) => void;
    emptyMessage?: string;
}

export default function DataTable<T extends { id: string }>({
    columns,
    rows,
    loading,
    error,
    selectedId,
    onSelect,
    emptyMessage = 'No data',
}: DataTableProps<T>): JSX.Element {
    const colCount = columns.length;

    /** Shared colgroup keeps both tables pixel-aligned */
    const colGroup = (
        <colgroup>
            {columns.map((col, i) => (
                <col key={i} style={col.width ? { width: col.width } : undefined} />
            ))}
        </colgroup>
    );

    return (
        <div className="flex-1 min-h-0 @container flex flex-col">
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-xl border border-[#d1d3e6] bg-white shadow-sm">

                {/* Header — sits outside the scroll container, never moves */}
                <div className="flex-shrink-0 bg-[#f8f9fb] border-b border-[#d1d3e6]">
                    <table className="min-w-full text-left table-fixed">
                        {colGroup}
                        <thead>
                            <tr>
                                {columns.map((col, i) => (
                                    <th
                                        key={i}
                                        className={`px-6 py-4 text-[#0e101b] text-xs font-bold uppercase tracking-wider${col.headerClassName ? ` ${col.headerClassName}` : ''}`}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    </table>
                </div>

                {/* Body — only this zone scrolls; thin custom scrollbar */}
                <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#d1d3e6_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#d1d3e6] [&::-webkit-scrollbar-thumb]:rounded-full">
                    <table className="min-w-full text-left table-fixed">
                        {colGroup}
                        <tbody className="divide-y divide-[#d1d3e6]">
                            {error ? (
                                <tr>
                                    <td colSpan={colCount} className="px-6 py-6 text-center text-sm text-red-600">
                                        Error: {error}
                                    </td>
                                </tr>
                            ) : loading ? (
                                <>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={`skeleton-${i}`}>
                                            {columns.map((_, j) => (
                                                <td key={j} className="px-6 py-5">
                                                    <div className="h-4 w-full max-w-[120px] bg-gray-200 rounded animate-pulse" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={colCount} className="px-6 py-6 text-center text-sm text-[#505795]">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => {
                                    const isSelected = selectedId === row.id;
                                    return (
                                        <tr
                                            key={row.id}
                                            onClick={() => onSelect(row)}
                                            className={`hover:bg-primary/5 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-primary/5 border-l-4 border-l-blue-700' : 'border-l-4 border-l-transparent'}`}
                                        >
                                            {columns.map((col, j) => (
                                                <td key={j} className="px-6 py-5">
                                                    {col.render(row)}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
