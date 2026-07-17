import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

function MainLayout() {
  return (
    <div dir="rtl" className="min-vh-100 d-flex flex-column">
      <Navbar />

      <main className="flex-grow-1 mt-4 px-3 px-md-4 px-lg-5">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;
