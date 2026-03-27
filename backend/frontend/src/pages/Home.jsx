import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import {
    Search, Plus, Users, Bell, Menu, X,
    CheckCircle2, UploadCloud, FileText, Info, ChevronRight
} from 'lucide-react';
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

    return (
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

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-primary rounded-lg transition-colors">
                            <Menu size={24} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-primary rounded-full transition-colors">
                            <Bell size={20} />
                        </button>
                        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                        <div className="flex items-center gap-3 p-1.5 pr-3">
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-bold text-slate-700 leading-tight">
                                    {JSON.parse(localStorage.getItem('@AtasApp:usuario') || 'null')?.nome || 'Utilizador'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Coordenação</p>
                            </div>
                            <div className="w-9 h-9 bg-brand-primary text-white rounded-lg flex items-center justify-center font-bold shadow-md">
                                {JSON.parse(localStorage.getItem('@AtasApp:usuario') || 'null')?.nome?.charAt(0).toUpperCase() || 'C'}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">

                        {menuAtivo === 'dashboard' && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Escolar</h1>
                                    <p className="text-slate-500 text-sm mt-1">Resumo geral de acompanhamento pedagógico.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Corpo Docente</p>
                                            <p className="text-3xl font-black text-slate-800 mt-2">{dashboard.total_professores}</p>
                                        </div>
                                        <div className="p-3 bg-brand-light text-brand-primary rounded-xl"><Users size={20} /></div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Atas Geradas</p>
                                            <p className="text-3xl font-black text-slate-800 mt-2">{dashboard.total_atas}</p>
                                        </div>
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={20} /></div>
                                    </div>

                                    {/* CARTÃO: METAS FIRMADAS (COM MODAL #78865c) */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metas Firmadas</p>
                                            <button
                                                onClick={() => setModalInfoAberto(modalInfoAberto === 'metas' ? null : 'metas')}
                                                className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-[#78865c]/20 hover:text-[#78865c] transition-colors"
                                                title="Ver Professores com Metas"
                                            >
                                                <Info size={14} />
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-center text-sm font-bold text-slate-600 mt-1">
                                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#78865c]"></div> Abertas: {dashboard.pendencias_abertas}</span>
                                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Concluídas: {dashboard.pendencias_concluidas}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                                            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: dashboard.pendencias_abertas + dashboard.pendencias_concluidas > 0 ? `${(dashboard.pendencias_concluidas / (dashboard.pendencias_abertas + dashboard.pendencias_concluidas)) * 100}%` : '0%' }}></div>
                                        </div>

                                        {/* Dropdown de Metas - COR #78865c E TEXTO BRANCO */}
                                        {modalInfoAberto === 'metas' && (
                                            <div ref={modalRef} className="absolute top-12 right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden">
                                                <div className="px-4 py-3 bg-[#78865c] text-white border-b border-[#6a7651]">
                                                    <p className="text-xs font-black uppercase tracking-wider">Professores com Metas</p>
                                                </div>
                                                <div className="max-h-56 overflow-y-auto p-1.5">
                                                    {dashboard.professores_metas_abertas?.length > 0 ? (
                                                        dashboard.professores_metas_abertas.map((prof, idx) => (
                                                            <div
                                                                key={idx}
                                                                onClick={() => navigate(`/professor/${prof.id}`)}
                                                                className="flex justify-between items-center px-3 py-2.5 text-sm text-slate-700 font-bold hover:bg-[#78865c]/10 hover:text-[#78865c] rounded-lg cursor-pointer transition-colors"
                                                            >
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

                                    {/* CARTÃO: PORTAL (COM MODAL VERMELHO) */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Situação do Portal</p>
                                            <button
                                                onClick={() => setModalInfoAberto(modalInfoAberto === 'portal' ? null : 'portal')}
                                                className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                                                title="Ver Professores Pendentes"
                                            >
                                                <Info size={14} />
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-center text-sm font-bold text-slate-600 mt-1">
                                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-primary"></div> Em Dia: {dashboard.portal_em_dia}</span>
                                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400"></div> Pendentes: {dashboard.portal_pendente}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden flex gap-[2px]">
                                            <div className="bg-brand-primary h-1.5 rounded-full transition-all" style={{ flexGrow: dashboard.portal_em_dia }}></div>
                                            <div className="bg-red-400 h-1.5 rounded-full transition-all" style={{ flexGrow: dashboard.portal_pendente }}></div>
                                        </div>

                                        {/* Dropdown de Portal */}
                                        {modalInfoAberto === 'portal' && (
                                            <div ref={modalRef} className="absolute top-12 right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden">
                                                <div className="px-4 py-3 bg-red-600 text-white border-b border-red-700">
                                                    <p className="text-xs font-black uppercase tracking-wider">Portal Pendente</p>
                                                </div>
                                                <div className="max-h-56 overflow-y-auto p-1.5">
                                                    {dashboard.professores_portal_pendente?.length > 0 ? (
                                                        dashboard.professores_portal_pendente.map((prof, idx) => (
                                                            <div
                                                                key={idx}
                                                                onClick={() => navigate(`/professor/${prof.id}`)}
                                                                className="flex justify-between items-center px-3 py-2.5 text-sm text-slate-700 font-bold hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer transition-colors"
                                                            >
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

                                {/* BLOCO INFERIOR DO DASHBOARD (Listas Top com Scroll) */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">Temas mais Abordados</h3>
                                        {dashboard.top_temas?.length === 0 ? (
                                            <div className="text-slate-400 italic text-sm text-center py-6 bg-slate-50 rounded-xl">Nenhum tema registado nas atas recentes.</div>
                                        ) : (
                                            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                                                {dashboard.top_temas?.map((t, i) => (
                                                    <div key={`tema-${i}`} className="flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-100">
                                                        <span className="text-sm font-bold text-slate-700">{t.nome}</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-xs font-black text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-md">{t.quantidade}x</div>
                                                            <div className="text-xs font-black text-slate-400 min-w-[44px] text-right bg-white px-2 py-1 rounded-md shadow-sm border border-slate-200">{t.porcentagem.toFixed(1)}%</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">Principais Observações</h3>
                                        {dashboard.top_observacoes?.length === 0 ? (
                                            <div className="text-slate-400 italic text-sm text-center py-6 bg-slate-50 rounded-xl">Nenhuma observação registada nas atas.</div>
                                        ) : (
                                            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                                                {dashboard.top_observacoes?.map((t, i) => (
                                                    <div key={`obs-${i}`} className="flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-100">
                                                        <span className="text-sm font-bold text-slate-700">{t.nome}</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-xs font-black text-amber-700 bg-amber-100/50 px-2.5 py-1 rounded-md">{t.quantidade}x</div>
                                                            <div className="text-xs font-black text-slate-400 min-w-[44px] text-right bg-white px-2 py-1 rounded-md shadow-sm border border-slate-200">{t.porcentagem.toFixed(1)}%</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {menuAtivo === 'professores' && (
                            <>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Corpo Docente</h1>
                                        <p className="text-slate-500 text-sm mt-1">Gira a equipa e aceda ao histórico de reuniões.</p>
                                    </div>
                                    <button onClick={() => { setIsModalOpen(true); setAbaModal('manual'); }} className="px-5 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition-all w-full md:w-auto">
                                        <Plus size={18} /> Adicionar Professor
                                    </button>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Procurar professor pelo nome..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            value={filtroDisciplina}
                                            onChange={(e) => setFiltroDisciplina(e.target.value)}
                                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all md:w-64 appearance-none"
                                        >
                                            <option value="">Todas as Disciplinas</option>
                                            {disciplinasUnicas.map((disc, idx) => <option key={idx} value={disc}>{disc}</option>)}
                                        </select>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr className="bg-white border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                                                    <th className="p-5">Professor</th>
                                                    <th className="p-5">Disciplina</th>
                                                    <th className="p-5">Turmas</th>
                                                    <th className="p-5 text-right">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 text-sm">
                                                {filteredProfessores.length === 0 ? (
                                                    <tr><td colSpan="4" className="p-12 text-center text-slate-400 font-medium">Nenhum registo encontrado.</td></tr>
                                                ) : (
                                                    filteredProfessores.map((prof) => (
                                                        <tr key={prof.id} className="group hover:bg-slate-50 transition-colors">
                                                            <td className="p-4 cursor-pointer" onClick={() => navigate(`/professor/${prof.id}`)}>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 bg-slate-100 group-hover:bg-brand-primary group-hover:text-white rounded-full flex items-center justify-center text-slate-600 font-black uppercase transition-colors shadow-sm">
                                                                        {prof.nome.charAt(0)}
                                                                    </div>
                                                                    <p className="font-bold text-slate-700 group-hover:text-brand-primary transition-colors">{prof.nome}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-slate-600 font-medium">{prof.disciplina || '-'}</td>
                                                            <td className="p-4 text-slate-600 font-medium">{prof.turmas || '-'}</td>
                                                            <td className="p-4 text-right">
                                                                <button onClick={() => navigate(`/professor/${prof.id}`)} className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white rounded-xl font-bold text-xs transition-colors shadow-sm">
                                                                    Ver Perfil
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

            {/* MODAIS MANUAIS MANTIDOS */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">{abaModal === 'manual' ? 'Novo Professor' : 'Importar Ficheiro'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><X size={16} /></button>
                        </div>
                        <div className="flex gap-2 mb-6 p-1.5 bg-slate-100 rounded-xl">
                            <button className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${abaModal === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => { setAbaModal('manual'); setMensagem({ texto: '', tipo: '' }); }}>Inserção Manual</button>
                            <button className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${abaModal === 'planilha' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => { setAbaModal('planilha'); setMensagem({ texto: '', tipo: '' }); }}>Importar Excel/CSV</button>
                        </div>
                        {mensagem.texto && <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${mensagem.tipo === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>{mensagem.tipo === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}{mensagem.texto}</div>}

                        {abaModal === 'manual' ? (
                            <div className="space-y-4">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome Completo</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-medium focus:border-brand-primary outline-none transition-all" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Disciplina</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-medium focus:border-brand-primary outline-none transition-all" value={formData.disciplina} onChange={e => setFormData({ ...formData, disciplina: e.target.value })} /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Turmas</label><input type="text" placeholder="Ex: 6A, 7B" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-medium focus:border-brand-primary outline-none transition-all" value={formData.turmas} onChange={e => setFormData({ ...formData, turmas: e.target.value })} /></div>
                                <div className="flex gap-3 pt-6"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={handleSaveManual} className="flex-1 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-hover shadow-lg shadow-brand-primary/30 transition-all">Salvar Professor</button></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 hover:border-brand-primary/50 hover:bg-brand-light/30 transition-all group relative overflow-hidden bg-slate-50">
                                    <UploadCloud className="w-12 h-12 text-slate-300 group-hover:text-brand-primary transition-colors" />
                                    <p className="text-sm font-bold text-slate-600 text-center">Clique ou arraste o ficheiro</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider">.CSV ou .XLSX</p>
                                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={(e) => setArquivo(e.target.files[0])} />
                                </div>
                                {arquivo && <div className="p-4 bg-slate-800 rounded-xl text-sm font-bold text-white flex items-center justify-between"><span className="truncate">{arquivo.name}</span><button onClick={() => setArquivo(null)} className="text-slate-400 hover:text-red-400"><X size={18} /></button></div>}
                                <div className="flex gap-3 pt-6"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={handleImportar} className="flex-1 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-hover shadow-lg shadow-brand-primary/30 transition-all">Iniciar Importação</button></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;