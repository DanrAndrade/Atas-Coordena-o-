import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, CheckCircle2, Clock, AlertCircle, Tag, Calendar } from 'lucide-react';
import api from '../services/api';

function ProfessorProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [professor, setProfessor] = useState(null);
    const [atas, setAtas] = useState([]);
    const [pendencias, setPendencias] = useState([]);
    const [topTags, setTopTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmandoPend, setConfirmandoPend] = useState(null);

    useEffect(() => {
        const carregarDadosReais = async () => {
            try {
                // Busca professor
                const profResponse = await api.get('/professores');
                const profEncontrado = profResponse.data.find(p => p.id === parseInt(id));
                setProfessor(profEncontrado);

                // Busca atas reais com compromissos e tags inclusos
                const atasResponse = await api.get(`/professores/${id}/atas`);
                const listaAtas = atasResponse.data;
                setAtas(listaAtas);

                // PROCESSAMENTO 1: Lista real de compromissos pendentes
                const todasPendencias = listaAtas.flatMap(ata => 
                    (ata.compromissos || [])
                        .filter(comp => comp.status === 'pendente')
                        .map(comp => ({ ...comp, dataOrigem: ata.data_criacao, ataId: ata.id }))
                );
                setPendencias(todasPendencias);

                // PROCESSAMENTO 2: As 3 tags mais recorrentes da coordenação
                const todasTags = listaAtas.flatMap(ata => ata.tags_coordenacao || []);
                const contagemTags = todasTags.reduce((acc, tag) => {
                    acc[tag] = (acc[tag] || 0) + 1;
                    return acc;
                }, {});
                
                const top3 = Object.entries(contagemTags)
                    .sort((a, b) => b[1] - a[1]) // Ordena pela frequência (maior para menor)
                    .slice(0, 3)                 // Pega apenas as 3 primeiras
                    .map(entry => entry[0]);     // Extrai apenas o nome da tag
                
                setTopTags(top3);

            } catch (error) {
                console.error("Erro ao buscar dados reais do banco:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarDadosReais();
    }, [id]);

    const executeConcluirPendencia = async (pendenciaId) => {
        try {
            await api.put(`/compromissos/${pendenciaId}/concluir`);
            setPendencias(pendencias.filter(p => p.id !== pendenciaId));
            setConfirmandoPend(null);
        } catch (error) {
            console.error("Erro ao concluir pendência:", error);
        }
    };

    const handleDownloadPDF = async (ataId) => {
        try {
            const response = await api.get(`/atas/${ataId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            
            // Formatando o nome do arquivo: ata-nome-data.pdf
            const ataSelecionada = atas.find(a => a.id === ataId);
            const nomeProf = professor.nome.replace(/\s+/g, '-').toLowerCase();
            const dataDoc = ataSelecionada && ataSelecionada.data_criacao ? ataSelecionada.data_criacao.replace(/\//g, '-') : 'data';
            const nomeArquivo = `ata-${nomeProf}-${dataDoc}.pdf`;
            
            link.href = url;
            link.setAttribute('download', nomeArquivo);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // Liberar a memória do Blob
        } catch (error) {
            console.error("Erro ao baixar PDF:", error);
            alert("Erro ao gerar o PDF.");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-brand-primary font-bold animate-pulse">Carregando dados do servidor...</div>
            </div>
        );
    }

    if (!professor) {
        return <div className="p-8 text-slate-500 font-bold">Professor não encontrado.</div>;
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            
            {/* SIDEBAR COM LOGO */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col z-30">
                <div className="h-16 flex items-center justify-center px-6 border-b border-gray-100">
                    <img src="/images/logo.png" alt="Logo IASC" className="h-8 object-contain" />
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <button onClick={() => navigate('/')} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-sm font-medium text-slate-500 hover:bg-gray-50">
                        <ArrowLeft size={20} />
                        <span>Voltar à Lista</span>
                    </button>
                </div>
            </aside>

            {/* CONTEÚDO */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8 shrink-0 z-20 shadow-sm gap-4">
                    <button 
                        onClick={() => navigate('/')}
                        className="lg:hidden p-2 text-slate-500 hover:bg-gray-100 hover:text-brand-primary rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-sm font-bold text-slate-700">Painel do Professor</div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
                        
                        {/* HEADER DO PERFIL */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-brand-light text-brand-primary rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm border border-brand-primary/20">
                                    {professor.nome.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{professor.nome}</h1>
                                    <p className="text-slate-500 font-medium mt-1">
                                        {professor.disciplina || 'Sem disciplina'} • {professor.turmas || 'Sem turmas'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate(`/nova-ata/${professor.id}`)}
                                className="px-5 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-primary/30 transition-all"
                            >
                                <Plus size={18} />
                                Iniciar Nova Ata
                            </button>
                        </div>

                        {/* LINHA 1: DASHBOARD DE INDICADORES */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Card Total de Atas */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total de Atas</p>
                                        <p className="text-4xl font-black text-slate-800 mt-2">{atas.length}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 text-slate-400 rounded-xl"><FileText size={24} /></div>
                                </div>
                            </div>

                            {/* Card Top 3 Tags */}
                            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Tag size={16} /> Top 3 Observações da Coordenação
                                </h3>
                                
                                {topTags.length === 0 ? (
                                    <p className="text-slate-500 text-sm font-medium">Nenhuma observação registrada nas atas anteriores.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {topTags.map((tag, idx) => (
                                            <span key={idx} className="px-4 py-2 bg-brand-light text-brand-primary border border-brand-primary/20 rounded-xl font-bold text-sm shadow-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* LINHA 2: LISTA REAL DE COMPROMISSOS PENDENTES */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="text-brand-primary" size={22} />
                                    <h2 className="text-lg font-bold text-slate-800">Compromissos Pendentes</h2>
                                </div>
                                <span className="bg-brand-light text-brand-primary px-3 py-1 rounded-lg text-sm font-bold">
                                    {pendencias.length} item(s)
                                </span>
                            </div>
                            
                            <div className="divide-y divide-gray-100">
                                {pendencias.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 font-medium">
                                        Não há compromissos pendentes para este professor.
                                    </div>
                                ) : (
                                    pendencias.map((pendencia) => (
                                        <div key={pendencia.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-700 text-base">{pendencia.descricao}</p>
                                                <p className="text-xs font-bold text-slate-400 mt-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                                                    <Calendar size={12} /> 
                                                    Gerado na ata de {pendencia.dataOrigem}
                                                    {pendencia.data_prazo && ` • Prazo: ${pendencia.data_prazo}`}
                                                </p>
                                            </div>
                                            {confirmandoPend === pendencia.id ? (
                                                <div className="flex items-center gap-2 animate-fade-in shrink-0">
                                                    <button onClick={() => executeConcluirPendencia(pendencia.id)} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg shadow-sm hover:bg-brand-hover">OK, Confirmar</button>
                                                    <button onClick={() => setConfirmandoPend(null)} className="px-3 py-1.5 bg-gray-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-gray-300">Não</button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setConfirmandoPend(pendencia.id)}
                                                    className="inline-flex justify-center shrink-0 px-4 py-1.5 bg-amber-50 text-amber-700 font-bold text-xs rounded-lg border border-amber-200 shadow-sm hover:bg-amber-100 transition-colors"
                                                    title="Marcar como Concluído"
                                                >
                                                    <CheckCircle2 size={16} className="mr-1.5" /> Marcar Feito
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* LINHA 3: HISTÓRICO DE ATAS */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800">Histórico de Reuniões</h2>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Apenas combinados abertos podem ser alterados</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            <th className="p-4">Data da Reunião</th>
                                            <th className="p-4">Status do Documento</th>
                                            <th className="p-4">Total de Combinados</th>
                                            <th className="p-4 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {atas.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="p-8 text-center text-slate-400 font-medium">
                                                    Nenhuma ata registrada para este professor.
                                                </td>
                                            </tr>
                                        ) : (
                                            atas.map((ata) => {
                                                const pendentesNestaAta = ata.compromissos.filter(c => c.status === 'pendente').length;
                                                return (
                                                    <tr key={ata.id} className="group hover:bg-slate-50 transition-colors">
                                                        <td className="p-4 font-bold text-slate-700">{ata.data_criacao}</td>
                                                        <td className="p-4">
                                                            {ata.status === 'fechada' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                    <CheckCircle2 size={14} /> Fechada (Imutável)
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                                                    <Clock size={14} /> Em Rascunho
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-slate-600 font-medium">
                                                            {ata.compromissos.length} combinados {pendentesNestaAta > 0 && <span className="text-brand-primary ml-1">({pendentesNestaAta} pendentes)</span>}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button 
                                                                onClick={() => handleDownloadPDF(ata.id)}
                                                                className="px-4 py-2 text-white bg-slate-800 hover:bg-brand-primary rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-end gap-2 ml-auto"
                                                            >
                                                                <FileText size={14} /> PDF
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default ProfessorProfile;