
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminProfile from "../../Components/admin/AdminProfile";
import VendorVerification from "../../Components/admin/VendorVerification";
import BookingManagement from "./BookingManagement";
import CustomerManagement from "../../Components/admin/CustomerManagement";
import CategoriesServices from "../../pages/admin/CategoriesServices";
import RatingsReviews from "./RatingsReviews";
import AddAdmin from "../../pages/admin/AddAdmin";

const API_BASE_URL = "./api";

const INITIAL_STATS = {
  total_vendors: 0,
  total_bookings: 0,
  pending_vendors: 0,
  total_customers: 0,
};

// Read a cookie from the browser.
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

  return "";
}

// Obtain a CSRF token using the existing Django endpoint.
async function getCsrfToken() {
  let csrfToken = getCookie("csrftoken");

  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/csrf-token/`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    // The response may not contain JSON.
  }

  if (!response.ok) {
    throw new Error(
      `Unable to initialize CSRF protection (${response.status}).`
    );
  }

  csrfToken =
    getCookie("csrftoken") ||
    data?.csrfToken ||
    data?.csrf_token ||
    data?.token ||
    "";

  if (!csrfToken) {
    throw new Error(
      "CSRF token is missing. Check your Django CSRF endpoint and cookie settings."
    );
  }

  return csrfToken;
}

function AdminDashboard({ setAdminLoggedIn }) {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(INITIAL_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [activeModule, setActiveModule] = useState("Dashboard");

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [showAdminProfile, setShowAdminProfile] = useState(false);

  // Verify the real Django session or custom-admin session.
  useEffect(() => {
    const controller = new AbortController();

    async function verifyAdminSession() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/profile/`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("adminDetails");
          localStorage.removeItem("adminLoggedIn");

          if (typeof setAdminLoggedIn === "function") {
            setAdminLoggedIn(false);
          }

          navigate("/admin/login", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Unable to verify admin session (${response.status}).`
          );
        }

        const adminDetails = await response.json();

        if (
          !adminDetails?.id ||
          !adminDetails.is_active ||
          !["django", "custom"].includes(
            adminDetails.account_type
          )
        ) {
          throw new Error(
            "This account does not have valid admin access."
          );
        }

        setAdmin(adminDetails);

        // Local storage is for display convenience only.
        // Django remains responsible for authentication.
        localStorage.setItem(
          "adminDetails",
          JSON.stringify(adminDetails)
        );

        localStorage.setItem("adminLoggedIn", "true");

        if (typeof setAdminLoggedIn === "function") {
          setAdminLoggedIn(true);
        }
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Admin session verification error:", error);

        setStatsError(
          error.message || "Unable to verify your admin session."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    verifyAdminSession();

    return () => controller.abort();
  }, [navigate, setAdminLoggedIn]);

  // Reusable statistics function.
  const fetchDashboardStats = useCallback(async (signal) => {
    setStatsLoading(true);
    setStatsError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/dashboard-stats/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          ...(signal ? { signal } : {}),
        }
      );

      if (!response.ok) {
        let errorMessage =
          `Statistics request failed (${response.status}).`;

        try {
          const errorData = await response.json();

          if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // Keep the original error message.
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      const requiredFields = [
        "total_vendors",
        "total_bookings",
        "pending_vendors",
        "total_customers",
      ];

      const invalidFields = requiredFields.filter(
        (field) =>
          !Object.prototype.hasOwnProperty.call(data, field) ||
          !Number.isFinite(Number(data[field])) ||
          Number(data[field]) < 0
      );

      if (invalidFields.length > 0) {
        throw new Error(
          `Invalid statistics fields: ${invalidFields.join(", ")}.`
        );
      }

      setStats({
        total_vendors: Number(data.total_vendors),
        total_bookings: Number(data.total_bookings),
        pending_vendors: Number(data.pending_vendors),
        total_customers: Number(data.total_customers),
      });
    } catch (error) {
      if (error.name === "AbortError") return;

      console.error("Dashboard statistics error:", error);

      setStatsError(
        error.message || "Unable to load dashboard statistics."
      );
    } finally {
      if (!signal?.aborted) {
        setStatsLoading(false);
      }
    }
  }, []);

  // Load dashboard statistics after session verification.
  useEffect(() => {
    if (!admin) return;

    const controller = new AbortController();

    fetchDashboardStats(controller.signal);

    return () => controller.abort();
  }, [admin, fetchDashboardStats]);

  const adminRole = admin?.is_superuser
    ? "Super Admin"
    : "Admin";

  // Support both nested permissions and top-level permission fields.
  // This helps match the response returned by the Django profile view.
  function getAdminPermissions() {
    return admin?.permissions || admin || {};
  }

  // Super Admin has full access.
  // Custom admins receive access based on Django-provided permissions.
  function hasModuleAccess(moduleTitle) {
    if (
      admin?.account_type === "django" &&
      admin?.is_superuser === true
    ) {
      return true;
    }

    const permissions = getAdminPermissions();

    switch (moduleTitle) {
      case "Vendor Verification":
        return permissions.manage_vendors === true;

      case "Booking Management":
        return permissions.manage_bookings === true;

      case "Customer Management":
        return permissions.manage_customers === true;

      case "Categories & Services":
        return (
          permissions.manage_categories === true ||
          permissions.manage_services === true
        );

      case "Ratings & Reviews":
        return permissions.manage_reviews === true;

      case "Add Admin":
        return permissions.can_manage_admins === true;

      default:
        return moduleTitle === "Dashboard";
    }
  }

  // Update the dashboard after the profile is saved.
  function handleProfileUpdated(updatedProfile) {
    setAdmin((previous) => {
      if (!previous) return previous;

      const updatedAdmin = {
        ...previous,
        ...updatedProfile,
      };

      localStorage.setItem(
        "adminDetails",
        JSON.stringify(updatedAdmin)
      );

      return updatedAdmin;
    });
  }

  function openAdminProfile() {
    setMessage("");
    setShowAdminProfile(true);
  }

  // Support keyboard navigation for clickable profile areas.
  function handleProfileKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAdminProfile();
    }
  }

  // Open the in-app logout confirmation.
  function openLogoutConfirmation() {
    setMessage("");
    setShowLogoutModal(true);
  }

  // Log out from the server and React UI.
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setMessage("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/logout/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        let errorMessage =
          `Unable to log out from the server (${response.status}).`;

        try {
          const data = await response.json();

          if (data?.message) {
            errorMessage = data.message;
          } else if (data?.detail) {
            errorMessage = data.detail;
          }
        } catch {
          // Keep the status-based error message.
        }

        throw new Error(errorMessage);
      }

      // Clear frontend session information only after
      // the server confirms that logout succeeded.
      localStorage.removeItem("adminDetails");
      localStorage.removeItem("adminLoggedIn");

      setAdmin(null);
      setStats(INITIAL_STATS);
      setStatsError("");
      setActiveModule("Dashboard");
      setShowLogoutModal(false);
      setShowAdminProfile(false);
      setMessage("");

      if (typeof setAdminLoggedIn === "function") {
        setAdminLoggedIn(false);
      }

      navigate("/admin/login", { replace: true });
    } catch (error) {
      console.error("Admin logout error:", error);

      setMessage(
        error.message || "Unable to log out. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  // Keep all modules visible.
  // Permission is checked when the user opens each module.
  const adminModules = [
    {
      icon: "✓",
      title: "Vendor Verification",
      description:
        "Review vendor registrations and approve or reject them.",
      label: "Vendor Admin",
    },
    {
      icon: "▣",
      title: "Booking Management",
      description:
        "View bookings and monitor their current status.",
      label: "Booking Admin",
    },
    {
      icon: "♙",
      title: "Customer Management",
      description:
        "Manage customer accounts and support requests.",
      label: "Customer Support",
    },
    {
      icon: "▤",
      title: "Categories & Services",
      description:
        "Manage the categories and services shown in Oorkaran.",
      label: "Content Admin",
    },
    {
      icon: "★",
      title: "Ratings & Reviews",
      description:
        "Review feedback submitted by customers.",
      label: "Reviews",
    },
    {
      icon: "♙",
      title: "Add Admin",
      description:
        "Create staff accounts and assign their responsibilities.",
      label: "Admin Management",
    },
  ];

  // Sidebar items and dashboard cards use the same handler.
  // Restricted modules remain visible so users can see
  // which sections exist in the dashboard.
  function showModuleMessage(moduleTitle) {
    setMessage("");
    setActiveModule(moduleTitle);
  }

  // Return to the dashboard from a management module.
  function goToDashboard() {
    setMessage("");
    setActiveModule("Dashboard");
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div
          className="spinner-border text-warning"
          role="status"
        >
          <span className="visually-hidden">
            Loading...
          </span>
        </div>

        <p className="mt-3 mb-0">
          Verifying your admin session...
        </p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="admin-loading">
        <p>
          {statsError || "Redirecting to admin login..."}
        </p>

        {statsError && (
          <button
            type="button"
            className="btn btn-warning"
            onClick={() =>
              navigate("/admin/login", { replace: true })
            }
          >
            Back to Login
          </button>
        )}
      </div>
    );
  }

  const moduleHasAccess =
    activeModule === "Dashboard" ||
    hasModuleAccess(activeModule);

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div
            className="dashboard-logo-area"
            onClick={openLogoutConfirmation}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                openLogoutConfirmation();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Oorkaran. Open logout confirmation"
          >
            <div className="brand-logo">
              <img src="/logo.png" alt="Oorkaran" />
            </div>

            <span className="fw-bold fs-4">
              ஊர்
              <span style={{ color: "var(--primary)" }}>
                க்காரன்
              </span>
            </span>
          </div>

          <small>ADMIN PANEL</small>
        </div>

        <div className="admin-sidebar-label">
          WORKSPACE
        </div>

        <button
          type="button"
          className={`admin-nav-item ${
            activeModule === "Dashboard" ? "active" : ""
          }`}
          onClick={() => showModuleMessage("Dashboard")}
        >
          <span className="admin-nav-icon">▦</span>
          Dashboard
        </button>

        <div className="admin-sidebar-label mt-4">
          MANAGEMENT
        </div>

        {adminModules.map((module) => (
          <button
            type="button"
            className={`admin-nav-item ${
              activeModule === module.title ? "active" : ""
            }`}
            key={module.title}
            onClick={() => showModuleMessage(module.title)}
            aria-current={
              activeModule === module.title ? "page" : undefined
            }
          >
            <span className="admin-nav-icon">
              {module.icon}
            </span>

            {module.title}
          </button>
        ))}

        <div className="admin-sidebar-bottom">
          <div
            className="admin-sidebar-user"
            role="button"
            tabIndex={0}
            aria-label="Open admin profile"
            onClick={openAdminProfile}
            onKeyDown={handleProfileKeyDown}
          >
            <div className="admin-avatar">
              {admin.username?.charAt(0).toUpperCase() || "A"}
            </div>

            <div className="admin-sidebar-user-info">
              <strong>
                {admin.username || "Admin"}
              </strong>

              <small>{adminRole}</small>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={openLogoutConfirmation}
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main dashboard */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-breadcrumb">
              Oorkaran /{" "}
              {activeModule === "Dashboard"
                ? "Dashboard"
                : activeModule}
            </div>

            <h1>
              {activeModule === "Dashboard"
                ? "Admin Dashboard"
                : activeModule}
            </h1>
          </div>

          <div
            className="admin-topbar-profile"
            role="button"
            tabIndex={0}
            aria-label="Open admin profile"
            onClick={openAdminProfile}
            onKeyDown={handleProfileKeyDown}
          >
            <div className="admin-profile-text">
              <strong>
                {admin.username || "Admin"}
              </strong>

              <small>{adminRole}</small>
            </div>

            <div className="admin-avatar admin-avatar-large">
              {admin.username?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Restricted-access screen */}
        {activeModule !== "Dashboard" && !moduleHasAccess ? (
          <section className="admin-section">
            <div
              className="alert alert-warning"
              role="alert"
              aria-live="polite"
            >
              <h2 className="h5">
                <span className="me-2" aria-hidden="true">
                  🔒
                </span>
                Access Restricted
              </h2>

              <p className="mb-3">
                You do not have permission to access{" "}
                <strong>{activeModule}</strong>.
                Please contact your Super Admin if you need
                access to this module.
              </p>

              <button
                type="button"
                className="btn btn-warning"
                onClick={goToDashboard}
              >
                Back to Dashboard
              </button>
            </div>
          </section>
        ) : activeModule === "Vendor Verification" ? (
          <VendorVerification
            onBack={goToDashboard}
            onStatsRefresh={fetchDashboardStats}
          />
        ) : activeModule === "Booking Management" ? (
          <BookingManagement />
        ) : activeModule === "Customer Management" ? (
          <CustomerManagement />
        ) : activeModule === "Categories & Services" ? (
          <CategoriesServices
            canManageCategories={
              hasModuleAccess("Categories & Services") &&
              getAdminPermissions().manage_categories === true
            }
            canManageServices={
              hasModuleAccess("Categories & Services") &&
              getAdminPermissions().manage_services === true
            }
          />
        ) : activeModule === "Ratings & Reviews" ? (
          <RatingsReviews />
        ) : activeModule === "Add Admin" ? (
          <AddAdmin onBack={goToDashboard} />
        ) : (
          <>
            {/* Welcome section */}
            <section className="admin-welcome">
              <div className="admin-welcome-content">
                <span className="admin-eyebrow">
                  OORKARAN ADMINISTRATION
                </span>

                <h2>
                  Welcome back, {admin.username || "Admin"}!
                </h2>

                <p>
                  Manage your local-services platform from one place.
                </p>
              </div>

              <div
                className="admin-welcome-symbol"
                aria-hidden="true"
              >
                ஊ
              </div>
            </section>

            {/* In-app messages */}
            {message && (
              <div
                className="alert alert-warning admin-message"
                role="status"
              >
                <span>{message}</span>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Dismiss message"
                  onClick={() => setMessage("")}
                />
              </div>
            )}

            {/* Statistics error */}
            {statsError && (
              <div
                className="alert alert-danger"
                role="alert"
              >
                <strong>Notice: </strong>
                {statsError}
              </div>
            )}

            {/* Platform statistics */}
            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <h2>Platform overview</h2>

                  <p>
                    {statsLoading
                      ? "Loading the latest platform statistics..."
                      : statsError
                        ? "Statistics could not be loaded."
                        : "A summary of your platform activity."}
                  </p>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="admin-stat-card">
                    <div className="admin-stat-top">
                      <span className="admin-stat-icon amber">
                        ♙
                      </span>

                      <span className="admin-stat-tag">
                        Vendors
                      </span>
                    </div>

                    <p>Total vendors</p>

                    <h3>
                      {statsLoading
                        ? "…"
                        : statsError
                          ? "—"
                          : stats.total_vendors}
                    </h3>

                    <small>Registered vendors</small>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="admin-stat-card">
                    <div className="admin-stat-top">
                      <span className="admin-stat-icon blue">
                        ▣
                      </span>

                      <span className="admin-stat-tag">
                        Bookings
                      </span>
                    </div>

                    <p>Total bookings</p>

                    <h3>
                      {statsLoading
                        ? "…"
                        : statsError
                          ? "—"
                          : stats.total_bookings}
                    </h3>

                    <small>
                      Bookings recorded in the system
                    </small>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="admin-stat-card">
                    <div className="admin-stat-top">
                      <span className="admin-stat-icon green">
                        ✓
                      </span>

                      <span className="admin-stat-tag">
                        Requests
                      </span>
                    </div>

                    <p>Pending approvals</p>

                    <h3>
                      {statsLoading
                        ? "…"
                        : statsError
                          ? "—"
                          : stats.pending_vendors}
                    </h3>

                    <small>
                      Vendors awaiting verification
                    </small>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="admin-stat-card">
                    <div className="admin-stat-top">
                      <span className="admin-stat-icon purple">
                        ♙
                      </span>

                      <span className="admin-stat-tag">
                        Customers
                      </span>
                    </div>

                    <p>Total customers</p>

                    <h3>
                      {statsLoading
                        ? "…"
                        : statsError
                          ? "—"
                          : stats.total_customers}
                    </h3>

                    <small>Registered customers</small>
                  </div>
                </div>
              </div>
            </section>

            {/* Management modules */}
            <section className="admin-section admin-modules-section">
              <div className="admin-section-heading">
                <div>
                  <h2>Management modules</h2>

                  <p>
                    Choose a module to continue managing the admin panel.
                  </p>
                </div>
              </div>

              <div className="row g-3">
                {adminModules.map((module) => (
                  <div
                    className="col-12 col-md-6 col-xl-4"
                    key={module.title}
                  >
                    <button
                      type="button"
                      className="admin-module-card"
                      onClick={() =>
                        showModuleMessage(module.title)
                      }
                    >
                      <div className="admin-module-card-top">
                        <span className="admin-module-icon">
                          {module.icon}
                        </span>

                        <span className="admin-module-arrow">
                          ↗
                        </span>
                      </div>

                      <h3>{module.title}</h3>

                      <p>{module.description}</p>

                      <span className="admin-module-label">
                        {module.label}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="admin-footer">
          <span>ஊர்க்காரன் · Admin Panel</span>
          <span>Local services, connected.</span>
        </footer>
      </main>

      {/* Admin profile popup */}
      <AdminProfile
        show={showAdminProfile}
        onClose={() => setShowAdminProfile(false)}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !loggingOut
            ) {
              setShowLogoutModal(false);
            }
          }}
        >
          <div
            className="admin-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-logout-title"
          >
            <div className="admin-modal-icon">↪</div>

            <h2 id="admin-logout-title">
              Log out of Oorkaran?
            </h2>

            <p>
              Are you sure you want to log out of the admin panel?
            </p>

            {message && (
              <div
                className="alert alert-danger"
                role="alert"
              >
                {message}
              </div>
            )}

            <div className="admin-modal-actions">
              <button
                type="button"
                className="btn admin-cancel-button"
                disabled={loggingOut}
                onClick={() => {
                  setShowLogoutModal(false);
                  setMessage("");
                }}
              >
                Stay logged in
              </button>

              <button
                type="button"
                className="btn admin-confirm-logout"
                disabled={loggingOut}
                onClick={handleLogout}
              >
                {loggingOut
                  ? "Logging out..."
                  : "Yes, log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
