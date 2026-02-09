import { PanelLeft } from 'lucide-react';
import React from 'react';

type HeaderProps = {
    onToggleSidebar: () => void;
};

const PrimaryHeader: React.FC<HeaderProps> = ({ onToggleSidebar }) => {

    return (
        <header className="flex flex-wrap sm:flex-nowrap items-center justify-between w-full px-4 sm:px-6 py-4 mb-2 bg-slate-100 rounded-t-xl">
            <div className="flex items-center mb-2 sm:mb-0">
                {/* Mobile menu button for small screens */}
                {/* <button
                    onClick={onOpenMobileMenu}
                    className="sm:hidden mr-4"
                    aria-label="Open mobile menu"
                >
                    <Menu className="w-7 h-7 text-black" strokeWidth={1} />
                </button> */}

                {/* Sidebar toggle button for sm and up */}
                <button
                    onClick={onToggleSidebar}
                    className="hidden sm:inline mr-4"
                    aria-label="Toggle sidebar"
                >
                    <PanelLeft className="w-7 h-7 text-black" strokeWidth={1} />
                </button>
            </div>

            {/* <div className="p-4 flex flex-col gap-2">
                <button
                    onClick={handleLogout}
                    className={`
            flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full
            ${sidebarOpen ? '' : 'justify-center'}
          `}
                >
                    <LogOut className="min-w-[20px] min-h-[20px] w-5 h-5" />
                    {sidebarOpen && <span className="text-sm">Logout</span>}
                </button>
            </div> */}
        </header >
    );
};

export default PrimaryHeader;