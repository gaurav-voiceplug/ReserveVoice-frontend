import { UserPlus } from 'lucide-react';
import { useEffect, useState, type JSX } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DataTable, { type Column } from '../common/DataTable';
import FilterBar from '../common/FilterBar';
import PageHeader from '../common/PageHeader';
import { type AddUserFormData } from './AddUserModal';

type User = {
    id: string;
    name: string;
    email: string;
    role: 'brand_admin' | 'store_admin' | 'store_operations';
    status: 'active' | 'inactive';
    createdAt?: string;
};

const ROLE_CHIP: Record<User['role'], { label: string; text: string; bg: string; dot: string }> = {
    brand_admin:      { label: 'Brand Admin',      text: 'text-[#2437e0]',  bg: 'bg-[#eef2ff]',  dot: 'bg-[#2437e0]'  },
    store_admin:      { label: 'Store Admin',      text: 'text-purple-700', bg: 'bg-purple-50',   dot: 'bg-purple-600'  },
    store_operations: { label: 'Store Ops',        text: 'text-amber-700',  bg: 'bg-amber-50',    dot: 'bg-amber-500'   },
};

const STATUS_CHIP: Record<User['status'], { label: string; text: string; bg: string; dot: string }> = {
    active:   { label: 'Active',   text: 'text-[#0b875b]', bg: 'bg-[#ecfdf3]', dot: 'bg-[#0b875b]' },
    inactive: { label: 'Inactive', text: 'text-slate-500',  bg: 'bg-slate-100', dot: 'bg-slate-400'  },
};

const DUMMY_USERS: User[] = [
    { id: '1',  name: 'Alice Johnson',   email: 'alice.johnson@reservevoice.com',  role: 'brand_admin',      status: 'active',   createdAt: '2024-01-15' },
    { id: '2',  name: 'Brian Patel',     email: 'brian.patel@reservevoice.com',    role: 'store_admin',      status: 'active',   createdAt: '2024-02-03' },
    { id: '3',  name: 'Clara Martinez',  email: 'clara.martinez@reservevoice.com', role: 'store_operations', status: 'active',   createdAt: '2024-02-18' },
    { id: '4',  name: 'David Kim',       email: 'david.kim@reservevoice.com',      role: 'store_operations', status: 'inactive', createdAt: '2024-03-07' },
    { id: '5',  name: 'Emily Chen',      email: 'emily.chen@reservevoice.com',     role: 'store_admin',      status: 'active',   createdAt: '2024-03-22' },
    { id: '6',  name: 'Frank Nguyen',    email: 'frank.nguyen@reservevoice.com',   role: 'store_operations', status: 'inactive', createdAt: '2024-04-01' },
    { id: '7',  name: 'Grace Lee',       email: 'grace.lee@reservevoice.com',      role: 'store_operations', status: 'active',   createdAt: '2024-04-14' },
    { id: '8',  name: 'Henry Brooks',    email: 'henry.brooks@reservevoice.com',   role: 'store_admin',      status: 'active',   createdAt: '2024-05-09' },
    { id: '9',  name: 'Isabella Torres', email: 'i.torres@reservevoice.com',       role: 'store_operations', status: 'active',   createdAt: '2024-05-20' },
    { id: '10', name: 'James Wright',    email: 'james.wright@reservevoice.com',   role: 'brand_admin',      status: 'active',   createdAt: '2024-06-02' },
    { id: '11', name: 'Karen Scott',     email: 'karen.scott@reservevoice.com',    role: 'store_admin',      status: 'inactive', createdAt: '2024-06-17' },
    { id: '12', name: 'Liam Patel',      email: 'liam.patel@reservevoice.com',     role: 'store_operations', status: 'inactive', createdAt: '2024-07-05' },
];

export default function UserManagement(): JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const [users, setUsers] = useState<User[]>(DUMMY_USERS);
    const [loading] = useState(false);
    const [error] = useState<string | null>(null);
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [roleFilter, setRoleFilter] = useState<string[]>([]);

    // Accept new user navigated back from AddUserPage
    useEffect(() => {
        const state = location.state as { newUser?: AddUserFormData } | null;
        if (state?.newUser) {
            const data = state.newUser;
            const newUser: User = {
                id: String(Date.now()),
                name: `${data.first_name} ${data.last_name}`.trim(),
                email: data.email,
                role: data.role,
                status: 'active',
                createdAt: new Date().toISOString().slice(0, 10),
            };
            setUsers((prev) => [newUser, ...prev]);
            // Clear the navigation state so a refresh doesn't re-add
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    const filtered = users.filter((u) => {
        const q = nameFilter.toLowerCase();
        const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(u.status);
        const matchesRole = roleFilter.length === 0 || roleFilter.includes(u.role);
        return matchesSearch && matchesStatus && matchesRole;
    });

    const userColumns: Column<User>[] = [
        {
            header: 'Name',
            width: '22%',
            render: (u) => <span className="text-sm font-semibold text-[#0e101b]">{u.name}</span>,
        },
        {
            header: 'Email',
            width: '30%',
            render: (u) => <span className="text-sm text-[#505795]">{u.email}</span>,
        },
        {
            header: 'Role',
            width: '18%',
            render: (u) => {
                const c = ROLE_CHIP[u.role];
                return (
                    <div className={`inline-flex items-center gap-1.5 ${c.text} ${c.bg} px-2.5 py-1 rounded-full w-fit`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        <span className="text-xs font-bold">{c.label}</span>
                    </div>
                );
            },
        },
        {
            header: 'Status',
            width: '14%',
            render: (u) => {
                const c = STATUS_CHIP[u.status];
                return (
                    <div className={`inline-flex items-center gap-1.5 ${c.text} ${c.bg} px-2.5 py-1 rounded-full w-fit`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        <span className="text-xs font-bold">{c.label}</span>
                    </div>
                );
            },
        },
        {
            header: 'Created',
            width: '16%',
            render: (u) => (
                <span className="text-sm text-[#505795]">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                </span>
            ),
        },
    ];

    return (
        <div className="flex w-full bg-background-light h-[calc(100vh-1rem)] overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col gap-4 px-10 py-8 overflow-hidden">
                <PageHeader title="User Management" subtitle={`${users.length} total users`}>
                    <button
                        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#2437e0] text-white text-sm font-bold hover:bg-[#1a2ab8] cursor-pointer"
                        onClick={() => navigate('/users/add')}
                    >
                        <UserPlus className="w-4 h-4" />
                        Add New User
                    </button>
                </PageHeader>

                <FilterBar
                    loading={loading}
                    name={nameFilter}
                    onNameChange={setNameFilter}
                    statusValues={statusFilter}
                    onStatusChange={setStatusFilter}
                    statusOptions={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                    ]}
                    roleValues={roleFilter}
                    onRoleChange={setRoleFilter}
                    roleOptions={[
                        { value: 'brand_admin', label: 'Brand Admin' },
                        { value: 'store_admin', label: 'Store Admin' },
                        { value: 'store_operations', label: 'Store Ops' },
                    ]}
                    onClearAll={() => { setNameFilter(''); setStatusFilter([]); setRoleFilter([]); }}
                />

                <DataTable
                    columns={userColumns}
                    rows={filtered}
                    loading={loading}
                    error={error}
                    onSelect={() => {}}
                    emptyMessage="No users found"
                />
            </div>
        </div>
    );
}
