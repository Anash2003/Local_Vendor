
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../../css/CustomerLogin.css";
import "../../App.css";

function Customer_Login({ setCustomerLoggedIn }) {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post(
                "./api/customer/login/",
                {
                    username: username,
                    password: password
                }
            );

            console.log(response.data);

            // Remove old customer ID
            localStorage.removeItem("customer_id");

            // Save the correct customer ID
            localStorage.setItem(
                "customer_id",
                response.data.customer_id
            );

            // Save customer status if backend provides it
            if (response.data.status) {
                localStorage.setItem(
                    "customer_status",
                    response.data.status
                );
            }

            setCustomerLoggedIn(true);

            navigate("/customer-dashboard");
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                "Invalid username or password."
            );
        }
    };

    // Logo click
    const handleLogoClick = () => {
        setShowLogoutModal(true);
    };

    // Confirm logout and go home
    const handleConfirmLogout = () => {
        localStorage.removeItem("customer_id");
        localStorage.removeItem("customer_status");

        if (setCustomerLoggedIn) {
            setCustomerLoggedIn(false);
        }

        setShowLogoutModal(false);

        navigate("/");
    };

    // Cancel
    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    return (
        <div className="login-page">
            <div className="login-card">

                <div className="text-center">

                    {/* Logo */}
                    <div
                        className="register-logo rounded-5 vendor-register-logo"
                        onClick={handleLogoClick}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                handleLogoClick();
                            }
                        }}
                        role="button"
                        tabIndex="0"
                    >
                        <img
                            className="img-fluid border-0 rounded w-100"
                            src="/logo.png"
                            alt="Oorkaran"
                        />
                    </div>

                    <h1 className="login-label">
                        ஊர்க்காரன்
                    </h1>

                    <h2>
                        Welcome back
                    </h2>

                    <h1 className="login-subtitle">
                        Sign in to book trusted local services.
                    </h1>

                </div>

                {/* Error */}
                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin}>

                    <div className="mb-3">
                        <label className="form-label">
                            Username
                        </label>

                        <input
                            type="text"
                            className="form-control login-input"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Password
                        </label>

                        <input
                            type="password"
                            className="form-control login-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn login-submit w-100"
                    >
                        Sign In
                    </button>

                </form>

                {/* Register */}
                <div className="register-text">
                    New here?{" "}

                    <button
                        type="button"
                        className="register-link"
                        onClick={() =>
                            navigate("/customer-reg")
                        }
                    >
                        Register
                    </button>
                </div>

                {/* Forgot Password */}
                <center>
                    <button
                        type="button"
                        className="btn btn-link forgot-password-link"
                        onClick={() =>
                            navigate("/customer-forgot-password")
                        }
                    >
                        Forgot Password?
                    </button>
                </center>

            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.5)"
                    }}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        role="document"
                    >
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Leave Customer Login?
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleCancelLogout}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <div className="modal-body">
                                <p className="mb-0">
                                    Are you sure you want to leave?
                                    Any existing customer login session
                                    will be logged out.
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
            )}

        </div>
    );
}

export default Customer_Login;
