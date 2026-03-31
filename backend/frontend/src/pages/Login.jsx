import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Função de Login restaurada EXATAMENTE igual ao seu código original funcional
  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, senha: password });
      const { token, usuario } = response.data;
      
      // Usando os nomes exatos do localStorage que o resto do seu sistema espera
      localStorage.setItem('@AtasApp:token', token);
      localStorage.setItem('@AtasApp:usuario', JSON.stringify(usuario));
      
      // Set token on API headers immediately (Igual ao original)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // O seu código original ia para '/', o meu ia para '/home'. Ajustado para '/'.
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.error_message || err.response?.data?.message || 'Falha ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#faf9f6] font-['Inter'] text-[#2f3430] antialiased min-h-screen w-full flex flex-col aurora-bg relative overflow-hidden">
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
        }
        .glass-footer {
            background: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-top: 1px solid rgba(255, 255, 255, 0.5);
        }
        .aurora-bg {
            background: radial-gradient(circle at 20% 30%, #ffede1 0%, transparent 40%),
                        radial-gradient(circle at 80% 20%, #fce589 0%, transparent 30%),
                        radial-gradient(circle at 50% 80%, #ffdcd1 0%, transparent 50%),
                        #faf9f6;
            background-attachment: fixed;
        }
      `}} />

      <div className="absolute inset-0 aurora-bg -z-10 w-full h-full"></div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] bg-[#f16137] opacity-40 blur-[90px] md:blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[50vw] h-[50vw] md:w-[35vw] md:h-[35vw] bg-[#fce589] opacity-40 blur-[80px] md:blur-[100px] rounded-full"></div>
      </div>

      <main className="flex-grow flex items-center justify-center relative z-10 w-full px-4 sm:px-8 md:px-12 py-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center w-full max-w-5xl mx-auto">
          
          <div className="text-center lg:text-left space-y-5 lg:space-y-6 order-2 lg:order-1 mt-8 lg:mt-0 flex flex-col items-center lg:items-start">
            <h2 className="font-['Manrope'] text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2f3430] tracking-tight leading-[1.15]">
              Instituto Associados <br className="hidden md:block" /> Saber e Cultura
            </h2>
            
            <p className="font-['Inter'] text-base sm:text-lg text-[#5c605c] leading-relaxed opacity-95 max-w-md">
              Bem-vindo ao portal unificado da nossa coordenação. Centralize o registro de atas, simplifique a gestão de reuniões e colabore com sua equipe em um ambiente seguro e intuitivo.
            </p>
          </div>

          <div className="flex justify-center order-1 lg:order-2 w-full">
            <div className="glass-card w-full max-w-[26rem] md:max-w-[28rem] px-6 py-12 sm:p-10 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_15px_40px_rgba(0,0,0,0.1)] flex flex-col items-center border border-white/60">
              
              <div className="mb-10 text-center flex flex-col items-center">
                <div className="flex items-center justify-center h-14 md:h-16 mb-4">
                  <img src="/images/logo.png" alt="Logo" className="max-h-full w-auto object-contain" />
                </div>
                <h1 className="font-['Manrope'] text-2xl md:text-3xl font-extrabold tracking-tight text-[#2f3430] mb-2">Bem-vindo</h1>
                <p className="text-[#5c605c] text-xs md:text-sm font-medium tracking-wide">Aceda à sua conta para continuar</p>
              </div>

              {erro && (
                <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-[1.5rem] flex items-start sm:items-center gap-3 backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-xs sm:text-sm text-red-700 font-medium text-left">{erro}</p>
                </div>
              )}

              <form className="w-full space-y-6 md:space-y-7" onSubmit={handleLogin}>
                <div className="space-y-2 text-left w-full">
                  <label className="font-['Inter'] text-[0.65rem] md:text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c605c] ml-4 block">
                    Endereço de Email
                  </label>
                  <input 
                    className="w-full px-5 py-4 bg-[#f4f4f0] border-none rounded-[1.5rem] md:rounded-[2rem] text-[#2f3430] placeholder:text-[#afb3ae] focus:ring-2 focus:ring-[#f16137]/20 transition-all outline-none text-sm md:text-base" 
                    placeholder="coordenacao@escola.com" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2 text-left w-full">
                  <label className="font-['Inter'] text-[0.65rem] md:text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c605c] ml-4 block">
                    Palavra-passe
                  </label>
                  <input 
                    className="w-full px-5 py-4 bg-[#f4f4f0] border-none rounded-[1.5rem] md:rounded-[2rem] text-[#2f3430] placeholder:text-[#afb3ae] focus:ring-2 focus:ring-[#f16137]/20 transition-all outline-none text-sm md:text-base" 
                    placeholder="••••••••" 
                    required 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button 
                  disabled={loading}
                  className="w-full mt-2 md:mt-4 py-4 md:py-5 bg-gradient-to-r from-[#f16137] to-[#d44f2b] text-[#ffffff] font-bold rounded-full shadow-lg shadow-[#f16137]/25 hover:scale-[1.02] transition-all duration-200 active:scale-95 flex items-center justify-center gap-3 group text-base md:text-lg disabled:opacity-70 disabled:cursor-not-allowed" 
                  type="submit"
                >
                  <span>{loading ? 'A entrar...' : 'Entrar no Sistema'}</span>
                  {!loading && (
                    <span className="material-symbols-outlined text-lg md:text-xl group-hover:translate-x-1 transition-transform">login</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 px-4 z-50 glass-footer flex justify-center items-center mt-auto">
        <span className="font-['Inter'] text-[10px] md:text-[12px] font-semibold tracking-wide text-[#2f3430] opacity-80 uppercase text-center leading-relaxed">
          © {new Date().getFullYear()} Instituto Associados Saber e Cultura <br className="sm:hidden" /> <span className="hidden sm:inline">-</span> Todos os direitos reservados
        </span>
      </footer>
    </div>
  );
};

export default Login;