import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 text-center">
          <span className="material-symbols-outlined text-danger d-block mb-3" style={{ fontSize: 72 }}>error</span>
          <h2 className="fw-bold mb-2">حدث خطأ غير متوقع</h2>
          <p className="text-muted mb-4">نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.</p>
          <button className="btn btn-primary rounded-3 px-4 py-2 fw-bold" onClick={() => window.location.reload()}>إعادة تحميل الصفحة</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
