import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ProfessorProfile from './pages/ProfessorProfile';
import NovaAta from './pages/NovaAta';
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login';

// Componente para proteger as rotas
function PrivateRoute({ children }) {
  const token = localStorage.getItem('@AtasApp:token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/professor/:id" element={<PrivateRoute><ProfessorProfile /></PrivateRoute>} />
        <Route path="/nova-ata/:id" element={<PrivateRoute><NovaAta /></PrivateRoute>} />
        <Route path="/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;