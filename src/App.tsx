import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { GoogleAuth } from '@/components/GoogleAuth';
import { isAuthenticated } from '@/lib/auth';
import Patients from '@/pages/Patients';
import SessionReports from '@/pages/SessionReports';
import Tasks from '@/pages/Tasks';

function App() {
  if (!isAuthenticated()) {
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
