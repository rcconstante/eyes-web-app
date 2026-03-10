import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './hooks/useSettings';
import { AppStateProvider } from './hooks/useAppState';
import SplashPage from './pages/SplashPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AppStateProvider>
          <div className="max-w-md mx-auto min-h-screen bg-black">
            <Routes>
              <Route path="/" element={<SplashPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </div>
        </AppStateProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;
