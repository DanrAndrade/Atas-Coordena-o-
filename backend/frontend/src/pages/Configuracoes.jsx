import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    Tag, Plus, Trash2, Edit2, CheckCircle2, X, ArrowLeft, Settings
} from 'lucide-react';

function Configuracoes() {
    const navigate = useNavigate();
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTagId, setCurrentTagId] = useState(null);
    const [formData, setFormData] = useState({ nome: '', tipo: 'tema' });
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    const [tagToDelete, setTagToDelete] = useState(null);

    const carregarTags = async () => {
        try {
            const response = await api.get('/tags');
            setTags(response.data);
        } catch (error) {
            console.error("Erro ao buscar tags:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarTags();
    }, []);

    const handleOpenModal = (tag = null) => {
        setMensagem({ texto: '', tipo: '' });
        if (tag) {
            setIsEditing(true);
            setCurrentTagId(tag.id);
            setFormData({ nome: tag.nome, tipo: tag.tipo });
        } else {
            setIsEditing(false);
            setCurrentTagId(null);
            setFormData({ nome: '', tipo: 'tema' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.nome) return;

        setMensagem({ texto: 'Salvando...', tipo: 'info' });
        try {
            if (isEditing) {
                await api.put(`/tags/${currentTagId}`, formData);
                setMensagem({ texto: 'Anotação atualizada!', tipo: 'success' });
            } else {
                await api.post('/tags', formData);
                setMensagem({ texto: 'Anotação criada!', tipo: 'success' });
            }
            carregarTags();
            setTimeout(() => { setIsModalOpen(false); }, 1500);
        } catch (error) {
            setMensagem({ texto: error.response?.data?.erro || 'Erro ao salvar.', tipo: 'error' });
        }
    };

    const executeDelete = async (id) => {
        try {
            await api.delete(`/tags/${id}`);
            carregarTags();
            setTagToDelete(null);
        } catch (error) {
            setMensagem({ texto: "Aviso: Esta tag está em uso por atas passadas e não pode ser apagada.", tipo: 'error' });
            setIsModalOpen(true);
            setTagToDelete(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-brand-primary font-bold animate-pulse">Carregando Configurações...</div>
            </div>
        );
    }

    const temas = tags.filter(t => t.tipo === 'tema');
    const observacoes = tags.filter(t => t.tipo === 'observacao');

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            
            {/* SIDEBAR COM LOGO (Simplificada) */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col z-30">
                <div className="h-16 flex items-center justify-center px-6 border-b border-gray-100">
                    <img src="/images/logo.png" alt="Logo IASC" className="h-8 object-contain" />
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <button onClick={() => navigate('/')} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-sm font-medium text-slate-500 hover:bg-gray-50">
                        <ArrowLeft size={20} />
                        <span>Voltar ao Início</span>
                    </button>
                    <div className="mt-8 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Painel
                    </div>
                    <button className="flex items-center w-full py-3 px-4 rounded-xl transition-all text-sm font-medium bg-brand-light text-brand-primary gap-3">
                        <Settings size={22} />
                        <span>Configurações</span>
                    </button>
                </div>
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8 shrink-0 z-20 shadow-sm gap-4">
                    <button 
                        onClick={() => navigate('/')}
                        className="lg:hidden p-2 text-slate-500 hover:bg-gray-100 hover:text-brand-primary rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-sm font-bold text-slate-700">Configurações Gerais</div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gerenciamento de Tags</h1>
                                <p className="text-slate-500 text-sm">Configure os Temas de Reunião e as Observações Padrões para Atas.</p>
                            </div>
                            <button 
                                onClick={() => handleOpenModal()}
                                className="px-5 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-primary/30 transition-all w-full md:w-auto justify-center"
                            >
                                <Plus size={18} />
                                Nova Tag
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* COLUNA: TEMAS */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-gray-100 flex items-center bg-slate-50/50 gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Tag size={20} />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-800">Temas Abordados</h2>
                                </div>
                                <div className="flex-1 p-5 overflow-y-auto max-h-[500px]">
                                    {temas.length === 0 ? (
                                        <p className="text-slate-400 text-center text-sm py-8">Nenhum tema configurado.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {temas.map(t => (
                                                <div key={t.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-colors group">
                                                    <span className="font-medium text-slate-700">{t.nome}</span>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {tagToDelete === t.id ? (
                                                            <div className="flex items-center gap-1 animate-fade-in pr-2">
                                                                <button onClick={() => executeDelete(t.id)} className="p-1.5 bg-red-500 text-white rounded text-xs font-bold">Apagar</button>
                                                                <button onClick={() => setTagToDelete(null)} className="p-1.5 bg-gray-200 text-slate-600 rounded text-xs font-bold">Cancelar</button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleOpenModal(t)} className="p-1.5 text-slate-400 hover:text-brand-primary rounded bg-white shadow-sm border border-gray-100"><Edit2 size={14}/></button>
                                                                <button onClick={() => setTagToDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded bg-white shadow-sm border border-gray-100"><Trash2 size={14}/></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* COLUNA: OBSERVAÇÕES */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-gray-100 flex items-center bg-slate-50/50 gap-3">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                        <Tag size={20} />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-800">Observações Padrão</h2>
                                </div>
                                <div className="flex-1 p-5 overflow-y-auto max-h-[500px]">
                                    {observacoes.length === 0 ? (
                                        <p className="text-slate-400 text-center text-sm py-8">Nenhuma observação configurada.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {observacoes.map(t => (
                                                <div key={t.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-amber-200 hover:bg-amber-50/50 transition-colors group">
                                                    <span className="font-medium text-slate-700">{t.nome}</span>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {tagToDelete === t.id ? (
                                                            <div className="flex items-center gap-1 animate-fade-in pr-2">
                                                                <button onClick={() => executeDelete(t.id)} className="p-1.5 bg-red-500 text-white rounded text-xs font-bold">Apagar</button>
                                                                <button onClick={() => setTagToDelete(null)} className="p-1.5 bg-gray-200 text-slate-600 rounded text-xs font-bold">Cancelar</button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleOpenModal(t)} className="p-1.5 text-slate-400 hover:text-brand-primary rounded bg-white shadow-sm border border-gray-100"><Edit2 size={14}/></button>
                                                                <button onClick={() => setTagToDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded bg-white shadow-sm border border-gray-100"><Trash2 size={14}/></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">
                                {isEditing ? 'Editar Tag' : 'Nova Tag'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}>
                                <X size={20} className="text-slate-400 hover:text-slate-600" />
                            </button>
                        </div>

                        {mensagem.texto && (
                            <div className={`mb-4 p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${mensagem.tipo === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {mensagem.tipo === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
                                {mensagem.texto}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome/Nomecrécia da Tag</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all" 
                                    value={formData.nome} 
                                    onChange={e => setFormData({...formData, nome: e.target.value})} 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Tag</label>
                                <select 
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all appearance-none" 
                                    value={formData.tipo} 
                                    onChange={e => setFormData({...formData, tipo: e.target.value})}
                                >
                                    <option value="tema">Tema Abordado na Reunião</option>
                                    <option value="observacao">Observação Padrão</option>
                                </select>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-hover shadow-lg shadow-brand-primary/20 transition-all">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Configuracoes;