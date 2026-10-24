
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../../css/CustomerLogin.css";
import "../../App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

// Axios configuration for Django session authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Read a cookie from the browser
function getCookie(name) {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();

    if (trimmedCookie.startsWith(`${name}=`)) {
      return decodeURIComponent(
        trimmedCookie.substring(name.length + 1)
      );
    }
  }

  return null;
}

function AdminLogin({ setAdminLoggedIn }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Ask Django to set the CSRF cookie
      await api.get("/api/csrf-token/");

      // Step 2: Read the CSRF token
      let csrfToken = getCookie("csrftoken");

      // Fallback if the cookie is not readable by JavaScript
      if (!csrfToken) {
        const csrfResponse = await api.get("/api/csrf-token/");

        csrfToken =
          csrfResponse.data?.csrfToken ||
          csrfResponse.data?.csrftoken ||
          null;
      }

      if (!csrfToken) {
        setError(
          "CSRF token is missing. Please check your Django CSRF and CORS settings."
        );
        return;
      }

      // Step 3: Send login request with the CSRF token
      const response = await api.post(
        "/api/admin/login/",
        {
          username: username.trim(),
          password: password,
        },
        {
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );

      // Step 4: Validate the server response
      const admin = response.data?.admin;

      if (!admin || !admin.id) {
        setError("Invalid response received from the server.");
        return;
      }

      // Step 5: Store admin details for UI display
      // Django session cookie remains the authentication mechanism
      localStorage.setItem("adminDetails", JSON.stringify(admin));
      localStorage.setItem("adminLoggedIn", "true");

      // Step 6: Update React login state
      setAdminLoggedIn(true);

      // Step 7: Open the dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);

      if (err.response?.status === 403) {
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "CSRF verification failed. Please check your Django CSRF settings."
        );
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Brand */}
        <div className="text-center mb-4">
          <span className="fw-bold fs-4">
            ஊர்
            <span style={{ color: "var(--primary)" }}>
              க்காரன்
            </span>
          </span>
        </div>

        <h2 className="text-center mb-2">Admin Login</h2>

        <p className="text-center text-muted mb-4">
          Sign in to manage Oorkaran
        </p>

        {/* Error message */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label
              htmlFor="adminUsername"
              className="form-label"
            >
              Username
            </label>

            <input
              id="adminUsername"
              type="text"
              className="form-control"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="adminPassword"
              className="form-label"
            >
              Password
            </label>

            <input
              id="adminPassword"
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-warning w-100 fw-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                ></span>
                Signing in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <button
            type="button"
            className="btn btn-link text-decoration-none"
            onClick={() => navigate("/")}
            disabled={isLoading}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
