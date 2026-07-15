import React, { useEffect, useRef, useState } from "react";

// ============================================================================
// CONFIGURACIÓN DIRECTA DE GOOGLE ADSENSE
// ============================================================================
// Si prefieres no usar variables de entorno, puedes colocar tu ID de editor de 
// Google AdSense directamente aquí (ejemplo: "ca-pub-1234567890123456").
// Si dejas esta constante vacía, el componente intentará leer la variable
// VITE_ADSENSE_CLIENT_ID de la configuración de AI Studio.
export const DIRECT_ADSENSE_CLIENT_ID = ""; 
// ============================================================================

interface AdSenseBannerProps {
  slot?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  responsive?: "true" | "false";
  style?: React.CSSProperties;
  className?: string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slot,
  format = "auto",
  responsive = "true",
  style,
  className = "",
}) => {
  const [clientId, setClientId] = useState<string>(() => {
    return (
      localStorage.getItem("adsense_publisher_id") ||
      DIRECT_ADSENSE_CLIENT_ID ||
      (import.meta as any).env?.VITE_ADSENSE_CLIENT_ID ||
      ""
    );
  });
  const [hasError, setHasError] = useState(false);
  const [isUnfilled, setIsUnfilled] = useState(false);
  const initialized = useRef(false);
  const insRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleUpdate = () => {
      const updatedId = 
        localStorage.getItem("adsense_publisher_id") ||
        DIRECT_ADSENSE_CLIENT_ID ||
        (import.meta as any).env?.VITE_ADSENSE_CLIENT_ID ||
        "";
      setClientId(updatedId);
      // Reset initialization status if the publisher ID changes
      initialized.current = false;
      setIsUnfilled(false);
      setHasError(false);
    };

    window.addEventListener("adsense-client-id-changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("adsense-client-id-changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    // If no client ID is provided, we don't try to load AdSense script
    if (!clientId) return;

    // Load AdSense script if not already present
    const scriptId = "adsbygoogle-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onerror = () => {
        setHasError(true);
      };
      document.head.appendChild(script);
    } else {
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      const prevOnError = script.onerror;
      script.onerror = (ev) => {
        if (prevOnError) (prevOnError as any)(ev);
        setHasError(true);
      };
    }

    // Set up MutationObserver to detect if the ad is "unfilled"
    const insElement = insRef.current;
    let observer: MutationObserver | null = null;
    if (insElement) {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes" && mutation.attributeName === "data-ad-status") {
            const status = insElement.getAttribute("data-ad-status");
            if (status === "unfilled") {
              setIsUnfilled(true);
            }
          }
        });
      });
      observer.observe(insElement, { attributes: true });
    }

    let checkInterval: any;
    let attempts = 0;

    const tryPush = () => {
      attempts++;
      const currentIns = insRef.current;
      
      // Wait until the browser layout has calculated a positive, visible width
      // This perfectly prevents the "No slot size for availableWidth=0" error
      if (currentIns && currentIns.offsetWidth > 0) {
        try {
          if (!initialized.current) {
            const windowWithAds = window as any;
            windowWithAds.adsbygoogle = windowWithAds.adsbygoogle || [];
            windowWithAds.adsbygoogle.push({});
            initialized.current = true;
          }
        } catch (err) {
          console.warn("AdSense push error:", err);
          setHasError(true);
        }
      } else if (attempts < 25) {
        // Retry every 150ms for up to ~3.75s to allow UI animations/layout to complete
        checkInterval = setTimeout(tryPush, 150);
      } else {
        console.warn("AdSense slot width was still 0 after multiple checks. Giving up to prevent error.");
      }
    };

    tryPush();

    // Liveness check: If after 3.5 seconds there is no iframe or children inside <ins>,
    // collapse the component to avoid leaving an empty white space.
    const livenessTimeout = setTimeout(() => {
      const currentIns = insRef.current;
      if (currentIns) {
        const hasIframe = currentIns.querySelector("iframe") !== null;
        const hasChildren = currentIns.children.length > 0;
        if (!hasIframe && !hasChildren) {
          setIsUnfilled(true);
        }
      }
    }, 3500);

    return () => {
      if (checkInterval) clearTimeout(checkInterval);
      clearTimeout(livenessTimeout);
      if (observer) observer.disconnect();
    };
  }, [clientId]);

  // Setup sensible default style. We remove fixed minimum dimensions so that the component collapses to 0 height if unfilled, preventing any empty blank spaces.
  const getContainerStyle = (): React.CSSProperties => {
    return {
      display: "block",
      overflow: "hidden",
      width: "100%",
    };
  };

  const combinedStyle = {
    ...getContainerStyle(),
    ...style,
  };

  // If there's no client ID configured, or if there is an error/unfilled state, return null to avoid taking up any space
  if (!clientId || hasError || isUnfilled) {
    return null;
  }

  return (
    <div className={`adsense-container w-full overflow-hidden ${className}`} style={combinedStyle}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client={clientId}
        data-ad-slot={slot || "default-slot"}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};
