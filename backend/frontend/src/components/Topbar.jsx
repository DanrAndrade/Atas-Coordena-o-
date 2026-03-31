import { useNavigate } from 'react-router-dom';
import { Menu, Bell, ArrowLeft } from 'lucide-react';

export default function Topbar({ 
    onMenuClick, 
    showMenuButton = false, 
    showBackButton = false, 
    onBackClick 
}) {
    const navigate = useNavigate();
    
    const handleBack = () => {
        if (onBackClick) onBackClick();
        else navigate(-1);
    };

    const handleLogout = () => {
        localStorage.removeItem('@AtasApp:token');
        localStorage.removeItem('@AtasApp:usuario');
        navigate('/login');
    };

    return (
        <header className="h-14 md:h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 shadow-sm sticky top-0 transition-all duration-300">
            <div className="flex items-center gap-4">
                {showMenuButton && (
                    <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-primary rounded-lg transition-colors">
                        <Menu size={24} />
                    </button>
                )}
                {showBackButton && (
                    <button onClick={handleBack} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-primary rounded-lg transition-colors" title="Voltar">
                        <ArrowLeft size={22} />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-primary rounded-full transition-colors hidden sm:block">
                    <Bell size={20} />
                </button>
                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                <div className="flex items-center gap-3 p-1.5 pr-3 cursor-pointer group" onClick={handleLogout}>
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-bold text-slate-700 leading-tight font-headline group-hover:text-red-600 transition-colors">
                            {JSON.parse(localStorage.getItem('@AtasApp:usuario') || 'null')?.nome || 'Utilizador'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide font-body group-hover:text-red-400 transition-colors">Coordenação (Sair)</p>
                    </div>
                    <div className="w-10 h-10 bg-brand-primary group-hover:bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-md transition-colors border-2 border-white">
                        {JSON.parse(localStorage.getItem('@AtasApp:usuario') || 'null')?.nome?.charAt(0).toUpperCase() || 'C'}
                    </div>
                </div>
            </div>
        </header>
    );
}
