import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StudentRoute, AdminRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

// Student Pages
import Register from './pages/student/Register';
import TeamRegister from './pages/student/TeamRegister';
import Instructions from './pages/student/Instructions';
import Quiz from './pages/student/Quiz';
import Result from './pages/student/Result';
import Feedback from './pages/student/Feedback';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Questions from './pages/admin/Questions';
import AdminResults from './pages/admin/Results';
import Config from './pages/admin/Config';
import Students from './pages/admin/Students';

// Public Pages
import Home from './pages/public/Home';
import Ranks from './pages/public/Ranks';

export default function App() {
  const isRankMode = import.meta.env.VITE_APP_MODE === 'ranks_only';

  if (isRankMode) {
    return (
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Ranks />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Homepage */}
          <Route path="/" element={<Home />} />

          {/* Student Routes */}
          <Route path="/student" element={<Register />} />
          <Route path="/student/team-register" element={<TeamRegister />} />
          <Route path="/student/instructions" element={<StudentRoute><Instructions /></StudentRoute>} />
          <Route path="/student/quiz" element={<StudentRoute><Quiz /></StudentRoute>} />
          <Route path="/student/result" element={<StudentRoute><Result /></StudentRoute>} />
          <Route path="/student/feedback" element={<StudentRoute><Feedback /></StudentRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/admin/students" element={<AdminRoute><Students /></AdminRoute>} />
          <Route path="/admin/questions" element={<AdminRoute><Questions /></AdminRoute>} />
          <Route path="/admin/results" element={<AdminRoute><AdminResults /></AdminRoute>} />
          <Route path="/admin/config" element={<AdminRoute><Config /></AdminRoute>} />

          {/* Public */}
          <Route path="/ranks" element={<Ranks />} />

          {/* 404 → home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
