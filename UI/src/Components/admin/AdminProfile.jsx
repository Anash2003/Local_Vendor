import { useEffect, useState } from "react";

// Use the same host as your admin login.
const API_BASE_URL = "./api";

// Get a fresh CSRF token directly from Django.
async function getCsrfToken() {
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
    // Handle a response that is not valid JSON below.
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to obtain CSRF token from Django."
    );
  }

  const token = data.csrfToken;

  // Django's get_token(request) returns a masked CSRF token.
  if (
    typeof token !== "string" ||
    !/^[a-zA-Z0-9]{64}$/.test(token)
  ) {
    throw new Error(
      "Django returned an invalid CSRF token. Check the /api/csrf-token/ endpoint."
    );
  }

  return token;
}

// Read JSON safely so non-JSON error responses do not crash the component.
async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function AdminProfile({ show, onClose, onProfileUpdated }) {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
  });

  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      loadProfile();
    }
  }, [show]);

  async function loadProfile() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/profile/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.detail ||
            "Unable to load admin profile."
        );
      }

      const username = data.username || "";
      const email = data.email || "";

      setProfile({ username, email });
      setFormData({ username, email });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!formData.username.trim()) {
      setError("Username is required.");
      return;
    }

    setLoading(true);

    try {
      // Obtain a fresh token before the PATCH request.
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/profile/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            username: formData.username.trim(),
            email: formData.email.trim(),
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.detail ||
            "Unable to update profile."
        );
      }

      const updatedProfile = {
        username: data.username ?? formData.username.trim(),
        email: data.email ?? formData.email.trim(),
      };

      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setIsEditing(false);
      setMessage(
        data.message || "Profile updated successfully."
      );

      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSave(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      !passwordData.current_password ||
      !passwordData.new_password ||
      !passwordData.confirm_password
    ) {
      setError("Please complete all password fields.");
      return;
    }

    if (
      passwordData.new_password !==
      passwordData.confirm_password
    ) {
      setError("New passwords do not match.");
      return;
    }

    if (
      passwordData.current_password ===
      passwordData.new_password
    ) {
      setError("Choose a different password.");
      return;
    }

    setLoading(true);

    try {
      // Get the token from Django, not directly from document.cookie.
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/change-password/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            current_password: passwordData.current_password,
            new_password: passwordData.new_password,
            confirm_password: passwordData.confirm_password,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.detail ||
            "Unable to change password."
        );
      }

      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setIsChangingPassword(false);
      setMessage(
        data.message || "Password changed successfully."
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function closeProfile() {
    setMessage("");
    setError("");
    setIsEditing(false);
    setIsChangingPassword(false);
    onClose();
  }

  if (!show) {
    return null;
  }

  return (
    <div
      className="admin-profile-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeProfile();
        }
      }}
    >
      <div
        className="admin-profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-profile-title"
      >
        <div className="admin-profile-header">
          <div className="admin-profile-avatar">
            <i className="bi bi-shield-lock-fill"></i>
          </div>

          <div className="admin-profile-heading">
            <h2 id="admin-profile-title">Admin Profile</h2>
            <p>Manage your administrator account</p>
          </div>

          <button
            type="button"
            className="admin-profile-close"
            onClick={closeProfile}
            aria-label="Close profile"
          >
            &times;
          </button>
        </div>

        <div className="admin-profile-body">
          {message && (
            <div
              className="admin-profile-message success"
              role="status"
            >
              {message}
            </div>
          )}

          {error && (
            <div
              className="admin-profile-message error"
              role="alert"
            >
              {error}
            </div>
          )}

          {loading && (
            <p className="admin-profile-loading">
              Please wait...
            </p>
          )}

          {!isChangingPassword && (
            <section className="admin-profile-section">
              <div className="admin-profile-section-heading">
                <h3>Account Information</h3>

                {!isEditing && (
                  <button
                    type="button"
                    className="admin-profile-text-button"
                    onClick={() => {
                      setError("");
                      setMessage("");
                      setFormData(profile);
                      setIsEditing(true);
                    }}
                    disabled={loading}
                  >
                    <i className="bi bi-pencil-square"></i>
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileSave}>
                  <div className="admin-profile-field">
                    <label htmlFor="admin-profile-username">
                      Username
                    </label>
                    <input
                      id="admin-profile-username"
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleProfileChange}
                      required
                      autoComplete="username"
                    />
                  </div>

                  <div className="admin-profile-field">
                    <label htmlFor="admin-profile-email">
                      Email Address
                    </label>
                    <input
                      id="admin-profile-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleProfileChange}
                      autoComplete="email"
                    />
                  </div>

                  <div className="admin-profile-actions">
                    <button
                      type="button"
                      className="admin-profile-secondary-button"
                      onClick={() => {
                        setFormData(profile);
                        setIsEditing(false);
                        setError("");
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="admin-profile-primary-button"
                      disabled={loading}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="admin-profile-field">
                    <label>Username</label>
                    <div className="admin-profile-value">
                      {profile.username || "Not available"}
                    </div>
                  </div>

                  <div className="admin-profile-field">
                    <label>Email Address</label>
                    <div className="admin-profile-value">
                      {profile.email || "Not provided"}
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          <section className="admin-profile-section">
            <div className="admin-profile-section-heading">
              <h3>Security</h3>
            </div>

            {isChangingPassword ? (
              <form onSubmit={handlePasswordSave}>
                <div className="admin-profile-field">
                  <label htmlFor="admin-current-password">
                    Current Password
                  </label>
                  <input
                    id="admin-current-password"
                    type="password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="admin-profile-field">
                  <label htmlFor="admin-new-password">
                    New Password
                  </label>
                  <input
                    id="admin-new-password"
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="admin-profile-field">
                  <label htmlFor="admin-confirm-password">
                    Confirm New Password
                  </label>
                  <input
                    id="admin-confirm-password"
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="admin-profile-actions">
                  <button
                    type="button"
                    className="admin-profile-secondary-button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        current_password: "",
                        new_password: "",
                        confirm_password: "",
                      });
                      setError("");
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-profile-primary-button"
                    disabled={loading}
                  >
                    Update Password
                  </button>
                </div>
              </form>
            ) : (
              <div className="admin-profile-security-row">
                <div className="admin-profile-security-icon">
                  <i className="bi bi-key-fill"></i>
                </div>

                <div className="admin-profile-security-text">
                  <h4>Change Password</h4>
                  <p>
                    Keep your administrator account secure.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-profile-text-button"
                  onClick={() => {
                    setError("");
                    setMessage("");
                    setIsChangingPassword(true);
                    setIsEditing(false);
                  }}
                  disabled={loading}
                >
                  Change
                </button>
              </div>
            )}
          </section>

          <div className="admin-profile-note">
            <i className="bi bi-info-circle-fill"></i>
            <p>
              Profile changes are saved through your authenticated
              Django session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;