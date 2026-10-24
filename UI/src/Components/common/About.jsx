import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

function About() {
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleExploreServices = () => {
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = () => {
        // Clear customer session data
        localStorage.removeItem("customer_id");
        localStorage.removeItem("customer_name");
        localStorage.removeItem("customer_email");

        // Clear vendor session data
        localStorage.removeItem("vendor_id");
        localStorage.removeItem("vendor_name");
        localStorage.removeItem("vendor_email");

        // Close modal
        setShowLogoutModal(false);

        // Go to home page
        navigate("/");
    };

    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    return (
        <div className="about-page">

            <div className="container">

                {/* Hero */}
                <section className="about-hero">

                    <p className="about-label">
                        ABOUT OORKARAN
                    </p>

                    <h1>
                        Local services,
                        <span> made simple.</span>
                    </h1>

                    <p className="about-hero-text">
                        ஊர்க்காரன் connects customers with reliable local
                        service providers, making it easier to find the
                        right professional for everyday needs.
                    </p>

                </section>


                {/* About Content */}
                <section className="about-content">

                    <div className="row g-4">

                        <div className="col-lg-6">
                            <div className="about-card">

                                <div className="about-card-icon">
                                    <i className="fa-solid fa-location-dot"></i>
                                </div>

                                <h4>
                                    Built for Local Communities
                                </h4>

                                <p>
                                    Finding a trustworthy local service
                                    provider should not be difficult.
                                    ஊர்க்காரன் brings customers and local
                                    vendors together in one convenient
                                    platform.
                                </p>

                            </div>
                        </div>


                        <div className="col-lg-6">
                            <div className="about-card">

                                <div className="about-card-icon">
                                    <i className="fa-solid fa-handshake"></i>
                                </div>

                                <h4>
                                    Connecting Customers & Vendors
                                </h4>

                                <p>
                                    Customers can discover services,
                                    compare vendors, make bookings and
                                    share their experience through
                                    ratings and reviews.
                                </p>

                            </div>
                        </div>


                        <div className="col-lg-6">
                            <div className="about-card">

                                <div className="about-card-icon">
                                    <i className="fa-solid fa-shield-halved"></i>
                                </div>

                                <h4>
                                    Trusted Service Experience
                                </h4>

                                <p>
                                    Our platform is designed to make the
                                    booking process clear and convenient,
                                    while helping customers connect with
                                    approved service providers.
                                </p>

                            </div>
                        </div>


                        <div className="col-lg-6">
                            <div className="about-card">

                                <div className="about-card-icon">
                                    <i className="fa-solid fa-star"></i>
                                </div>

                                <h4>
                                    Customer Experiences Matter
                                </h4>

                                <p>
                                    Ratings and feedback help customers
                                    make better decisions and encourage
                                    vendors to provide quality service.
                                </p>

                            </div>
                        </div>

                    </div>

                </section>


                {/* CTA */}
                <section className="about-cta">

                    <h3>
                        Looking for a local service?
                    </h3>

                    <p>
                        Find the right service provider for your needs.
                    </p>

                    <button
                        type="button"
                        className="btn about-cta-button"
                        onClick={handleExploreServices}
                    >
                        Explore Services
                    </button>

                </section>

            </div>


            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div
                    className="about-logout-backdrop"
                    onClick={handleCancelLogout}
                >
                    <div
                        className="about-logout-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="about-logout-icon">
                            <i className="fa-solid fa-right-from-bracket"></i>
                        </div>

                        <h4>
                            Leave this page?
                        </h4>

                        <p>
                            You will be taken to the main page.
                            Your current login session will be cleared.
                        </p>

                        <div className="about-logout-actions">

                            <button
                                type="button"
                                className="about-cancel-button"
                                onClick={handleCancelLogout}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="about-confirm-button"
                                onClick={handleConfirmLogout}
                            >
                                Go to Home
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default About;