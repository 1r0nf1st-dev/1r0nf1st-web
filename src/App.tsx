import type { JSX } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './components/ProjectsPage';
import { GoalTrackerPage } from './pages/GoalTrackerPage';
import { WeatherPage } from './pages/WeatherPage';
import { HealthTrackerPage } from './pages/HealthTrackerPage';
import { CloudInfrastructurePage } from './pages/CloudInfrastructurePage';
import { FeaturedShowcasePage } from './pages/FeaturedShowcasePage';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const App = (): JSX.Element => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/goal-tracker" element={<GoalTrackerPage />} />
      <Route path="/projects/weather" element={<WeatherPage />} />
      <Route path="/projects/health-tracker" element={<HealthTrackerPage />} />
      <Route path="/projects/cloud" element={<CloudInfrastructurePage />} />
      <Route path="/projects/showcase" element={<FeaturedShowcasePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
