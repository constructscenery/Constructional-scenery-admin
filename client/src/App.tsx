import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";

import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Hero } from "@/pages/Hero";
import { Logos } from "@/pages/Logos";
import { About } from "@/pages/About";
import { Services } from "@/pages/Services";
import { Projects } from "@/pages/Projects/index";
import { CaseStudyForm } from "@/pages/Projects/CaseStudyForm";
import { Process } from "@/pages/Process";
import { Testimonials } from "@/pages/Testimonials";
import { Sustainability } from "@/pages/Sustainability";
import { Contact } from "@/pages/Contact";
import { Footer } from "@/pages/Footer";
import { Bio } from "@/pages/Bio";
import { MediaLibrary } from "@/pages/MediaLibrary";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/hero" element={<Hero />} />
              <Route path="/logos" element={<Logos />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />

              {/* ── Projects + case studies (merged) ────────────────────── */}
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId/case-study" element={<CaseStudyForm />} />

              {/* Legacy /worlds routes → redirect so old bookmarks still work */}
              <Route path="/worlds" element={<Navigate to="/projects" replace />} />
              <Route path="/worlds/new" element={<Navigate to="/projects" replace />} />
              <Route
                path="/worlds/:id/edit"
                element={<Navigate to="/projects" replace />}
              />

              <Route path="/process" element={<Process />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/sustainability" element={<Sustainability />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/footer" element={<Footer />} />
              <Route path="/bio" element={<Bio />} />
              <Route path="/media" element={<MediaLibrary />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="bottom-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
