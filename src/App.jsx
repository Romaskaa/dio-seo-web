import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./auth/login";
import ContentGenerationPage from "./pages/GenerateContent";
import InvitationsPage from "./auth/invitations";
import PromotionPage from "./pages/PromotionPage";
import { MainLayout, AuthLayout } from "./components/layout/layout";
import InviteAcceptPage from "./auth/registration";
import authHeader from "./auth/authHeader";
const App = () => {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/seo" element={<PromotionPage />} />
          <Route path="/generate/content" element={<ContentGenerationPage />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/invitations" element={<InvitationsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/invite/accept" element={<InviteAcceptPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/seo" replace />} />
      </Routes>
    </>
  );
};

export default App;
