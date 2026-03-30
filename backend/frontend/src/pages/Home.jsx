import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Menu, Bell, X, CheckCircle2, UploadCloud, Users, FileText, Info, ChevronRight, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';

function Home() {
    const navigate = useNavigate();
    const [professores, setProfessores] = useState([]);
    const location = useLocation();
    const [menuAtivo, setMenuAtivo] = useState(location.state?.menuAtivo || 'professores');

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filtroDisciplina, setFiltroDisciplina] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [abaModal, setAbaModal] = useState('manual');
    const [formData, setFormData] = useState({ nome: '', disciplina: '', turmas: '' });
    const [arquivo, setArquivo] = useState(null);
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });

    // DASHBOARD & MODAIS DE INFORMAÇÃO
    const [dashboard, setDashboard] = useState({
        total_professores: 0, total_atas: 0,
        pendencias_abertas: 0, pendencias_concluidas: 0,
        portal_em_dia: 0, portal_pendente: 0,
        professores_metas_abertas: [],
        professores_portal_pendente: [],
        top_temas: [], top_observacoes: []
    });

    const [modalInfoAberto, setModalInfoAberto] = useState(null); // 'metas' | 'portal' | null
    const modalRef = useRef(null);

    // Fechar modal ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setModalInfoAberto(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const carregarProfessores = () => {
        api.get('/professores')
            .then(response => setProfessores(response.data))
            .catch(error => console.error("Erro ao buscar professores:", error));
    };

    const carregarDashboard = () => {
        api.get('/dashboard')
            .then(response => setDashboard(response.data))
            .catch(error => console.error("Erro ao buscar dashboard:", error));
    };

    useEffect(() => {
        carregarProfessores();
        carregarDashboard();
    }, []);

    const disciplinasUnicas = [...new Set(professores.map(p => p.disciplina).filter(Boolean))];

    const filteredProfessores = professores.filter(prof => {
        const matchBusca = prof.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFiltro = filtroDisciplina === '' || prof.disciplina === filtroDisciplina;
        return matchBusca && matchFiltro;
    });

    const handleSaveManual = async () => {
        if (!formData.nome) return;
        setMensagem({ texto: 'A guardar...', tipo: 'info' });
        try {
            await api.post('/professores', formData);
            setMensagem({ texto: 'Professor adicionado com sucesso.', tipo: 'success' });
            setFormData({ nome: '', disciplina: '', turmas: '' });
            carregarProfessores();
            setTimeout(() => { setIsModalOpen(false); setMensagem({ texto: '', tipo: '' }); }, 300);
        } catch (error) {
            setMensagem({ texto: error.response?.data?.erro || 'Erro ao guardar.', tipo: 'error' });
        }
    };

    const handleImportar = async () => {
        if (!arquivo) return setMensagem({ texto: 'Selecione um ficheiro.', tipo: 'error' });
        const data = new FormData();
        data.append('arquivo', arquivo);
        setMensagem({ texto: 'A processar...', tipo: 'info' });
        try {
            const res = await api.post('/professores/importar', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMensagem({ texto: res.data.mensagem || 'Documento importado com sucesso.', tipo: 'success' });
            setArquivo(null);
            carregarProfessores();
            setTimeout(() => { setIsModalOpen(false); setMensagem({ texto: '', tipo: '' }); }, 300);
        } catch (error) {
            setMensagem({ texto: error.response?.data?.erro || 'Erro ao importar.', tipo: 'error' });
        }
    };

    // Estilos Customizados Injetados da Inspiração
    const customStyles = `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            line-height: 1;
            text-transform: none;
            letter-spacing: normal;
            word-wrap: normal;
            white-space: nowrap;
            direction: ltr;
        }
        .signature-glow {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%);
        }
        .editorial-shadow {
            box-shadow: 0 12px 32px rgba(32, 48, 68, 0.06);
        }
        .bg-dots {
            background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
            background-size: 24px 24px;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `;

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />

            <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
                )}

                <Sidebar
                    isMobileMenuOpen={isMobileMenuOpen}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    activeMenuOverride={menuAtivo}
                    onMenuClick={setMenuAtivo}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f6ff]">

                    {/* CABEÇALHO PADRONIZADO */}
                    <header className="h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 shadow-sm sticky top-0 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-primary rounded-lg transition-colors">
                                <Menu size={24} />
                            </button>
                            <span className="text-xl font-black text-slate-800 italic font-headline hidden md:block">Academic Atelier</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-primary rounded-full transition-colors hidden sm:block">
                                <Bell size={20} />
                            </button>
                            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                            <div className="flex items-center gap-3 p-1.5 pr-3 cursor-pointer group" onClick={() => {
                                localStorage.removeItem('@AtasApp:token');
                                navigate('/login');
                            }}>
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

                    <main className="flex-1 overflow-y-auto px-4 py-8 md:px-12 md:py-12 scroll-smooth bg-[#f4f6ff] dotted-grid">
                        <div className="max-w-7xl mx-auto animate-fade-in-up">

                            {/* MÓDULO: DASHBOARD */}
                            {menuAtivo === 'dashboard' && (
                                <div className="space-y-6">
                                    <div className="mb-8">
                                        <span className="font-body text-brand-primary uppercase tracking-[0.2em] font-semibold mb-2 block text-xs">Visão Geral</span>
                                        <h1 className="text-4xl font-headline font-extrabold tracking-tighter text-slate-800 leading-tight">Dashboard Escolar</h1>
                                        <p className="text-slate-500 text-lg mt-2 font-body font-light">Resumo geral de acompanhamento pedagógico.</p>
                                    </div>

                                    {/* CARTÕES DO DASHBOARD MANTIDOS IGUAIS E FUNCIONAIS */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-body">Corpo Docente</p>
                                                <p className="text-3xl font-black text-slate-800 mt-2 font-headline">{dashboard.total_professores}</p>
                                            </div>
                                            <div className="p-3 bg-orange-50 text-brand-primary rounded-xl"><Users size={20} /></div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-body">Atas Geradas</p>
                                                <p className="text-3xl font-black text-slate-800 mt-2 font-headline">{dashboard.total_atas}</p>
                                            </div>
                                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={20} /></div>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-body">Metas Firmadas</p>
                                                <button onClick={() => setModalInfoAberto(modalInfoAberto === 'metas' ? null : 'metas')} className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-[#78865c]/20 hover:text-[#78865c] transition-colors" title="Ver Professores com Metas">
                                                    <Info size={14} />
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-bold text-slate-600 mt-1 font-body">
                                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#78865c]"></div> Abertas: {dashboard.pendencias_abertas}</span>
                                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Concluídas: {dashboard.pendencias_concluidas}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                                                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: dashboard.pendencias_abertas + dashboard.pendencias_concluidas > 0 ? `${(dashboard.pendencias_concluidas / (dashboard.pendencias_abertas + dashboard.pendencias_concluidas)) * 100}%` : '0%' }}></div>
                                            </div>
                                            {modalInfoAberto === 'metas' && (
                                                <div ref={modalRef} className="absolute top-12 right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden">
                                                    <div className="px-4 py-3 bg-[#78865c] text-white border-b border-[#6a7651]">
                                                        <p className="text-xs font-black uppercase tracking-wider font-body">Professores com Metas</p>
                                                    </div>
                                                    <div className="max-h-56 overflow-y-auto p-1.5 custom-scrollbar">
                                                        {dashboard.professores_metas_abertas?.length > 0 ? (
                                                            dashboard.professores_metas_abertas.map((prof, idx) => (
                                                                <div key={idx} onClick={() => navigate(`/professor/${prof.id}`)} className="flex justify-between items-center px-3 py-2.5 text-sm text-slate-700 font-bold hover:bg-[#78865c]/10 hover:text-[#78865c] rounded-lg cursor-pointer transition-colors font-body">
                                                                    <span className="truncate pr-2">{prof.nome}</span>
                                                                    <ChevronRight size={16} className="text-[#78865c]/50 shrink-0" />
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-slate-500 font-medium">Nenhum professor com metas abertas.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-body">Situação do Portal</p>
                                                <button onClick={() => setModalInfoAberto(modalInfoAberto === 'portal' ? null : 'portal')} className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors" title="Ver Professores Pendentes">
                                                    <Info size={14} />
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-bold text-slate-600 mt-1 font-body">
                                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-primary"></div> Em Dia: {dashboard.portal_em_dia}</span>
                                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400"></div> Pendentes: {dashboard.portal_pendente}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden flex gap-[2px]">
                                                <div className="bg-brand-primary h-1.5 rounded-full transition-all" style={{ flexGrow: dashboard.portal_em_dia }}></div>
                                                <div className="bg-red-400 h-1.5 rounded-full transition-all" style={{ flexGrow: dashboard.portal_pendente }}></div>
                                            </div>
                                            {modalInfoAberto === 'portal' && (
                                                <div ref={modalRef} className="absolute top-12 right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden">
                                                    <div className="px-4 py-3 bg-red-600 text-white border-b border-red-700">
                                                        <p className="text-xs font-black uppercase tracking-wider font-body">Portal Pendente</p>
                                                    </div>
                                                    <div className="max-h-56 overflow-y-auto p-1.5 custom-scrollbar">
                                                        {dashboard.professores_portal_pendente?.length > 0 ? (
                                                            dashboard.professores_portal_pendente.map((prof, idx) => (
                                                                <div key={idx} onClick={() => navigate(`/professor/${prof.id}`)} className="flex justify-between items-center px-3 py-2.5 text-sm text-slate-700 font-bold hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer transition-colors font-body">
                                                                    <span className="truncate pr-2">{prof.nome}</span>
                                                                    <ChevronRight size={16} className="text-red-300 shrink-0" />
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-slate-500 font-medium">Todos os professores em dia!</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3 font-body">Temas mais Abordados</h3>
                                            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                                {dashboard.top_temas?.map((t, i) => (
                                                    <div key={`tema-${i}`} className="flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-100">
                                                        <span className="text-sm font-bold text-slate-700 font-body">{t.nome}</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-xs font-black text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-md">{t.quantidade}x</div>
                                                            <div className="text-xs font-black text-slate-400 min-w-[44px] text-right bg-white px-2 py-1 rounded-md shadow-sm border border-slate-200">{t.porcentagem.toFixed(1)}%</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3 font-body">Principais Observações</h3>
                                            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                                {dashboard.top_observacoes?.map((t, i) => (
                                                    <div key={`obs-${i}`} className="flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-100">
                                                        <span className="text-sm font-bold text-slate-700 font-body">{t.nome}</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-xs font-black text-amber-700 bg-amber-100/50 px-2.5 py-1 rounded-md">{t.quantidade}x</div>
                                                            <div className="text-xs font-black text-slate-400 min-w-[44px] text-right bg-white px-2 py-1 rounded-md shadow-sm border border-slate-200">{t.porcentagem.toFixed(1)}%</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MÓDULO: CORPO DOCENTE (A NOVA INSPIRAÇÃO!) */}
                            {menuAtivo === 'professores' && (
                                <>
                                    {/* Hero / Header Section with Asymmetric Layout */}
                                    <section className="relative mb-12 overflow-hidden rounded-2xl bg-white border border-slate-200 p-8 md:p-12 flex flex-col md:flex-row justify-between items-end gap-8 shadow-sm">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-dots -mr-12 -mt-12 pointer-events-none opacity-40"></div>
                                        <div className="relative z-10 max-w-2xl w-full">
                                            <span className="font-body text-brand-primary uppercase tracking-[0.2em] font-bold mb-3 block text-[11px]">Gestão Académica</span>
                                            <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-800 mb-4 leading-tight">
                                                Excelência no <br /><span className="text-brand-primary">Corpo Docente</span>
                                            </h1>
                                            <p className="text-slate-500 text-base md:text-lg max-w-lg leading-relaxed font-body font-light">
                                                Visualize e gira os professores que moldam o futuro da instituição.
                                            </p>
                                        </div>
                                        <div className="relative z-10 flex w-full md:w-auto shrink-0">
                                            <button onClick={() => { setIsModalOpen(true); setAbaModal('manual'); }} className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 signature-glow text-white rounded-full font-headline font-bold shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform">
                                                <span className="material-symbols-outlined">person_add</span>
                                                Novo Professor
                                            </button>
                                        </div>
                                    </section>

                                    {/* Filters & Search Bar */}
                                    <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between">
                                        <div className="w-full md:w-1/3 relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                            <input
                                                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-body text-sm placeholder:text-slate-400 shadow-sm outline-none"
                                                placeholder="Buscar por nome ou disciplina..."
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-3 overflow-x-auto pb-2 w-full md:w-auto custom-scrollbar">
                                            <button
                                                onClick={() => setFiltroDisciplina('')}
                                                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${filtroDisciplina === '' ? 'bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                Todos
                                            </button>
                                            {disciplinasUnicas.map((disc, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setFiltroDisciplina(disc)}
                                                    className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${filtroDisciplina === disc ? 'bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    {disc}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Refined Faculty Table (The "Atelier" List) */}
                                    <div className="bg-white rounded-2xl editorial-shadow border border-slate-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse text-left min-w-[800px]">
                                                <thead>
                                                    <tr className="bg-slate-900 text-white font-headline text-xs uppercase tracking-widest border-none">
                                                        <th className="px-8 py-5 font-bold rounded-tl-xl">Professor</th>
                                                        <th className="px-6 py-5 font-bold">Disciplina</th>
                                                        <th className="px-6 py-5 font-bold">Turmas</th>
                                                        <th className="px-8 py-5 text-right font-bold rounded-tr-xl">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 font-body">
                                                    {filteredProfessores.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="4" className="px-8 py-16 text-center">
                                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                                    <span className="material-symbols-outlined text-5xl mb-3 opacity-50">search_off</span>
                                                                    <p className="font-medium text-lg text-slate-500">Nenhum professor encontrado.</p>
                                                                    <p className="text-sm mt-1">Tente ajustar os seus termos de busca ou filtros.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredProfessores.map((prof, index) => (
                                                            <tr key={prof.id} onClick={() => navigate(`/professor/${prof.id}`)} className="group hover:bg-slate-50/80 transition-colors duration-300 cursor-pointer">
                                                                <td className="px-8 py-6 w-2/5">
                                                                    <div className="flex items-center gap-5">
                                                                        <div className={`h-14 w-14 shrink-0 rounded-full flex items-center justify-center font-headline font-black text-xl text-white shadow-md transition-transform group-hover:scale-105 ${index % 3 === 0 ? 'signature-glow' : index % 3 === 1 ? 'bg-[#78865c]' : 'bg-slate-800'}`}>
                                                                            {prof.nome.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-headline font-bold text-lg text-slate-800 group-hover:text-brand-primary transition-colors">{prof.nome}</p>
                                                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Docente Registado</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6 w-1/4">
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {prof.disciplina?.split(',').map((d, i) => (
                                                                            <span key={i} className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-wider">{d.trim()}</span>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6 w-1/4">
                                                                    <span className="font-body text-sm font-bold text-slate-700 flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-slate-400 text-lg">group</span>
                                                                        {prof.turmas || '-'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-6 text-right w-32">
                                                                    <button className="p-3 text-slate-400 bg-white border border-slate-200 rounded-xl group-hover:bg-brand-primary group-hover:text-white group-hover:border-brand-primary transition-all shadow-sm">
                                                                        <span className="material-symbols-outlined">arrow_forward</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </main>
                </div>

                {/* MODAL DE ADIÇÃO (MANTIDO E ESTILIZADO) */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-body">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-headline font-extrabold text-slate-800">{abaModal === 'manual' ? 'Novo Professor' : 'Importar Dados'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><X size={20} /></button>
                            </div>

                            <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 rounded-xl">
                                <button className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${abaModal === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => { setAbaModal('manual'); setMensagem({ texto: '', tipo: '' }); }}>Registo Manual</button>
                                <button className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${abaModal === 'planilha' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => { setAbaModal('planilha'); setMensagem({ texto: '', tipo: '' }); }}>Importar Excel/CSV</button>
                            </div>

                            {mensagem.texto && <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${mensagem.tipo === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>{mensagem.tipo === 'success' ? <CheckCircle2 size={20} /> : <X size={20} />}{mensagem.texto}</div>}

                            {abaModal === 'manual' ? (
                                <div className="space-y-5">
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label><input type="text" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-semibold focus:border-brand-primary outline-none transition-all shadow-sm" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Disciplina</label><input type="text" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-semibold focus:border-brand-primary outline-none transition-all shadow-sm" value={formData.disciplina} onChange={e => setFormData({ ...formData, disciplina: e.target.value })} /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Turmas</label><input type="text" placeholder="Ex: 6A, 7B" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-semibold focus:border-brand-primary outline-none transition-all shadow-sm" value={formData.turmas} onChange={e => setFormData({ ...formData, turmas: e.target.value })} /></div>
                                    <div className="flex gap-3 pt-6"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={handleSaveManual} className="flex-1 py-4 signature-glow text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform">Guardar</button></div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 hover:border-brand-primary/50 hover:bg-orange-50/50 transition-all group relative overflow-hidden bg-slate-50">
                                        <UploadCloud className="w-16 h-16 text-slate-300 group-hover:text-brand-primary transition-colors" />
                                        <p className="text-base font-bold text-slate-700 text-center font-headline">Clique ou arraste o ficheiro</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">.CSV ou .XLSX</p>
                                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={(e) => setArquivo(e.target.files[0])} />
                                    </div>
                                    {arquivo && <div className="p-4 bg-slate-800 rounded-xl text-sm font-bold text-white flex items-center justify-between"><span className="truncate pr-4">{arquivo.name}</span><button onClick={() => setArquivo(null)} className="text-slate-400 hover:text-red-400 bg-white/10 p-1.5 rounded-lg"><X size={16} /></button></div>}
                                    <div className="flex gap-3 pt-6"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={handleImportar} className="flex-1 py-4 signature-glow text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform">Iniciar Importação</button></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default Home;