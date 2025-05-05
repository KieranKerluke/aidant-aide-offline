import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { GoogleAuth } from '@/components/GoogleAuth';
import { isAuthenticated } from '@/lib/auth';
import Patients from '@/pages/Patients';
import SessionReports from '@/pages/SessionReports';
import Tasks from '@/pages/Tasks';
import { useEffect, useState } from 'react';

function App() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = isAuthenticated();
        setIsAuth(authStatus);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuth(false);
      } finally {
        setIsAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuth) {
    return <GoogleAuth />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout title="PairAidant">
            <Routes>
              <Route index element={<Patients />} />
              <Route path="sessions/:id/reports" element={<SessionReports />} />
              <Route path="tasks" element={<Tasks />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
