import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Centralized API error handling
api.interceptors.response.use(
  (response) => response,

  (error) => {
    // Server/backend is not reachable
    if (!error.response) {
      error.userMessage =
        "Unable to connect to the server. Please check your backend.";

      return Promise.reject(error);
    }

    const status = error.response.status;

    switch (status) {
      case 400:
        error.userMessage =
          error.response.data?.message ||
          "Invalid request. Please check your input.";
        break;

      case 401:
        error.userMessage =
          error.response.data?.message ||
          "Your session has expired. Please login again.";

        // IMPORTANT:
        // Do NOT redirect when the 401 comes from Login API.
        // Wrong password also returns 401.
        if (!error.config?.url?.includes("/Auth/login")) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");

          window.location.href = "/login";
        }

        break;

      case 403:
        error.userMessage =
          error.response.data?.message ||
          "You do not have permission to perform this action.";
        break;

      case 404:
        error.userMessage =
          error.response.data?.message ||
          "The requested resource was not found.";
        break;

      case 500:
        error.userMessage =
          "Something went wrong on the server. Please try again later.";
        break;

      default:
        error.userMessage =
          error.response.data?.message ||
          "Something went wrong. Please try again.";
        break;
    }

    return Promise.reject(error);
  },
);

export default api;