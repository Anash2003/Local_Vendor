
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie
    ? decodeURIComponent(cookie.substring(name.length + 1))
    : null;
}

export async function prepareCsrfToken() {
  let token = getCookie("csrftoken");

  if (!token) {
    await api.get("/api/csrf-token/");
    token = getCookie("csrftoken");
  }

  if (!token) {
    throw new Error(
      "CSRF cookie is missing. Check Django CSRF settings and browser cookies."
    );
  }

  return token;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toLowerCase();

  if (["post", "put", "patch", "delete"].includes(method)) {
    const token = await prepareCsrfToken();
    config.headers["X-CSRFToken"] = token;
  }

  return config;
});

export default api;
