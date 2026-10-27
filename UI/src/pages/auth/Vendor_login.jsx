
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../../App.css";
import "../../css/VendorLogin.css";

function Vendor_Login({ setVendorLoggedIn }) {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [showVerificationModal, setShowVerificationModal] =
        useState(false);

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // --------------------------------
    // Vendor Login
    // --------------------------------
    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                "./api/vendor/login/",
                {
                    username,
                    password,
                }
            );

            const vendorId = response.data.vendor_id;
            const vendorStatus = response.data.status;

            // Make sure the backend returned the required details
            if (
                vendorId === undefined ||
                vendorId === null ||
                !vendorStatus
            ) {
                setError(
                    "Login response is missing the required vendor information."
                );
                return;
            }

            // Clear old vendor login data
            localStorage.removeItem("vendor_id");
            localStorage.removeItem("vendor_status");

            // Store new vendor login data
            localStorage.setItem("vendor_id", vendorId);
            localStorage.setItem("vendor_status", vendorStatus);

            if (setVendorLoggedIn) {
                setVendorLoggedIn(true);
            }

            if (vendorStatus.toLowerCase() === "approved") {
                navigate("/vendor-dashboard");
            } else {
                setShowVerificationModal(true);
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to log in. Please check your username and password."
            );
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------
    // Logo / App Name Click
    // --------------------------------
    const handleLogoClick = () => {
        setShowLogoutModal(true);
    };

    // --------------------------------
    // Confirm Logout + Go Home
    // --------------------------------
    const handleConfirmLogout = () => {
        // Clear any existing vendor login data
        localStorage.removeItem("vendor_id");
        localStorage.removeItem("vendor_status");

        // Update React login state
        if (setVendorLoggedIn) {
            setVendorLoggedIn(false);
        }

        setShowLogoutModal(false);

        // Go to home page
        navigate("/");
    };

    // --------------------------------
    // Cancel Logout
    // --------------------------------
    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    // --------------------------------
    // Verification Modal
    // --------------------------------
    const handleGoToProfile = () => {
        setShowVerificationModal(false);
        navigate("/vendor-profile");
    };

    const handleMaybeLater = () => {
        setShowVerificationModal(false);
    };

    return (
        <div className="vendor-login-page">

            <div className="admin-login-page py-4 py-md-5">

                <div className="admin-login-page row justify-content-center">

                    <div className="col-12 col-sm-10 col-md-8 col-lg-6">

                        <div className="vendor-login-card">

                            {/* Logo and App Name */}
                            <div className="text-center mb-4">

                                <div
                                    className="vendor-login-logo"
                                    onClick={handleLogoClick}
                                    role="button"
                                    tabIndex="0"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleLogoClick();
                                        }
                                    }}
                                >
                                    <img
                                        src="/logo.png"
                                        alt="ஊர்க்காரன்"
                                        className="img-fluid"
                                    />
                                </div>

                                <h1 className="mt-3">
                                    ஊர்
                                    <span
                                        style={{
                                            color: "var(--primary)",
                                        }}
                                    >
                                        க்காரன்
                                    </span>
                                </h1>

                                <h2>Vendor Login</h2>

                                <p>
                                    Sign in to manage your services and bookings.
                                </p>

                            </div>

                            {/* Error Message */}
                            {error && (
                                <div
                                    className="alert alert-danger"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={handleLogin}>

                                <div className="mb-3">

                                    <label
                                        htmlFor="vendorUsername"
                                        className="form-label"
                                    >
                                        Username
                                    </label>

                                    <input
                                        id="vendorUsername"
                                        type="text"
                                        className="form-control vendor-login-input"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                        autoComplete="username"
                                        required
                                    />

                                </div>

                                <div className="mb-3">

                                    <label
                                        htmlFor="vendorPassword"
                                        className="form-label"
                                    >
                                        Password
                                    </label>

                                    <input
                                        id="vendorPassword"
                                        type="password"
                                        className="form-control vendor-login-input"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        autoComplete="current-password"
                                        required
                                    />

                                </div>

                                <div className="text-end mb-3">

                                    <button
                                        type="button"
                                        className="forgot-password-link border-0 bg-transparent"
                                        onClick={() =>
                                            navigate(
                                                "/vendor-forgot-password"
                                            )
                                        }
                                    >
                                        Forgot Password?
                                    </button>

                                </div>

                                <button
                                    type="submit"
                                    className="btn vendor-login-submit w-100"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Signing in..."
                                        : "Login"}
                                </button>

                            </form>

                            {/* Register Link */}
                            <p className="vendor-register-text text-center mt-4 mb-0">

                                Don't have an account?{" "}

                                <button
                                    type="button"
                                    className="vendor-register-link"
                                    onClick={() =>
                                        navigate("/vendor-reg")
                                    }
                                >
                                    Register
                                </button>

                            </p>

                        </div>

                    </div>

                </div>

            </div>

            {/* --------------------------------
                Logout Confirmation Modal
            -------------------------------- */}
            {showLogoutModal && (
                <>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        role="dialog"
                        aria-modal="true"
                    >

                        <div className="modal-dialog modal-dialog-centered">

                            <div className="modal-content">

                                <div className="modal-header">

                                    <h5 className="modal-title">
                                        Leave Vendor Login?
                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Close"
                                        onClick={handleCancelLogout}
                                    >
                                    </button>

                                </div>

                                <div className="modal-body">

                                    <p className="mb-0">
                                        Do you want to logout and go to
                                        the main page?
                                    </p>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCancelLogout}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-warning"
                                        onClick={handleConfirmLogout}
                                    >
                                        Logout & Go Home
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* --------------------------------
                Verification Modal
            -------------------------------- */}
            {showVerificationModal && (
                <>
                    <div
                        className="vendor-verification-overlay"
                        aria-hidden="true"
                    />

                    <div
                        className="vendor-verification-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="verificationTitle"
                    >

                        <div className="vendor-verification-icon">
                            <i className="bi bi-shield-check"></i>
                        </div>

                        <span className="vendor-verification-badge">
                            <i className="bi bi-clock-history me-1"></i>
                            Verification in progress
                        </span>

                        <h2 id="verificationTitle">
                            Your journey with Oorkaran is almost ready!
                        </h2>

                        <p>
                            Thank you for joining our community of local
                            professionals. Your profile is currently under
                            review by our team.
                        </p>

                        <p>
                            Once verification is complete, your vendor
                            dashboard will become available. In the meantime,
                            you can review and update your profile.
                        </p>

                        <button
                            type="button"
                            className="btn vendor-verification-primary w-100"
                            onClick={handleGoToProfile}
                        >
                            Continue to My Profile
                            <i className="bi bi-arrow-right ms-2"></i>
                        </button>

                        <button
                            type="button"
                            className="btn vendor-verification-secondary w-100 mt-2"
                            onClick={handleMaybeLater}
                        >
                            Maybe Later
                        </button>

                    </div>
                </>
            )}

        </div>
    );
}

export default Vendor_Login;
