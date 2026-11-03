import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "ekart-scroll-positions";

function readPositions() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function ScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const key = location.key;

    const savePosition = () => {
      const positions = readPositions();
      positions[key] = window.scrollY;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    };

    window.addEventListener("scroll", savePosition, { passive: true });

    // Save the latest position when leaving this route.
    return () => {
      savePosition();
      window.removeEventListener("scroll", savePosition);
    };
  }, [location.key]);

  useLayoutEffect(() => {
    const key = location.key;
    const positions = readPositions();

    if (navigationType === "POP") {
      const savedY = positions[key] ?? 0;

      // Retry briefly in case product cards are still rendering.
      const timers = [0, 100, 300, 600].map((delay) =>
        setTimeout(() => {
          window.scrollTo({
            top: savedY,
            left: 0,
            behavior: "instant",
          });
        }, delay),
      );

      return () => timers.forEach(clearTimeout);
    }

    // New navigation: open the new page at the top.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.key, navigationType]);

  return null;
}
