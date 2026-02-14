import { Navigate } from 'react-router-dom';

export function StudentRoute({ children }) {
    const token = localStorage.getItem('student_token');
    return token ? children : <Navigate to="/student" replace />;
}

export function AdminRoute({ children }) {
    const token = localStorage.getItem('admin_token');
    return token ? children : <Navigate to="/admin/login" replace />;
}
