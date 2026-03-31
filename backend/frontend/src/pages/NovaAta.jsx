import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
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
    
    const [tagsDisponiveis, setTagsDisponiveis] = useState([]);
    
    const [pendencias, setPendencias] = useState([]);
    const [pendenciasMarcadas, setPendenciasMarcadas] = useState([]); 
    const [novosCompromissos, setNovosCompromissos] = useState([]);
    
    const [mensagemFinal, setMensagemFinal] = useState({ texto: '', tipo: '' });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [novaTagTema, setNovaTagTema] = useState('');
    const [novaTagObs, setNovaTagObs] = useState('');
    const [showInputTema, setShowInputTema] = useState(false);
    const [showInputObs, setShowInputObs] = useState(false);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const profRes = await api.get('/professores');
                setProfessor(profRes.data.find(p => p.id === parseInt(id)));
                
                const coord = JSON.parse(localStorage.getItem('@AtasApp:usuario'));
                setCoordenador(coord);

                const tagsRes = await api.get('/tags');
                setTagsDisponiveis(tagsRes.data);

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
            
            // Envia o HTML nativo do editor de texto
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
            setTimeout(() => navigate(`/professor/${id}`), 500);
        } catch (error) {
            setMensagemFinal({ texto: 'Erro ao salvar a ata: ' + (error.response?.data?.erro || error.message), tipo: 'error' });
        }
    };

    // Módulos do Editor Quill
    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            ['clean']
        ],
    };

    const customStyles = `
        .signature-glow { background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%); }
        .editorial-shadow { box-shadow: 0 12px 32px rgba(32, 48, 68, 0.06); }
        .bg-dots { 
            background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px); 
            background-size: 24px 24px; 
        }
        .quill-editor-container .ql-toolbar.ql-snow {
            border: none;
            border-bottom: 1px solid #e2e8f0;
            background-color: white;
            border-top-left-radius: 1rem;
            border-top-right-radius: 1rem;
            padding: 12px 16px;
        }
        .quill-editor-container .ql-container.ql-snow {
            border: none;
            background-color: white;
            border-bottom-left-radius: 1rem;
            border-bottom-right-radius: 1rem;
            font-family: inherit;
            font-size: 0.875rem;
        }
        .quill-editor-container .ql-editor {
            min-height: 200px;
            padding: 20px 24px;
            color: #334155;
            font-weight: 500;
        }
        .quill-editor-container .ql-editor.ql-blank::before {
            color: #94a3b8;
            font-style: normal;
            font-weight: 500;
        }
    `;

    if (loading || !professor || !coordenador) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f4f6ff]">
                <div className="text-brand-primary font-bold animate-pulse text-lg tracking-widest uppercase">Preparando documento...</div>
            </div>
        );
    }

    const temas = tagsDisponiveis.filter(t => t.tipo === 'tema');
    const observacoes = tagsDisponiveis.filter(t => t.tipo === 'observacao');
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />

            <div className="min-h-screen bg-[#f4f6ff] font-body pb-20 relative">
                
                {/* TOAST DE MENSAGEM */}
                {mensagemFinal.texto && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-md animate-fade-in z-50 px-4">
                        <div className={`px-6 py-4 text-sm font-bold flex items-center justify-center gap-3 rounded-2xl shadow-2xl ${mensagemFinal.tipo === 'success' ? 'bg-emerald-500 text-white' : mensagemFinal.tipo === 'info' ? 'signature-glow text-white' : 'bg-red-500 text-white'}`}>
                            {mensagemFinal.tipo === 'success' ? <CheckSquare size={20}/> : <AlertCircle size={20}/>}
                            {mensagemFinal.texto}
                        </div>
                    </div>
                )}

                {/* TOPBAR FLUTUANTE */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                    <div className="max-w-6xl mx-auto px-6 h-14 md:h-16 flex items-center justify-between">
                        <button 
                            type="button"
                            onClick={() => navigate(`/professor/${id}`)}
                            className="flex items-center gap-2 text-slate-400 hover:text-brand-primary font-bold text-xs uppercase tracking-widest transition-colors py-2"
                        >
                            <ArrowLeft size={18} /> Cancelar
                        </button>
                        <button 
                            type="button"
                            onClick={handleConfirmSubmit}
                            disabled={mensagemFinal.tipo === 'info'}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full font-headline font-bold text-xs uppercase tracking-widest shadow-lg transition-all hover:scale-105 ${mensagemFinal.tipo === 'info' ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'signature-glow text-white shadow-orange-500/30'}`}
                        >
                            <Save size={18} /> Salvar Documento
                        </button>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-6 mt-10 animate-fade-in-up space-y-8">
                    
                    {/* CABEÇALHO DA ATA (HERO CARD) */}
                    <div className="bg-white rounded-3xl p-10 editorial-shadow border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-dots -mr-12 -mt-12 pointer-events-none opacity-40"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-8 mb-8 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 signature-glow text-white rounded-2xl shadow-lg shadow-orange-500/20">
                                    <FileSignature size={28} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-headline font-extrabold text-slate-800 tracking-tighter">Registro de Ata</h1>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Reunião Pedagógica</p>
                                </div>
                            </div>
                            <div className="text-left md:text-right bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data de Emissão</p>
                                <p className="text-xl font-headline font-extrabold text-brand-primary">{dataAtual}</p>
                            </div>
                        </div>
                        
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Professor(a)</span> 
                                <span className="text-lg font-headline font-bold text-slate-800">{professor.nome}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Turmas / Disciplina</span> 
                                <span className="text-base font-bold text-slate-600">{professor.disciplina || '-'} • {professor.turmas || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Coordenação</span> 
                                <span className="text-base font-bold text-slate-600">{coordenador.nome}</span>
                            </div>
                        </div>
                    </div>

                    {/* TEMAS E PENDÊNCIAS LADO A LADO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* TEMAS DA REUNIÃO */}
                        <div className="bg-white rounded-3xl p-8 editorial-shadow border border-slate-100 flex flex-col">
                            <h2 className="text-xl font-headline font-extrabold text-slate-800 flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Tag size={20} /></div> 
                                Temas Abordados
                            </h2>
                            {temas.length === 0 ? (
                                <div className="flex items-center gap-3">
                                    <p className="text-sm text-slate-400 font-medium">Nenhum tema configurado.</p>
                                    {!showInputTema && (
                                        <button type="button" onClick={() => setShowInputTema(true)} className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"><Plus size={14} /> Criar</button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 items-center">
                                    {temas.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => toggleTag('tema', t.id)}
                                            className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                                                dadosAta.temas_ids.includes(t.id)
                                                    ? 'bg-white border-brand-primary text-brand-primary shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            {t.nome}
                                        </button>
                                    ))}
                                    {!showInputTema && (
                                        <button type="button" onClick={() => setShowInputTema(true)} className="px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border border-dashed border-slate-300 text-slate-400 hover:border-brand-primary hover:text-brand-primary flex items-center gap-1"><Plus size={14} /> Novo</button>
                                    )}
                                </div>
                            )}
                            
                            {showInputTema && (
                                <div className="flex items-center gap-2 mt-4 animate-fade-in p-2 bg-slate-50 rounded-2xl border border-slate-200 w-fit">
                                    <input autoFocus type="text" placeholder="Nome do novo tema..." className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-bold text-slate-700 min-w-[250px]" value={novaTagTema} onChange={e => setNovaTagTema(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSalvarTag('tema')} />
                                    <button type="button" onClick={() => handleSalvarTag('tema')} className="signature-glow text-white p-2.5 rounded-xl hover:scale-105 transition-transform shadow-sm"><CheckSquare size={16}/></button>
                                    <button type="button" onClick={() => setShowInputTema(false)} className="bg-white text-slate-400 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"><X size={16}/></button>
                                </div>
                            )}
                        </div>

                        {/* PENDÊNCIAS ANTERIORES */}
                        <div className="bg-white rounded-3xl p-8 editorial-shadow border border-slate-100 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
                            <h2 className="text-xl font-headline font-extrabold text-slate-800 flex items-center gap-3 mb-6">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><AlertCircle size={20} /></div> 
                                Pendências Anteriores
                            </h2>
                            {pendencias.length === 0 ? (
                                <p className="text-sm text-slate-500 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 w-fit">Não há compromissos em aberto para este professor.</p>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-[10px] text-amber-500 font-black tracking-widest uppercase mb-4">Marque o que foi cumprido:</p>
                                    {pendencias.map(p => {
                                        const isMarcado = pendenciasMarcadas.includes(p.id);
                                        return (
                                            <div 
                                                key={p.id} 
                                                onClick={() => togglePendencia(p.id)}
                                                className={`p-4 rounded-2xl border text-sm font-bold flex items-start gap-4 cursor-pointer transition-all ${
                                                    isMarcado ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                                }`}
                                            >
                                                {isMarcado ? <CheckSquare size={20} className="text-amber-500 mt-0.5 shrink-0" /> : <Square size={20} className="text-slate-300 mt-0.5 shrink-0" />}
                                                <div>
                                                    <p className={isMarcado ? 'line-through opacity-60 text-amber-800' : ''}>{p.descricao}</p>
                                                    <p className={`text-[9px] uppercase font-black tracking-widest mt-2 ${isMarcado ? 'text-amber-600/70' : 'text-slate-400'}`}>Gerado em: {p.data_origem}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SITUAÇÃO NO PORTAL E OBSERVAÇÕES SETADAS (FULL WIDTH) */}
                    <div className="bg-white rounded-3xl p-8 editorial-shadow border border-slate-100">
                        <div className="mb-10">
                            <h2 className="text-sm font-black text-slate-800 mb-4 block uppercase tracking-widest">Registros no portal em dia? (Diário/Notas/Faltas)</h2>
                            <div className="flex gap-4 max-w-2xl">
                                {['Sim', 'Incompleto', 'Não'].map(op => (
                                    <label key={op} className={`flex-1 py-4 px-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wider ${
                                        dadosAta.registros_portal === op 
                                        ? 'bg-white border-brand-primary text-brand-primary shadow-sm' 
                                        : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'
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

                        <div>
                            <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
                                <Tag size={16} className="text-brand-primary" /> Observações Rápidas da Coordenação
                            </h2>
                            {observacoes.length === 0 ? (
                                <div className="flex items-center gap-3">
                                    <p className="text-sm text-slate-400 font-medium">Nenhuma observação configurada.</p>
                                    {!showInputObs && (
                                        <button type="button" onClick={() => setShowInputObs(true)} className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-50 text-slate-500 hover:bg-brand-light hover:text-brand-primary flex items-center gap-2"><Plus size={14} /> Criar</button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 items-center">
                                    {observacoes.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => toggleTag('obs', t.id)}
                                            className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                                                dadosAta.tags_obs_ids.includes(t.id)
                                                    ? 'bg-white border-brand-primary text-brand-primary shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            {t.nome}
                                        </button>
                                    ))}
                                    {!showInputObs && (
                                        <button type="button" onClick={() => setShowInputObs(true)} className="px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border border-dashed border-slate-300 text-slate-400 hover:border-brand-primary hover:text-brand-primary flex items-center gap-1"><Plus size={14} /> Novo</button>
                                    )}
                                </div>
                            )}
                            
                            {showInputObs && (
                                <div className="flex items-center gap-2 mt-4 animate-fade-in p-2 bg-slate-50 rounded-2xl border border-slate-200 w-fit">
                                    <input autoFocus type="text" placeholder="Nome da observação..." className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-bold text-slate-700 min-w-[250px]" value={novaTagObs} onChange={e => setNovaTagObs(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSalvarTag('obs')} />
                                    <button type="button" onClick={() => handleSalvarTag('obs')} className="signature-glow text-white p-2.5 rounded-xl hover:scale-105 transition-transform shadow-sm"><CheckSquare size={16}/></button>
                                    <button type="button" onClick={() => setShowInputObs(false)} className="bg-white text-slate-400 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"><X size={16}/></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RELATO DA COORDENAÇÃO E RELATO DO PROFESSOR (FULL WIDTH - LINHAS SEPARADAS) */}
                    <div className="grid grid-cols-1 gap-8">
                        <div className="bg-white rounded-3xl p-8 editorial-shadow border border-slate-100 flex flex-col">
                            <h2 className="text-xl font-headline font-extrabold text-slate-800 flex items-center gap-3 mb-6">
                                <div className="p-2 bg-slate-100 text-slate-500 rounded-xl"><MessageSquare size={20} /></div> 
                                Relato da Coordenação
                            </h2>
                            <div className="quill-editor-container border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
                                <ReactQuill 
                                    theme="snow"
                                    modules={quillModules}
                                    value={dadosAta.observacoes_coordenacao_texto}
                                    onChange={(content) => setDadosAta({...dadosAta, observacoes_coordenacao_texto: content})}
                                    placeholder="Descreva detalhadamente as pautas, orientações e feedbacks dados ao professor..."
                                />
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-3xl p-8 editorial-shadow border border-slate-100 flex flex-col">
                            <h2 className="text-xl font-headline font-extrabold text-slate-800 flex items-center gap-3 mb-6">
                                <div className="p-2 bg-slate-100 text-slate-500 rounded-xl"><MessageSquare size={20} /></div> 
                                Relato do Professor
                            </h2>
                            <div className="quill-editor-container border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
                                <ReactQuill 
                                    theme="snow"
                                    modules={quillModules}
                                    value={dadosAta.observacoes_professor_texto}
                                    onChange={(content) => setDadosAta({...dadosAta, observacoes_professor_texto: content})}
                                    placeholder="Descreva as justificativas, dificuldades relatadas e considerações do docente..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* NOVOS COMPROMISSOS */}
                    <div className="bg-white rounded-3xl p-8 editorial-shadow border border-brand-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary"></div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-2xl font-headline font-extrabold text-slate-800 tracking-tight">Novos Compromissos e Metas</h2>
                                <p className="text-sm text-slate-500 font-medium mt-1">Estabelecidos nesta reunião para verificação futura.</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={handleAdicionarCompromisso} 
                                className="px-6 py-3 bg-orange-50 text-brand-primary border border-brand-primary/20 rounded-full font-bold flex items-center gap-2 text-xs uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-colors shadow-sm"
                            >
                                <Plus size={16} /> Adicionar Item
                            </button>
                        </div>

                        {novosCompromissos.length === 0 ? (
                            <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center justify-center bg-slate-50/50">
                                <CheckSquare size={32} className="text-slate-300 mb-3" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma meta adicionada.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {novosCompromissos.map((comp, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-fade-in shadow-sm">
                                        <div className="flex-1 w-full">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">O que deve ser feito?</label>
                                            <input 
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all font-bold text-slate-700 shadow-sm"
                                                placeholder="Ex: Atualizar diários da turma 6A..."
                                                value={comp.descricao}
                                                onChange={(e) => handleCompromissoChange(index, 'descricao', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-full sm:w-1/3 sm:min-w-[160px]">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Prazo (Opcional)</label>
                                            <input 
                                                type="date"
                                                min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all font-bold text-slate-700 shadow-sm"
                                                value={comp.data_prazo_limite}
                                                onChange={(e) => handleCompromissoChange(index, 'data_prazo_limite', e.target.value)}
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoverCompromisso(index)} 
                                            className="w-full sm:w-auto mt-2 sm:mt-0 p-3 flex justify-center text-slate-400 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 rounded-xl transition-colors shadow-sm"
                                            title="Remover"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
                
                {/* MODAL DE CONFIRMAÇÃO DE SALVAMENTO */}
                {isConfirmModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-slate-100">
                            <div className="bg-orange-50 p-10 flex flex-col items-center text-center border-b border-orange-100">
                                <div className="w-20 h-20 signature-glow text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30">
                                    <HelpCircle size={36} />
                                </div>
                                <h3 className="text-2xl font-headline font-extrabold text-slate-800 tracking-tight">Finalizar Ata?</h3>
                                <p className="text-sm font-medium text-slate-600 mt-3 leading-relaxed">
                                    Uma vez salva, a Ata será fechada permanentemente. Você poderá baixá-la em PDF, mas não poderá alterá-la.
                                </p>
                            </div>
                            <div className="p-8 flex flex-col gap-3 bg-white">
                                <button 
                                    onClick={executeSubmit}
                                    className="w-full py-4 signature-glow text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]"
                                >
                                    <Save size={18} /> Sim, Salvar Documento
                                </button>
                                <button 
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition-colors uppercase tracking-widest text-[11px]"
                                >
                                    Voltar e Revisar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default NovaAta;