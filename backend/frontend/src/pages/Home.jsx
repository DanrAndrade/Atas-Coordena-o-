import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Search, Plus, LayoutDashboard, Users, Bell, Menu, X, 
  CheckCircle2, UploadCloud, ChevronLeft, ChevronRight, FileText, Settings
} from 'lucide-react';

function Home() {
    const navigate = useNavigate();
    const [professores, setProfessores] = useState([]);
    const [menuAtivo, setMenuAtivo] = useState('professores'); 
    
    // Estados do Menu Retrátil e Responsivo
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroDisciplina, setFiltroDisciplina] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [abaModal, setAbaModal] = useState('manual'); 
    const [formData, setFormData] = useState({ nome: '', disciplina: '', turmas: '' });
    const [arquivo, setArquivo] = useState(null);
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    
    // DASHBOARD
    const [dashboard, setDashboard] = useState({
        total_professores: 0,
        total_atas: 0,
        pendencias_abertas: 0,
        top_tags_geral: []
    });

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
        setMensagem({ texto: 'Salvando...', tipo: 'info' });
        try {
            await api.post('/professores', formData);
            setMensagem({ texto: 'Professor adicionado com sucesso.', tipo: 'success' });
            setFormData({ nome: '', disciplina: '', turmas: '' });
            carregarProfessores();
            setTimeout(() => { setIsModalOpen(false); setMensagem({ texto: '', tipo: '' }); }, 1500);
        } catch (error) {
            setMensagem({ texto: error.response?.data?.erro || 'Erro ao salvar.', tipo: 'error' });
        }
    };

    const handleImportar = async () => {
        if (!arquivo) return setMensagem({ texto: 'Selecione um arquivo.', tipo: 'error' });
        const data = new FormData();
        data.append('arquivo', arquivo);
        setMensagem({ texto: 'Processando...', tipo: 'info' });
        try {
            const res = await api.post('/professores/importar', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMensagem({ texto: res.data.mensagem || 'Planilha importada com sucesso.', tipo: 'success' });
            setArquivo(null); 
            carregarProfessores(); 
            setTimeout(() => { setIsModalOpen(false); setMensagem({ texto: '', tipo: '' }); }, 2000);
        } catch (error) {
            setMensagem({ texto: error.response?.data?.erro || 'Erro ao importar.', tipo: 'error' });
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
            
            {/* OVERLAY PARA MENU MOBILE */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* SIDEBAR RETRÁTIL E RESPONSIVA */}
            <aside 
                className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
            >
                <div className={`h-16 flex items-center border-b border-gray-100 ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
                    {isSidebarCollapsed ? (
                        <FileText className="w-8 h-8 text-brand-primary" />
                    ) : (
                        <img src="/images/logo.png" alt="Logo IASC" className="h-8 object-contain" />
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
                        onClick={() => { setMenuAtivo('dashboard'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center w-full py-3 rounded-xl transition-all text-sm font-medium ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} ${menuAtivo === 'dashboard' ? 'bg-brand-light text-brand-primary' : 'text-slate-500 hover:bg-gray-50 hover:text-slate-700'}`}
                        title={isSidebarCollapsed ? "Dashboard" : ""}
                    >
                        <LayoutDashboard size={22} />
                        {!isSidebarCollapsed && <span>Dashboard</span>}
                    </button>
                    
                    <button 
                        onClick={() => { setMenuAtivo('professores'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center w-full py-3 rounded-xl transition-all text-sm font-medium ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} ${menuAtivo === 'professores' ? 'bg-brand-light text-brand-primary' : 'text-slate-500 hover:bg-gray-50 hover:text-slate-700'}`}
                        title={isSidebarCollapsed ? "Professores" : ""}
                    >
                        <Users size={22} />
                        {!isSidebarCollapsed && <span>Professores</span>}
                    </button>

                    {/* NOVO BOTÃO DE CONFIGURAÇÕES */}
                    <button 
                        onClick={() => navigate('/configuracoes')}
                        className={`flex items-center w-full py-3 rounded-xl transition-all text-sm font-medium ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} text-slate-500 hover:bg-gray-50 hover:text-slate-700`}
                        title={isSidebarCollapsed ? "Configurações" : ""}
                    >
                        <Settings size={22} />
                        {!isSidebarCollapsed && <span>Configurações</span>}
                    </button>
                </div>
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                
                {/* TOPBAR */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)} 
                            className="lg:hidden p-2 text-slate-500 hover:bg-gray-100 hover:text-brand-primary rounded-lg transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:bg-gray-100 hover:text-brand-primary rounded-full transition-colors">
                            <Bell size={20} />
                        </button>
                        <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition-colors pr-2">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-700 leading-tight">Painel de Controle</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Coordenação</p>
                            </div>
                            <div className="w-9 h-9 bg-brand-primary text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-brand-primary/20" onClick={() => {
                                localStorage.removeItem('@AtasApp:token');
                                navigate('/login');
                            }}>
                                Sair
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
                        
                        {menuAtivo === 'dashboard' && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard da Escola</h1>
                                    <p className="text-slate-500 text-sm">Resumo geral das atas e compromissos firmados pela coordenação.</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Corpo Docente</p>
                                                <p className="text-4xl font-black text-slate-800 mt-2">{dashboard.total_professores}</p>
                                            </div>
                                            <div className="p-3 bg-brand-light text-brand-primary rounded-xl"><Users size={24} /></div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Atas Geradas</p>
                                                <p className="text-4xl font-black text-slate-800 mt-2">{dashboard.total_atas}</p>
                                            </div>
                                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={24} /></div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Pendências Ativas</p>
                                                <p className="text-4xl font-black text-slate-800 mt-2">{dashboard.pendencias_abertas}</p>
                                            </div>
                                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><CheckCircle2 size={24} /></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Principais Observações (Geral)</h3>
                                    {dashboard.top_tags_geral?.length === 0 ? (
                                        <p className="text-slate-500 text-sm font-medium">Não há dados suficientes.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-3">
                                            {dashboard.top_tags_geral?.map((tag, idx) => (
                                                <span key={idx} className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm shadow-sm">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {menuAtivo === 'professores' && (
                            <>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Corpo Docente</h1>
                                        <p className="text-slate-500 text-sm">Acesse o painel dos professores e gerencie o histórico de atas.</p>
                                    </div>
                                    <button 
                                        onClick={() => { setIsModalOpen(true); setAbaModal('manual'); }}
                                        className="px-4 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition-all w-full md:w-auto"
                                    >
                                        <Plus size={18} />
                                        Novo Professor
                                    </button>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="Buscar professor..." 
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <select 
                                            value={filtroDisciplina}
                                            onChange={(e) => setFiltroDisciplina(e.target.value)}
                                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all md:w-64 text-slate-600 appearance-none"
                                        >
                                            <option value="">Todas as Disciplinas</option>
                                            {disciplinasUnicas.map((disc, idx) => (
                                                <option key={idx} value={disc}>{disc}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    <th className="p-4">Professor</th>
                                                    <th className="p-4">Disciplina</th>
                                                    <th className="p-4">Turmas</th>
                                                    <th className="p-4 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 text-sm">
                                                {filteredProfessores.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td>
                                                    </tr>
                                                ) : (
                                                    filteredProfessores.map((prof) => (
                                                        <tr key={prof.id} className="group hover:bg-slate-50 transition-colors">
                                                            
                                                            {/* NOME AGORA É TOTALMENTE CLICÁVEL */}
                                                            <td 
                                                                className="p-4 cursor-pointer"
                                                                onClick={() => navigate(`/professor/${prof.id}`)}
                                                                title="Acessar Perfil do Professor"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 bg-slate-100 group-hover:bg-brand-light group-hover:text-brand-primary rounded-full flex items-center justify-center text-slate-500 font-bold uppercase transition-colors">
                                                                        {prof.nome.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-700 group-hover:text-brand-primary transition-colors">{prof.nome}</p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="p-4 text-slate-600 font-medium">{prof.disciplina || '-'}</td>
                                                            <td className="p-4 text-slate-600 font-medium">{prof.turmas || '-'}</td>
                                                            <td className="p-4 text-right">
                                                                <button 
                                                                    onClick={() => navigate(`/professor/${prof.id}`)}
                                                                    className="px-4 py-2 text-brand-primary hover:bg-brand-light rounded-xl font-bold text-xs transition-colors"
                                                                >
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

            {/* MODAL DE ADICIONAR PROFESSOR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">
                                {abaModal === 'manual' ? 'Novo Professor' : 'Importar Planilha'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}>
                                <X size={20} className="text-slate-400 hover:text-slate-600" />
                            </button>
                        </div>

                        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                            <button 
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${abaModal === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => { setAbaModal('manual'); setMensagem({texto: '', tipo: ''}); }}
                            >
                                Manual
                            </button>
                            <button 
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${abaModal === 'planilha' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => { setAbaModal('planilha'); setMensagem({texto: '', tipo: ''}); }}
                            >
                                Planilha CSV/Excel
                            </button>
                        </div>

                        {mensagem.texto && (
                            <div className={`mb-4 p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${mensagem.tipo === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {mensagem.tipo === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
                                {mensagem.texto}
                            </div>
                        )}

                        {abaModal === 'manual' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                                    <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Disciplina</label>
                                    <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all" value={formData.disciplina} onChange={e => setFormData({...formData, disciplina: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Turmas</label>
                                    <input type="text" placeholder="Ex: 6A, 7B" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all" value={formData.turmas} onChange={e => setFormData({...formData, turmas: e.target.value})} />
                                </div>
                                <div className="flex gap-3 mt-8">
                                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                                    <button onClick={handleSaveManual} className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-hover shadow-lg shadow-brand-primary/20 transition-all">Salvar</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 hover:border-brand-primary/50 hover:bg-brand-light/50 transition-all group relative overflow-hidden">
                                    <UploadCloud className="w-10 h-10 text-slate-300 group-hover:text-brand-primary transition-colors" />
                                    <p className="text-sm font-bold text-slate-600 text-center">Clique ou arraste o arquivo aqui</p>
                                    <p className="text-xs text-slate-400 text-center">.CSV ou .XLSX (nome, disciplina, turmas)</p>
                                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={(e) => setArquivo(e.target.files[0])} />
                                </div>
                                {arquivo && (
                                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-between">
                                        <span className="truncate">{arquivo.name}</span>
                                        <button onClick={() => setArquivo(null)} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
                                    </div>
                                )}
                                <div className="flex gap-3 mt-8">
                                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                                    <button onClick={handleImportar} className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-hover shadow-lg shadow-brand-primary/20 transition-all">Importar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;