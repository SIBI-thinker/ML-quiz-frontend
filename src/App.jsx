import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StudentRoute, AdminRoute } from './components/ProtectedRoute';

// Student Pages
import Register from './pages/student/Register';
import Instructions from './pages/student/Instructions';
import Quiz from './pages/student/Quiz';
import Result from './pages/student/Result';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Questions from './pages/admin/Questions';
import AdminResults from './pages/admin/Results';

// Public Pages
import Ranks from './pages/public/Ranks';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home redirects to student register */}
        <Route path="/" element={<Navigate to="/student" replace />} />

        {/* Student Routes */}
        <Route path="/student" element={<Register />} />
        <Route path="/student/instructions" element={<StudentRoute><Instructions /></StudentRoute>} />
        <Route path="/student/quiz" element={<StudentRoute><Quiz /></StudentRoute>} />
        <Route path="/student/result" element={<StudentRoute><Result /></StudentRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/questions" element={<AdminRoute><Questions /></AdminRoute>} />
        <Route path="/admin/results" element={<AdminRoute><AdminResults /></AdminRoute>} />

        {/* Public */}
        <Route path="/ranks" element={<Ranks />} />

        {/* 404 → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
