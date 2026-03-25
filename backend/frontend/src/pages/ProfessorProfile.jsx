import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, CheckCircle2, AlertCircle, Tag, Calendar, Menu, Bell } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

function ProfessorProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [professor, setProfessor] = useState(null);
    const [atas, setAtas] = useState([]);
    const [pendencias, setPendencias] = useState([]);
    const [topTags, setTopTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowLoading(true), 300);
        return () => clearTimeout(timer);
    }, []);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [confirmandoPend, setConfirmandoPend] = useState(null);

    const carregarTudo = async () => {
        try {
            const [pr, at, pd] = await Promise.all([
                api.get('/professores'),
                api.get(`/professores/${id}/atas`),
                api.get(`/professores/${id}/pendencias`)
            ]);

            setProfessor(pr.data.find(p => p.id === parseInt(id)));
            setAtas(at.data);
            setPendencias(pd.data);

            const todasTags = at.data.flatMap(a => a.tags_coordenacao || []);
            const counts = todasTags.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
            setTopTags(Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,3).map(e => e[0]));

        } catch (error) {
            console.error("Erro na comunicação com servidor:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarTudo(); }, [id]);

    const handleDownloadPDF = async (ataId) => {
        try {
            const response = await api.get(`/atas/${ataId}/pdf`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Ata_${ataId}_${professor.nome.replace(/\s/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert("Não foi possível gerar o PDF. Verifique o servidor.");
        }
    };

    const concluirPende = async (pid) => {
        try {
            await api.put(`/compromissos/${pid}/concluir`);
            setPendencias(prev => prev.filter(p => p.id !== pid));
            setConfirmandoPend(null);
        } catch (e) { alert("Erro ao concluir."); }
    };

    if (loading) {
        if (!showLoading) return null;
        return <div className="flex h-screen items-center justify-center bg-slate-50 text-brand-primary font-bold animate-pulse">Carregando dados...</div>;
    }
    if (!professor) return <div className="p-8 text-slate-500 font-bold">Registro não localizado.</div>;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 shadow-sm gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)} 
                            className="lg:hidden p-2 text-slate-500 hover:bg-gray-100 hover:text-brand-primary rounded-lg transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="text-sm font-bold text-slate-700 hidden lg:block">Painel do Professor</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:bg-gray-100 hover:text-brand-primary rounded-full transition-colors">
                            <Bell size={20} />
                        </button>
                        <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                        <div className="flex items-center gap-3 cursor-pointer hover:bg-red-50 p-1.5 rounded-xl transition-colors pr-3 group text-left" onClick={() => {
                            localStorage.removeItem('@AtasApp:token');
                            navigate('/login');
                        }}>
                            <div className="hidden md:block">
                                <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-red-600 transition-colors">
                                    {JSON.parse(localStorage.getItem('@AtasApp:usuario') || 'null')?.nome || 'Usuário'}
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide group-hover:text-red-400">Sair do Sistema</p>
                            </div>
                            <div className="w-9 h-9 bg-brand-primary group-hover:bg-red-500 text-white rounded-lg flex items-center justify-center font-bold shadow-md transition-colors">
                                {JSON.parse(localStorage.getItem('@AtasApp:usuario') || 'null')?.nome?.charAt(0).toUpperCase() || 'S'}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* HEADER */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-brand-light text-brand-primary rounded-2xl flex items-center justify-center text-2xl font-black border border-brand-primary/20 shadow-sm">
                                    {professor.nome.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800">{professor.nome}</h1>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        {professor.disciplina?.split(',').map((disc, i) => (
                                            <span key={`disc-${i}`} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">{disc.trim()}</span>
                                        ))}
                                        {(professor.disciplina && professor.turmas) && <span className="text-slate-300">•</span>}
                                        {professor.turmas?.split(',').map((turma, i) => (
                                            <span key={`turma-${i}`} className="px-2 py-1 bg-brand-light text-brand-primary rounded-lg text-xs font-bold border border-brand-primary/10">{turma.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => navigate(`/nova-ata/${professor.id}`)} className="px-5 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-primary/30 transition-all">
                                <Plus size={18} /> Iniciar Nova Ata
                            </button>
                        </div>

                        {/* INDICADORES */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Atas</p>
                                <p className="text-4xl font-black text-slate-800 mt-2">{atas.length}</p>
                            </div>
                            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-4">Top Observações</p>
                                <div className="flex flex-wrap gap-2">
                                    {topTags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-brand-light text-brand-primary rounded-lg font-bold text-xs border border-brand-primary/10">{tag}</span>
                                    ))}
                                    {topTags.length === 0 && <span className="text-slate-400 text-sm italic">Sem registros.</span>}
                                </div>
                            </div>
                        </div>

                        {/* PENDENCIAS */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><AlertCircle className="text-brand-primary" size={20}/> Combinados Pendentes</h2>
                                <span className="bg-brand-primary text-white px-3 py-1 rounded-full text-xs font-bold">{pendencias.length}</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {pendencias.map(p => (
                                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                        <div>
                                            <p className="font-bold text-slate-700">{p.descricao}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 flex items-center gap-2">
                                                <Calendar size={12}/> Gerado em: {p.data_origem} {p.data_prazo && `• Prazo: ${p.data_prazo}`}
                                            </p>
                                        </div>
                                        {confirmandoPend === p.id ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => concluirPende(p.id)} className="bg-emerald-500 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold">CONFIRMAR</button>
                                                <button onClick={() => setConfirmandoPend(null)} className="bg-slate-200 text-slate-600 text-[10px] px-3 py-1.5 rounded-lg font-bold">NÃO</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfirmandoPend(p.id)} className="p-2 text-brand-primary hover:bg-brand-light rounded-lg">
                                                <CheckCircle2 size={22} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {pendencias.length === 0 && <div className="p-12 text-center text-slate-400 italic">Nenhum combinado aberto.</div>}
                            </div>
                        </div>

                        {/* HISTÓRICO */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800">Histórico de Reuniões</h2>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                                    <tr>
                                        <th className="p-4">Data</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {atas.map(ata => (
                                        <tr key={ata.id} className="text-sm hover:bg-slate-50">
                                            <td className="p-4 font-bold text-slate-700">{ata.data_criacao}</td>
                                            <td className="p-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-100 uppercase">Fechada</span></td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDownloadPDF(ata.id)} className="p-2.5 bg-slate-800 text-white rounded-xl hover:bg-brand-primary transition-all">
                                                    <FileText size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {atas.length === 0 && <div className="p-12 text-center text-slate-400 font-medium">Nenhuma reunião registrada.</div>}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default ProfessorProfile;