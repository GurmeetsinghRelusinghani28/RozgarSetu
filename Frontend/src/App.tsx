import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import SplashScreen from "./pages/SplashScreen";
import LanguageSelection from "./pages/LanguageSelection";
import UserTypeSelection from "./pages/UserTypeSelection";
import WorkerLogin from "./pages/WorkerLogin";
import WorkerProfile from "./pages/WorkerProfile";
import WorkerDashboard from "./pages/WorkerDashboard";
import WorkerProfileView from "./pages/WorkerProfileView";
import JobListing from "./pages/JobListing";
import RozgarMitra from "./pages/RozgarMitra";
import ContractorLogin from "./pages/ContractorLogin";
import ContractorDashboard from "./pages/ContractorDashboard";
import ContractorReview from "./pages/ContractorReview";
import ContractorProjects from "./pages/ContractorProjects";
import ContractorProjectApplicants from "./pages/ContractorProjectApplicants";
import ContractorWorkers from "./pages/ContractorWorkers";
import ContractorProfile from "./pages/ContractorProfile";
import CreateProject from "./pages/CreateProject";
import SkillTips from "./pages/SkillTips";
import EarningsTracker from "./pages/EarningsTracker";
import HelpCenter from "./pages/HelpCenter";
import WorkerApplications from "./pages/WorkerApplications";
import NotFound from "./pages/NotFound";

import ChatScreen from "./pages/ChatScreen";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/language" element={<LanguageSelection />} />
            <Route path="/user-type" element={<UserTypeSelection />} />
            <Route path="/worker-login" element={<WorkerLogin />} />
            <Route path="/worker-profile" element={<WorkerProfile />} />
            <Route path="/worker-dashboard" element={<WorkerDashboard />} />
            <Route path="/worker-profile-view" element={<WorkerProfileView />} />
            <Route path="/worker-profile/:workerId" element={<WorkerProfileView />} />
            <Route path="/jobs" element={<JobListing />} />
            <Route path="/rozgar-mitra" element={<RozgarMitra />} />
            <Route path="/contractor-login" element={<ContractorLogin />} />
            <Route path="/contractor-dashboard" element={<ContractorDashboard />} />
            <Route path="/contractor-projects" element={<ContractorProjects />} />
            <Route path="/contractor-projects/:projectId/applicants" element={<ContractorProjectApplicants />} />
            <Route path="/contractor-workers" element={<ContractorWorkers />} />
            <Route path="/contractor-profile" element={<ContractorProfile />} />
            <Route path="/contractor-review" element={<ContractorReview />} />
            <Route path="/create-project" element={<CreateProject />} />
            <Route path="/skill-tips" element={<SkillTips />} />
            <Route path="/earnings" element={<EarningsTracker />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/worker-applications" element={<WorkerApplications />} />
            <Route path="/chat/:jobId/:workerId" element={<ChatScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>

      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
