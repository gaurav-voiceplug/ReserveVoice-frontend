import { Box, Calendar as CalendarIcon, CreditCard, MapPinCheck, Users } from 'lucide-react';
import AddFAQPage from './components/FAQs/AddFAQPage';
import FAQLibrary from './components/FAQs/FAQLibrary';
import AddLocationPage from './components/location/AddLocationPage';
import LocationManagement from './components/location/LocationManagement';
import OrdersOverview from './components/transScripts/orders/OrdersOverview';
import TableReservation from './components/transScripts/reservations/TableReservation';
import AddUserPage from './components/users/AddUserPage';
import UserManagement from './components/users/UserManagement';

export const routes = [
    {
        path: 'orders',
        element: <OrdersOverview />,
        label: 'Orders',
        icon: <Box className="w-5 h-5 text-black" />,
        showInSidebar: true,
    },
    {
        path: 'reservations',
        element: <TableReservation />,
        label: 'Reservations',
        icon: <CalendarIcon className="w-5 h-5 text-black" />,
        showInSidebar: true,
    },
    {
         path: 'users',
        element: <UserManagement />,
        label: 'User Management',
        icon: <Users className="w-6 h-6 text-black" />,
        showInSidebar: true,
    },
    {
        path: 'users/add',
        element: <AddUserPage />,
        label: 'Add User',
        showInSidebar: false,
    },
    {
        path: 'locations',
        element: <LocationManagement />,
        label: 'Location Management',
        icon: <MapPinCheck className="w-6 h-6 text-black" />,
        showInSidebar: true,
    },
    {
        path: 'locations/add',
        element: <AddLocationPage />,
        label: 'Add Location',
        showInSidebar: false,
    },
    {
        path: 'faqs',
        element: <FAQLibrary />,
        label: 'FAQs',
        icon: <CreditCard className="w-5 h-5 text-black" />,
        showInSidebar: true,
    },
    {
        path: 'faqs/add',
        element: <AddFAQPage />,
        label: 'Add FAQ',
        showInSidebar: false,
    },

    // Add more protected child routes here
];
