import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ProfessorProfile from './pages/ProfessorProfile';
import NovaAta from './pages/NovaAta';
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login';

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Componente Guardião Robusto: Impede falhas e tokens falsos
function PrivateRoute({ children }) {
  const token = localStorage.getItem('@AtasApp:token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  const payload = parseJwt(token);
  if (!payload || !payload.exp || Date.now() >= payload.exp * 1000) {
      // Limpa rastros e chuta pro login antes de piscar a tela
      localStorage.removeItem('@AtasApp:token');
      localStorage.removeItem('@AtasApp:usuario');
      return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Desprotegida */}
        <Route path="/login" element={<Login />} />
        
        {/* Rotas Protegidas */}
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/professor/:id" element={<PrivateRoute><ProfessorProfile /></PrivateRoute>} />
        <Route path="/nova-ata/:id" element={<PrivateRoute><NovaAta /></PrivateRoute>} />
        <Route path="/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />

        {/* Redirecionamento Padrão de Segurança */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;