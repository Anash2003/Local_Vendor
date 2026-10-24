
import React, { useState } from "react";
import {
    BrowserRouter,
    Route,
    Routes,
    Navigate
} from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import Home from "./pages/Home";
import Footer from "./Components/common/Footer";

import Customer_Register from "./pages/auth/Customer_reg";
import Customer_Login from "./pages/auth/Customer_login";
import CustomerDashboard from "./Components/customer/CustomerDashboard";


import Vendor_Register from "./pages/auth/Vendor_reg";
import Vendor_Login from "./pages/auth/Vendor_login";
import VendorDashboard from "./Components/vendor/VendorDashboard";

import Vendor_Services from "./pages/vendor/Vendor_Services";
import VendorAvailability from "./pages/vendor/VendorAvailability";
import ManageServices from "./pages/vendor/ManageServices";
import VendorBookings from "./pages/vendor/VendorBookings";
import VendorProfile from "./pages/vendor/VendorProfile";

import CustomerForgotPassword from "./pages/auth/CustomerForgotPassword";
import VendorForgotPassword from "./pages/auth/VendorForgotPassword";
import Customer_Profile from "./pages/customer/CustomerProfile";
import Booking from "./Components/customer/BookingCard";
import MyBookings from "./pages/customer/MyBookings";
import About from "./Components/common/About";
import Contact from "./Components/common/Contact";
import AdminLogin from "./pages/auth/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

// Reusable protection for vendor pages



function VendorProtectedRoute({
    children,
    vendorLoggedIn,
    approvedOnly = false
}) {
    const vendorId = localStorage.getItem("vendor_id");
    const vendorStatus = localStorage.getItem("vendor_status");

    // Vendor must be logged in
    if (!vendorLoggedIn || !vendorId) {
        return <Navigate to="/vendor-login" replace />;
    }

    // Some pages are available only to approved vendors
    if (
        approvedOnly &&
        vendorStatus?.toLowerCase() !== "approved"
    ) {
        return <Navigate to="/vendor-profile" replace />;
    }

    return children;
}

function Routing() {
    const [customerLoggedIn, setCustomerLoggedIn] = useState(
        localStorage.getItem("customer_id") !== null
    );

    const [vendorLoggedIn, setVendorLoggedIn] = useState(
        Boolean(localStorage.getItem("vendor_id"))
    );
    const [adminLoggedIn, setAdminLoggedIn] = useState(
    localStorage.getItem("adminDetails") !== null
);
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />

                {/* Customer authentication */}
                <Route
                    path="/customer-reg"
                    element={<Customer_Register />}
                />

                <Route
                    path="/customer-login"
                    element={
                        <Customer_Login
                            setCustomerLoggedIn={setCustomerLoggedIn}
                        />
                    }
                />

                <Route
                    path="/customer-dashboard"
                    element={
                        customerLoggedIn &&
                        localStorage.getItem("customer_id") ? (
                            <CustomerDashboard
                                setCustomerLoggedIn={setCustomerLoggedIn}
                            />
                        ) : (
                            <Navigate to="/customer-login" replace />
                        )
                    }
                />

                {/* Vendor authentication */}
                <Route
                    path="/vendor-reg"
                    element={<Vendor_Register />}
                />

                <Route
                    path="/vendor-login"
                    element={
                        <Vendor_Login
                            setVendorLoggedIn={setVendorLoggedIn}
                        />
                    }
                />

                {/* Profile: any logged-in vendor */}
                <Route
                    path="/vendor-profile"
                    element={
                        <VendorProtectedRoute
                            vendorLoggedIn={vendorLoggedIn}
                        >
                            <VendorProfile setVendorLoggedIn={setVendorLoggedIn}/>
                        </VendorProtectedRoute>
                    }
                />

                {/* Dashboard: approved vendors only */}
                <Route
                    path="/vendor-dashboard"
                    element={
                        <VendorProtectedRoute
                            vendorLoggedIn={vendorLoggedIn}
                            approvedOnly
                        >
                            <VendorDashboard
                                setVendorLoggedIn={setVendorLoggedIn}
                            />
                        </VendorProtectedRoute>
                    }
                />

                <Route
                    path="/vendor-services"
                    element={
                        <VendorProtectedRoute
                            vendorLoggedIn={vendorLoggedIn}
                            approvedOnly
                        >
                            <Vendor_Services
                                setVendorLoggedIn={setVendorLoggedIn}
                            />
                        </VendorProtectedRoute>
                    }
                />

                <Route
                    path="/vendor-availability"
                    element={
                        <VendorProtectedRoute
                            vendorLoggedIn={vendorLoggedIn}
                            approvedOnly
                        >
                            <VendorAvailability />
                        </VendorProtectedRoute>
                    }
                />

                <Route
                    path="/manage-services"
                    element={
                        <VendorProtectedRoute
                            vendorLoggedIn={vendorLoggedIn}
                            approvedOnly
                        >
                            <ManageServices />
                        </VendorProtectedRoute>
                    }
                />

                <Route
                    path="/vendor-bookings"
                    element={
                        <VendorProtectedRoute
                            vendorLoggedIn={vendorLoggedIn}
                            approvedOnly
                        >
                            <VendorBookings />
                        </VendorProtectedRoute>
                    }
                />

                {/* Forgot password */}
                <Route
                    path="/customer-forgot-password"
                    element={<CustomerForgotPassword />}
                />

                <Route
                    path="/vendor-forgot-password"
                    element={<VendorForgotPassword />}
                />

                {/* Unknown URLs return home */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

                <Route
                    path="/customer-profile"
                    element={
                        <Customer_Profile
                            setCustomerLoggedIn={setCustomerLoggedIn}
                        />
                    }
                />
                <Route
                    path="/booking/:serviceId"
                    element={
                        customerLoggedIn &&
                        localStorage.getItem("customer_id") ? (
                            <Booking />
                        ) : (
                            <Navigate to="/customer-login" replace />
                        )
                    }
                />
                <Route
                    path="/my-bookings"
                    element={
                        customerLoggedIn &&
                        localStorage.getItem("customer_id") ? (
                            <MyBookings/>
                        ) : (
                            <Navigate to="/customer-login" replace />
                        )
                    }
                />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route
  path="/admin/login"
  element={
    <AdminLogin setAdminLoggedIn={setAdminLoggedIn} />
  }
/>
                

<Route
    path="/admin/dashboard"
    element={
        adminLoggedIn &&
        localStorage.getItem("adminDetails") ? (
            <AdminDashboard />
        ) : (
            <Navigate to="/admin/login" replace />
        )
    }
/>




            </Routes>

            <Footer />
        </BrowserRouter>
    );
}

export default Routing;