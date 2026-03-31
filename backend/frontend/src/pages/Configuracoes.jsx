import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    Tag, Trash2, Edit2, CheckCircle2, X, Menu, Bell
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

function Configuracoes() {
    const navigate = useNavigate();
    const [tags, setTags] = useState([]);
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
            setTimeout(() => { setIsModalOpen(false); }, 300);
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

    const temas = tags.filter(t => t.tipo === 'tema');
    const observacoes = tags.filter(t => t.tipo === 'observacao');

    const customStyles = `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            line-height: 1;
        }
        .signature-glow {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%);
        }
        .editorial-shadow {
            box-shadow: 0 12px 32px rgba(32, 48, 68, 0.06);
        }
        .bg-dots {
            background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px);
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

            <div className="flex h-screen bg-[#f4f6ff] overflow-hidden font-sans relative">
                
                {isMobileMenuOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
                
                <Sidebar 
                    isMobileMenuOpen={isMobileMenuOpen} 
                    setIsMobileMenuOpen={setIsMobileMenuOpen} 
                    activeMenuOverride="configuracoes" 
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                    
                    {/* CABEÇALHO PADRONIZADO (MERO DISPLAY DE PERFIL) */}
                    <Topbar showMenuButton={true} onMenuClick={() => setIsMobileMenuOpen(true)} />

                    <main className="flex-1 overflow-y-auto px-4 py-8 md:px-12 md:py-12 scroll-smooth bg-[#f4f6ff] dotted-grid">
                        <div className="max-w-6xl mx-auto animate-fade-in-up space-y-10">
                            
                            {/* HEADER SECTION PADRONIZADO COM LARANJA */}
                            <section className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-8 md:p-12 flex flex-col md:flex-row justify-between items-end gap-8 shadow-sm">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-dots -mr-12 -mt-12 pointer-events-none opacity-40"></div>
                                <div className="relative z-10 max-w-2xl w-full">
                                    <span className="font-body text-brand-primary uppercase tracking-[0.2em] font-bold mb-3 block text-[11px]">Configurações Gerais</span>
                                    <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-800 mb-4 leading-tight">
                                        Gerenciamento de <br /><span className="text-brand-primary">Tags</span>
                                    </h1>
                                    <p className="text-slate-500 text-base md:text-lg max-w-lg leading-relaxed font-body font-light">
                                        Configure os Temas de Reunião e as Observações Padrões para Atas.
                                    </p>
                                </div>
                                <div className="relative z-10 flex w-full md:w-auto shrink-0">
                                    <button onClick={() => handleOpenModal()} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 signature-glow text-white rounded-full font-headline font-bold text-sm shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform">
                                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                        Nova Tag
                                    </button>
                                </div>
                            </section>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
                                
                                {/* COLUNA: TEMAS */}
                                <div className="bg-white rounded-2xl editorial-shadow border border-slate-200 overflow-hidden flex flex-col h-[550px]">
                                    <div className="p-6 border-b border-slate-100 flex items-center bg-slate-50/50 gap-4">
                                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shadow-sm border border-blue-200">
                                            <Tag size={20} />
                                        </div>
                                        <h2 className="text-xl font-headline font-extrabold text-slate-800 tracking-tight">Temas Abordados</h2>
                                    </div>
                                    
                                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                        {temas.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <span className="material-symbols-outlined text-5xl mb-3 opacity-30">label_off</span>
                                                <p className="text-sm font-medium font-body">Nenhum tema configurado.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {temas.map(t => (
                                                    <div key={t.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50/30 transition-all group font-body">
                                                        <span className="font-bold text-slate-700">{t.nome}</span>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {tagToDelete === t.id ? (
                                                                <div className="flex items-center gap-2 animate-fade-in pr-2">
                                                                    <button onClick={() => executeDelete(t.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-red-600 transition-colors uppercase tracking-widest">Apagar</button>
                                                                    <button onClick={() => setTagToDelete(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors uppercase tracking-widest">Cancelar</button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => handleOpenModal(t)} className="p-2 text-slate-400 hover:text-brand-primary rounded-lg bg-white shadow-sm border border-slate-200 transition-colors"><Edit2 size={16}/></button>
                                                                    <button onClick={() => setTagToDelete(t.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg bg-white shadow-sm border border-slate-200 transition-colors"><Trash2 size={16}/></button>
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
                                <div className="bg-white rounded-2xl editorial-shadow border border-slate-200 overflow-hidden flex flex-col h-[550px]">
                                    <div className="p-6 border-b border-slate-100 flex items-center bg-slate-50/50 gap-4">
                                        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl shadow-sm border border-amber-200">
                                            <Tag size={20} />
                                        </div>
                                        <h2 className="text-xl font-headline font-extrabold text-slate-800 tracking-tight">Observações Padrão</h2>
                                    </div>
                                    
                                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                        {observacoes.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <span className="material-symbols-outlined text-5xl mb-3 opacity-30">label_off</span>
                                                <p className="text-sm font-medium font-body">Nenhuma observação configurada.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {observacoes.map(t => (
                                                    <div key={t.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-amber-300 hover:bg-amber-50/30 transition-all group font-body">
                                                        <span className="font-bold text-slate-700">{t.nome}</span>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {tagToDelete === t.id ? (
                                                                <div className="flex items-center gap-2 animate-fade-in pr-2">
                                                                    <button onClick={() => executeDelete(t.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-red-600 transition-colors uppercase tracking-widest">Apagar</button>
                                                                    <button onClick={() => setTagToDelete(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors uppercase tracking-widest">Cancelar</button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => handleOpenModal(t)} className="p-2 text-slate-400 hover:text-brand-primary rounded-lg bg-white shadow-sm border border-slate-200 transition-colors"><Edit2 size={16}/></button>
                                                                    <button onClick={() => setTagToDelete(t.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg bg-white shadow-sm border border-slate-200 transition-colors"><Trash2 size={16}/></button>
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

                {/* MODAL (ESTILIZADO PREMIUM) */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-body">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden relative">
                            <div className="w-full h-full p-6 md:p-8 overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-8 shrink-0">
                                <h3 className="text-2xl font-headline font-extrabold text-slate-800 uppercase tracking-tight">
                                    {isEditing ? 'Editar Tag' : 'Nova Tag'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-colors shrink-0">
                                    <X size={20} />
                                </button>
                            </div>

                            {mensagem.texto && (
                                <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${mensagem.tipo === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {mensagem.tipo === 'success' ? <CheckCircle2 size={20} /> : <X size={20} />}
                                    {mensagem.texto}
                                </div>
                            )}

                            <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nome/Nomenclatura da Tag</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all shadow-sm text-slate-800 font-bold text-sm" 
                                        value={formData.nome} 
                                        onChange={e => setFormData({...formData, nome: e.target.value})} 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tipo de Tag</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all appearance-none shadow-sm text-slate-800 font-bold text-sm" 
                                            value={formData.tipo} 
                                            onChange={e => setFormData({...formData, tipo: e.target.value})}
                                        >
                                            <option value="tema">Tema Abordado na Reunião</option>
                                            <option value="observacao">Observação Padrão</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest text-[11px]">Cancelar</button>
                                    <button type="submit" className="flex-1 py-4 signature-glow text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform uppercase tracking-widest text-[11px]">Salvar</button>
                                </div>
                            </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default Configuracoes;