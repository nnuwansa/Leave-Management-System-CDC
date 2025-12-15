import React, { useState, useEffect } from "react";
import { Send, Calendar, AlertCircle, Info, Menu } from "lucide-react";
import Navbar from "../Navbar/Navbar";
import EmployeeSidebar from "../Navbar/EmployeeSidebar";
import "../CSS/EmployeeDashboard.css";
import Header from "./EmployeeDashboard";
import API from "../../utils/apiUtils";

// Get leave type display name
const getLeaveTypeDisplayName = (leaveType) => {
  const displayNames = {
    CASUAL: "Casual Leave",
    SICK: "Medical Leave",
    DUTY: "Duty Leave",
    MATERNITY: "Maternity Leave",
    SHORT: "Short Leave",
    HALF_DAY: "Half Day Leave",
  };
  return displayNames[leaveType] || leaveType.replace("_", " ");
};

// Get proper title based on gender and marital status
const getTitle = (gender, maritalStatus) => {
  if (gender === "MALE") {
    return "Mr.";
  } else if (gender === "FEMALE") {
    if (maritalStatus === "MARRIED") {
      return "Mrs.";
    } else {
      return "Miss";
    }
  }
  return "";
};

// Format officer name with title
const formatOfficerName = (officer) => {
  const title = getTitle(officer.gender, officer.maritalStatus);
  return `${title} ${officer.name} - ${officer.designation}`;
};

// Define leave types
const leaveTypes = ["CASUAL", "SICK", "DUTY", "MATERNITY", "HALF_DAY", "SHORT"];

// Define payment options for maternity leave
const maternityPaymentOptions = [
  { value: "FULL_PAY", label: "Full Pay - 84 Days" },
  { value: "HALF_PAY", label: "Half Pay - 84 Days" },
  { value: "NO_PAY", label: "No Pay - 84 Days" },
];

// Helper: calculate days between two dates
const calculateDaysUtil = (start, end) => {
  if (!start || !end) return 0;
  const diffTime = new Date(end) - new Date(start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const SubmitLeaveRequest = ({
  showMessage: propShowMessage,
  refreshData = () => {},
}) => {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  // Responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  // State management
  const [currentUser, setCurrentUser] = useState(null);
  const [actingOfficers, setActingOfficers] = useState([]);
  const [supervisingOfficers, setSupervisingOfficers] = useState([]);
  const [approvalOfficers, setApprovalOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [leaveEntitlements, setLeaveEntitlements] = useState([]);
  const [shortLeaveEntitlements, setShortLeaveEntitlements] = useState([]);

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "",
    actingOfficerEmail: "",
    supervisingOfficerEmail: "",
    approvalOfficerEmail: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    halfDayPeriod: "MORNING",
    reason: "",
    maternityLeaveType: "FULL_PAY",
  });

  const today = new Date().toISOString().split("T")[0];

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

  // Message handling
  const showMessage = (message, isError = false) => {
    if (propShowMessage) {
      propShowMessage(message, isError);
    } else {
      if (isError) {
        setError(message);
        setSuccess("");
      } else {
        setSuccess(message);
        setError("");
      }
      setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
    }
  };

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const user = await API.get(`/admin/users/${email}`);
      setCurrentUser(user);
      if (user.department) {
        fetchDepartmentOfficers(user.department, user.email);
      }
    } catch (err) {
      showMessage("Failed to fetch user", true);
      console.error(err);
    }
  };

  // Fetch leave entitlements
  const fetchLeaveEntitlements = async () => {
    try {
      console.log("Fetching leave entitlements...");
      const entitlements = await API.get("/entitlements/my-entitlements");
      console.log("Raw entitlements received:", entitlements);

      if (Array.isArray(entitlements)) {
        const processedEntitlements = entitlements.map((entitlement) => {
          const halfDays = entitlement.accumulatedHalfDays || 0;
          const effectiveUsedDays = entitlement.usedDays + halfDays * 0.5;
          const effectiveRemainingDays =
            entitlement.totalEntitlement - effectiveUsedDays;

          return {
            ...entitlement,
            effectiveUsedDays: effectiveUsedDays,
            effectiveRemainingDays: effectiveRemainingDays,
            hasHalfDays: halfDays > 0,
          };
        });

        setLeaveEntitlements(processedEntitlements);
      } else {
        console.warn("Entitlements response is not an array:", entitlements);
        setLeaveEntitlements([]);
      }
    } catch (err) {
      console.error("Error fetching entitlements:", err);
      showMessage("Failed to fetch leave entitlements", true);
      setLeaveEntitlements([]);
    }
  };

  // Fetch short leave entitlements
  const fetchShortLeaveEntitlements = async () => {
    try {
      if (!token) {
        console.log("No token available for short leave entitlements");
        return;
      }

      const response = await API.get("/leaves/my-short-leave-entitlements");
      const data = Array.isArray(response.data) ? response.data : [];

      console.log("Short leave entitlements fetched:", data);

      // Only include current month's short leave
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const currentMonthData = data.filter(
        (item) => item.month === currentMonth && item.year === currentYear
      );

      setShortLeaveEntitlements(currentMonthData);
    } catch (error) {
      console.error("Error fetching short leave entitlements:", error);
      setShortLeaveEntitlements([]);
    }
  };

  // Fetch department officers - includes supervising officers
  const fetchDepartmentOfficers = async (department, currentUserEmail) => {
    try {
      console.log("Fetching officers for department:", department);

      if (department === "All") {
        try {
          const allDeptOfficers = await API.get(
            `/employee/officers/department/All/exclude/${encodeURIComponent(
              currentUserEmail
            )}`
          );

          console.log("All department officers response:", allDeptOfficers);

          const sortedOfficers = Array.isArray(allDeptOfficers.acting)
            ? allDeptOfficers.acting.sort((a, b) =>
                a.name.localeCompare(b.name)
              )
            : [];

          setActingOfficers(sortedOfficers);
          setSupervisingOfficers(sortedOfficers);

          setApprovalOfficers(
            Array.isArray(allDeptOfficers.approval)
              ? allDeptOfficers.approval
                  .filter(
                    (officer, index, self) =>
                      index === self.findIndex((o) => o.email === officer.email)
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
              : []
          );
        } catch (err) {
          console.warn("Error fetching 'All' department officers:", err);
          setActingOfficers([]);
          setSupervisingOfficers([]);
          setApprovalOfficers([]);
        }
      } else {
        try {
          const deptOfficers = await API.get(
            `/employee/officers/department/${encodeURIComponent(
              department
            )}/exclude/${encodeURIComponent(currentUserEmail)}`
          );

          console.log("Department officers response:", deptOfficers);

          const sortedDeptOfficers = Array.isArray(deptOfficers.acting)
            ? deptOfficers.acting.sort((a, b) => a.name.localeCompare(b.name))
            : [];

          setActingOfficers(sortedDeptOfficers);
          setSupervisingOfficers(sortedDeptOfficers);

          try {
            const allDeptOfficers = await API.get(
              `/employee/officers/department/All/exclude/${encodeURIComponent(
                currentUserEmail
              )}`
            );

            setApprovalOfficers(
              Array.isArray(allDeptOfficers.approval)
                ? allDeptOfficers.approval
                    .filter(
                      (officer, index, self) =>
                        index ===
                        self.findIndex((o) => o.email === officer.email)
                    )
                    .sort((a, b) => a.name.localeCompare(b.name))
                : []
            );
          } catch (err) {
            console.warn("Could not fetch 'All' department officers:", err);
            setApprovalOfficers([]);
          }
        } catch (err) {
          console.error("Error fetching department officers:", err);
          showMessage("Failed to fetch department officers", true);
          setActingOfficers([]);
          setSupervisingOfficers([]);
          setApprovalOfficers([]);
        }
      }
    } catch (err) {
      showMessage("Failed to fetch department officers", true);
      console.error(err);
    }
  };

  // Handle Leave Submission
  const handleSubmitLeave = async () => {
    // Basic validation
    if (
      !leaveForm.leaveType ||
      !leaveForm.approvalOfficerEmail ||
      !leaveForm.startDate
    ) {
      showMessage(
        "Please fill all required fields (Leave Type, Approval Officer, Start Date)!",
        true
      );
      return;
    }

    // Specific validation for different leave types
    if (leaveForm.leaveType === "HALF_DAY") {
      if (!leaveForm.halfDayPeriod) {
        showMessage("Please select half day period!", true);
        return;
      }
    } else if (leaveForm.leaveType === "SHORT") {
      if (!leaveForm.startTime || !leaveForm.endTime) {
        showMessage("Please provide start and end time for short leave!", true);
        return;
      }
      if (leaveForm.startTime >= leaveForm.endTime) {
        showMessage("End time must be after start time!", true);
        return;
      }
    } else if (leaveForm.leaveType === "MATERNITY") {
      if (!leaveForm.maternityLeaveType) {
        showMessage("Please select payment type for maternity leave!", true);
        return;
      }
    } else {
      if (!leaveForm.endDate) {
        showMessage("Please provide end date!", true);
        return;
      }
      if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
        showMessage("End date cannot be before start date!", true);
        return;
      }
    }

    // Officer uniqueness validation
    const selectedOfficers = [
      leaveForm.actingOfficerEmail,
      leaveForm.supervisingOfficerEmail,
      leaveForm.approvalOfficerEmail,
    ].filter((email) => email && email !== "" && email !== "NONE");

    const uniqueOfficers = new Set(selectedOfficers);
    if (selectedOfficers.length !== uniqueOfficers.size) {
      showMessage("Please select different officers for each role!", true);
      return;
    }

    try {
      setLoading(true);

      // Prepare the request data
      let requestData = {
        leaveType: leaveForm.leaveType,
        actingOfficerEmail:
          leaveForm.actingOfficerEmail === "NONE"
            ? null
            : leaveForm.actingOfficerEmail,
        supervisingOfficerEmail:
          leaveForm.supervisingOfficerEmail === "NONE"
            ? null
            : leaveForm.supervisingOfficerEmail,
        approvalOfficerEmail: leaveForm.approvalOfficerEmail,
        startDate: leaveForm.startDate,
        reason: leaveForm.reason || "",
      };

      // Set end date and additional fields based on leave type
      if (leaveForm.leaveType === "HALF_DAY") {
        requestData.endDate = leaveForm.startDate;
        requestData.halfDayPeriod = leaveForm.halfDayPeriod;
        requestData.isHalfDay = true;
      } else if (leaveForm.leaveType === "SHORT") {
        requestData.endDate = leaveForm.startDate;
        requestData.startTime = leaveForm.startTime;
        requestData.endTime = leaveForm.endTime;
      } else if (leaveForm.leaveType === "MATERNITY") {
        requestData.maternityLeaveType = leaveForm.maternityLeaveType;
      } else {
        requestData.endDate = leaveForm.endDate;
      }

      // Validate the leave request before submission
      try {
        let validation;

        if (leaveForm.leaveType === "SHORT") {
          validation = await API.post("/leaves/validate-short-leave", {
            date: leaveForm.startDate,
          });
        } else if (leaveForm.leaveType === "HALF_DAY") {
          validation = await API.post("/leaves/validate-half-day", {
            date: leaveForm.startDate,
            halfDayPeriod: leaveForm.halfDayPeriod,
          });
        } else if (leaveForm.leaveType === "MATERNITY") {
          validation = await API.post("/leaves/validate-maternity", {
            startDate: leaveForm.startDate,
            maternityLeaveType: leaveForm.maternityLeaveType,
          });
        } else {
          validation = await API.post("/leaves/validate", {
            leaveType: leaveForm.leaveType,
            startDate: leaveForm.startDate,
            endDate: leaveForm.endDate,
            isHalfDay: false,
          });
        }

        if (!validation.valid) {
          showMessage(validation.message, true);
          return;
        }
      } catch (validationError) {
        showMessage(validationError.message || "Leave validation failed", true);
        return;
      }

      // Submit the leave request
      const response = await API.post("/leaves/submit", requestData);
      showMessage(
        typeof response === "string"
          ? response.replace("✅ ", "")
          : "Leave submitted successfully"
      );

      // Reset form
      setLeaveForm({
        leaveType: "",
        actingOfficerEmail: "",
        supervisingOfficerEmail: "",
        approvalOfficerEmail: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        halfDayPeriod: "MORNING",
        reason: "",
        maternityLeaveType: "FULL_PAY",
      });

      // Refresh data
      refreshData();
    } catch (err) {
      showMessage(err.message || "Failed to submit leave request", true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    if (!token || !email) return;

    console.log("Initializing SubmitLeaveRequest component...");
    fetchCurrentUser();
    fetchLeaveEntitlements();
    fetchShortLeaveEntitlements();
  }, [email, token]);

  // Authentication check
  if (!token || !email) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning d-flex align-items-center shadow-lg border-0 rounded-4">
              <AlertCircle size={20} className="me-3 text-warning" />
              <div>
                <h6 className="mb-1 fw-semibold">Authentication Required</h6>
                <p className="mb-0">Please log in to submit a leave request.</p>
              </div>
            </div>
          </div>
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
        {/* Header Component */}
        <Header />

        {/* Submit Leave Form Section */}
        <div className={`container-fluid ${isMobile ? "px-0" : "px-4"} py-4`}>
          {/* Success & Error Messages */}
          {success && (
            <div className="alert alert-success d-flex align-items-center shadow-lg border-0 rounded-4 mb-4">
              <div>
                <strong>Success!</strong> {success}
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger d-flex align-items-center shadow-lg border-0 rounded-4 mb-4">
              <AlertCircle size={20} className="me-3" />
              <div>
                <strong>Error!</strong> {error}
              </div>
            </div>
          )}

          <div className="glass-card rounded-4 mb-4">
            <div className={`p-${isMobile ? "3" : "4"}`}>
              <div
                className={`d-flex align-items-center mb-4 ${
                  isMobile ? "flex-column text-center" : ""
                }`}
              >
                <Send size={isMobile ? 20 : 24} className="text-primary me-3" />
                <h5
                  className={`mb-0 fw-bold text-dark ${isMobile ? "mt-2" : ""}`}
                  style={{ fontSize: isMobile ? "1.1rem" : "1.25rem" }}
                >
                  SUBMIT LEAVE REQUEST
                </h5>
              </div>

              <div
                className="alert alert-info d-flex align-items-start border-0 rounded-3 mb-4"
                style={{ backgroundColor: "#e3f2fd" }}
              >
                <Info
                  size={20}
                  className="me-3 mt-1 text-primary flex-shrink-0"
                />
                <div>
                  <h6
                    className={`mb-3 fw-semibold text-primary ${
                      isMobile ? "fs-6" : ""
                    }`}
                  >
                    Officer Selection Guidelines
                  </h6>

                  {/* Approval Flow */}
                  <div
                    className={`mb-3 p-2 bg-white rounded-2 ${
                      isMobile ? "text-center" : "align-items-center"
                    }`}
                  >
                    <small
                      className="text-muted fw-semibold mx-2"
                      style={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                    >
                      Leave Approval Process:
                    </small>
                    <small
                      className="text-muted mx-2"
                      style={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}
                    >
                      {isMobile ? (
                        <>Acting → Supervising → Approval Officer</>
                      ) : (
                        <>
                          Acting Officer → Supervising Officer → Approval
                          Officer
                        </>
                      )}
                    </small>
                  </div>

                  <div className="mb-2">
                    <p
                      className="mb-1 text-dark"
                      style={{ fontSize: isMobile ? "12px" : "14px" }}
                    >
                      • You may select <strong>"None"</strong> for Acting or
                      Supervising Officer if they are not required. Your leave
                      will be routed directly to the next available approver.
                    </p>
                  </div>

                  <div className="mb-3">
                    <p
                      className="mb-1 text-danger fw-semibold"
                      style={{ fontSize: isMobile ? "12px" : "14px" }}
                    >
                      • If an Acting Officer or Supervising Officer is required
                      for your leave, you must select them. Otherwise, your
                      leave request will be rejected.
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitLeave();
                }}
              >
                <div className="row g-3">
                  {/* Leave Type */}
                  <div
                    className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}
                  >
                    <label
                      className="form-label fw-semibold text-dark"
                      style={{ fontSize: isMobile ? "13px" : "14px" }}
                    >
                      Leave Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select border-0 shadow-sm rounded-3"
                      style={{
                        height: isMobile ? "40px" : "45px",
                        fontSize: isMobile ? "13px" : "14px",
                      }}
                      value={leaveForm.leaveType}
                      onChange={(e) =>
                        setLeaveForm({
                          ...leaveForm,
                          leaveType: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes.map((type) => (
                        <option key={type} value={type}>
                          {getLeaveTypeDisplayName(type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Acting Officer */}
                  <div
                    className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}
                  >
                    <label
                      className="form-label fw-semibold text-dark"
                      style={{ fontSize: isMobile ? "13px" : "14px" }}
                    >
                      Acting Officer{" "}
                      <span className="text-muted">(Optional)</span>
                    </label>
                    <select
                      className="form-select border-0 shadow-sm rounded-3"
                      style={{
                        height: isMobile ? "40px" : "45px",
                        fontSize: isMobile ? "13px" : "14px",
                      }}
                      value={leaveForm.actingOfficerEmail}
                      onChange={(e) =>
                        setLeaveForm({
                          ...leaveForm,
                          actingOfficerEmail: e.target.value,
                        })
                      }
                    >
                      <option value="">
                        {actingOfficers.length === 0
                          ? "Loading..."
                          : "Select Acting Officer"}
                      </option>
                      <option value="NONE">None</option>
                      {actingOfficers.map((officer) => (
                        <option key={officer.email} value={officer.email}>
                          {formatOfficerName(officer)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Supervising Officer */}
                  <div
                    className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}
                  >
                    <label
                      className="form-label fw-semibold text-dark"
                      style={{ fontSize: isMobile ? "13px" : "14px" }}
                    >
                      Supervising Officer{" "}
                      <span className="text-muted">(Optional)</span>
                    </label>
                    <select
                      className="form-select border-0 shadow-sm rounded-3"
                      style={{
                        height: isMobile ? "40px" : "45px",
                        fontSize: isMobile ? "13px" : "14px",
                      }}
                      value={leaveForm.supervisingOfficerEmail}
                      onChange={(e) =>
                        setLeaveForm({
                          ...leaveForm,
                          supervisingOfficerEmail: e.target.value,
                        })
                      }
                    >
                      <option value="">
                        {supervisingOfficers.length === 0
                          ? "Loading..."
                          : "Select Supervising Officer"}
                      </option>
                      <option value="NONE">None</option>
                      {supervisingOfficers
                        .filter(
                          (officer) =>
                            officer.email !== leaveForm.actingOfficerEmail
                        )
                        .map((officer) => (
                          <option key={officer.email} value={officer.email}>
                            {formatOfficerName(officer)}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Approval Officer */}
                  <div
                    className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}
                  >
                    <label
                      className="form-label fw-semibold text-dark"
                      style={{ fontSize: isMobile ? "13px" : "14px" }}
                    >
                      Approval Officer <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select border-0 shadow-sm rounded-3"
                      style={{
                        height: isMobile ? "40px" : "45px",
                        fontSize: isMobile ? "13px" : "14px",
                      }}
                      value={leaveForm.approvalOfficerEmail}
                      onChange={(e) =>
                        setLeaveForm({
                          ...leaveForm,
                          approvalOfficerEmail: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">
                        {approvalOfficers.length === 0
                          ? "Loading..."
                          : "Select Approval Officer"}
                      </option>
                      {approvalOfficers
                        .filter(
                          (officer) =>
                            officer.email !== leaveForm.actingOfficerEmail &&
                            officer.email !== leaveForm.supervisingOfficerEmail
                        )
                        .map((officer) => (
                          <option key={officer.email} value={officer.email}>
                            {formatOfficerName(officer)}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div
                    className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}
                  >
                    <label
                      className="form-label fw-semibold text-dark"
                      style={{ fontSize: isMobile ? "13px" : "14px" }}
                    >
                      Start Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control border-0 shadow-sm rounded-3"
                      style={{
                        height: isMobile ? "40px" : "45px",
                        fontSize: isMobile ? "13px" : "14px",
                      }}
                      value={leaveForm.startDate}
                      min={today}
                      onChange={(e) =>
                        setLeaveForm({
                          ...leaveForm,
                          startDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* End Date - Hidden for SHORT, HALF_DAY, and MATERNITY */}
                  {leaveForm.leaveType !== "SHORT" &&
                    leaveForm.leaveType !== "HALF_DAY" &&
                    leaveForm.leaveType !== "MATERNITY" && (
                      <div
                        className={`${
                          isMobile ? "col-12" : "col-lg-4 col-md-6"
                        }`}
                      >
                        <label
                          className="form-label fw-semibold text-dark"
                          style={{ fontSize: isMobile ? "13px" : "14px" }}
                        >
                          End Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control border-0 shadow-sm rounded-3"
                          style={{
                            height: isMobile ? "40px" : "45px",
                            fontSize: isMobile ? "13px" : "14px",
                          }}
                          value={leaveForm.endDate}
                          min={leaveForm.startDate || today}
                          onChange={(e) =>
                            setLeaveForm({
                              ...leaveForm,
                              endDate: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    )}

                  {/* Maternity Payment Type - Only for MATERNITY leave */}
                  {leaveForm.leaveType === "MATERNITY" && (
                    <div
                      className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}
                    >
                      <label
                        className="form-label fw-semibold text-dark"
                        style={{ fontSize: isMobile ? "13px" : "14px" }}
                      >
                        Payment Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select border-0 shadow-sm rounded-3"
                        style={{
                          height: isMobile ? "40px" : "45px",
                          fontSize: isMobile ? "13px" : "14px",
                        }}
                        value={leaveForm.maternityLeaveType}
                        onChange={(e) =>
                          setLeaveForm({
                            ...leaveForm,
                            maternityLeaveType: e.target.value,
                          })
                        }
                        required
                      >
                        {maternityPaymentOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Half Day Period Selection */}
                  {leaveForm.leaveType === "HALF_DAY" && (
                    <div
                      className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}
                    >
                      <label
                        className="form-label fw-semibold text-dark"
                        style={{ fontSize: isMobile ? "13px" : "14px" }}
                      >
                        Half Day Period <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select border-0 shadow-sm rounded-3"
                        style={{
                          height: isMobile ? "40px" : "45px",
                          fontSize: isMobile ? "13px" : "14px",
                        }}
                        value={leaveForm.halfDayPeriod}
                        onChange={(e) =>
                          setLeaveForm({
                            ...leaveForm,
                            halfDayPeriod: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="MORNING">Morning (1st Half)</option>
                        <option value="AFTERNOON">Afternoon (2nd Half)</option>
                      </select>
                    </div>
                  )}

                  {/* Short Leave Time Selection */}
                  {leaveForm.leaveType === "SHORT" && (
                    <>
                      <div
                        className={`${
                          isMobile ? "col-6" : "col-lg-2 col-md-6"
                        }`}
                      >
                        <label
                          className="form-label fw-semibold text-dark"
                          style={{ fontSize: isMobile ? "13px" : "14px" }}
                        >
                          Start Time <span className="text-danger">*</span>
                        </label>
                        <input
                          type="time"
                          className="form-control border-0 shadow-sm rounded-3"
                          style={{
                            height: isMobile ? "40px" : "45px",
                            fontSize: isMobile ? "13px" : "14px",
                          }}
                          value={leaveForm.startTime}
                          onChange={(e) =>
                            setLeaveForm({
                              ...leaveForm,
                              startTime: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div
                        className={`${
                          isMobile ? "col-6" : "col-lg-2 col-md-6"
                        }`}
                      >
                        <label
                          className="form-label fw-semibold text-dark"
                          style={{ fontSize: isMobile ? "13px" : "14px" }}
                        >
                          End Time <span className="text-danger">*</span>
                        </label>
                        <input
                          type="time"
                          className="form-control border-0 shadow-sm rounded-3"
                          style={{
                            height: isMobile ? "40px" : "45px",
                            fontSize: isMobile ? "13px" : "14px",
                          }}
                          value={leaveForm.endTime}
                          onChange={(e) =>
                            setLeaveForm({
                              ...leaveForm,
                              endTime: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Duration Display */}
                  {leaveForm.startDate && (
                    <div className="col-12">
                      <div
                        className={`p-3 bg-light rounded-3 ${
                          isMobile ? "text-center" : ""
                        }`}
                      >
                        <div
                          className={`d-flex ${
                            isMobile ? "flex-column" : ""
                          } align-items-center ${
                            isMobile ? "text-center" : ""
                          }`}
                        >
                          <Calendar
                            size={20}
                            className={`text-primary ${
                              isMobile ? "mb-2" : "me-2"
                            }`}
                          />
                          <span
                            className="fw-semibold text-dark"
                            style={{ fontSize: isMobile ? "0.9rem" : "1rem" }}
                          >
                            {leaveForm.leaveType === "HALF_DAY" &&
                              `Half Day Leave - ${leaveForm.halfDayPeriod} Period`}
                            {leaveForm.leaveType === "SHORT" &&
                              leaveForm.startTime &&
                              leaveForm.endTime &&
                              `Short Leave: ${leaveForm.startTime} - ${leaveForm.endTime}`}
                            {leaveForm.leaveType === "MATERNITY" &&
                              `Maternity Leave - Start Date: ${new Date(
                                leaveForm.startDate
                              ).toLocaleDateString()} (${
                                maternityPaymentOptions.find(
                                  (opt) =>
                                    opt.value === leaveForm.maternityLeaveType
                                )?.label
                              }) - End date will be determined by admin`}
                            {leaveForm.leaveType !== "HALF_DAY" &&
                              leaveForm.leaveType !== "SHORT" &&
                              leaveForm.leaveType !== "MATERNITY" &&
                              leaveForm.endDate &&
                              `Total Days: ${calculateDaysUtil(
                                leaveForm.startDate,
                                leaveForm.endDate
                              )}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="col-12">
                    <label
                      className="form-label fw-semibold text-dark"
                      style={{ fontSize: isMobile ? "13px" : "14px" }}
                    >
                      Reason for Leave
                    </label>
                    <textarea
                      className="form-control border-0 shadow-sm rounded-3"
                      style={{ fontSize: isMobile ? "13px" : "14px" }}
                      rows={isMobile ? "2" : "3"}
                      value={leaveForm.reason}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, reason: e.target.value })
                      }
                      placeholder="Please provide the reason for your leave request..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="col-12 d-flex justify-content-center mt-4">
                    <button
                      type="submit"
                      className="btn btn-lg px-4 py-3 rounded-3 shadow-sm text-white"
                      disabled={
                        loading ||
                        actingOfficers.length === 0 ||
                        supervisingOfficers.length === 0 ||
                        approvalOfficers.length === 0
                      }
                      style={{
                        minWidth: isMobile ? "90%" : "200px",
                        background:
                          "linear-gradient(135deg, #5b9ad9 0%, #0d4f92 100%)",
                        border: "none",
                        fontSize: isMobile ? "14px" : "16px",
                        fontWeight: "600",
                        height: isMobile ? "45px" : "auto",
                      }}
                    >
                      {loading ? (
                        <>
                          <div
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={isMobile ? 16 : 18} className="me-2" />
                          Submit Leave Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
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
          .btn-lg {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
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
      `}</style>
    </div>
  );
};

export default SubmitLeaveRequest;
