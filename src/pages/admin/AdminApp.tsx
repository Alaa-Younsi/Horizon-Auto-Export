import { lazy, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "@/auth/AuthProvider";
import { AdminLayout } from "./AdminLayout";
import AdminLogin from "./AdminLogin";
import { AdminI18nProvider } from "./i18n/AdminI18n";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const VehicleForm = lazy(() => import("./pages/VehicleForm"));
const Inquiries = lazy(() => import("./pages/Inquiries"));
const Brands = lazy(() => import("./pages/Brands"));
const Settings = lazy(() => import("./pages/Settings"));
const Team = lazy(() => import("./pages/Team"));
const Account = lazy(() => import("./pages/Account"));

/**
 * The public site never links here — staff type /admin. The auth listener lives
 * only inside the admin, so public pages never load a session. Routes are
 * relative to /admin/* (App.tsx); the section map lives in adminSections.ts.
 */
export default function AdminApp() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Admin | Horizon Auto Export";
    return () => {
      document.title = previous;
    };
  }, []);
  return (
    <AuthProvider>
      <AdminI18nProvider>
        <Routes>
          <Route path="login" element={<AdminLogin />} />
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="vehicles/new" element={<VehicleForm />} />
            <Route path="vehicles/:id" element={<VehicleForm />} />
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="brands" element={<Brands />} />
            <Route path="settings" element={<Settings />} />
            <Route path="team" element={<Team />} />
            <Route path="account" element={<Account />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </AdminI18nProvider>
    </AuthProvider>
  );
}
