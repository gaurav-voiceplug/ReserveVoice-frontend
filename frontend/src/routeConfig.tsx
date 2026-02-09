import FAQ from './components/FAQs/FAQ';
import LocationManagement from './components/location/LocationManagement';
import ReservationsOverview from './components/reservations/ReservationsOverview';
import OrdersOverview from './components/orders/OrdersOverview';

import { Calendar as CalendarIcon, CreditCard, MapPinCheck, Box } from 'lucide-react';

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
        element: <ReservationsOverview />,
        label: 'Reservations',
        icon: <CalendarIcon className="w-5 h-5 text-black" />,
        showInSidebar: true,
    },
    // {
    //     index: true,
    //     element: <div>Dashboard Home</div>,
    //     label: 'Dashboard',
    //     icon: <HomeIcon className="w-5 h-5" />, 
    //     path: '',
    //     showInSidebar: true,
    // },
    {
        path: 'locations',
        element: <LocationManagement />,
        label: 'Location Management',
        icon: <MapPinCheck className="w-6 h-6 text-black" />, 
        showInSidebar: true,
    },
    {
        path: 'faqs',
        element: <FAQ />,
        label: 'FAQs',
        icon: <CreditCard className="w-5 h-5 text-black" />, 
        showInSidebar: true,
    },
    
    // Add more protected child routes here
];
