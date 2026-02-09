import { BrowserRouter } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './components/login/AuthContext';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
