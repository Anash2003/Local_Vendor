import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

function CustomerForgotPassword() {

    const navigate = useNavigate();

    const [step, setStep] = useState(1);

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);


    // STEP 1 - Send OTP
    const sendOTP = async (e) => {

        e.preventDefault();

        setMessage('');
        setError('');

        if (!email) {
            setError('Please enter your email');
            return;
        }

        try {

            setLoading(true);

            const response = await axios.post(
                './api/customer/forgot-password/',
                {
                    email: email
                }
            );

            setMessage(response.data.message);

            setStep(2);

        } catch (error) {

            if (error.response) {
                setError(error.response.data.message);
            } else {
                setError('Something went wrong');
            }

        } finally {
            setLoading(false);
        }
    };


    // STEP 2 - Verify OTP
    const verifyOTP = async (e) => {

        e.preventDefault();

        setMessage('');
        setError('');

        if (!otp) {
            setError('Please enter the OTP');
            return;
        }

        try {

            setLoading(true);

            const response = await axios.post(
                './api/customer/verify-otp/',
                {
                    email: email,
                    otp: otp
                }
            );

            setMessage(response.data.message);

            setStep(3);

        } catch (error) {

            if (error.response) {
                setError(error.response.data.message);
            } else {
                setError('Something went wrong');
            }

        } finally {
            setLoading(false);
        }
    };


    // STEP 3 - Reset Password
    const resetPassword = async (e) => {

        e.preventDefault();

        setMessage('');
        setError('');

        if (!password || !confirmPassword) {
            setError('Please enter both passwords');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {

            setLoading(true);

            const response = await axios.post(
                './api/customer/reset-password/',
                {
                    email: email,
                    otp: otp,
                    password: password
                }
            );

            setMessage(response.data.message);

            setTimeout(() => {
                navigate('/customer-login');
            }, 1500);

        } catch (error) {

            if (error.response) {
                setError(error.response.data.message);
            } else {
                setError('Something went wrong');
            }

        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="forgot-password-page">

            <div className="forgot-password-card">

                {/* Brand */}
                <div className="text-center mb-4">

                    <span className="fw-bold fs-3">
                        ஊர்
                        <span style={{ color: 'var(--primary)' }}>
                            க்காரன்
                        </span>
                    </span>

                    <h3 className="mt-3">
                        Forgot Password
                    </h3>

                    <p className="text-muted">
                        {step === 1 && 'Enter your email to receive an OTP'}
                        {step === 2 && 'Enter the OTP sent to your email'}
                        {step === 3 && 'Create your new password'}
                    </p>

                </div>


                {/* Messages */}

                {message && (
                    <div className="alert alert-success">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}


                {/* STEP 1 */}

                {step === 1 && (

                    <form onSubmit={sendOTP}>

                        <div className="mb-3">

                            <label className="form-label">
                                Email
                            </label>

                            <input
                                type="email"
                                className="form-control"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                        </div>

                        <button
                            type="submit"
                            className="btn w-100"
                            style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white'
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>

                    </form>

                )}


                {/* STEP 2 */}

                {step === 2 && (

                    <form onSubmit={verifyOTP}>

                        <div className="mb-3">

                            <label className="form-label">
                                OTP
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter 6-digit OTP"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />

                        </div>

                        <button
                            type="submit"
                            className="btn w-100"
                            style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white'
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                    </form>

                )}


                {/* STEP 3 */}

                {step === 3 && (

                    <form onSubmit={resetPassword}>

                        <div className="mb-3">

                            <label className="form-label">
                                New Password
                            </label>

                            <input
                                type="password"
                                className="form-control"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                        </div>


                        <div className="mb-3">

                            <label className="form-label">
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                className="form-control"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />

                        </div>


                        <button
                            type="submit"
                            className="btn w-100"
                            style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white'
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>

                    </form>

                )}


                {/* Back to Login */}

                <div className="text-center mt-4">

                    <button
                        className="btn btn-link text-decoration-none"
                        onClick={() => navigate('/customer-login')}
                    >
                        ← Back to Login
                    </button>

                </div>

            </div>

        </div>
    );
}

export default CustomerForgotPassword;