
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/VendorProfile.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function VendorProfile({ setVendorLoggedIn }) {
    const navigate = useNavigate();

    const [vendor, setVendor] = useState(null);

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [about, setAbout] = useState("");

    const [profileImage, setProfileImage] = useState(null);
    const [profilePreview, setProfilePreview] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showAccessModal, setShowAccessModal] = useState(false);

    const [accessMessage, setAccessMessage] = useState("");

    // Load the logged-in vendor's profile.
    useEffect(() => {
        const vendorId = localStorage.getItem("vendor_id");

        if (!vendorId) {
            navigate("/vendor-login");
            return;
        }

        getVendorProfile(vendorId);
    }, [navigate]);

    // Put the API response into the profile form.
    const updateProfileState = (data) => {
        setVendor(data);

        setName(data.name || "");
        setUsername(data.username || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAbout(data.about || "");

        setProfilePreview(data.profile || "");

        if (data.status) {
            localStorage.setItem("vendor_status", data.status);
        }
    };

    // Fetch the current vendor profile.
    const getVendorProfile = async (vendorId) => {
        try {
            setError("");

            const response = await axios.get(
                `${API_BASE_URL}/vendor/profile/${vendorId}/`
            );

            updateProfileState(response.data);
        } catch (error) {
            console.error("Profile loading error:", error);

            if (error.response?.status === 404) {
                setError("Your vendor profile could not be found.");
            } else {
                setError("Unable to load your profile. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Select a profile image and show its preview.
    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Please select an image smaller than 5 MB.");
            e.target.value = "";
            return;
        }

        setError("");
        setMessage("");
        setProfileImage(file);

        const previewUrl = URL.createObjectURL(file);
        setProfilePreview(previewUrl);
    };

    // Ask for confirmation before saving.
    const handleSubmit = (e) => {
        e.preventDefault();

        setError("");
        setMessage("");
        setShowConfirmation(true);
    };

    // Save profile details and the optional image.
    const confirmSaveProfile = async () => {
    const vendorId = localStorage.getItem("vendor_id");

    if (!vendorId) {
        setShowConfirmation(false);
        navigate("/vendor-login");
        return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
        const formData = new FormData();

        formData.append("name", name.trim());
        formData.append("username", username.trim());
        formData.append("email", email.trim());
        formData.append("phone", phone.trim());
        formData.append("about", about.trim());

        if (profileImage) {
            formData.append("profile", profileImage);
        }

        const response = await axios.patch(
            `${API_BASE_URL}/vendor/profile/update/${vendorId}/`,
            formData
        );

        // Django returns the complete updated profile.
        updateProfileState(response.data);

        // The new image has already been saved.
        setProfileImage(null);

        setShowConfirmation(false);
        setMessage("Your profile has been updated successfully.");

    } catch (error) {
        console.error("Profile update error:", error);

        setShowConfirmation(false);

        const responseData = error.response?.data;

        if (responseData?.message) {
            setError(responseData.message);
        } else if (
            responseData &&
            typeof responseData === "object"
        ) {
            const firstError = Object.values(responseData).flat()[0];

            setError(
                typeof firstError === "string"
                    ? firstError
                    : "Please check your details and try again."
            );
        } else {
            setError(
                "Unable to update your profile. Please try again."
            );
        }
    } finally {
        setSaving(false);
    }
};

    // The dashboard button is shown to everyone, but access is restricted.
    const handleDashboard = () => {
        const status = vendor?.status?.toLowerCase();

        if (status === "approved") {
            navigate("/vendor-dashboard");
            return;
        }

        if (status === "rejected") {
            setAccessMessage(
                "Your verification has not been approved. Please review your profile or contact the support team for further information."
            );
        } else {
            setAccessMessage(
                "Your profile is currently under review. You can continue updating your details, and your dashboard will become available once your verification is approved."
            );
        }

        setShowAccessModal(true);
    };

    // Logout and clear vendor login information.
    const handleLogout = () => {
    localStorage.removeItem("vendor_id");
    localStorage.removeItem("vendor_status");

    if (setVendorLoggedIn) {
        setVendorLoggedIn(false);
    }

    setShowLogoutModal(false);
    navigate("/");
};

    if (loading) {
        return (
            <div className="vendor-profile-page">
                <div className="container py-5 text-center">
                    <div
                        className="spinner-border text-warning"
                        role="status"
                    >
                        <span className="visually-hidden">Loading...</span>
                    </div>

                    <p className="mt-3">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vendor-profile-page">
            <div className="container py-3 py-md-4">

                {/* Header */}
                <header className="vendor-profile-header mb-4">
                    <button
                        type="button"
                        className="vendor-profile-brand"
                        onClick={() => setShowLogoutModal(true)}
                        aria-label="Oorkaran home and logout options"
                    >
                        <img src="/logo.png" alt="" />

                        <span className="fw-bold fs-4">
                            ஊர்
                            <span style={{ color: "var(--primary)" }}>
                                க்காரன்
                            </span>
                        </span>
                    </button>

                    <div className="vendor-profile-header-actions">
                        <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={handleDashboard}
                        >
                            <i className="fa-solid fa-house me-2"></i>
                            Dashboard
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={handleLogout}
                        >
                            <i className="fa-solid fa-right-from-bracket me-2"></i>
                            Logout
                        </button>
                    </div>
                </header>

                <div className="row justify-content-center">
                    <div className="col-12 col-lg-9 col-xl-8">
                        <div className="vendor-profile-card">

                            {/* Page heading */}
                            <div className="text-center mb-4">
                                <h1 className="vendor-profile-title">
                                    My Profile
                                </h1>

                                <p className="text-muted mb-0">
                                    Keep your professional information
                                    up to date.
                                </p>
                            </div>

                            {error && (
                                <div
                                    className="alert alert-danger"
                                    role="alert"
                                >
                                    <i className="fa-solid fa-circle-exclamation me-2"></i>
                                    {error}
                                </div>
                            )}

                            {message && (
                                <div
                                    className="alert alert-success"
                                    role="status"
                                >
                                    <i className="fa-solid fa-circle-check me-2"></i>
                                    {message}
                                </div>
                            )}

                            {/* Account status */}
                            <div className="vendor-status-box mb-4">
                                <div>
                                    <small className="text-muted">
                                        Account verification
                                    </small>

                                    <div className="fw-semibold mt-1">
                                        {vendor?.status?.toLowerCase() === "approved"
                                            ? "Your account is verified"
                                            : vendor?.status?.toLowerCase() === "rejected"
                                            ? "Verification was not approved"
                                            : "Your profile is under review"}
                                    </div>
                                </div>

                                <span
                                    className={`badge ${
                                        vendor?.status?.toLowerCase() === "approved"
                                            ? "bg-success"
                                            : vendor?.status?.toLowerCase() === "rejected"
                                            ? "bg-danger"
                                            : "bg-warning text-dark"
                                    }`}
                                >
                                    {vendor?.status || "Pending"}
                                </span>
                            </div>

                            {/* Profile photo */}
                            <div className="text-center mb-4">
                                <div className="vendor-profile-image-wrapper">
                                    {profilePreview ? (
                                        <img
                                            src={profilePreview}
                                            alt="Vendor profile"
                                            className="vendor-profile-image"
                                        />
                                    ) : (
                                        <div className="vendor-profile-placeholder">
                                            <i className="fa-solid fa-user"></i>
                                        </div>
                                    )}
                                </div>

                                <label
                                    htmlFor="vendorProfileImage"
                                    className="btn btn-outline-warning mt-3"
                                >
                                    <i className="fa-solid fa-camera me-2"></i>
                                    Change Photo
                                </label>

                                <input
                                    id="vendorProfileImage"
                                    type="file"
                                    className="d-none"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />

                                <p className="small text-muted mt-2 mb-0">
                                    JPG, PNG or other image format · Max 5 MB
                                </p>
                            </div>

                            {/* Editable profile details */}
                            <form onSubmit={handleSubmit}>
                                <div className="vendor-profile-section-heading">
                                    Personal Information
                                </div>

                                <div className="row">
                                    <div className="col-12 col-md-6 mb-3">
                                        <label
                                            htmlFor="vendorName"
                                            className="form-label fw-semibold"
                                        >
                                            Full Name
                                        </label>

                                        <input
                                            id="vendorName"
                                            type="text"
                                            className="form-control"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            maxLength={20}
                                            autoComplete="name"
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-6 mb-3">
                                        <label
                                            htmlFor="vendorUsername"
                                            className="form-label fw-semibold"
                                        >
                                            Username
                                        </label>

                                        <input
                                            id="vendorUsername"
                                            type="text"
                                            className="form-control"
                                            value={username}
                                            onChange={(e) =>
                                                setUsername(e.target.value)
                                            }
                                            maxLength={20}
                                            autoComplete="username"
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-6 mb-3">
                                        <label
                                            htmlFor="vendorEmail"
                                            className="form-label fw-semibold"
                                        >
                                            Email Address
                                        </label>

                                        <input
                                            id="vendorEmail"
                                            type="email"
                                            className="form-control"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            autoComplete="email"
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-6 mb-3">
                                        <label
                                            htmlFor="vendorPhone"
                                            className="form-label fw-semibold"
                                        >
                                            Phone Number
                                        </label>

                                        <input
                                            id="vendorPhone"
                                            type="tel"
                                            className="form-control"
                                            value={phone}
                                            onChange={(e) =>
                                                setPhone(e.target.value)
                                            }
                                            maxLength={10}
                                            pattern="[0-9]{10}"
                                            title="Enter a 10-digit phone number."
                                            autoComplete="tel"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="vendor-profile-section-heading mt-3">
                                    About Your Work
                                </div>

                                <div className="mb-4">
                                    <label
                                        htmlFor="vendorAbout"
                                        className="form-label fw-semibold"
                                    >
                                        Professional Introduction
                                    </label>

                                    <textarea
                                        id="vendorAbout"
                                        className="form-control"
                                        rows={5}
                                        maxLength={2000}
                                        placeholder="Tell customers about your work, skills, experience and the services you provide..."
                                        value={about}
                                        onChange={(e) =>
                                            setAbout(e.target.value)
                                        }
                                    />

                                    <div className="text-end small text-muted mt-1">
                                        {about.length}/2000 characters
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn vendor-profile-save-btn w-100"
                                    disabled={saving}
                                >
                                    <i className="fa-solid fa-floppy-disk me-2"></i>
                                    Save Profile
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save confirmation modal */}
            {showConfirmation && (
                <>
                    <div className="vendor-profile-overlay"></div>

                    <div
                        className="vendor-profile-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="saveProfileTitle"
                    >
                        <div className="vendor-profile-modal-icon">
                            <i className="fa-solid fa-floppy-disk"></i>
                        </div>

                        <h2 id="saveProfileTitle">
                            Save Profile Changes?
                        </h2>

                        <p>
                            Do you want to save the changes you made to your
                            profile?
                        </p>

                        <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                            <button
                                type="button"
                                className="btn btn-light border flex-fill"
                                onClick={() => setShowConfirmation(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn vendor-profile-save-btn flex-fill"
                                onClick={confirmSaveProfile}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Saving...
                                    </>
                                ) : (
                                    "Confirm & Save"
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Dashboard access modal */}
            {showAccessModal && (
                <>
                    <div className="vendor-profile-overlay"></div>

                    <div
                        className="vendor-profile-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dashboardAccessTitle"
                    >
                        <div className="vendor-profile-modal-icon">
                            <i className="fa-solid fa-shield-halved"></i>
                        </div>

                        <h2 id="dashboardAccessTitle">
                            Dashboard Not Available Yet
                        </h2>

                        <p>{accessMessage}</p>

                        <button
                            type="button"
                            className="btn vendor-profile-save-btn w-100 mt-3"
                            onClick={() => setShowAccessModal(false)}
                        >
                            Return to Profile
                        </button>
                    </div>
                </>
            )}

            {/* Brand click confirmation modal */}
            {showLogoutModal && (
                <>
                    <div className="vendor-profile-overlay"></div>

                    <div
                        className="vendor-profile-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="profileLogoutTitle"
                    >
                        <div className="vendor-profile-modal-icon">
                            <i className="fa-solid fa-right-from-bracket"></i>
                        </div>

                        <h2 id="profileLogoutTitle">
                            Return to Oorkaran Home?
                        </h2>

                        <p>
                            Do you want to log out and return to the main page?
                        </p>

                        <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                            <button
                                type="button"
                                className="btn btn-light border flex-fill"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Stay on Profile
                            </button>

                            <button
                                type="button"
                                className="btn btn-danger flex-fill"
                                onClick={handleLogout}
                            >
                                Logout & Continue
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default VendorProfile;
