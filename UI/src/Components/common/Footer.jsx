import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

function Footer() {
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [logoutDestination, setLogoutDestination] = useState("/");

    // --------------------------------
    // Check Customer Login
    // --------------------------------
    const isCustomerLoggedIn = () => {
        return localStorage.getItem("customer_id") !== null;
    };

    // --------------------------------
    // Home Click
    // --------------------------------
    const handleHomeClick = () => {
        if (isCustomerLoggedIn()) {
            setLogoutDestination("/");
            setShowLogoutModal(true);
        } else {
            navigate("/");
        }
    };

    // --------------------------------
    // Services Click
    // --------------------------------
    const handleServicesClick = () => {
        if (isCustomerLoggedIn()) {
            setLogoutDestination("/services");
            setShowLogoutModal(true);
        } else {
            navigate("/services");
        }
    };

    // --------------------------------
    // About Click
    // --------------------------------
    const handleAboutClick = () => {
        navigate("/about");
    };

    // --------------------------------
    // Contact Click
    // --------------------------------
    const handleContactClick = () => {
        navigate("/contact");
    };

    // --------------------------------
    // Terms & Conditions Click
    // --------------------------------
    const handleTermsClick = () => {
        navigate("/terms-and-conditions");
    };

    // --------------------------------
    // Confirm Logout
    // --------------------------------
    const handleConfirmLogout = () => {
        // Remove customer login information
        localStorage.removeItem("customer_id");

        // Remove other customer session information
        localStorage.removeItem("customer_name");
        localStorage.removeItem("customer_email");

        setShowLogoutModal(false);

        // Go to the requested destination
        navigate(logoutDestination);
    };

    // --------------------------------
    // Close Modal
    // --------------------------------
    const handleCloseModal = () => {
        setShowLogoutModal(false);
    };

    return (
        <>
            {/* =================================
                FOOTER
            ================================= */}
            <footer className="bg-dark text-white mt-5">
                <div className="container py-5">
                    <div className="row g-4">

                        {/* =================================
                            BRAND / ABOUT
                        ================================= */}
                        <div className="col-lg-5 col-md-6">
                            <h3 className="fw-bold mb-3">
                                <span className="fw-bold fs-4">
                                    ஊர்
                                    <span
                                        style={{
                                            color: "var(--primary)"
                                        }}
                                    >
                                        க்காரன்
                                    </span>
                                </span>
                            </h3>

                            <p className="text-light pe-lg-5">
                                Your trusted platform for finding reliable
                                local service providers. From home services
                                to repairs, connect with the right vendor
                                for your needs.
                            </p>

                            <p className="text-light mb-0">
                                Making local services simple, accessible
                                and convenient.
                            </p>
                        </div>

                        {/* =================================
                            QUICK LINKS
                        ================================= */}
                        <div className="col-lg-2 col-md-6">
                            <h6 className="fw-bold mb-3">
                                Quick Links
                            </h6>

                            <ul className="list-unstyled">

                                {/* Home */}
                                <li className="mb-2">
                                    <button
                                        type="button"
                                        className="footer-link-button"
                                        onClick={handleHomeClick}
                                    >
                                        Home
                                    </button>
                                </li>

                                {/* Services */}
                                <li className="mb-2">
                                    <button
                                        type="button"
                                        className="footer-link-button"
                                        onClick={handleServicesClick}
                                    >
                                        Services
                                    </button>
                                </li>

                                {/* About Us */}
                                <li className="mb-2">
                                    <button
                                        type="button"
                                        className="footer-link-button"
                                        onClick={handleAboutClick}
                                    >
                                        About Us
                                    </button>
                                </li>

                                {/* Contact */}
                                <li>
                                    <button
                                        type="button"
                                        className="footer-link-button"
                                        onClick={handleContactClick}
                                    >
                                        Contact
                                    </button>
                                </li>

                            </ul>
                        </div>

                        {/* =================================
                            SERVICES
                        ================================= */}
                        <div className="col-lg-2 col-md-6">
                            <h6 className="fw-bold mb-3">
                                Services
                            </h6>

                            <ul className="list-unstyled">
                                <li className="mb-2 text-light">
                                    Home Services
                                </li>

                                <li className="mb-2 text-light">
                                    Vehicle Services
                                </li>

                                <li className="mb-2 text-light">
                                    Tech Services
                                </li>

                                <li className="text-light">
                                    Personal Care
                                </li>
                            </ul>
                        </div>

                        {/* =================================
                            CONTACT
                        ================================= */}
                        <div className="col-lg-3 col-md-6">
                            <h6 className="fw-bold mb-3">
                                Get in Touch
                            </h6>

                            <p className="text-light mb-2">
                                Need a service? Find a trusted vendor
                                near you.
                            </p>

                            <button
                                type="button"
                                className="btn vendor-btn px-4 mt-2"
                                onClick={handleContactClick}
                            >
                                Contact Us
                            </button>
                            <button
                                type="button"
                                className="btn vendor-btn px-4 mt-2 ms-3"
                                onClick={handleHomeClick}
                            >
                                Home
                            </button>
                        </div>

                    </div>

                    <hr className="border-light my-4" />

                    {/* =================================
                        BOTTOM
                    ================================= */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">

                        <p className="text-light mb-2 mb-md-0">
                            © 2026 ஊர்க்காரன். All rights reserved.
                        </p>

                        <div>

                            {/* Privacy */}
                            <button
                                type="button"
                                className="footer-bottom-link me-3"
                                onClick={handleTermsClick}
                            >
                                Privacy
                            </button>

                            {/* Terms */}
                            <button
                                type="button"
                                className="footer-bottom-link"
                                onClick={handleTermsClick}
                            >
                                Terms
                            </button>

                        </div>
                    </div>
                </div>
            </footer>

            {/* =================================
                LOGOUT CONFIRMATION MODAL
            ================================= */}
            {showLogoutModal && (
                <>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content footer-logout-modal">

                                {/* Modal Header */}
                                <div className="modal-header">
                                    <div>
                                        <p className="footer-modal-label">
                                            {logoutDestination === "/"
                                                ? "GO TO HOME"
                                                : "GO TO SERVICES"}
                                        </p>

                                        <h5 className="modal-title">
                                            Leave Customer Account?
                                        </h5>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Close"
                                        onClick={handleCloseModal}
                                    ></button>
                                </div>

                                {/* Modal Body */}
                                <div className="modal-body">

                                    <div className="footer-modal-icon">
                                        <i className="fa-solid fa-right-from-bracket"></i>
                                    </div>

                                    <p>
                                        You are currently logged in as a
                                        customer.
                                    </p>

                                    <p className="mb-0">
                                        {logoutDestination === "/"
                                            ? "Going to the main page will log you out of your customer account."
                                            : "Going to the services page will log you out of your customer account."}
                                    </p>

                                </div>

                                {/* Modal Footer */}
                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn footer-modal-stay-button"
                                        onClick={handleCloseModal}
                                    >
                                        Stay Here
                                    </button>

                                    <button
                                        type="button"
                                        className="btn footer-modal-logout-button"
                                        onClick={handleConfirmLogout}
                                    >
                                        {logoutDestination === "/"
                                            ? "Logout & Go Home"
                                            : "Logout & Go Services"}
                                    </button>

                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </>
    );
}

export default Footer;