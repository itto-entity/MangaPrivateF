const supportsServiceWorker = "serviceWorker" in navigator;
const isSecureContext = window.isSecureContext || ["localhost", "127.0.0.1"].includes(window.location.hostname);

if (supportsServiceWorker && isSecureContext) {
  const appRoot = new URL("../", import.meta.url);
  const workerUrl = new URL("../sw.js", import.meta.url);

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(workerUrl, { scope: appRoot.pathname }).catch((error) => {
      console.warn("Service worker tidak dapat didaftarkan.", error);
    });
  });
}
