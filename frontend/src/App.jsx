import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import { useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/auth/AuthPage";
import WorkspacePage from "./pages/ai-workspace/AIWorkspacePage";
import HistoryPage from "./pages/history/HistoryPage";
import GardenPage from "./pages/garden/GardenPage";

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page-loader"><span className="brand-mark">✿</span></div>;
  return user ? children : <Navigate to="/auth" replace />;
}

function PublicEntry() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page-loader"><span className="brand-mark">✿</span></div>;
  return user ? <Navigate to="/home" replace /> : <LandingPage />;
}

function RouteFallback() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return <Navigate to={user ? "/home" : "/"} replace />;
}

export default function App() {
  const location = useLocation();
  const publicExperience = location.pathname === "/" || location.pathname === "/auth";

  return (
    <div className={`app-shell ${publicExperience ? "public-experience" : "member-experience"}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<PublicEntry />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/home" element={<Protected><HomePage /></Protected>} />
          <Route path="/discover" element={<Protected><WorkspacePage /></Protected>} />
          <Route path="/garden" element={<Protected><GardenPage /></Protected>} />
          <Route path="/history" element={<Protected><HistoryPage /></Protected>} />
          <Route path="*" element={<RouteFallback />} />
        </Routes>
      </main>
      {publicExperience && <Footer />}
    </div>
  );
}
