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
      document.head.appendChild(script);
    } else {
      // If script is already loaded but client ID is updated, update the script src or keep going
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    }

    let checkInterval: any;
    let attempts = 0;

    const tryPush = () => {
      attempts++;
      const insElement = insRef.current;
      
      // Wait until the browser layout has calculated a positive, visible width
      // This perfectly prevents the "No slot size for availableWidth=0" error
      if (insElement && insElement.offsetWidth > 0) {
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

    return () => {
      if (checkInterval) clearTimeout(checkInterval);
    };
  }, [clientId]);

  // Setup sensible default minimum dimensions depending on format to facilitate non-zero layout sizes
  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: "block",
      overflow: "hidden",
    };
    if (format === "vertical") {
      return { ...baseStyle, minWidth: "120px", minHeight: "250px" };
    }
    if (format === "horizontal") {
      return { ...baseStyle, minWidth: "250px", minHeight: "90px" };
    }
    if (format === "rectangle") {
      return { ...baseStyle, minWidth: "250px", minHeight: "250px" };
    }
    return { ...baseStyle, minWidth: "250px", minHeight: "50px" };
  };

  const combinedStyle = {
    ...getContainerStyle(),
    ...style,
  };

  // If there's no client ID configured, render a premium elegant placeholder in development/demo mode
  if (!clientId) {
    return (
      <div 
        className={`bg-zinc-950/60 border border-dashed border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-center transition min-h-[100px] select-none ${className}`}
        style={style}
      >
        <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 animate-pulse" />
          <span>Espacio Publicitario Google AdSense</span>
        </div>
        <p className="text-[10px] text-zinc-400 max-w-md">
          Para activar los anuncios reales, puedes ingresar tu ID de editor (ej. <code className="text-amber-400 font-mono">ca-pub-XXXXXXXXXXXXXXXX</code>) en la constante <code className="text-indigo-400 font-mono">DIRECT_ADSENSE_CLIENT_ID</code> dentro del archivo de este componente, o pegarlo en el panel de Secrets como <code className="text-amber-400 font-mono">VITE_ADSENSE_CLIENT_ID</code>. ¡También puedes pasármelo por el chat y yo lo coloco por vos!
        </p>
        {slot && (
          <span className="mt-1.5 text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
            Ad Slot ID: {slot} • Format: {format}
          </span>
        )}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center p-2 text-xs text-zinc-500 italic">
        Anuncio de AdSense (bloqueado o no disponible)
      </div>
    );
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
