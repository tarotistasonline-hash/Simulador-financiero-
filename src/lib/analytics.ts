import mixpanel from "mixpanel-browser";

// Constant to allow direct coding of the token if they want
export const DIRECT_MIXPANEL_TOKEN = "";

const getMixpanelToken = (): string => {
  return (
    localStorage.getItem("mixpanel_project_token") ||
    DIRECT_MIXPANEL_TOKEN ||
    (import.meta as any).env?.VITE_MIXPANEL_TOKEN ||
    ""
  );
};

let isInitialized = false;

export const initMixpanel = () => {
  const token = getMixpanelToken();
  if (!token) {
    console.log(
      "%c[Mixpanel] No se detectó Token de Proyecto. Iniciando en modo de depuración/consola.",
      "color: #a855f7; font-weight: bold;"
    );
    isInitialized = false;
    return;
  }

  try {
    mixpanel.init(token, {
      debug: true, // Display console logs during interaction
      track_pageview: true,
      persistence: "localStorage",
    });
    isInitialized = true;
    console.log(
      `%c[Mixpanel] Inicializado con éxito con el token: ${token.substring(0, 6)}...`,
      "color: #10b981; font-weight: bold;"
    );
  } catch (error) {
    console.error("[Mixpanel] Error al inicializar:", error);
    isInitialized = false;
  }
};

/**
 * Tracks an event in Mixpanel. Falls back to styled console logs if not configured.
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  const token = getMixpanelToken();
  const currentProps = {
    ...properties,
    url: window.location.href,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
  };

  if (token && isInitialized) {
    try {
      mixpanel.track(eventName, currentProps);
    } catch (error) {
      console.warn("[Mixpanel] Error al registrar evento real:", error);
    }
  }

  // Always log to console in development mode so user can see it's working
  console.log(
    `%c[Mixpanel Evento] ${eventName}`,
    "color: #d946ef; font-weight: bold; background: rgba(217, 70, 239, 0.1); padding: 2px 6px; border-radius: 4px;",
    currentProps
  );
};

// Listen to custom event for dynamic re-initialization from the UI
if (typeof window !== "undefined") {
  window.addEventListener("mixpanel-token-changed", () => {
    initMixpanel();
  });
}
