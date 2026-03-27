import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Settings, ChevronLeft, ChevronRight, X, LogOut
} from 'lucide-react';

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen, activeMenuOverride, onMenuClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('@AtasApp:token');
        localStorage.removeItem('@AtasApp:usuario');
        navigate('/login');
    };

    // Determine absolute active menu if override is not provided
    const path = location.pathname;
    let computedActive = 'dashboard';
    
    if (activeMenuOverride) {
        computedActive = activeMenuOverride;
    } else if (path.includes('/configuracoes')) {
        computedActive = 'configuracoes';
    } else if (path.includes('/professor') || path.includes('/nova-ata')) {
        computedActive = 'professores';
    }

    const handleNav = (menu) => {
        setIsMobileMenuOpen(false);
        if (menu === 'configuracoes') {
            navigate('/configuracoes');
        } else if (onMenuClick) {
            onMenuClick(menu); // Usa funcao custom da propria pagina
        } else {
            // Se nao estiver na Home, redireciona para a home com estado (se necessario)
            navigate('/', { state: { menuAtivo: menu } });
        }
    };

    return (
        <aside 
            className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
            lg:translate-x-0 lg:static ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
        >
            <div className={`h-16 flex items-center border-b border-gray-100 ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
                {isSidebarCollapsed ? (
                    <img key="icon-img" src="/images/icon.png" alt="Icon ASC" className="h-8 w-8 object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                ) : (
                    <img key="logo-img" src="/images/logo.png" alt="Logo ASC" className="h-8 object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                )}
                
                <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                    className="hidden lg:flex p-1.5 text-slate-400 hover:bg-gray-100 hover:text-brand-primary rounded-lg transition-colors"
                >
                    {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>

                <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="lg:hidden p-1.5 text-slate-400 hover:bg-gray-100 rounded-lg"
                >
                    <X size={20} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                {!isSidebarCollapsed && (
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3 mt-2">
                        Menu Principal
                    </div>
                )}
                
                <button 
                    onClick={() => handleNav('dashboard')}
                    className={`flex items-center w-full py-3 rounded-xl transition-all text-sm font-medium ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} ${computedActive === 'dashboard' ? 'bg-brand-light text-brand-primary' : 'text-slate-500 hover:bg-gray-50 hover:text-slate-700'}`}
                    title={isSidebarCollapsed ? "Dashboard" : ""}
                >
                    <LayoutDashboard size={22} />
                    {!isSidebarCollapsed && <span>Dashboard</span>}
                </button>
                
                <button 
                    onClick={() => handleNav('professores')}
                    className={`flex items-center w-full py-3 rounded-xl transition-all text-sm font-medium ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} ${computedActive === 'professores' ? 'bg-brand-light text-brand-primary' : 'text-slate-500 hover:bg-gray-50 hover:text-slate-700'}`}
                    title={isSidebarCollapsed ? "Professores" : ""}
                >
                    <Users size={22} />
                    {!isSidebarCollapsed && <span>Professores</span>}
                </button>

                <button 
                    onClick={() => handleNav('configuracoes')}
                    className={`flex items-center w-full py-3 rounded-xl transition-all text-sm font-medium ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} ${computedActive === 'configuracoes' ? 'bg-brand-light text-brand-primary' : 'text-slate-500 hover:bg-gray-50 hover:text-slate-700'}`}
                    title={isSidebarCollapsed ? "Configurações" : ""}
                >
                    <Settings size={22} />
                    {!isSidebarCollapsed && <span>Configurações</span>}
                </button>
            </div>
            
            <div className="p-3 border-t border-gray-100">
                <button 
                    onClick={handleLogout}
                    className={`flex items-center w-full py-3 rounded-xl transition-all text-sm font-bold ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} text-red-500 hover:bg-red-50 hover:text-red-600`}
                    title={isSidebarCollapsed ? "Sair" : ""}
                >
                    <LogOut size={22} />
                    {!isSidebarCollapsed && <span>Sair do Sistema</span>}
                </button>
            </div>
        </aside>
    );
}
