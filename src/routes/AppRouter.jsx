import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "../components/ProtectedRoute";

const Home = lazy(() => import("../pages/common/Home"));
const Login = lazy(() => import("../pages/common/Login"));
const Register = lazy(() => import("../pages/common/Register"));
const ForgotPassword = lazy(() => import("../pages/common/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/common/ResetPassword"));
const Splash = lazy(() => import("../pages/common/Splash"));
const About = lazy(() => import("../pages/common/About"));
const Contact = lazy(() => import("../pages/common/Contact"));
const FAQ = lazy(() => import("../pages/common/FAQ"));
const Privacy = lazy(() => import("../pages/common/Privacy"));
const Terms = lazy(() => import("../pages/common/Terms"));
const SearchApartments = lazy(() => import("../pages/student/SearchApartments"));
const ApartmentDetails = lazy(() => import("../pages/student/ApartmentDetails"));
const Favorites = lazy(() => import("../pages/student/Favorites"));
const Notifications = lazy(() => import("../pages/student/Notifications"));
const Profile = lazy(() => import("../pages/student/Profile"));
const EditProfile = lazy(() => import("../pages/student/EditProfile"));
const Messages = lazy(() => import("../pages/student/Messages"));
const Settings = lazy(() => import("../pages/student/Settings"));
const StudentHome = lazy(() => import("../pages/student/StudentHome"));
const MyRequests = lazy(() => import("../pages/student/MyRequests"));
const NotFound = lazy(() => import("../pages/common/NotFound"));
const Unauthorized = lazy(() => import("../pages/common/Unauthorized"));
const Forbidden = lazy(() => import("../pages/common/Forbidden"));
const Subscriptions = lazy(() => import("../pages/common/Subscriptions"));
const Compare = lazy(() => import("../pages/common/Compare"));
const ServerError = lazy(() => import("../pages/common/ServerError"));
const PendingApproval = lazy(() => import("../pages/common/PendingApproval"));
const RejectedApproval = lazy(() => import("../pages/common/RejectedApproval"));

const OwnerLayout = lazy(() => import("../layouts/OwnerLayout"));
const OwnerDashboard = lazy(() => import("../pages/owner/Dashboard"));
const OwnerMyApartments = lazy(() => import("../pages/owner/MyApartments"));
const OwnerAddApartment = lazy(() => import("../pages/owner/AddApartment"));
const OwnerEditApartment = lazy(() => import("../pages/owner/EditApartment"));
const OwnerApartmentDetails = lazy(() => import("../pages/owner/ApartmentDetails"));
const OwnerMessages = lazy(() => import("../pages/owner/Messages"));
const OwnerProfile = lazy(() => import("../pages/owner/Profile"));
const OwnerSettings = lazy(() => import("../pages/owner/Settings"));
const OwnerViewingRequests = lazy(() => import("../pages/owner/ViewingRequests"));
const OwnerBookingRequests = lazy(() => import("../pages/owner/BookingRequests"));
const OwnerRatings = lazy(() => import("../pages/owner/OwnerRatings"));

const BrokerLayout = lazy(() => import("../layouts/BrokerLayout"));
const BrokerDashboard = lazy(() => import("../pages/broker/Dashboard"));
const BrokerAddApartment = lazy(() => import("../pages/broker/AddApartment"));
const BrokerEditApartment = lazy(() => import("../pages/broker/EditApartment"));
const BrokerApartmentDetails = lazy(() => import("../pages/broker/ApartmentDetails"));
const BrokerMyApartments = lazy(() => import("../pages/broker/MyApartments"));
const BrokerStudentRequests = lazy(() => import("../pages/broker/StudentRequests"));
const BrokerMessages = lazy(() => import("../pages/broker/Messages"));
const BrokerProfile = lazy(() => import("../pages/broker/Profile"));
const BrokerSettings = lazy(() => import("../pages/broker/Settings"));
const BrokerViewingRequests = lazy(() => import("../pages/broker/ViewingRequests"));
const BrokerBookingRequests = lazy(() => import("../pages/broker/BookingRequests"));

const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("../pages/admin/Users"));
const AdminBrokers = lazy(() => import("../pages/admin/Brokers"));
const AdminReports = lazy(() => import("../pages/admin/Reports"));
const AdminSettings = lazy(() => import("../pages/admin/Settings"));
const AdminApartments = lazy(() => import("../pages/admin/Apartments"));
const AdminVerifications = lazy(() => import("../pages/admin/Verifications"));
const AdminContactMessages = lazy(() => import("../pages/admin/ContactMessages"));
const AdminSubscriptions = lazy(() => import("../pages/admin/Subscriptions"));

function PageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: "var(--primary)", width: "2.5rem", height: "2.5rem" }} role="status" />
        <p className="text-muted small">جاري التحميل...</p>
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/apartments" element={<SearchApartments />} />
            <Route path="/student-home" element={<StudentHome />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/rejected-approval" element={<RejectedApproval />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/student/my-requests" element={<MyRequests />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/apartment/:id" element={<ApartmentDetails />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["owner"]} requireVerification />}>
            <Route element={<OwnerLayout />}>
              <Route path="/owner/dashboard" element={<OwnerDashboard />} />
              <Route path="/owner/apartments" element={<OwnerMyApartments />} />
              <Route path="/owner/add-apartment" element={<OwnerAddApartment />} />
              <Route path="/owner/edit-apartment/:id" element={<OwnerEditApartment />} />
              <Route path="/owner/apartment/:id" element={<OwnerApartmentDetails />} />
              <Route path="/owner/messages" element={<OwnerMessages />} />
              <Route path="/owner/profile" element={<OwnerProfile />} />
              <Route path="/owner/settings" element={<OwnerSettings />} />
              <Route path="/owner/viewing-requests" element={<OwnerViewingRequests />} />
              <Route path="/owner/booking-requests" element={<OwnerBookingRequests />} />
              <Route path="/owner/ratings" element={<OwnerRatings />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["broker"]} requireVerification />}>
            <Route element={<BrokerLayout />}>
              <Route path="/broker/dashboard" element={<BrokerDashboard />} />
              <Route path="/broker/add-apartment" element={<BrokerAddApartment />} />
              <Route path="/broker/edit-apartment/:id" element={<BrokerEditApartment />} />
              <Route path="/broker/apartment/:id" element={<BrokerApartmentDetails />} />
              <Route path="/broker/apartments" element={<BrokerMyApartments />} />
              <Route path="/broker/students" element={<BrokerStudentRequests />} />
              <Route path="/broker/messages" element={<BrokerMessages />} />
              <Route path="/broker/profile" element={<BrokerProfile />} />
              <Route path="/broker/settings" element={<BrokerSettings />} />
              <Route path="/broker/viewing-requests" element={<BrokerViewingRequests />} />
              <Route path="/broker/booking-requests" element={<BrokerBookingRequests />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/brokers" element={<AdminBrokers />} />
              <Route path="/admin/apartments" element={<AdminApartments />} />
              <Route path="/admin/verifications" element={<AdminVerifications />} />
              <Route path="/admin/contact" element={<AdminContactMessages />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          <Route path="/401" element={<Unauthorized />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRouter;
