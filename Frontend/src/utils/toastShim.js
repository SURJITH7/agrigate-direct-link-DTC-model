// Lightweight shim for toast notifications.
// If `react-toastify` isn't installed, this provides a graceful fallback.
const toast = {
  success: (msg) => {
    try {
      // Try to use a non-blocking UI snackbar if present
      if (typeof window !== "undefined" && window.dispatchEvent) {
        // custom event could be handled by a global snackbar component
        window.dispatchEvent(
          new CustomEvent("app-toast", {
            detail: { type: "success", message: msg },
          })
        );
      }
    } catch (e) {
      /* ignore */
    }
    // Fallback to console.log and alert for visibility during development
    console.log("[toast success]", msg);
    // Use small non-blocking notification where possible; alert as last resort
    if (typeof document !== "undefined") {
      const el = document.createElement("div");
      el.style.position = "fixed";
      el.style.bottom = "16px";
      el.style.right = "16px";
      el.style.background = "rgba(40,167,69,0.95)";
      el.style.color = "white";
      el.style.padding = "8px 12px";
      el.style.borderRadius = "6px";
      el.style.zIndex = 9999;
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => {
        el.style.transition = "opacity 300ms";
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 350);
      }, 2500);
    } else {
      // last resort
      // eslint-disable-next-line no-alert
      alert(msg);
    }
  },
  error: (msg) => {
    console.error("[toast error]", msg);
    if (typeof document !== "undefined") {
      const el = document.createElement("div");
      el.style.position = "fixed";
      el.style.bottom = "16px";
      el.style.right = "16px";
      el.style.background = "rgba(220,53,69,0.95)";
      el.style.color = "white";
      el.style.padding = "8px 12px";
      el.style.borderRadius = "6px";
      el.style.zIndex = 9999;
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => {
        el.style.transition = "opacity 300ms";
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 350);
      }, 3500);
    } else {
      // eslint-disable-next-line no-alert
      alert(msg);
    }
  },
};

export default toast;
