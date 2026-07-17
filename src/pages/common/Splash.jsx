import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-screen d-flex flex-column align-items-center justify-content-center">
      <style>{`
        .splash-screen {
          min-height: calc(100vh - 120px);
          background: radial-gradient(circle at center, #ffffff 0%, #f4f6fc 100%);
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .splash-container {
          text-align: center;
          z-index: 2;
        }
        .splash-logo-wrapper {
          position: relative;
          display: inline-block;
          margin-bottom: 2rem;
        }
        .splash-logo-glow {
          position: absolute;
          top: -20px;
          left: -20px;
          right: -20px;
          bottom: -20px;
          background: radial-gradient(circle, rgba(107, 144, 128, 0.4) 0%, rgba(107, 144, 128, 0) 70%);
          border-radius: 50%;
          animation: logo-pulse 2s infinite ease-in-out;
        }
        .splash-logo-circle {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #8ab5a2 0%, #52796f 100%);
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 4rem;
          box-shadow: 0 15px 35px rgba(82, 121, 111, 0.25);
          position: relative;
          animation: logo-bounce 2s infinite ease-in-out;
        }
        .splash-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #2d6a4f;
          margin-bottom: 0.5rem;
          letter-spacing: -0.5px;
          animation: fade-in-up 0.8s ease-out both;
        }
        .splash-subtitle {
          font-size: 1rem;
          color: #52796f;
          font-weight: 500;
          margin-bottom: 2.5rem;
          animation: fade-in-up 0.8s ease-out 0.2s both;
        }
        .splash-loader {
          display: flex;
          justify-content: center;
          gap: 8px;
          animation: fade-in-up 0.8s ease-out 0.4s both;
        }
        .loader-dot {
          width: 10px;
          height: 10px;
          background-color: #52796f;
          border-radius: 50%;
          animation: dot-pulse 1.2s infinite ease-in-out;
        }
        .loader-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .loader-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes logo-pulse {
          0%, 100% {
            transform: scale(0.9);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
        @keyframes logo-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes dot-pulse {
          0%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>

      <div className="splash-container">
        <div className="splash-logo-wrapper">
          <div className="splash-logo-glow" />
          <div className="splash-logo-circle">
            <span className="material-symbols-rounded" style={{ fontSize: "4.5rem", fontVariationSettings: "'FILL' 1" }}>home_work</span>
          </div>
        </div>
        <h1 className="splash-title">سـكـنـي</h1>
        <p className="splash-subtitle">منصة الإسكان الطلابي الأولى بالفيوم</p>
        <div className="splash-loader">
          <div className="loader-dot" />
          <div className="loader-dot" />
          <div className="loader-dot" />
        </div>
      </div>
    </div>
  );
}

export default Splash;
