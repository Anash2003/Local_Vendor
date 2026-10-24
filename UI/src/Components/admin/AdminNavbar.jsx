
import { useState } from "react";
import "./AdminNavbar.css";

function AdminNavbar({ username = "Admin", onMenuClick, onLogout }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    onLogout?.();
  };

  return (
    <>
      <header className="admin-navbar">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="admin-menu-button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <i className="bi bi-list" />
          </button>

          <div>
            <h1 className="admin-navbar-title">Admin Panel</h1>
            <p className="admin-navbar-subtitle mb-0">
              Manage your Oorkaran platform
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              <i className="bi bi-person-fill" />
            </div>
            <span className="admin-username">{username}</span>
          </div>

          <button
            type="button"
            className="btn admin-logout-button"
            onClick={() => setShowLogoutModal(true)}
          >
            <i className="bi bi-box-arrow-right me-2" />
            Logout
          </button>
        </div>
      </header>

      {showLogoutModal && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowLogoutModal(false);
            }
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered admin-logout-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-logout-title"
          >
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title fs-5" id="admin-logout-title">
                  Confirm logout
                </h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowLogoutModal(false)}
                />
              </div>

              <div className="modal-body">
                Are you sure you want to log out of the admin panel?
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Stay logged in
                </button>
                <button
                  type="button"
                  className="btn admin-confirm-logout"
                  onClick={confirmLogout}
                >
                  Yes, log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminNavbar;
