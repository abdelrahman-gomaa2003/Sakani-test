import { useState, useEffect, useRef, useCallback } from "react";

function AnimatedCounter({ target, duration = 1500, prefix = "", suffix = "" }) {
  const numTarget = typeof target === "string" ? parseInt(target.replace(/[^0-9]/g, ""), 10) || 0 : (target || 0);
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);
  const targetRef = useRef(numTarget);

  const animate = useCallback(() => {
    targetRef.current = numTarget;
    startTimeRef.current = null;

    if (numTarget === 0) {
      frameRef.current = requestAnimationFrame(() => setDisplay(0));
      return;
    }

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * numTarget));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
  }, [numTarget, duration]);

  useEffect(() => {
    animate();
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [animate]);

  const formatted = display.toLocaleString("ar-EG");
  return <>{prefix}{formatted}{suffix}</>;
}

export default AnimatedCounter;
