
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


function Customer_Profile({ setCustomerLoggedIn }) {

    const navigate = useNavigate();

    const BASE_API = "http://127.0.0.1:8000";

    const customerId = localStorage.getItem("customer_id");

    // ==================================================
    // PROFILE STATE
    // ==================================================

    const [profile, setProfile] = useState(null);

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // ==================================================
    // IMAGE STATE
    // ==================================================

    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    // ==================================================
    // PAGE STATE
    // ==================================================

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [isEditing, setIsEditing] = useState(false);

    // ==================================================
    // MESSAGE STATE
    // ==================================================

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    // ==================================================
    // LOGOUT MODAL
    // ==================================================

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // ==================================================
    // GET CUSTOMER PROFILE
    // ==================================================

    useEffect(() => {

        const fetchProfile = async () => {

            if (!customerId) {
                navigate("/customer-login");
                return;
            }

            try {

                setLoading(true);

                const response = await axios.get(
                    `${BASE_API}/user/profile/${customerId}/`
                );

                const data = response.data;

                setProfile(data);

                setName(data.name || "");
                setUsername(data.username || "");
                setEmail(data.email || "");
                setPhone(data.phone || "");

            } catch (error) {

                console.error(
                    "Customer profile loading error:",
                    error
                );

                setMessage(
                    error.response?.data?.message ||
                    "Unable to load your profile."
                );

                setMessageType("danger");

            } finally {

                setLoading(false);

            }
        };

        fetchProfile();

    }, [customerId, navigate]);

    // ==================================================
    // EDIT PROFILE
    // ==================================================

    const handleEdit = () => {

        setMessage("");
        setMessageType("");

        setIsEditing(true);

    };

    // ==================================================
    // CANCEL EDIT
    // ==================================================

    const handleCancelEdit = () => {

        if (profile) {

            setName(profile.name || "");
            setUsername(profile.username || "");
            setEmail(profile.email || "");
            setPhone(profile.phone || "");

        }

        setSelectedImage(null);
        setImagePreview("");

        setMessage("");
        setMessageType("");

        setIsEditing(false);

    };

    // ==================================================
    // IMAGE CHANGE
    // ==================================================

    const handleImageChange = (e) => {

        const file = e.target.files[0];

        if (!file) {
            return;
        }

        // ------------------------------------------
        // Allowed image types
        // ------------------------------------------

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            setMessage(
                "Only JPG, PNG and WEBP images are allowed."
            );

            setMessageType("danger");

            e.target.value = "";

            return;
        }

        // ------------------------------------------
        // Maximum file size = 5 MB
        // ------------------------------------------

        if (file.size > 5 * 1024 * 1024) {

            setMessage(
                "Profile image must be less than 5 MB."
            );

            setMessageType("danger");

            e.target.value = "";

            return;
        }

        // ------------------------------------------
        // Store selected image
        // ------------------------------------------

        setSelectedImage(file);

        // ------------------------------------------
        // Create instant preview
        // ------------------------------------------

        const previewUrl = URL.createObjectURL(file);

        setImagePreview(previewUrl);

        setMessage("");
        setMessageType("");

    };

    // ==================================================
    // SAVE PROFILE
    // ==================================================

    const handleSaveProfile = async (e) => {

        e.preventDefault();

        // ------------------------------------------
        // Validate name
        // ------------------------------------------

        if (!name.trim()) {

            setMessage("Name is required.");
            setMessageType("danger");

            return;
        }

        // ------------------------------------------
        // Validate username
        // ------------------------------------------

        if (!username.trim()) {

            setMessage("Username is required.");
            setMessageType("danger");

            return;
        }

        // ------------------------------------------
        // Validate email
        // ------------------------------------------

        if (!email.trim()) {

            setMessage("Email is required.");
            setMessageType("danger");

            return;
        }

        // ------------------------------------------
        // Validate phone
        // ------------------------------------------

        if (
            phone &&
            !/^\d{10}$/.test(phone)
        ) {

            setMessage(
                "Phone number must contain 10 digits."
            );

            setMessageType("danger");

            return;
        }

        try {

            setSaving(true);

            setMessage("");
            setMessageType("");

            // ------------------------------------------
            // FormData
            // ------------------------------------------

            const formData = new FormData();

            formData.append(
                "name",
                name.trim()
            );

            formData.append(
                "username",
                username.trim()
            );

            formData.append(
                "email",
                email.trim()
            );

            formData.append(
                "phone",
                phone.trim()
            );

            // ------------------------------------------
            // Add image only when selected
            // ------------------------------------------

            if (selectedImage) {

                formData.append(
                    "profile",
                    selectedImage
                );

            }

            // ------------------------------------------
            // PATCH request
            // ------------------------------------------

            const response = await axios.patch(
                `${BASE_API}/user/profile/${customerId}/`,
                formData
            );

            // ------------------------------------------
            // Updated profile from backend
            // ------------------------------------------

            const updatedProfile = response.data;

            setProfile(updatedProfile);

            setName(
                updatedProfile.name || ""
            );

            setUsername(
                updatedProfile.username || ""
            );

            setEmail(
                updatedProfile.email || ""
            );

            setPhone(
                updatedProfile.phone || ""
            );

            // ------------------------------------------
            // Clear image selection
            // ------------------------------------------

            setSelectedImage(null);
            setImagePreview("");

            // ------------------------------------------
            // Exit edit mode
            // ------------------------------------------

            setIsEditing(false);

            // ------------------------------------------
            // Success message
            // ------------------------------------------

            setMessage(
                updatedProfile.message ||
                "Profile updated successfully."
            );

            setMessageType("success");

        } catch (error) {

            console.error(
                "Customer profile update error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to update your profile."
            );

            setMessageType("danger");

        } finally {

            setSaving(false);

        }

    };

    // ==================================================
    // LOGOUT
    // ==================================================

    const handleLogout = () => {

        setShowLogoutModal(true);

    };

    // ==================================================
    // CONFIRM LOGOUT
    // ==================================================

    const handleConfirmLogout = () => {

        localStorage.removeItem("customer_id");
        localStorage.removeItem("customer_status");

        if (setCustomerLoggedIn) {

            setCustomerLoggedIn(false);

        }

        setShowLogoutModal(false);

        navigate("/");

    };

    // ==================================================
    // CANCEL LOGOUT
    // ==================================================

    const handleCancelLogout = () => {

        setShowLogoutModal(false);

    };

    // ==================================================
    // LOADING SCREEN
    // ==================================================

    if (loading) {

        return (

            <div className="customer-profile-page">

                <div className="customer-profile-loading">

                    <div
                        className="spinner-border text-warning"
                        role="status"
                    >
                        <span className="visually-hidden">
                            Loading...
                        </span>
                    </div>

                    <p>
                        Loading your profile...
                    </p>

                </div>

            </div>

        );

    }

    // ==================================================
    // MAIN PAGE
    // ==================================================

    return (

        <div className="customer-profile-page">

            {/* ==================================================
                NAVBAR
            ================================================== */}

            <nav className="customer-profile-navbar">

                {/* BRAND */}

                <div
                    className="customer-profile-brand"
                    onClick={handleLogout}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(e) => {

                        if (
                            e.key === "Enter" ||
                            e.key === " "
                        ) {

                            e.preventDefault();

                            handleLogout();

                        }

                    }}
                >

                    <img
                        src="/logo.png"
                        alt="Oorkaran"
                        className="customer-profile-logo"
                    />

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

                </div>

                {/* NAVIGATION BUTTONS */}

                <div className="customer-profile-nav-actions">

                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() =>
                            navigate("/customer-dashboard")
                        }
                    >

                        <i className="fa-solid fa-house me-2"></i>

                        Dashboard

                    </button>

                    <button
                        type="button"
                        className="btn btn-warning"
                        onClick={handleLogout}
                    >

                        <i className="fa-solid fa-right-from-bracket me-2"></i>

                        Logout

                    </button>

                </div>

            </nav>

            {/* ==================================================
                MAIN CONTAINER
            ================================================== */}

            <main className="customer-profile-container">

                {/* ==================================================
                    PAGE HEADING
                ================================================== */}

                <div className="customer-profile-heading">

                    <span className="customer-profile-label">
                        MY ACCOUNT
                    </span>

                    <h1>
                        Customer Profile
                    </h1>

                    <p>
                        Manage your personal information and account details.
                    </p>

                </div>

                {/* ==================================================
                    MESSAGE
                ================================================== */}

                {message && (

                    <div
                        className={`alert alert-${messageType} customer-profile-alert`}
                        role="alert"
                    >

                        <i
                            className={`fa-solid ${
                                messageType === "success"
                                    ? "fa-circle-check"
                                    : "fa-circle-exclamation"
                            } me-2`}
                        ></i>

                        {message}

                    </div>

                )}

                {/* ==================================================
                    PROFILE CARD
                ================================================== */}

                {profile && (

                    <div className="customer-profile-card">

                        {/* ==================================================
                            PROFILE HEADER
                        ================================================== */}

                        <div className="customer-profile-header">

                            {/* PROFILE IMAGE */}

                            <div className="customer-profile-image-wrapper">

                                <label
    htmlFor="customer-profile-image-input"
    className={
        isEditing
            ? "customer-profile-image-editable"
            : ""
    }
    tabIndex={isEditing ? 0 : -1}
>

                                    {/* PREVIEW IMAGE */}

                                    {imagePreview ? (

                                        <img
                                            src={imagePreview}
                                            alt="Profile preview"
                                            className="customer-profile-image"
                                        />

                                    ) : profile.profile ? (

                                        <img
                                            src={profile.profile}
                                            alt={
                                                profile.name ||
                                                "Customer"
                                            }
                                            className="customer-profile-image"
                                        />

                                    ) : (

                                        <div className="customer-profile-image-placeholder">

                                            <i className="fa-solid fa-user"></i>

                                        </div>

                                    )}

                                    {/* IMAGE OVERLAY */}

                                    {isEditing && (

                                        <div className="customer-profile-image-overlay">

                                            <i className="fa-solid fa-camera"></i>

                                            <span>
                                                Change Photo
                                            </span>

                                        </div>

                                    )}

                                </label>

                                {/* FILE INPUT */}

                                {isEditing && (

                                    <input
                                        id="customer-profile-image-input"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageChange}
                                        className="d-none"
                                    />

                                )}

                            </div>

                            {/* PROFILE BASIC INFO */}

                            <div className="customer-profile-header-info">

                                <span className="customer-account-badge">

                                    <i className="fa-solid fa-circle-check me-1"></i>

                                    Customer Account

                                </span>

                                <h2>
                                    {profile.name || "Customer"}
                                </h2>

                                <p>
                                    @{profile.username || "username"}
                                </p>

                            </div>

                            {/* EDIT BUTTON */}

                            {!isEditing && (

                                <button
                                    type="button"
                                    className="btn btn-warning customer-edit-button"
                                    onClick={handleEdit}
                                >

                                    <i className="fa-solid fa-pen me-2"></i>

                                    Edit Profile

                                </button>

                            )}

                        </div>

                        {/* ==================================================
                            PROFILE BODY
                        ================================================== */}

                        <div className="customer-profile-body">

                            <div className="customer-profile-section-title">

                                <i className="fa-solid fa-user"></i>

                                <div>

                                    <h3>
                                        Personal Information
                                    </h3>

                                    <p>
                                        Your basic account information
                                    </p>

                                </div>

                            </div>

                            {/* FORM */}

                            <form onSubmit={handleSaveProfile}>

                                <div className="row g-4">

                                    {/* ==================================================
                                        NAME
                                    ================================================== */}

                                    <div className="col-md-6">

                                        <label
                                            htmlFor="customer-name"
                                            className="form-label"
                                        >
                                            Full Name
                                        </label>

                                        <div className="customer-input-wrapper">

                                            <i className="fa-solid fa-user"></i>

                                            <input
                                                id="customer-name"
                                                type="text"
                                                className="form-control"
                                                value={name}
                                                onChange={(e) =>
                                                    setName(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={!isEditing}
                                            />

                                        </div>

                                    </div>

                                    {/* ==================================================
                                        USERNAME
                                    ================================================== */}

                                    <div className="col-md-6">

                                        <label
                                            htmlFor="customer-username"
                                            className="form-label"
                                        >
                                            Username
                                        </label>

                                        <div className="customer-input-wrapper">

                                            <i className="fa-solid fa-at"></i>

                                            <input
                                                id="customer-username"
                                                type="text"
                                                className="form-control"
                                                value={username}
                                                onChange={(e) =>
                                                    setUsername(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={!isEditing}
                                            />

                                        </div>

                                    </div>

                                    {/* ==================================================
                                        EMAIL
                                    ================================================== */}

                                    <div className="col-md-6">

                                        <label
                                            htmlFor="customer-email"
                                            className="form-label"
                                        >
                                            Email Address
                                        </label>

                                        <div className="customer-input-wrapper">

                                            <i className="fa-solid fa-envelope"></i>

                                            <input
                                                id="customer-email"
                                                type="email"
                                                className="form-control"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={!isEditing}
                                            />

                                        </div>

                                    </div>

                                    {/* ==================================================
                                        PHONE
                                    ================================================== */}

                                    <div className="col-md-6">

                                        <label
                                            htmlFor="customer-phone"
                                            className="form-label"
                                        >
                                            Phone Number
                                        </label>

                                        <div className="customer-input-wrapper">

                                            <i className="fa-solid fa-phone"></i>

                                            <input
                                                id="customer-phone"
                                                type="tel"
                                                className="form-control"
                                                value={phone}
                                                onChange={(e) => {

                                                    const value =
                                                        e.target.value
                                                            .replace(
                                                                /\D/g,
                                                                ""
                                                            )
                                                            .slice(
                                                                0,
                                                                10
                                                            );

                                                    setPhone(value);

                                                }}
                                                disabled={!isEditing}
                                                maxLength="10"
                                            />

                                        </div>

                                    </div>

                                </div>

                                {/* ==================================================
                                    EDIT ACTIONS
                                ================================================== */}

                                {isEditing && (

                                    <div className="customer-profile-edit-actions">

                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCancelEdit}
                                            disabled={saving}
                                        >

                                            <i className="fa-solid fa-xmark me-2"></i>

                                            Cancel

                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-warning"
                                            disabled={saving}
                                        >

                                            {saving ? (

                                                <>

                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        role="status"
                                                    ></span>

                                                    Saving...

                                                </>

                                            ) : (

                                                <>

                                                    <i className="fa-solid fa-check me-2"></i>

                                                    Save Changes

                                                </>

                                            )}

                                        </button>

                                    </div>

                                )}

                            </form>

                        </div>

                        {/* ==================================================
                            ACCOUNT INFORMATION
                        ================================================== */}

                        <div className="customer-account-info">

                            <div className="customer-info-item">

                                <div className="customer-info-icon">

                                    <i className="fa-solid fa-shield-halved"></i>

                                </div>

                                <div>

                                    <strong>
                                        Account Security
                                    </strong>

                                    <span>
                                        Your account information is protected.
                                    </span>

                                </div>

                            </div>


                        </div>

                    </div>

                )}

            </main>

            {/* ==================================================
                LOGOUT CONFIRMATION MODAL
            ================================================== */}

            {showLogoutModal && (

                <div
                    className="customer-profile-modal-overlay"
                    onClick={handleCancelLogout}
                >

                    <div
                        className="customer-profile-logout-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* ICON */}

                        <div className="customer-logout-icon">

                            <i className="fa-solid fa-right-from-bracket"></i>

                        </div>

                        {/* TITLE */}

                        <h3>
                            Leave Oorkaran?
                        </h3>

                        {/* MESSAGE */}

                        <p>
                            Are you sure you want to logout?
                            Your customer session will be cleared.
                        </p>

                        {/* BUTTONS */}

                        <div className="customer-logout-actions">

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

            )}

        </div>

    );

}

export default Customer_Profile;
