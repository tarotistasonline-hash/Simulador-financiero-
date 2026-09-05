/**
 * In-App Local Analytics (Mixpanel removido)
 * Registra eventos en consola y emite eventos locales si se requiere depuración.
 */

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  const payload = {
    eventName,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
  };

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `%c[Evento] ${eventName}`,
      "color: #10b981; font-weight: bold; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px;",
      payload.properties
    );
  }
};
