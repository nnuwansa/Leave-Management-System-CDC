import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import Navbar from "../Navbar/Navbar";
import EmployeeSidebar from "../Navbar/EmployeeSidebar";
import EmployeeDashboard from "./EmployeeDashboard";
import API from "../../utils/apiUtils";
import "../CSS/EmployeeDashboard.css";

const Settings = ({ user, showMessage }) => {
  // Responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  // Component state
  const [activeSection, setActiveSection] = useState("profile");
  const [currentUser, setCurrentUser] = useState(user || null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  // Get credentials
  const getEmail = () => {
    try {
      return (
        localStorage?.getItem("email") ||
        localStorage?.getItem("userEmail") ||
        null
      );
    } catch (e) {
      return null;
    }
  };

  const getToken = () => {
    try {
      return localStorage?.getItem("token") || null;
    } catch (e) {
      return null;
    }
  };

  const email = getEmail();
  const token = getToken();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarSections = [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
  ];

  // Fetch current user data
  useEffect(() => {
    if (token && email) {
      console.log("Initializing settings...");
      fetchCurrentUser();
    } else {
      console.error("Missing authentication credentials");
      if (showMessage) {
        showMessage("Authentication required. Please log in.", true);
      }
    }
  }, [token, email]);

  const fetchCurrentUser = async () => {
    if (!email) {
      if (showMessage) {
        showMessage("Email not found. Please log in again.", true);
      }
      return;
    }

    try {
      setLoading(true);
      let user;

      // Try different endpoints
      try {
        user = await API.get(`/admin/users/${email}`);
      } catch (adminError) {
        console.log("Admin endpoint failed, trying employee endpoint");
        try {
          user = await API.get(`/employee/profile/${email}`);
        } catch (employeeError) {
          console.log("Employee endpoint failed, trying user endpoint");
          user = await API.get(`/users/${email}`);
        }
      }

      setCurrentUser(user);
      console.log("User data fetched successfully:", user);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      if (showMessage) {
        showMessage(
          err.message || "Failed to fetch user data. Please try again.",
          true
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Update currentUser when user prop changes
  useEffect(() => {
    setCurrentUser(user || null);
  }, [user]);

  // Handler for password input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Password change handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      if (showMessage) {
        showMessage("New password and confirm password do not match", true);
      }
      return;
    }

    if (!email) {
      if (showMessage) {
        showMessage("Email not found. Please log in again.", true);
      }
      return;
    }

    try {
      setLoading(true);

      const requestBody = {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      };

      await API.put(`/employee/change-password/${email}`, requestBody);

      if (showMessage) {
        showMessage("Password changed successfully!");
      }

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Password change error:", err);

      let errorMessage = "Failed to change password";

      if (
        err.message.includes("401") ||
        err.message.toLowerCase().includes("unauthorized")
      ) {
        errorMessage = "Current password is incorrect";
      } else if (
        err.message.includes("403") ||
        err.message.toLowerCase().includes("forbidden")
      ) {
        errorMessage = "Access denied. Please contact your administrator.";
      } else if (
        err.message.includes("400") ||
        err.message.toLowerCase().includes("bad request")
      ) {
        errorMessage = "Invalid password format or requirements not met";
      } else if (err.message.toLowerCase().includes("network")) {
        errorMessage = "Network error. Please check your connection.";
      }

      if (showMessage) {
        showMessage(errorMessage, true);
      }
    } finally {
      setLoading(false);
    }
  };

  const isPasswordFormValid = () => {
    return (
      passwordForm.oldPassword &&
      passwordForm.newPassword &&
      passwordForm.confirmPassword &&
      passwordForm.newPassword.length >= 6 &&
      passwordForm.newPassword === passwordForm.confirmPassword
    );
  };

  const handleResetForm = () => {
    setPasswordForm({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // Show loading state or error if no authentication
  if (!token || !email) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #88b3df 0%, #b5cce7 50%, #75e3c0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "15px" : "20px",
        }}
      >
        <div className="alert alert-warning" role="alert">
          <Lock size={16} className="me-2" />
          Authentication required. Please log in to access settings.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #88b3df 0%, #b5cce7 50%, #75e3c0 100%)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Fixed Navbar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1030,
        }}
      >
        <Navbar setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Desktop Sidebar */}
      <div
        className="d-none d-lg-block position-fixed"
        style={{
          top: "60px",
          left: 0,
          bottom: 0,
          width: "280px",
          zIndex: 1020,
        }}
      >
        <EmployeeSidebar sidebarOpen={true} setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Mobile Sidebar */}
      {isMobile && (
        <EmployeeSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}

      {/* Main Content Area */}
      <div
        className="main-content"
        style={{
          marginLeft: isMobile ? "0" : "280px",
          marginTop: "60px",
          minHeight: "calc(100vh - 60px)",
          padding: isMobile ? "15px" : "20px",
        }}
      >
        {/* Dashboard Header Component */}
        <div style={{ position: "relative", zIndex: 1, marginBottom: "20px" }}>
          <EmployeeDashboard />
        </div>

        <div className={`container-fluid ${isMobile ? "px-0" : "px-4"} py-4`}>
          <div
            className="glass-card rounded-4 slide-in"
            style={{
              backgroundColor: "#bccee4f2",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Header */}
            <div className={`border-bottom p-${isMobile ? "3" : "4"}`}>
              <div
                className={`d-flex align-items-center ${
                  isMobile ? "justify-content-center text-center" : ""
                }`}
              >
                <div
                  className={`rounded-circle p-2 ${isMobile ? "" : "me-3"}`}
                  style={{ background: "rgba(31, 41, 55, 0.1)" }}
                >
                  <SettingsIcon
                    size={isMobile ? 18 : 20}
                    style={{ color: "#1f2937" }}
                  />
                </div>
                <h5
                  className={`mb-0 fw-semibold text-dark ${
                    isMobile ? "mt-2" : ""
                  }`}
                  style={{ fontSize: isMobile ? "1.1rem" : "1.25rem" }}
                >
                  SETTINGS
                </h5>
              </div>
            </div>

            <div className="row g-0">
              {/* Sidebar Navigation */}
              <div
                className="col-12"
                style={{ backgroundColor: "rgba(219, 233, 247, 0.5)" }}
              >
                <div className={`px-${isMobile ? "2" : "4"} py-2`}>
                  <nav
                    className={`nav d-flex ${
                      isMobile ? "justify-content-center" : ""
                    }`}
                  >
                    {sidebarSections.map((section) => (
                      <button
                        key={section.id}
                        className="nav-link border-0 bg-transparent position-relative"
                        onClick={() => setActiveSection(section.id)}
                        style={{
                          color:
                            activeSection === section.id ? "black" : "#666",
                          backgroundColor:
                            activeSection === section.id
                              ? "#9faebd"
                              : "transparent",
                          fontWeight:
                            activeSection === section.id ? "700" : "500",
                          fontSize: isMobile ? "14px" : "15px",
                          borderRadius: "8px",
                          boxShadow:
                            activeSection === section.id
                              ? "0 2px 10px rgba(0, 123, 255, 0.3)"
                              : "none",
                          transform:
                            activeSection === section.id
                              ? "translateY(-1px)"
                              : "translateY(0)",
                          border:
                            activeSection === section.id
                              ? "2px solid #0056b3"
                              : "1px solid transparent",
                          transition: "all 0.3s ease",
                          padding: isMobile ? "8px 16px" : "12px 24px",
                          margin: isMobile ? "0 4px" : "0 8px",
                        }}
                      >
                        {section.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Settings Content */}
              <div className="col-md-12">
                <div className={`p-${isMobile ? "3" : "4"}`}>
                  {/* Profile Section */}
                  {activeSection === "profile" && (
                    <div>
                      <h6
                        className={`fw-semibold mb-4 text-dark ${
                          isMobile ? "text-center fs-6" : ""
                        }`}
                      >
                        Profile Information
                      </h6>
                      {loading ? (
                        <div className="text-center py-4">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p
                            className={`mt-2 text-muted ${
                              isMobile ? "small" : ""
                            }`}
                          >
                            Loading profile information...
                          </p>
                        </div>
                      ) : currentUser ? (
                        <div className="row g-3">
                          {/* Row 1 */}
                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Full Name
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={currentUser.name || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>
                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Email
                            </label>
                            <input
                              type="email"
                              className="form-control"
                              value={currentUser.email || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>
                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              className="form-control"
                              value={currentUser.phoneNumber || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>

                          {/* Row 2 */}
                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Department
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={currentUser.department || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>
                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Designation
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={currentUser.designation || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>
                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Address
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={currentUser.address || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>

                          {/* Row 3 */}
                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Join Date
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              value={currentUser.joinDate || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>

                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Status
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={currentUser.status || "Active"}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>
                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Date of Birth
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={currentUser.dateOfBirth || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>

                          {/* Row 4 */}
                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              NIC No
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={currentUser.nationalId || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>

                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Gender
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={currentUser.gender || "Active"}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>
                          <div
                            className={`${isMobile ? "col-12" : "col-md-4"}`}
                          >
                            <label
                              className={`form-label fw-medium text-dark ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Emergency Contact
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={currentUser.emergencyContact || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontSize: isMobile ? "14px" : "16px",
                                height: isMobile ? "40px" : "auto",
                              }}
                            />
                          </div>

                          {/* Info Alert */}
                          <div className="col-12">
                            <div
                              className={`alert alert-info d-flex align-items-center ${
                                isMobile ? "text-center flex-column" : ""
                              }`}
                              role="alert"
                            >
                              <User
                                size={16}
                                className={`${isMobile ? "mb-2" : "me-2"}`}
                              />
                              <small
                                style={{ fontSize: isMobile ? "12px" : "14px" }}
                              >
                                Contact your administrator to update profile
                                information.
                              </small>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted">
                          <div className="alert alert-warning" role="alert">
                            <User size={16} className="me-2" />
                            <span
                              style={{ fontSize: isMobile ? "14px" : "16px" }}
                            >
                              Unable to load profile information. Please try
                              refreshing the page or contact support.
                            </span>
                          </div>
                          <button
                            className={`btn btn-primary mt-2 ${
                              isMobile ? "btn-sm" : ""
                            }`}
                            onClick={fetchCurrentUser}
                            disabled={loading}
                          >
                            {loading ? "Loading..." : "Retry"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Security Section */}
                  {activeSection === "security" && (
                    <div>
                      <h6
                        className={`fw-semibold mb-4 text-dark ${
                          isMobile ? "text-center fs-6" : ""
                        }`}
                      >
                        Security Settings
                      </h6>

                      {/* Change Password Form */}
                      <div
                        className="card border-0"
                        style={{ backgroundColor: "rgba(248, 249, 250, 0.8)" }}
                      >
                        <div className={`card-body p-${isMobile ? "3" : "4"}`}>
                          <h6
                            className={`card-title d-flex align-items-center mb-3 ${
                              isMobile
                                ? "justify-content-center text-center flex-column"
                                : ""
                            }`}
                          >
                            <Lock
                              size={18}
                              className={`text-primary ${
                                isMobile ? "mb-2" : "me-2"
                              }`}
                            />
                            <span
                              style={{ fontSize: isMobile ? "1rem" : "1.1rem" }}
                            >
                              Change Password
                            </span>
                          </h6>

                          {/* Current Password */}
                          <div className="mb-3">
                            <label
                              className={`form-label fw-medium ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Current Password
                            </label>
                            <div className="input-group">
                              <input
                                type={showOldPassword ? "text" : "password"}
                                className="form-control"
                                name="oldPassword"
                                value={passwordForm.oldPassword}
                                onChange={handleInputChange}
                                placeholder="Enter your current password"
                                disabled={loading}
                                style={{
                                  fontSize: isMobile ? "16px" : "14px", // Prevent zoom on iOS
                                  height: isMobile ? "44px" : "auto",
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() =>
                                  setShowOldPassword(!showOldPassword)
                                }
                                disabled={loading}
                                style={{ minWidth: isMobile ? "50px" : "auto" }}
                              >
                                {showOldPassword ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* New Password */}
                          <div className="mb-3">
                            <label
                              className={`form-label fw-medium ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              New Password
                            </label>
                            <div className="input-group">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                className="form-control"
                                name="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handleInputChange}
                                placeholder="Enter your new password"
                                disabled={loading}
                                style={{
                                  fontSize: isMobile ? "16px" : "14px", // Prevent zoom on iOS
                                  height: isMobile ? "44px" : "auto",
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                                disabled={loading}
                                style={{ minWidth: isMobile ? "50px" : "auto" }}
                              >
                                {showNewPassword ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            </div>
                            <small
                              className={`text-muted ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Password must be at least 6 characters long
                            </small>
                            {passwordForm.newPassword &&
                              passwordForm.newPassword.length < 6 && (
                                <small
                                  className={`text-danger d-block ${
                                    isMobile ? "small" : ""
                                  }`}
                                >
                                  Password is too short
                                </small>
                              )}
                          </div>

                          {/* Confirm Password */}
                          <div className="mb-3">
                            <label
                              className={`form-label fw-medium ${
                                isMobile ? "small" : ""
                              }`}
                            >
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              className="form-control"
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handleInputChange}
                              placeholder="Confirm your new password"
                              disabled={loading}
                              style={{
                                fontSize: isMobile ? "16px" : "14px", // Prevent zoom on iOS
                                height: isMobile ? "44px" : "auto",
                              }}
                            />
                            {passwordForm.newPassword &&
                              passwordForm.confirmPassword &&
                              passwordForm.newPassword !==
                                passwordForm.confirmPassword && (
                                <small
                                  className={`text-danger ${
                                    isMobile ? "small" : ""
                                  }`}
                                >
                                  Passwords do not match
                                </small>
                              )}
                          </div>

                          {/* Buttons */}
                          <div
                            className={`d-flex ${
                              isMobile
                                ? "flex-column gap-2"
                                : "justify-content-end"
                            }`}
                          >
                            <button
                              type="button"
                              className={`btn btn-outline-secondary ${
                                isMobile ? "w-100" : "me-2"
                              }`}
                              onClick={handleResetForm}
                              disabled={loading}
                              style={{
                                minHeight: isMobile ? "44px" : "auto",
                                fontSize: isMobile ? "14px" : "16px",
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className={`btn btn-primary ${
                                isMobile ? "w-100" : ""
                              }`}
                              onClick={handlePasswordChange}
                              disabled={loading || !isPasswordFormValid()}
                              style={{
                                minHeight: isMobile ? "44px" : "auto",
                                fontSize: isMobile ? "14px" : "16px",
                              }}
                            >
                              {loading ? (
                                <>
                                  <div
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                  ></div>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <Shield size={16} className="me-2" />
                                  Update Password
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        /* Glass effect */
        .glass-card {
          background: #bccee4f2;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        /* Mobile responsive adjustments */
        @media (max-width: 991.98px) {
          .main-content {
            margin-left: 0 !important;
          }

          /* Better mobile spacing */
          .container-fluid {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }

          /* Mobile form improvements */
          .form-select,
          .form-control {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }

          /* Mobile button improvements */
          .btn {
            min-height: 44px;
            font-size: 14px;
          }

          /* Mobile input groups */
          .input-group .btn {
            min-width: 50px;
          }
        }

        @media (max-width: 576px) {
          /* Extra small screens */
          .glass-card {
            border-radius: 1rem !important;
            margin: 0.5rem;
          }

          /* Stack form elements better on very small screens */
          .row.g-3 {
            gap: 0.75rem !important;
          }

          /* Improve alert spacing */
          .alert {
            margin-bottom: 1rem;
            padding: 0.75rem;
            font-size: 0.875rem;
          }

          /* Better mobile navigation tabs */
          .nav-link {
            padding: 0.5rem 0.75rem !important;
            margin: 0 0.25rem !important;
            font-size: 0.875rem !important;
          }
        }

        /* Ensure sidebar doesn't interfere on mobile */
        @media (max-width: 991.98px) {
          .translate-x-n100 {
            transform: translateX(-100%) !important;
          }

          .translate-x-0 {
            transform: translateX(0) !important;
          }
        }

        /* Loading animation */
        .spinner-border {
          animation: spinner-border 0.75s linear infinite;
        }

        @keyframes spinner-border {
          to {
            transform: rotate(360deg);
          }
        }

        /* Touch improvements for mobile */
        @media (pointer: coarse) {
          .form-select,
          .form-control,
          .btn {
            min-height: 44px;
          }

          .nav-link {
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        /* Enhanced accessibility */
        .form-label {
          margin-bottom: 0.5rem;
        }

        /* Slide in animation */
        .slide-in {
          animation: slideIn 0.5s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Card hover effects */
        .card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        /* Focus styles for better accessibility */
        .form-control:focus,
        .form-select:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }

        .btn:focus {
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }

        /* Mobile Safari specific fixes */
        @supports (-webkit-touch-callout: none) {
          @media (max-width: 991.98px) {
            .form-control,
            .form-select {
              -webkit-appearance: none;
            }
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .glass-card {
            border: 2px solid #000;
          }

          .btn {
            border-width: 2px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .slide-in {
            animation: none;
          }

          .card {
            transition: none;
          }

          .nav-link {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
