import { useState, useEffect, useCallback } from "react";

function Lightbox({ items, startIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goNext();
      if (e.key === "ArrowRight") goPrev();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  if (!items || items.length === 0) return null;

  const item = items[currentIndex];
  const isVideo = item.type === "video";

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} type="button">
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
      </button>

      {items.length > 1 && (
        <button className="lightbox-nav" style={{ left: 20 }} onClick={(e) => { e.stopPropagation(); goPrev(); }} type="button">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>chevron_right</span>
        </button>
      )}

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video src={item.src} controls autoPlay playsInline style={{ maxWidth: "90vw", maxHeight: "80vh" }} />
        ) : (
          <img src={item.src} alt={item.alt || ""} />
        )}
      </div>

      {items.length > 1 && (
        <button className="lightbox-nav" style={{ right: 20 }} onClick={(e) => { e.stopPropagation(); goNext(); }} type="button">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>chevron_left</span>
        </button>
      )}

      {items.length > 1 && (
        <div className="lightbox-thumb-bar">
          {items.map((it, i) => (
            <img
              key={i}
              src={it.type === "video" ? (it.poster || it.src) : it.src}
              alt=""
              className={`lightbox-thumb ${i === currentIndex ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
            />
          ))}
        </div>
      )}

      {items.length > 1 && (
        <div className="lightbox-counter">
          {currentIndex + 1} / {items.length}
        </div>
      )}
    </div>
  );
}

export default Lightbox;
