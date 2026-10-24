
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../../App.css";
import "../../css/CustomerRegister.css";

function Customer_Register({ setCustomerLoggedIn }) {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");

        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/customer/register/",
                {
                    name: name,
                    username: username,
                    email: email,
                    phone: phone,
                    password: password
                }
            );

            console.log(response.data);

            navigate("/customer-login");

        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                "Registration failed. Please try again."
            );
        }
    };

    // --------------------------------
    // Logo Click
    // --------------------------------
    const handleLogoClick = () => {
        setShowLogoutModal(true);
    };

    // --------------------------------
    // Confirm Logout + Go Home
    // --------------------------------
    const handleConfirmLogout = () => {

        // Clear any existing customer login data
        localStorage.removeItem("customer_id");
        localStorage.removeItem("customer_status");

        // Update React login state
        if (setCustomerLoggedIn) {
            setCustomerLoggedIn(false);
        }

        setShowLogoutModal(false);

        // Go to home page
        navigate("/");
    };

    // --------------------------------
    // Cancel
    // --------------------------------
    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    return (
        <div className="register-page">

            <div className="register-card">

                {/* Logo */}
                <div className="text-center">

                    <div
                        className="register-logo rounded-5 vendor-register-logo"
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
                            className="img-fluid border-0 rounded w-100"
                            src="/logo.png"
                            alt="ஊர்க்காரன்"
                        />

                    </div>

                    <p className="register-label">
                    </p>

                    <h2>
                        Create your account
                    </h2>

                    <p className="register-subtitle">
                        Register to book trusted local services.
                    </p>

                </div>

                {/* Error */}
                {error && (
                    <div
                        className="alert alert-danger"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleRegister}>

                    <div className="mb-3">

                        <label className="form-label">
                            Name
                        </label>

                        <input
                            type="text"
                            className="form-control register-input"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            required
                        />

                    </div>

                    <div className="mb-3">

                        <label className="form-label">
                            Username
                        </label>

                        <input
                            type="text"
                            className="form-control register-input"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            required
                        />

                    </div>

                    <div className="mb-3">

                        <label className="form-label">
                            Email
                        </label>

                        <input
                            type="email"
                            className="form-control register-input"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                    </div>

                    <div className="mb-3">

                        <label className="form-label">
                            Phone
                        </label>

                        <input
                            type="tel"
                            className="form-control register-input"
                            placeholder="Enter your phone number"
                            value={phone}
                            onChange={(e) =>
                                setPhone(e.target.value)
                            }
                            maxLength="10"
                            required
                        />

                    </div>

                    <div className="mb-3">

                        <label className="form-label">
                            Password
                        </label>

                        <input
                            type="password"
                            className="form-control register-input"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                    </div>

                    <button
                        type="submit"
                        className="btn register-submit w-100"
                    >
                        Create Account
                    </button>

                </form>

                {/* Login Link */}
                <div className="login-text">

                    Already have an account?{" "}

                    <button
                        type="button"
                        className="login-link"
                        onClick={() =>
                            navigate("/customer-login")
                        }
                    >
                        Sign In
                    </button>

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
                                        Leave Registration?
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

        </div>
    );
}

export default Customer_Register;
