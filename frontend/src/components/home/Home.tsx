import { useEffect, useRef, useState } from "react";
import Navbar from "../Navbar/Navbar";
import { Outlet, useLocation } from "react-router-dom";

const Home = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const mainContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
    }, [location.pathname]);



    return (
        <div className="flex flex-col sm:flex-row min-h-screen bg-white w-full overflow-hidden">
            {/* Sidebar for desktop - sticky */}
            <div className={`hidden sm:flex flex-shrink-0 ${sidebarOpen ? 'w-[250px]' : 'w-[70px]'} h-screen sticky top-0 z-50`}>
                <Navbar sidebarOpen={sidebarOpen} />
            </div>

            {/* Main content */}
            <div ref={mainContentRef} className="flex-1 flex flex-col overflow-y-auto min-w-0 h-screen">
                {/* <PrimaryHeader
                    onToggleSidebar={() => setSidebarOpen((v) => !v)}
                /> */}
                <div className="flex-1 bg-slate-100 overflow-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Home
