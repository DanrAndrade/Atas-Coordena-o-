import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, senha });
            const { token, usuario } = response.data;
            
            localStorage.setItem('@AtasApp:token', token);
            localStorage.setItem('@AtasApp:usuario', JSON.stringify(usuario));
            
            // Set token on API headers immediately
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            navigate('/');
        } catch (err) {
            setErro(err.response?.data?.message || 'Falha ao fazer login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand-primary/20">
                        IASC
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Sistema de Atas
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 font-medium">
                    Acesso exclusivo para Coordenação
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
                <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        
                        {erro && (
                            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in">
                                <AlertCircle size={16} />
                                {erro}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700">Email</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary sm:text-sm transition-all text-slate-800 font-medium"
                                    placeholder="coordenacao@escola.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700">Senha</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary sm:text-sm transition-all text-slate-800 font-medium"
                                    placeholder="••••••••"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed items-center gap-2 group"
                            >
                                {loading ? 'Entrando...' : 'Entrar no Sistema'}
                                {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
