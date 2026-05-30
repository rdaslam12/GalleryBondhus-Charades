import { useEffect } from "react";

export default function useVisualViewportSize() {
  useEffect(() => {
    const updateSize = () => {
      const width = window.visualViewport?.width ?? window.innerWidth;
      const height = window.visualViewport?.height ?? window.innerHeight;
      
      document.documentElement.style.setProperty("--vvw", `${width}px`);
      document.documentElement.style.setProperty("--vvh", `${height}px`);
    };

    updateSize();

    window.addEventListener("resize", updateSize);
    window.addEventListener("orientationchange", updateSize);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateSize);
      window.visualViewport.addEventListener("scroll", updateSize);
    }

    return () => {
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("orientationchange", updateSize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateSize);
        window.visualViewport.removeEventListener("scroll", updateSize);
      }
    };
  }, []);
}
