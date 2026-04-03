import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './features/auth/Login';
import Lending from './features/lending/Lending';
import LendingCreate from './features/lending/LendingCreate';
import Locator from './features/locator/Locator';
import ReFind from './features/refind/ReFind';
import Profile from './features/profile/Profile';
import Chat from './features/chat/Chat';
import './App.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/lending" /> : <Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="lending" element={<Lending />} />
          <Route path="lending/create" element={<LendingCreate />} />
          <Route path="locator" element={<Locator />} />
          <Route path="refind" element={<ReFind />} />
          <Route path="chat/:chatId" element={<Chat />} />
          <Route path="profile" element={<Profile />} />
          <Route index element={<Navigate to="lending" />} />
        </Route>
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

