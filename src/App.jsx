import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CompareProvider } from "./context/CompareContext";
import ErrorBoundary from "./components/ErrorBoundary";
import AppRouter from "./routes/AppRouter";

function App() {
  useEffect(() => {
    const saved = localStorage.getItem("sakani_font_size");
    if (saved) document.documentElement.style.fontSize = saved + "px";
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <CompareProvider>
            <AppRouter />
            <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: "12px", padding: "12px 20px", fontFamily: "'IBM Plex Sans Arabic', sans-serif", direction: "rtl" }, success: { iconTheme: { primary: "#10b981", secondary: "#fff" } }, error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } } }} />
          </CompareProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
