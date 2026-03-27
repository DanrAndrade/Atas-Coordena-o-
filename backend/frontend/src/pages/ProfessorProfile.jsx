import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

function ProfessorProfile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [professor, setProfessor] = useState(null);
    const [atas, setAtas] = useState([]);
    const [metas, setMetas] = useState([]);
    const [topTags, setTopTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowLoading(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [confirmandoMeta, setConfirmandoMeta] = useState(null);

    const carregarTudo = async () => {
        try {
            const [pr, at, pd] = await Promise.all([
                api.get('/professores'),
                api.get(`/professores/${id}/atas`),
                api.get(`/professores/${id}/pendencias`)
            ]);

            setProfessor(pr.data.find(p => p.id === parseInt(id)));
            setAtas(at.data);
            setMetas(pd.data);

            const todasTags = at.data.flatMap(a => a.tags_coordenacao || []);
            const counts = todasTags.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
            setTopTags(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3));

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

    const concluirMeta = async (mid) => {
        try {
            await api.put(`/compromissos/${mid}/concluir`);
            setMetas(prev => prev.filter(m => m.id !== mid));
            setConfirmandoMeta(null);
        } catch (e) { alert("Erro ao concluir meta."); }
    };

    if (loading) {
        if (!showLoading) return null;
        return <div className="flex h-screen items-center justify-center bg-slate-50 text-brand-primary font-bold animate-pulse">A carregar dados do docente...</div>;
    }

    if (!professor) return <div className="p-8 text-slate-500 font-bold">Docente não localizado.</div>;

    // CSS Customizado Injetado
    const customStyles = `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .dotted-grid {
            background-image: radial-gradient(#64748b 0.5px, transparent 0.5px);
            background-size: 24px 24px;
        }
        .premium-banner {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%);
            position: relative;
            overflow: hidden;
        }
        .premium-banner::before {
            content: "";
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
        }
        .olive-gradient-bg {
            background-color: #78865c;
            background-image: radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(135deg, #78865c 0%, #4a5338 100%);
            background-size: 20px 20px, 100% 100%;
            position: relative;
            overflow: hidden;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9; 
            border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1; 
            border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8; 
        }
    `;

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />

            <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative dotted-grid">

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
                )}

                <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">

                    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 shadow-sm sticky top-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-primary rounded-lg transition-colors" title="Voltar">
                                <ArrowLeft size={22} />
                            </button>
                            <span className="text-lg font-black text-brand-primary italic font-headline hidden md:block">Sistema IASC</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-primary rounded-full transition-colors hidden sm:block">
                                <Bell size={18} />
                            </button>
                            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

                            <div className="flex items-center gap-3 p-1.5 pr-3">
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-bold text-slate-700 leading-tight font-body">
                                        {JSON.parse(localStorage.getItem('@AtasApp:usuario') || 'null')?.nome || 'Utilizador'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide font-label">Coordenação</p>
                                </div>
                                <div className="w-8 h-8 bg-brand-primary text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">
                                    {JSON.parse(localStorage.getItem('@AtasApp:usuario') || 'null')?.nome?.charAt(0).toUpperCase() || 'C'}
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 scroll-smooth">
                        <div className="max-w-6xl mx-auto space-y-8">

                            {/* Cabeçalho do Professor */}
                            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="min-h-[140px] premium-banner flex items-center px-6 md:px-8 py-6 relative">
                                    <span className="material-symbols-outlined absolute -right-6 -bottom-10 text-[10rem] text-white opacity-10 rotate-[-15deg] pointer-events-none select-none" data-icon="local_library">local_library</span>

                                    <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 relative z-10">
                                        <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-auto">
                                            <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                                                <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-white drop-shadow-sm">{professor.nome}</h1>
                                            </div>
                                            <div className="mt-2.5">
                                                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold font-label rounded-md border border-white/30 flex items-center gap-1 w-fit mx-auto md:mx-0 shadow-sm">
                                                    <span className="material-symbols-outlined text-[14px]" data-icon="verified">verified</span>
                                                    DOCENTE IASC
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0">
                                            <button onClick={() => navigate(`/nova-ata/${professor.id}`)} className="w-full md:w-auto px-5 py-2.5 bg-white text-brand-primary rounded-lg font-headline font-bold text-sm shadow-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5">
                                                <span className="material-symbols-outlined text-[18px]" data-icon="add_circle">add_circle</span>
                                                Nova Reunião
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-white border-t border-slate-100">
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 items-center w-full">
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {professor.disciplina?.split(',').map((disc, i) => (
                                                <span key={`disc-${i}`} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold font-label tracking-wide uppercase">{disc.trim()}</span>
                                            )) || <span className="text-slate-400 text-xs italic">Sem disciplina</span>}
                                        </div>
                                        <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
                                        <div className="flex flex-wrap justify-center gap-3 text-slate-500 text-[11px] font-semibold italic">
                                            {professor.turmas?.split(',').map((turma, i) => (
                                                <span key={`turma-${i}`} className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]" data-icon="group">group</span> {turma.trim()}
                                                </span>
                                            )) || <span>Turmas não definidas</span>}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Indicadores */}
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-brand-primary/30 transition-colors group flex flex-col justify-center">
                                    <p className="text-[10px] font-label font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-base group-hover:text-brand-primary transition-colors" data-icon="description">description</span>
                                        Total de Atas
                                    </p>
                                    <h4 className="text-5xl font-headline font-black text-slate-800">{atas.length}</h4>
                                    <p className="mt-3 text-[11px] text-slate-400 font-medium">Reuniões no sistema</p>
                                </div>

                                {/* TOP OBSERVAÇÕES - DESIGN LIMPO E FONTES MENORES */}
                                <div className="md:col-span-2 olive-gradient-bg border border-[#78865c]/40 p-8 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-center">
                                    {/* Marca de água */}
                                    <span className="material-symbols-outlined absolute -right-4 -bottom-8 text-[12rem] text-white opacity-[0.05] rotate-[15deg] pointer-events-none select-none" data-icon="monitoring">monitoring</span>

                                    <p className="text-[10px] font-label font-bold uppercase tracking-widest text-white/80 mb-6 flex items-center gap-2 relative z-10">
                                        <span className="material-symbols-outlined text-base" data-icon="trending_up">trending_up</span>
                                        Top Observações
                                    </p>

                                    <div className="flex flex-wrap gap-x-8 gap-y-4 items-center relative z-10">
                                        {topTags.length > 0 ? topTags.map(([tag, count], i) => (
                                            <div key={i} className="group/tag flex flex-col">
                                                <span className="text-base md:text-lg font-headline font-bold text-white group-hover/tag:text-[#ffdb99] transition-colors cursor-default drop-shadow-sm">
                                                    #{tag.toLowerCase().replace(/\s+/g, '')}
                                                    <span className="text-white/60 font-medium text-sm ml-1 group-hover/tag:text-white">({count})</span>
                                                </span>
                                                <div className="h-0.5 w-0 group-hover/tag:w-full bg-white transition-all duration-300 rounded-full mt-1.5 opacity-80"></div>
                                            </div>
                                        )) : (
                                            <span className="text-white/60 text-sm font-medium italic">O sistema ainda não possui dados suficientes.</span>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Main Content: Layout Empilhado */}
                            <section className="flex flex-col gap-8 pb-12">

                                {/* METAS */}
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <h2 className="text-xl font-headline font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
                                            Metas do Docente
                                        </h2>
                                        {metas.length > 0 ? (
                                            <span className="bg-orange-100 text-brand-primary text-[10px] font-bold px-3 py-1 rounded-full border border-brand-primary/20 shadow-sm">
                                                {metas.length} PENDENTES
                                            </span>
                                        ) : (
                                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                                                TUDO CONCLUÍDO
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-5">
                                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                            {metas.map(m => (
                                                <div key={m.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 group/meta hover:border-brand-primary/40 transition-all hover:bg-white hover:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1.5">
                                                            <span className="material-symbols-outlined text-brand-primary text-[18px]" data-icon="flag">flag</span>
                                                            {m.data_prazo ? (
                                                                <span className="text-[9px] font-label font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap shadow-sm">LIMITE: {m.data_prazo}</span>
                                                            ) : (
                                                                <span className="text-[9px] font-label font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 whitespace-nowrap shadow-sm">S/ PRAZO</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-semibold text-slate-700 leading-snug font-body">{m.descricao}</p>
                                                    </div>

                                                    <div className="shrink-0 w-full md:w-auto">
                                                        {confirmandoMeta === m.id ? (
                                                            <div className="flex gap-2 w-full md:w-auto justify-end">
                                                                <button onClick={() => concluirMeta(m.id)} className="flex-1 md:flex-none px-4 py-2 bg-emerald-500 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-600 transition-all uppercase font-label shadow-sm">CONFIRMAR</button>
                                                                <button onClick={() => setConfirmandoMeta(null)} className="flex-1 md:flex-none px-4 py-2 bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg hover:bg-slate-300 transition-all uppercase font-label">NÃO</button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => setConfirmandoMeta(m.id)} className="w-full md:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-600 font-bold text-[10px] rounded-lg hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all uppercase font-label flex items-center justify-center md:justify-start gap-1.5 shadow-sm">
                                                                <span className="material-symbols-outlined text-[16px]" data-icon="check_circle">check_circle</span> CONCLUIR
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {metas.length === 0 && (
                                                <div className="py-10 text-center text-slate-400">
                                                    <span className="material-symbols-outlined text-5xl text-emerald-300 mb-3 block opacity-60" data-icon="task_alt">task_alt</span>
                                                    <p className="font-medium text-sm font-body">Não há metas pendentes.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* HISTÓRICO DE ATAS - COM FUNDO PONTILHADO E MARCA D'ÁGUA SUAVE */}
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-700 relative overflow-hidden flex items-center justify-between border-b border-slate-900">
                                        {/* Padrão quadriculado sutil no fundo */}
                                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                                        {/* Glow Decorativo */}
                                        <div className="absolute -top-16 -right-10 w-48 h-48 bg-slate-500 rounded-full mix-blend-overlay filter blur-[40px] opacity-30 pointer-events-none"></div>
                                        <div className="absolute -bottom-16 -left-10 w-48 h-48 bg-slate-900 rounded-full mix-blend-overlay filter blur-[40px] opacity-60 pointer-events-none"></div>

                                        <h2 className="text-xl font-headline font-extrabold tracking-tight text-white relative z-10 flex items-center gap-2">
                                            Histórico de Reuniões
                                        </h2>

                                        {/* Marca de Água Integrada */}
                                        <span className="material-symbols-outlined absolute -right-6 top-1/2 -translate-y-1/2 text-[8rem] text-white opacity-[0.04] pointer-events-none select-none rotate-[-15deg]" data-icon="history">history</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[600px]">
                                            <thead>
                                                <tr className="bg-slate-800 border-b border-slate-900">
                                                    <th className="px-6 py-3 text-[10px] font-label font-black text-slate-300 uppercase tracking-widest">Ata</th>
                                                    <th className="px-6 py-3 text-[10px] font-label font-black text-slate-300 uppercase tracking-widest">Data</th>
                                                    <th className="px-6 py-3 text-[10px] font-label font-black text-slate-300 uppercase tracking-widest">Status</th>
                                                    <th className="px-6 py-3 text-right text-[10px] font-label font-black text-slate-300 uppercase tracking-widest">Documento</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {atas.map(ata => (
                                                    <tr key={ata.id} className="hover:bg-slate-50/80 transition-colors group/row">
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-slate-700 text-sm font-body">Alinhamento #{ata.id}</p>
                                                            {ata.tags_coordenacao && ata.tags_coordenacao.length > 0 && (
                                                                <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[250px]" title={ata.tags_coordenacao.join(', ')}>
                                                                    {ata.tags_coordenacao.join(' • ')}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-slate-600 font-medium font-body">{ata.data_criacao}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-md border border-emerald-200 font-label">FECHADA</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button onClick={() => handleDownloadPDF(ata.id)} className="p-2 text-slate-500 bg-white border border-slate-300 hover:text-white hover:bg-brand-primary hover:border-brand-primary rounded-lg transition-all shadow-sm group-hover/row:shadow-md" title="Baixar PDF">
                                                                <span className="material-symbols-outlined text-[18px]" data-icon="download">download</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {atas.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium italic font-body">
                                                            Nenhuma reunião registada no histórico.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

export default ProfessorProfile;