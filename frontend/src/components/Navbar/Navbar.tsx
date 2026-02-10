import { LogOut } from 'lucide-react';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../login/AuthContext';
import { routes } from '../../routeConfig';

const Navbar: React.FC<{ sidebarOpen: boolean }> = ({ sidebarOpen }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside
            className={`
        transition-all duration-500
        ${sidebarOpen ? 'w-64' : 'w-16'}
        h-screen flex flex-col bg-white border-r border-[#e8e9f3] shadow-sm
      `}
        >
            <div className={`flex items-center px-4 mt-4 mb-4 h-[64px] transition-all duration-300 ${sidebarOpen ? 'justify-start' : 'justify-center w-full'}`}>
                <img src="/VoicePlug_Logo.svg" alt="Voiceplug Logo" className="w-10 h-10" />
                {sidebarOpen && (
                    <div className='relative ml-2'>
                        <span className='text-[24px] font-semibold'>ReserveVOICE</span>
                        <span className="absolute top-[0px] right-[-8px] text-[10px] text-black font-semibold translate-x-1/2 -translate-y-1/2 ml-6">™</span>
                    </div>
                )}
            </div>
            {/* Nav Links */}
            <nav className="flex-1 px-4 py-4 space-y-2 mt-2">
                {routes.filter(r => r.showInSidebar).map((link) => {
                    // compute full sidebar path at root (no /home prefix)
                    const fullPath = link.path ? (link.path.startsWith('/') ? `${link.path}` : `/${link.path}`) : '/';
                     // active if exact match or a nested path under the route
                     const isActive = location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
                     return (
                         <Link
                             key={link.label}
                             to={fullPath}
                             className={`
                                 flex items-start gap-2 px-5 py-3 rounded-lg font-medium transition-colors
                                 ${isActive ? 'bg-[#e8e9f3] text-blue-700' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'}
                                 ${sidebarOpen ? '' : 'justify-center'}
                             `}
                             aria-current={isActive ? 'page' : undefined}
                         >
                             {link.icon && React.cloneElement(link.icon, {
                                 // force icon color to white when active, slate when not
                                 className: `w-5 h-5 ${isActive ? 'text-blue-700' : 'text-slate-400'} transition-colors`,
                            })}
                            {sidebarOpen && <span className="text-sm">{link.label}</span>}
                        </Link>
                     );
                 })}
             </nav>
            {/* Help & Logout */}
            <div className="p-4 border-t border-[#e8e9f3] mt-auto flex flex-col gap-2">
                <button
                    onClick={handleLogout}
                    className={`
            flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-red-600 hover:bg-red-50 transition-colors w-full
            ${sidebarOpen ? '' : 'justify-center'}
          `}
                >
                    <LogOut className="min-w-[20px] min-h-[20px] w-5 h-5" />
                    {sidebarOpen && <span className="text-sm">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Navbar;