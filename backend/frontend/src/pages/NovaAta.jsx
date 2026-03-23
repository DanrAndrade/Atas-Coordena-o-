import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    ArrowLeft, Save, Plus, Trash2, CheckSquare, Square, 
    MessageSquare, Tag, FileSignature, AlertCircle, X, HelpCircle
} from 'lucide-react';

function NovaAta() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [professor, setProfessor] = useState(null);
    const [coordenador, setCoordenador] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [dadosAta, setDadosAta] = useState({
        registros_portal: 'Sim',
        observacoes_professor_texto: '',
        observacoes_coordenacao_texto: '',
        temas_ids: [],
        tags_obs_ids: []
    });
    
    // Selects
    const [tagsDisponiveis, setTagsDisponiveis] = useState([]);
    
    // Compromissos
    const [pendencias, setPendencias] = useState([]);
    const [pendenciasMarcadas, setPendenciasMarcadas] = useState([]); // IDs das pendências que vão ser concluídas
    const [novosCompromissos, setNovosCompromissos] = useState([]);
    
    // UI Feedback
    const [mensagemFinal, setMensagemFinal] = useState({ texto: '', tipo: '' });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Novo Atalho Tags Inline
    const [novaTagTema, setNovaTagTema] = useState('');
    const [novaTagObs, setNovaTagObs] = useState('');
    const [showInputTema, setShowInputTema] = useState(false);
    const [showInputObs, setShowInputObs] = useState(false);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                // 1. Professor
                const profRes = await api.get('/professores');
                setProfessor(profRes.data.find(p => p.id === parseInt(id)));
                
                // 2. Coordenador
                const coord = JSON.parse(localStorage.getItem('@AtasApp:usuario'));
                setCoordenador(coord);

                // 3. Tags
                const tagsRes = await api.get('/tags');
                setTagsDisponiveis(tagsRes.data);

                // 4. Pendências do Professor
                const pendRes = await api.get(`/professores/${id}/pendencias`);
                setPendencias(pendRes.data);

            } catch (error) {
                console.error("Erro ao carregar dados da ata:", error);
                alert("Erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, [id]);

    const handleAdicionarCompromisso = () => {
        setNovosCompromissos([...novosCompromissos, { descricao: '', data_prazo_limite: '' }]);
    };

    const handleCompromissoChange = (index, campo, valor) => {
        const arr = [...novosCompromissos];
        arr[index][campo] = valor;
        setNovosCompromissos(arr);
    };

    const handleRemoverCompromisso = (index) => {
        const arr = [...novosCompromissos];
        arr.splice(index, 1);
        setNovosCompromissos(arr);
    };

    const togglePendencia = (pendId) => {
        if (pendenciasMarcadas.includes(pendId)) {
            setPendenciasMarcadas(pendenciasMarcadas.filter(id => id !== pendId));
        } else {
            setPendenciasMarcadas([...pendenciasMarcadas, pendId]);
        }
    };

    const toggleTag = (tipo, tagId) => {
        const campo = tipo === 'tema' ? 'temas_ids' : 'tags_obs_ids';
        const listaAtual = dadosAta[campo];
        
        if (listaAtual.includes(tagId)) {
            setDadosAta({ ...dadosAta, [campo]: listaAtual.filter(id => id !== tagId) });
        } else {
            setDadosAta({ ...dadosAta, [campo]: [...listaAtual, tagId] });
        }
    };

    const handleSalvarTag = async (tipo) => {
        const nome = tipo === 'tema' ? novaTagTema : novaTagObs;
        if (!nome || !nome.trim()) {
            tipo === 'tema' ? setShowInputTema(false) : setShowInputObs(false);
            return;
        }
        
        try {
            const res = await api.post('/tags', { nome: nome.trim(), tipo: tipo === 'tema' ? 'tema' : 'observacao' });
            const novaTag = { id: res.data.id, nome: nome.trim(), tipo: tipo === 'tema' ? 'tema' : 'observacao' };
            setTagsDisponiveis(prev => [...prev, novaTag]);
            
            const campo = tipo === 'tema' ? 'temas_ids' : 'tags_obs_ids';
            setDadosAta(prev => ({ ...prev, [campo]: [...prev[campo], novaTag.id] }));
            
            if (tipo === 'tema') {
                setNovaTagTema('');
                setShowInputTema(false);
            } else {
                setNovaTagObs('');
                setShowInputObs(false);
            }
        } catch (error) {
            alert('Erro ao salvar nova tag!');
        }
    };

    const handleConfirmSubmit = (e) => {
        e.preventDefault();
        setIsConfirmModalOpen(true);
    };

    const executeSubmit = async () => {
        setIsConfirmModalOpen(false);
        
        const payload = {
            professor_id: parseInt(id),
            registros_portal: dadosAta.registros_portal,
            observacoes_professor_texto: dadosAta.observacoes_professor_texto,
            observacoes_coordenacao_texto: dadosAta.observacoes_coordenacao_texto,
            
            temas_ids: dadosAta.temas_ids,
            tags_obs_ids: dadosAta.tags_obs_ids,
            
            novos_compromissos: novosCompromissos.filter(c => c.descricao.trim() !== ''),
            compromissos_concluidos: pendenciasMarcadas
        };

        setMensagemFinal({ texto: 'Salvando documento...', tipo: 'info' });

        try {
            await api.post('/atas', payload);
            setMensagemFinal({ texto: 'Ata salva com sucesso! Redirecionando...', tipo: 'success' });
            setTimeout(() => navigate(`/professor/${id}`), 1500);
        } catch (error) {
            setMensagemFinal({ texto: 'Erro ao salvar a ata: ' + (error.response?.data?.erro || error.message), tipo: 'error' });
        }
    };

    if (loading || !professor || !coordenador) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-brand-primary font-bold animate-pulse">Preparando documento...</div>
            </div>
        );
    }

    const temas = tagsDisponiveis.filter(t => t.tipo === 'tema');
    const observacoes = tagsDisponiveis.filter(t => t.tipo === 'observacao');
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* TOPBAR */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm relative">
                
                {/* TOAST DE MENSAGEM */}
                {mensagemFinal.texto && (
                    <div className="absolute top-full left-0 w-full animate-fade-in z-40">
                        <div className={`px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 overflow-hidden shadow-lg ${mensagemFinal.tipo === 'success' ? 'bg-emerald-500 text-white' : mensagemFinal.tipo === 'info' ? 'bg-brand-primary text-white' : 'bg-red-500 text-white'}`}>
                            {mensagemFinal.tipo === 'success' ? <CheckSquare size={18}/> : <AlertCircle size={18}/>}
                            {mensagemFinal.texto}
                        </div>
                    </div>
                )}
                
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button 
                        type="button"
                        onClick={() => navigate(`/professor/${id}`)}
                        className="flex items-center gap-2 text-slate-500 hover:text-brand-primary font-bold text-sm transition-colors py-2"
                    >
                        <ArrowLeft size={18} /> Cancelar e Voltar
                    </button>
                    <button 
                        type="button"
                        onClick={handleConfirmSubmit}
                        disabled={mensagemFinal.tipo === 'info'}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${mensagemFinal.tipo === 'info' ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-hover text-white shadow-brand-primary/20'}`}
                    >
                        <Save size={18} /> Salvar Documento
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 animate-fade-in-up space-y-6">
                
                {/* CABEÇALHO DA ATA MODERNO E LIMPO */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-slate-700">
                    <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-gray-100 pb-6 mb-6">
                        <div className="flex items-center gap-3">
                            <FileSignature className="text-brand-primary w-8 h-8" />
                            <div>
                                <h1 className="text-lg font-bold text-slate-800">Registro de Ata de Reunião</h1>
                                <p className="text-sm font-medium text-slate-500">Coordenação e Corpo Docente</p>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 text-left md:text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data de Emissão</p>
                            <p className="text-base font-bold text-slate-700">{dataAtual}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 text-sm font-medium">
                        <div className="flex items-center">
                            <span className="font-bold text-slate-400 uppercase tracking-widest text-xs w-32 shrink-0">Professor(a):</span> 
                            <span className="text-base font-bold text-slate-800">{professor.nome}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="font-bold text-slate-400 uppercase tracking-widest text-xs w-32 shrink-0">Turmas:</span> 
                            <span className="text-slate-600">{professor.disciplina || '-'} • {professor.turmas || '-'}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="font-bold text-slate-400 uppercase tracking-widest text-xs w-32 shrink-0">Responsável:</span> 
                            <span className="text-slate-600">{coordenador.nome}</span>
                        </div>
                    </div>
                </div>

                {/* TEMAS E PENDÊNCIAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Temas da Reunião */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <Tag size={20} className="text-blue-500" /> Temas Abordados
                        </h2>
                        {temas.length === 0 ? (
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-slate-500 italic">Nenhum tema configurado.</p>
                                {!showInputTema ? (
                                    <button type="button" onClick={() => setShowInputTema(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-dashed border-gray-300 text-slate-500 hover:border-brand-primary hover:text-brand-primary flex items-center gap-1"><Plus size={14} /> Criar</button>
                                ) : null}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 items-center">
                                {temas.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => toggleTag('tema', t.id)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${
                                            dadosAta.temas_ids.includes(t.id)
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'bg-white border-gray-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                    >
                                        {t.nome}
                                    </button>
                                ))}
                                {!showInputTema ? (
                                    <button type="button" onClick={() => setShowInputTema(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-dashed border-gray-300 text-slate-400 hover:border-brand-primary hover:text-brand-primary flex items-center gap-1"><Plus size={14} /> Novo</button>
                                ) : null}
                            </div>
                        )}
                        
                        {showInputTema && (
                            <div className="flex items-center gap-2 mt-3 animate-fade-in">
                                <input autoFocus type="text" placeholder="Nome do novo tema..." className="flex-1 max-w-[200px] border border-brand-primary/40 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20" value={novaTagTema} onChange={e => setNovaTagTema(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSalvarTag('tema')} />
                                <button type="button" onClick={() => handleSalvarTag('tema')} className="bg-brand-primary text-white p-2 rounded-lg hover:bg-brand-hover"><CheckSquare size={14}/></button>
                                <button type="button" onClick={() => setShowInputTema(false)} className="bg-gray-100 text-slate-500 p-2 rounded-lg hover:bg-gray-200"><X size={14}/></button>
                            </div>
                        )}
                    </div>

                    {/* Pendências da Reunião Anterior */}
                    <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm bg-amber-50/30 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                        <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-4">
                            <AlertCircle size={20} className="text-amber-500" /> Pendências Anteriores
                        </h2>
                        {pendencias.length === 0 ? (
                            <p className="text-sm text-amber-700/70 font-medium">Não há compromissos em aberto para este professor.</p>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-amber-700 font-bold tracking-wide uppercase">Marque o que foi cumprido:</p>
                                {pendencias.map(p => {
                                    const isMarcado = pendenciasMarcadas.includes(p.id);
                                    return (
                                        <div 
                                            key={p.id} 
                                            onClick={() => togglePendencia(p.id)}
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-start gap-3 cursor-pointer transition-all ${
                                                isMarcado ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-inner' : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50'
                                            }`}
                                        >
                                            {isMarcado ? <CheckSquare size={18} className="text-amber-600 mt-0.5 shrink-0" /> : <Square size={18} className="text-amber-400 mt-0.5 shrink-0" />}
                                            <div>
                                                <p className={isMarcado ? 'line-through opacity-70' : ''}>{p.descricao}</p>
                                                <p className="text-[10px] uppercase font-bold text-amber-600/70 mt-1">Gerado em: {p.data_origem}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* SITUAÇÃO NO PORTAL E OBSERVAÇÕES SETADAS */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="mb-8">
                        <h2 className="text-base font-bold text-slate-800 mb-3 block">Registros completos no portal? (Diário/Notas/Faltas)</h2>
                        <div className="flex gap-4">
                            {['Sim', 'Incompleto', 'Não'].map(op => (
                                <label key={op} className={`flex-1 py-3 px-4 rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                                    dadosAta.registros_portal === op 
                                    ? 'bg-brand-light border-brand-primary text-brand-primary shadow-sm' 
                                    : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="portal" 
                                        value={op} 
                                        checked={dadosAta.registros_portal === op} 
                                        onChange={(e) => setDadosAta({...dadosAta, registros_portal: e.target.value})}
                                        className="sr-only"
                                    />
                                    {op}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Tag size={18} className="text-brand-primary" /> Observações Rápidas da Coordenação
                        </h2>
                        {observacoes.length === 0 ? (
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-slate-500 italic">Nenhuma observação configurada.</p>
                                {!showInputObs ? (
                                    <button type="button" onClick={() => setShowInputObs(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-dashed border-gray-300 text-slate-500 hover:border-brand-primary hover:text-brand-primary flex items-center gap-1"><Plus size={14} /> Criar</button>
                                ) : null}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 items-center">
                                {observacoes.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => toggleTag('obs', t.id)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${
                                            dadosAta.tags_obs_ids.includes(t.id)
                                                ? 'bg-brand-light border-brand-primary text-brand-primary'
                                                : 'bg-white border-gray-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                    >
                                        {t.nome}
                                    </button>
                                ))}
                                {!showInputObs ? (
                                    <button type="button" onClick={() => setShowInputObs(true)} className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all border border-dashed border-gray-300 text-slate-400 hover:border-brand-primary hover:text-brand-primary flex items-center gap-1"><Plus size={14} /> Novo</button>
                                ) : null}
                            </div>
                        )}
                        
                        {showInputObs && (
                            <div className="flex items-center gap-2 mt-3 animate-fade-in">
                                <input autoFocus type="text" placeholder="Nome da observação..." className="flex-1 max-w-[200px] border border-brand-primary/40 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20" value={novaTagObs} onChange={e => setNovaTagObs(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSalvarTag('obs')} />
                                <button type="button" onClick={() => handleSalvarTag('obs')} className="bg-brand-primary text-white p-2 rounded-lg hover:bg-brand-hover"><CheckSquare size={14}/></button>
                                <button type="button" onClick={() => setShowInputObs(false)} className="bg-gray-100 text-slate-500 p-2 rounded-lg hover:bg-gray-200"><X size={14}/></button>
                            </div>
                        )}
                    </div>
                </div>

                {/* TEXTOS LONGOS DE OBSERVAÇÃO */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <MessageSquare size={20} className="text-slate-400" /> Relato da Coordenação
                        </h2>
                        <textarea 
                            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all resize-y min-h-[150px]"
                            placeholder="Descreva detalhadamente as pautas, orientações e feedbacks dados ao professor..."
                            value={dadosAta.observacoes_coordenacao_texto}
                            onChange={(e) => setDadosAta({...dadosAta, observacoes_coordenacao_texto: e.target.value})}
                        />
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <MessageSquare size={20} className="text-slate-400" /> Relato do Professor
                        </h2>
                        <textarea 
                            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all resize-y min-h-[150px]"
                            placeholder="Descreva as justificativas, dificuldades relatadas e considerações do docente..."
                            value={dadosAta.observacoes_professor_texto}
                            onChange={(e) => setDadosAta({...dadosAta, observacoes_professor_texto: e.target.value})}
                        />
                    </div>
                </div>

                {/* NOVOS COMPROMISSOS */}
                <div className="bg-white rounded-2xl p-6 border border-brand-primary/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
                    
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Novos Compromissos e Metas</h2>
                            <p className="text-sm text-slate-500 font-medium">Estabelecidos nesta reunião para verificação futura.</p>
                        </div>
                        <button 
                            type="button" 
                            onClick={handleAdicionarCompromisso} 
                            className="px-4 py-2 bg-brand-light text-brand-primary rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-brand-primary hover:text-white transition-colors"
                        >
                            <Plus size={16} /> Adicionar Item
                        </button>
                    </div>

                    {novosCompromissos.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-slate-400 font-bold bg-slate-50/50">
                            Nenhum compromisso novo adicionado.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {novosCompromissos.map((comp, index) => (
                                <div key={index} className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">O que deve ser feito?</label>
                                        <input 
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all font-medium text-slate-700"
                                            placeholder="Descreva a meta ou tarefa..."
                                            value={comp.descricao}
                                            onChange={(e) => handleCompromissoChange(index, 'descricao', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-1/3 min-w-[130px]">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Prazo (Opcional)</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all font-medium text-slate-700 text-center"
                                            value={comp.data_prazo_limite}
                                            onChange={(e) => handleCompromissoChange(index, 'data_prazo_limite', e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoverCompromisso(index)} 
                                        className="mt-6 p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                        title="Remover"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
            
            {/* MODAL DE CONFIRMAÇÃO DE SALVAMENTO */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="bg-amber-50 p-6 flex flex-col items-center text-center border-b border-amber-100">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <HelpCircle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Finalizar Ata?</h3>
                            <p className="text-sm font-medium text-amber-700/80 mt-2">
                                Uma vez salva, a Ata será <strong>fechada permanentemente</strong>. Você poderá baixá-la em PDF, mas não poderá alterá-la novamente.
                            </p>
                        </div>
                        <div className="p-6 flex flex-col sm:flex-row gap-3 bg-gray-50">
                            <button 
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="flex-1 py-3 px-4 bg-white border border-gray-200 text-slate-600 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
                            >
                                Voltar e Revisar
                            </button>
                            <button 
                                onClick={executeSubmit}
                                className="flex-1 py-3 px-4 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Sim, Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NovaAta;