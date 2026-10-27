
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../../App.css";
import "../../css/VendorRegister.css";

function Vendor_Register() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [profile, setProfile] = useState(null);

    const [error, setError] = useState("");
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleRegister = async (e) => {

        e.preventDefault();
        setError("");

        const formData = new FormData();

        formData.append("name", name);
        formData.append("username", username);
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("password", password);

        if (profile) {
            formData.append("profile", profile);
        }

        try {

            const response = await axios.post(
                "./api/vendor/register/",
                formData
            );

            console.log(response.data);

            navigate("/vendor-login");

        } catch (error) {

            console.error(error);

            setError(
                error.response?.data?.message ||
                "Registration failed. Please try again."
            );
        }
    };

    const handleLogoClick = () => {
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = () => {

        // Clear vendor login data if any old data exists
        localStorage.removeItem("vendor_id");

        setShowLogoutModal(false);

        navigate("/");
    };

    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    return (

        <div className="vendor-register-page">

            <div className="container py-4 py-md-5">

                <div className="row justify-content-center">

                    <div className="col-12 col-sm-10 col-md-8 col-lg-6">

                        <div className="vendor-register-card">

                            {/* Logo and heading */}

                            <div className="text-center mb-4">

                                <div
                                    className="vendor-register-logo"
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
                                    ஊர்க்காரன்
                                </h1>

                                <h2>
                                    Become a Vendor
                                </h2>

                                <p>
                                    Register your business and connect
                                    with local customers.
                                </p>

                            </div>

                            {/* Error message */}

                            {error && (
                                <div
                                    className="alert alert-danger"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}

                            {/* Registration form */}

                            <form onSubmit={handleRegister}>

                                <div className="mb-3">

                                    <label className="form-label">
                                        Name
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
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
                                        className="form-control"
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
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        className="form-control"
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
                                        className="form-control"
                                        placeholder="Enter your phone number"
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
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
                                        className="form-control"
                                        placeholder="Create a password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                    />

                                </div>

                                <div className="mb-4">

                                    <label className="form-label">
                                        Profile Image
                                    </label>

                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setProfile(
                                                e.target.files[0]
                                            )
                                        }
                                    />

                                </div>

                                <button
                                    type="submit"
                                    className="btn vendor-register-submit w-100"
                                >
                                    Register as Vendor
                                </button>

                            </form>

                            <div className="vendor-login-text text-center mt-4">

                                Already have a vendor account?{" "}

                                <button
                                    type="button"
                                    className="vendor-login-link"
                                    onClick={() =>
                                        navigate("/vendor-login")
                                    }
                                >
                                    Sign In
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            {/* Logout confirmation modal */}

            {showLogoutModal && (

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
                                ></button>

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

            )}

            {/* Modal backdrop */}

            {showLogoutModal && (
                <div className="modal-backdrop fade show"></div>
            )}

        </div>
    );
}

export default Vendor_Register;
