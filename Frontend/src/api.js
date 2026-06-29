// Minimal API helper to replace a missing axios instance.
// Exports an object with get/post/put/delete returning { data } like axios.
const BASE = import.meta.env.VITE_API_URL || "https://agrigate-backend-drsi.onrender.com";

const defaults = { baseURL: BASE };

async function request(method, url, body, options = {}) {
  const fullUrl = url.startsWith("http") ? url : `${BASE}${url}`;
  const fetchOpts = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };
  if (body !== undefined && body !== null) {
    fetchOpts.body = JSON.stringify(body);
  }

  const res = await fetch(fullUrl, fetchOpts);
  const text = await res.text().catch(() => null);
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    // non-json response
    data = text;
  }
  return {
    data,
    status: res.status,
    ok: res.ok,
    headers: res.headers,
    defaults,
  };
}

export default {
  defaults,
  get: (url, options) => request("GET", url, undefined, options),
  post: (url, body, options) => request("POST", url, body, options),
  put: (url, body, options) => request("PUT", url, body, options),
  delete: (url, body, options) => request("DELETE", url, body, options),
};
