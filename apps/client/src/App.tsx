// ============================================
// App — Root component with router
// ============================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSocketEvents } from '@/hooks/useSocket';
import { useTheme } from '@/hooks/useTheme';
import HomePage from '@/pages/HomePage';
import LobbyPage from '@/pages/LobbyPage';
import GamePage from '@/pages/GamePage';
import WinnerPage from '@/pages/WinnerPage';

function AppContent() {
  // Initialize socket event listeners
  useSocketEvents();
  // Initialize theme
  useTheme();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/room/:code" element={<LobbyPage />} />
      <Route path="/join/:code" element={<HomePage />} />
      <Route path="/game/:code" element={<GamePage />} />
      <Route path="/winner/:code" element={<WinnerPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
