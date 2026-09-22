// App.jsx — application shell: global styles, auth state, routes.
import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./auth/AuthContext.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LandingPage from "./landingpage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CustomizePage from "./pages/CustomizePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import StudioPage from "./pages/StudioPage.jsx";
import { LoginPage, RegisterPage } from "./pages/AuthPages.jsx";
import { AboutPage, ContactPage, NotFoundPage } from "./pages/InfoPages.jsx";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Anchor links like /#shop land on the merged home's shop section.
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/customize" element={<CustomizePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
