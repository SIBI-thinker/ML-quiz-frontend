import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getQuizConfig } from '../api/quizConfig';

export default function Layout({ children }) {
    const location = useLocation();

    // Update document title from config
    useEffect(() => {
        getQuizConfig().then(config => {
            if (config?.quiz_title) {
                document.title = config.quiz_title;
            }
        });
    }, [location.pathname]);

    return <>{children}</>;
}
