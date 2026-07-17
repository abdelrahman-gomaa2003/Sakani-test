import "./Skeleton.css";

function SkeletonCard({ className = "" }) {
  return (
    <div className={`skeleton-card rounded-4 overflow-hidden ${className}`}>
      <div className="skeleton-image" />
      <div className="p-3">
        <div className="skeleton-line skeleton-line-title" />
        <div className="skeleton-line skeleton-line-subtitle" />
        <div className="skeleton-line skeleton-line-short mt-3" />
      </div>
    </div>
  );
}

function SkeletonList({ count = 4, className = "" }) {
  return (
    <div className={`d-flex flex-column gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="d-flex align-items-center gap-3 p-3 rounded-3 bg-white">
          <div className="skeleton-avatar flex-shrink-0" />
          <div className="flex-grow-1">
            <div className="skeleton-line skeleton-line-title mb-2" />
            <div className="skeleton-line skeleton-line-subtitle" />
          </div>
          <div className="skeleton-line skeleton-line-short" style={{ width: 60 }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonStats({ count = 4, className = "" }) {
  return (
    <div className={`row g-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-12 col-sm-6 col-lg-3">
          <div className="bg-white rounded-4 p-4 h-100 skeleton-card" style={{ boxShadow: "0 4px 20px rgba(107,144,128,0.06)" }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="skeleton-icon rounded-3" />
            </div>
            <div className="skeleton-line skeleton-line-subtitle mb-2" />
            <div className="skeleton-line skeleton-line-title" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`d-flex flex-column gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton-line ${i === lines - 1 ? "skeleton-line-short" : ""}`} />
      ))}
    </div>
  );
}

function SkeletonImage({ height = 200, className = "" }) {
  return <div className={`skeleton-image rounded-4 ${className}`} style={{ height }} />;
}

export { SkeletonCard, SkeletonList, SkeletonStats, SkeletonText, SkeletonImage };
