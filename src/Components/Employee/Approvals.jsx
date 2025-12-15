import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Settings,
  Shield,
  Inbox,
  UserCog,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Check,
  X,
  Ban,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  Filter,
} from "lucide-react";
import Navbar from "../Navbar/Navbar";
import EmployeeSidebar from "../Navbar/EmployeeSidebar";
import "../CSS/EmployeeDashboard.css";
import EmployeeDashboard from "./EmployeeDashboard";
import API from "../../utils/apiUtils";

// ---------------- Approval Flow Component (Responsive) ----------------
const ApprovalFlow = ({
  leave,
  employeeDetails,
  isCompact = false,
  isMobile = false,
}) => {
  const getTitle = (gender, maritalStatus) => {
    if (!gender) return "";

    const genderUpper = gender.toString().toUpperCase();

    if (genderUpper === "MALE") {
      return "Mr.";
    } else if (genderUpper === "FEMALE") {
      const maritalStatusUpper = maritalStatus
        ? maritalStatus.toString().toUpperCase()
        : "";
      return maritalStatusUpper === "MARRIED" ? "Mrs." : "Miss.";
    }
    return "";
  };

  const formatOfficerName = (officerName) => {
    if (!officerName) return "Not Selected";

    const employeeData = employeeDetails[officerName];
    if (employeeData && employeeData.gender) {
      const title = getTitle(employeeData.gender, employeeData.maritalStatus);
      return title ? `${title} ${officerName}` : officerName;
    }

    return officerName;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return null;
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getStatusIcon = (
    status,
    isApproved,
    approvedAt,
    isCancelled = false,
    hasOfficer = true
  ) => {
    if (!hasOfficer) {
      return <Ban size={isMobile ? 10 : 12} className="text-muted" />;
    }
    if (isCancelled) {
      return <Ban size={isMobile ? 10 : 12} className="text-secondary" />;
    }
    if (isApproved && approvedAt) {
      return <Check size={isMobile ? 10 : 12} className="text-success" />;
    } else if (status === "REJECTED") {
      return <X size={isMobile ? 10 : 12} className="text-danger" />;
    } else if (status === "PENDING") {
      return <Clock size={isMobile ? 10 : 12} className="text-primary" />;
    }
    return <Clock size={isMobile ? 10 : 12} className="text-muted" />;
  };

  const getStatusColor = (
    status,
    isApproved,
    approvedAt,
    isCancelled = false,
    hasOfficer = true
  ) => {
    if (!hasOfficer) return "text-muted";
    if (isCancelled) return "text-secondary";
    if (isApproved && approvedAt) return "text-success";
    else if (status === "REJECTED") return "text-danger";
    else if (status === "PENDING") return "text-primary";
    return "text-muted";
  };

  // Check if officers exist
  const hasActingOfficer =
    leave.actingOfficerEmail &&
    leave.actingOfficerEmail !== "NONE" &&
    leave.actingOfficerName;
  const hasSupervisingOfficer =
    leave.supervisingOfficerEmail &&
    leave.supervisingOfficerEmail !== "NONE" &&
    leave.supervisingOfficerName;
  const hasApprovalOfficer =
    leave.approvalOfficerEmail &&
    leave.approvalOfficerEmail !== "NONE" &&
    leave.approvalOfficerName;

  // Check if leave is cancelled
  const isCancelled = leave.isCancelled || leave.status?.includes("CANCELLED");

  const actingOfficerApproved = leave.actingOfficerStatus === "APPROVED";
  const supervisingOfficerApproved =
    leave.supervisingOfficerStatus === "APPROVED";
  const approvalOfficerApproved = leave.approvalOfficerStatus === "APPROVED";

  const actingApprovedDateTime = formatDateTime(leave.actingOfficerApprovedAt);
  const supervisingApprovedDateTime = formatDateTime(
    leave.supervisingOfficerApprovedAt
  );
  const approvalApprovedDateTime = formatDateTime(
    leave.approvalOfficerApprovedAt
  );

  // Always show all three officers
  const officersToShow = [
    {
      type: "acting",
      name: hasActingOfficer
        ? formatOfficerName(leave.actingOfficerName)
        : "Not Assigned",
      status: hasActingOfficer ? leave.actingOfficerStatus : "NOT_ASSIGNED",
      approved: hasActingOfficer ? actingOfficerApproved : false,
      approvedAt: hasActingOfficer ? leave.actingOfficerApprovedAt : null,
      dateTime: hasActingOfficer ? actingApprovedDateTime : null,
      icon: User,
      title: isMobile ? "Acting" : "Acting Officer",
      hasOfficer: hasActingOfficer,
    },
    {
      type: "supervising",
      name: hasSupervisingOfficer
        ? formatOfficerName(leave.supervisingOfficerName)
        : "Not Assigned",
      status: hasSupervisingOfficer
        ? leave.supervisingOfficerStatus
        : "NOT_ASSIGNED",
      approved: hasSupervisingOfficer ? supervisingOfficerApproved : false,
      approvedAt: hasSupervisingOfficer
        ? leave.supervisingOfficerApprovedAt
        : null,
      dateTime: hasSupervisingOfficer ? supervisingApprovedDateTime : null,
      icon: UserCog,
      title: isMobile ? "Supervising" : "Supervising Officer",
      hasOfficer: hasSupervisingOfficer,
    },
    {
      type: "approval",
      name: hasApprovalOfficer
        ? formatOfficerName(leave.approvalOfficerName)
        : "Not Assigned",
      status: hasApprovalOfficer ? leave.approvalOfficerStatus : "NOT_ASSIGNED",
      approved: hasApprovalOfficer ? approvalOfficerApproved : false,
      approvedAt: hasApprovalOfficer ? leave.approvalOfficerApprovedAt : null,
      dateTime: hasApprovalOfficer ? approvalApprovedDateTime : null,
      icon: UserCheck,
      title: isMobile ? "Approval" : "Approval Officer",
      hasOfficer: hasApprovalOfficer,
    },
  ];

  const containerWidth = isMobile ? "70px" : isCompact ? "70px" : "120px";
  const containerHeight = isMobile ? "50px" : isCompact ? "60px" : "80px";
  const fontSize = isMobile ? "0.7rem" : isCompact ? "0.70rem" : "0.75rem";

  return (
    <div className="approval-flow-horizontal d-flex align-items-start justify-content-center">
      {officersToShow.map((officer, index) => {
        const IconComponent = officer.icon;
        const isLast = index === officersToShow.length - 1;

        return (
          <React.Fragment key={officer.type}>
            {/* Officer Container */}
            <div
              className="officer-container text-center"
              style={{ width: containerWidth, minHeight: containerHeight }}
            >
              <div
                className="d-flex align-items-center justify-content-center mb-1"
                style={{ minHeight: isMobile ? "14px" : "20px" }}
              >
                <div className="me-1">
                  {getStatusIcon(
                    officer.status,
                    officer.approved,
                    officer.approvedAt,
                    isCancelled,
                    officer.hasOfficer
                  )}
                </div>
                <IconComponent size={isMobile ? 8 : 10} className="me-1" />
              </div>

              <div
                className="mb-1"
                style={{ minHeight: isMobile ? "8px" : "10px" }}
              >
                <div
                  className="small text-muted"
                  style={{
                    fontSize: isMobile ? "0.5rem" : fontSize,
                    lineHeight: "1",
                  }}
                >
                  {officer.title}
                </div>
              </div>

              <div
                className={`fw-semibold text-center ${getStatusColor(
                  officer.status,
                  officer.approved,
                  officer.approvedAt,
                  isCancelled,
                  officer.hasOfficer
                )}`}
                style={{
                  fontSize: fontSize,
                  lineHeight: "1.1",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
                title={officer.name}
              >
                {isMobile
                  ? officer.name.length > 15
                    ? officer.name.substring(0, 15) + "..."
                    : officer.name
                  : officer.name.length > 15
                  ? officer.name.substring(0, 15) + "..."
                  : officer.name}
              </div>

              <div
                className="text-center mt-1"
                style={{ minHeight: isMobile ? "10px" : "15px" }}
              >
                {!officer.hasOfficer ? (
                  <div
                    className="small text-muted"
                    style={{ fontSize: isMobile ? "0.45rem" : "0.5rem" }}
                  >
                    N/A
                  </div>
                ) : isCancelled ? (
                  <div
                    className="small text-secondary"
                    style={{ fontSize: isMobile ? "0.45rem" : "0.5rem" }}
                  >
                    Cancelled
                  </div>
                ) : (
                  <>
                    {officer.dateTime && !isMobile && (
                      <div
                        className="small text-success"
                        style={{ fontSize: "0.5rem" }}
                      >
                        <div>{officer.dateTime.date}</div>
                      </div>
                    )}
                    {officer.status === "REJECTED" && (
                      <div
                        className="small text-danger"
                        style={{ fontSize: isMobile ? "0.45rem" : "0.5rem" }}
                      >
                        Rejected
                      </div>
                    )}
                    {officer.status === "PENDING" && !officer.approved && (
                      <div
                        className="small text-primary"
                        style={{ fontSize: isMobile ? "0.45rem" : "0.5rem" }}
                      >
                        Pending
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Arrow (if not last officer) */}
            {!isLast && (
              <div
                className="d-flex align-items-center justify-content-center mx-1"
                style={{ minHeight: isMobile ? "30px" : "40px" }}
              >
                <ArrowRight
                  size={isMobile ? 8 : 10}
                  className={
                    isCancelled
                      ? "text-secondary"
                      : officer.approved
                      ? "text-success"
                      : "text-muted"
                  }
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------- Mobile Card Component for Approval Item ----------------
const MobileApprovalCard = ({
  leave,
  employeeDetails,
  onApprove,
  onReject,
  loading,
  formatEmployeeName,
  getLeaveTypeDisplayName,
  calculateDuration,
  getRoleIcon,
  getRoleColor,
}) => {
  return (
    <div className="card border-0 shadow-sm mb-3 approval-card-mobile">
      <div className="card-body p-3">
        {/* Header Row */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <div
              className="fw-bold text-dark mb-1"
              style={{ fontSize: "0.9rem" }}
            >
              {formatEmployeeName(leave)}
            </div>
            <div className="small text-muted">
              {leave.receivedDate
                ? new Date(leave.receivedDate).toLocaleDateString()
                : new Date(
                    leave.requestDate || leave.createdAt || leave.dateSubmitted
                  ).toLocaleDateString()}
            </div>
          </div>
          <span
            className={`badge px-2 py-1 rounded-pill d-inline-flex align-items-center ${getRoleColor(
              leave.role
            )}`}
            style={{ fontSize: "0.7rem" }}
          >
            {getRoleIcon(leave.role)}
            <span style={{ fontSize: "0.7rem" }}>{leave.role}</span>
          </span>
        </div>

        {/* Leave Type and Reason */}
        <div className="mb-2">
          <span
            className="badge px-2 py-1 rounded-pill fw-semibold me-2"
            style={{
              backgroundColor: "#e9ecef",
              color: "#495057",
              fontSize: "0.75rem",
            }}
          >
            {getLeaveTypeDisplayName(leave.leaveType)}
          </span>
          {leave.leaveType === "MATERNITY" && leave.maternityLeaveType && (
            <span
              className="badge px-2 py-1 rounded-pill fw-semibold"
              style={{
                backgroundColor: "rgba(236, 72, 153, 0.1)",
                color: "#be185d",
                fontSize: "0.7rem",
              }}
            >
              {leave.maternityLeaveType.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="mb-2">
          <div className="small text-muted mb-1">Duration:</div>
          <div className="fw-semibold text-dark small">
            {leave.leaveType === "MATERNITY" ? (
              <>
                {new Date(leave.startDate).toLocaleDateString([], {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}
                <div className="small text-primary">
                  <Clock size={12} className="me-1" />
                  {(() => {
                    const paymentTypeLabels = {
                      FULL_PAY: "Full Pay - 84 Days",
                      HALF_PAY: "Half Pay - 84 Days",
                      NO_PAY: "No Pay - 84 Days",
                    };
                    return (
                      paymentTypeLabels[leave.maternityPaymentType] || "84 Days"
                    );
                  })()}
                </div>
              </>
            ) : leave.leaveType === "SHORT" ||
              leave.leaveType === "SHORT_LEAVE" ? (
              new Date(leave.startDate).toLocaleDateString([], {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })
            ) : leave.leaveType === "HALF_DAY" ? (
              `${new Date(leave.startDate).toLocaleDateString([], {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })} (${leave.halfDayPeriod || "MORNING"} period)`
            ) : (
              `${new Date(leave.startDate).toLocaleDateString([], {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })} → ${new Date(leave.endDate).toLocaleDateString([], {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}`
            )}
          </div>
          <div className="small text-muted">
            <Clock size={12} className="me-1" />
            {calculateDuration(
              leave.leaveType,
              leave.startDate,
              leave.endDate,
              leave.shortLeaveStartTime,
              leave.shortLeaveEndTime,
              leave.halfDayPeriod
            )}
          </div>
        </div>

        {/* Reason */}
        {leave.reason && (
          <div className="mb-2">
            <div className="small text-muted mb-1">
              <MessageSquare size={10} className="me-1" />
              Reason:
            </div>
            <div className="small text-dark">{leave.reason}</div>
          </div>
        )}

        {/* Approval Flow - Simplified for Mobile */}
        <div className="mb-3">
          <div className="small text-muted mb-2">Approval Chain:</div>
          <ApprovalFlow
            leave={leave}
            employeeDetails={employeeDetails}
            isCompact={true}
            isMobile={true}
          />
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2">
          <button
            className="btn btn-success flex-grow-1 d-flex align-items-center justify-content-center fw-semibold"
            style={{ fontSize: "0.8rem", height: "36px" }}
            onClick={() => onApprove(leave)}
            disabled={loading}
          >
            {loading ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
              ></span>
            ) : (
              <>
                <CheckCircle size={14} className="me-1" />
                APPROVE
              </>
            )}
          </button>
          <button
            className="btn btn-danger flex-grow-1 d-flex align-items-center justify-content-center fw-semibold"
            style={{ fontSize: "0.8rem", height: "36px" }}
            onClick={() => onReject(leave)}
            disabled={loading}
          >
            {loading ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
              ></span>
            ) : (
              <>
                <XCircle size={14} className="me-1" />
                REJECT
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- Mobile History Card Component ----------------
const MobileHistoryCard = ({
  leave,
  employeeDetails,
  formatEmployeeName,
  getLeaveTypeDisplayName,
  calculateDuration,
  getRoleIcon,
  getRoleColor,
}) => {
  const actionDate = new Date(
    leave.actionDate || leave.approvedAt || leave.rejectedAt || leave.createdAt
  );

  const actionTaken =
    leave.actionTaken ||
    leave.action ||
    (leave.status?.includes("APPROVED")
      ? "APPROVED"
      : leave.status?.includes("REJECTED")
      ? "REJECTED"
      : leave.status || "UNKNOWN");

  return (
    <div className="card border-0 shadow-sm mb-3 history-card-mobile">
      <div className="card-body p-3">
        {/* Header Row */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <div
              className="fw-bold text-dark mb-1"
              style={{ fontSize: "0.9rem" }}
            >
              {formatEmployeeName(leave)}
            </div>
            <div className="small text-muted">
              {actionDate.toLocaleDateString()} -{" "}
              {actionDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <span
            className={`badge px-2 py-1 rounded-pill fw-semibold ${
              actionTaken === "APPROVED"
                ? "bg-success text-white"
                : actionTaken === "REJECTED"
                ? "bg-danger text-white"
                : "bg-secondary text-white"
            }`}
            style={{ fontSize: "0.7rem" }}
          >
            {actionTaken === "APPROVED" ? (
              <>
                <CheckCircle size={12} className="me-1" />
                APPROVED
              </>
            ) : actionTaken === "REJECTED" ? (
              <>
                <XCircle size={12} className="me-1" />
                REJECTED
              </>
            ) : (
              actionTaken
            )}
          </span>
        </div>

        {/* Leave Type and Role */}
        <div className="mb-2 d-flex gap-2 flex-wrap">
          <span
            className="badge px-2 py-1 rounded-pill fw-semibold"
            style={{
              backgroundColor: "#e9ecef",
              color: "#495057",
              fontSize: "0.75rem",
            }}
          >
            {getLeaveTypeDisplayName(leave.leaveType)}
          </span>
          <span
            className={`badge px-2 py-1 rounded-pill d-inline-flex align-items-center ${getRoleColor(
              leave.role
            )}`}
            style={{ fontSize: "0.7rem" }}
          >
            {getRoleIcon(leave.role)}
            <span style={{ fontSize: "0.7rem" }}>{leave.role}</span>
          </span>
        </div>

        {/* Duration */}
        <div className="mb-2">
          <div className="small text-muted mb-1">Duration:</div>
          <div className="small fw-semibold text-dark">
            {leave.leaveType === "MATERNITY" ? (
              <>
                {new Date(leave.startDate).toLocaleDateString([], {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}
                <div className="small text-primary">
                  <Clock size={12} className="me-1" />
                  {(() => {
                    const paymentTypeLabels = {
                      FULL_PAY: "Full Pay - 84 Days",
                      HALF_PAY: "Half Pay - 84 Days",
                      NO_PAY: "No Pay - 84 Days",
                    };
                    return (
                      paymentTypeLabels[leave.maternityPaymentType] || "84 Days"
                    );
                  })()}
                </div>
              </>
            ) : (
              <>
                {leave.leaveType === "SHORT" ||
                leave.leaveType === "SHORT_LEAVE"
                  ? new Date(leave.startDate).toLocaleDateString([], {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })
                  : leave.leaveType === "HALF_DAY"
                  ? `${new Date(leave.startDate).toLocaleDateString([], {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })} (${leave.halfDayPeriod || "MORNING"} period)`
                  : `${new Date(leave.startDate).toLocaleDateString([], {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })} → ${new Date(leave.endDate).toLocaleDateString([], {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })}`}
                <div className="small text-muted mt-1">
                  <Clock size={12} className="me-1" />
                  {calculateDuration(
                    leave.leaveType,
                    leave.startDate,
                    leave.endDate,
                    leave.shortLeaveStartTime,
                    leave.shortLeaveEndTime,
                    leave.halfDayPeriod
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reason */}
        {leave.reason && (
          <div className="mb-2">
            <div className="small text-muted mb-1">
              <MessageSquare size={10} className="me-1" />
              Reason:
            </div>
            <div className="small text-dark">{leave.reason}</div>
          </div>
        )}

        {/* Approval Flow - Simplified for Mobile */}
        <div>
          <div className="small text-muted mb-2">Approval Chain:</div>
          <ApprovalFlow
            leave={leave}
            employeeDetails={employeeDetails}
            isCompact={true}
            isMobile={true}
          />
        </div>
      </div>
    </div>
  );
};

// ---------------- Main Approvals Component ----------------
const Approvals = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [allPendingLeaves, setAllPendingLeaves] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [loadingEmployeeData, setLoadingEmployeeData] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  // History state
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Get email and token from localStorage
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---------------- Utility Functions ----------------
  const showMessage = (message, isError = false) => {
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
  };

  // Static employee details mapping (fallback data)
  const staticEmployeeData = {
    Nadini: { gender: "FEMALE", maritalStatus: "MARRIED" },
    subashi: { gender: "MALE", maritalStatus: "SINGLE" },
    Nilushi: { gender: "FEMALE", maritalStatus: "MARRIED" },
    John: { gender: "MALE", maritalStatus: "MARRIED" },
    Sarah: { gender: "FEMALE", maritalStatus: "SINGLE" },
  };

  // ----- Get proper title based on gender and marital status ----
  const getTitle = (gender, maritalStatus) => {
    if (!gender) return "";

    if (gender.toUpperCase() === "MALE") {
      return "Mr.";
    } else if (gender.toUpperCase() === "FEMALE") {
      if (maritalStatus && maritalStatus.toUpperCase() === "MARRIED") {
        return "Mrs.";
      } else {
        return "Miss.";
      }
    }
    return "";
  };

  // ----- Format employee name with title ----
  const formatEmployeeName = (leave) => {
    const employeeName =
      leave.employeeName || leave.name || leave.empName || "Unknown Employee";

    let employeeInfo = null;

    // First, try from the leave object itself
    if (leave.employeeGender || leave.gender) {
      employeeInfo = {
        gender: leave.employeeGender || leave.gender,
        maritalStatus: leave.employeeMaritalStatus || leave.maritalStatus,
      };
    }

    // If not found in leave object, try from fetched employee details
    if (!employeeInfo && employeeDetails[employeeName]) {
      employeeInfo = employeeDetails[employeeName];
    }

    // If still not found, try from static data
    if (!employeeInfo && staticEmployeeData[employeeName]) {
      employeeInfo = staticEmployeeData[employeeName];
    }

    // Get title if employee info is available
    if (employeeInfo) {
      const title = getTitle(employeeInfo.gender, employeeInfo.maritalStatus);
      if (title) {
        return `${title} ${employeeName}`;
      }
    }

    return employeeName;
  };

  // // ---------------- API Utility ----------------
  // const apiCall = async (endpoint, options = {}) => {
  //   const config = {
  //     method: "GET",
  //     headers: {
  //       "Content-Type": "application/json",
  //       ...(token && { Authorization: `Bearer ${token}` }),
  //     },
  //     ...options,
  //   };

  //   const response = await fetch(`http://localhost:8080${endpoint}`, config);
  //   const data = await response.text();

  //   if (!response.ok)
  //     throw new Error(data || `HTTP error! status: ${response.status}`);

  //   try {
  //     return JSON.parse(data);
  //   } catch {
  //     return data;
  //   }
  // };

  // const API = {
  //   get: (endpoint) => apiCall(endpoint),
  //   post: (endpoint, data) =>
  //     apiCall(endpoint, { method: "POST", body: JSON.stringify(data) }),
  // };

  // Fetch all employee details from API
  const fetchEmployeeDetails = async () => {
    try {
      setLoadingEmployeeData(true);
      const response = await API.get("/admin/users");

      if (Array.isArray(response)) {
        const employeeMap = {};
        response.forEach((employee) => {
          const nameFields = [
            employee.name,
            employee.fullName,
            employee.employeeName,
            employee.empName,
          ].filter(Boolean);

          const employeeInfo = {
            gender: employee.gender,
            maritalStatus: employee.maritalStatus,
          };

          nameFields.forEach((nameField) => {
            if (nameField) {
              employeeMap[nameField] = employeeInfo;
            }
          });
        });

        const combinedData = { ...staticEmployeeData, ...employeeMap };
        setEmployeeDetails(combinedData);
        console.log("Employee details loaded:", employeeMap);
      }
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      setEmployeeDetails(staticEmployeeData);
    } finally {
      setLoadingEmployeeData(false);
    }
  };

  const getLeaveTypeDisplayName = (leaveType) => {
    const displayNames = {
      CASUAL: "CASUAL LEAVE",
      SICK: "MEDICAL LEAVE",
      MATERNITY: "MATERNITY LEAVE",
      SHORT: "SHORT LEAVE",
      HALF_DAY: "HALF DAY LEAVE",
    };
    return displayNames[leaveType] || leaveType.replace("_", " ");
  };

  const calculateDuration = (
    leaveType,
    startDate,
    endDate,
    shortLeaveStartTime,
    shortLeaveEndTime,
    halfDayPeriod
  ) => {
    if (leaveType === "HALF_DAY") {
      return `0.5 day (${halfDayPeriod || "MORNING"} period)`;
    } else if (leaveType === "SHORT" || leaveType === "SHORT_LEAVE") {
      if (shortLeaveStartTime && shortLeaveEndTime) {
        const start = new Date(`${startDate}T${shortLeaveStartTime}`);
        const end = new Date(`${startDate}T${shortLeaveEndTime}`);
        const diffHours = (end - start) / (1000 * 60 * 60);
        const options = { hour: "2-digit", minute: "2-digit" };
        const startStr = start.toLocaleTimeString([], options);
        const endStr = end.toLocaleTimeString([], options);
        return `${diffHours.toFixed(2)} hours (${startStr} - ${endStr})`;
      }
      return "Short duration";
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (days === 0.5) return "0.5 day";
      if (days === 1) return "1 day";
      return `${days} days`;
    }
  };

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      if (!email) {
        console.warn("No email available to fetch user");
        return;
      }
      const user = await API.get(`/admin/users/${email}`);
      setCurrentUser(user);
    } catch (err) {
      showMessage("Failed to fetch user", true);
      console.error(err);
    }
  };

  const fetchApprovalHistory = async (page = 1, pageSize = itemsPerPage) => {
    try {
      setHistoryLoading(true);

      const currentUserEmail = localStorage.getItem("email");
      console.log("Fetching approval history for user:", currentUserEmail);

      // Fetch from the three history endpoints
      const fetchPromises = [
        API.get(`/leaves/history/acting`).catch((err) => {
          console.error("Error fetching acting history:", err);
          return [];
        }),
        API.get(`/leaves/history/supervising`).catch((err) => {
          console.error("Error fetching supervising history:", err);
          return [];
        }),
        API.get(`/leaves/history/approval`).catch((err) => {
          console.error("Error fetching approval history:", err);
          return [];
        }),
      ];

      const [actingHistory, supervisingHistory, approvalHistoryData] =
        await Promise.all(fetchPromises);

      console.log("Raw API responses:", {
        acting: actingHistory,
        supervising: supervisingHistory,
        approval: approvalHistoryData,
      });

      // Helper function to process history item
      const processHistoryItem = (item, role) => {
        let actionDate;
        let actionTaken;

        if (role === "Acting Officer") {
          actionDate =
            item.actingOfficerApprovedAt ||
            item.createdAt ||
            item.dateSubmitted;
          actionTaken = item.actingOfficerStatus;
        } else if (role === "Supervising Officer") {
          actionDate =
            item.supervisingOfficerApprovedAt ||
            item.createdAt ||
            item.dateSubmitted;
          actionTaken = item.supervisingOfficerStatus;
        } else if (role === "Approval Officer") {
          actionDate =
            item.approvalOfficerApprovedAt ||
            item.createdAt ||
            item.dateSubmitted;
          actionTaken = item.approvalOfficerStatus;
        }

        return {
          ...item,
          role: role,
          actionDate: actionDate,
          actionTaken: actionTaken,

          // Ensure all approval chain fields are preserved
          actingOfficerName: item.actingOfficerName || "Not Assigned",
          actingOfficerEmail: item.actingOfficerEmail || "NONE",
          actingOfficerStatus: item.actingOfficerStatus || "NOT_ASSIGNED",
          actingOfficerApprovedAt: item.actingOfficerApprovedAt,

          supervisingOfficerName: item.supervisingOfficerName || "Not Assigned",
          supervisingOfficerEmail: item.supervisingOfficerEmail || "NONE",
          supervisingOfficerStatus:
            item.supervisingOfficerStatus || "NOT_ASSIGNED",
          supervisingOfficerApprovedAt: item.supervisingOfficerApprovedAt,

          approvalOfficerName: item.approvalOfficerName || "Not Assigned",
          approvalOfficerEmail: item.approvalOfficerEmail || "NONE",
          approvalOfficerStatus: item.approvalOfficerStatus || "NOT_ASSIGNED",
          approvalOfficerApprovedAt: item.approvalOfficerApprovedAt,

          // Employee information
          employeeName:
            item.employeeName ||
            item.name ||
            item.empName ||
            "Unknown Employee",
          employeeGender: item.employeeGender || item.gender,
          employeeMaritalStatus:
            item.employeeMaritalStatus || item.maritalStatus,

          // Leave details
          leaveType: item.leaveType,
          startDate: item.startDate,
          endDate: item.endDate,
          reason: item.reason,
          maternityLeaveType: item.maternityLeaveType,
          maternityPaymentType: item.maternityPaymentType,
          shortLeaveStartTime: item.shortLeaveStartTime,
          shortLeaveEndTime: item.shortLeaveEndTime,
          halfDayPeriod: item.halfDayPeriod,

          // Status and cancellation
          status: item.status,
          isCancelled: item.isCancelled || item.status?.includes("CANCELLED"),

          // Add unique identifier
          uniqueId: `${item.id}-${role}-${actionDate}`,
        };
      };

      // Collect all history items
      let allHistoryItems = [];

      // From acting officer history
      if (Array.isArray(actingHistory) && actingHistory.length > 0) {
        allHistoryItems.push(
          ...actingHistory.map((item) =>
            processHistoryItem(item, "Acting Officer")
          )
        );
      }

      // From supervising officer history
      if (Array.isArray(supervisingHistory) && supervisingHistory.length > 0) {
        allHistoryItems.push(
          ...supervisingHistory.map((item) =>
            processHistoryItem(item, "Supervising Officer")
          )
        );
      }

      // From approval officer history
      if (
        Array.isArray(approvalHistoryData) &&
        approvalHistoryData.length > 0
      ) {
        allHistoryItems.push(
          ...approvalHistoryData.map((item) =>
            processHistoryItem(item, "Approval Officer")
          )
        );
      }

      console.log("All collected history items:", allHistoryItems.length);

      // Remove duplicates based on unique identifier
      const uniqueHistoryItems = allHistoryItems.reduce((acc, item) => {
        const existing = acc.find(
          (existingItem) =>
            existingItem.id === item.id && existingItem.role === item.role
        );
        if (!existing) {
          acc.push(item);
        }
        return acc;
      }, []);

      console.log(
        "Unique history items after deduplication:",
        uniqueHistoryItems.length
      );

      // Sort by action date (most recent first)
      const sortedHistory = uniqueHistoryItems.sort((a, b) => {
        const dateA = new Date(a.actionDate || 0);
        const dateB = new Date(b.actionDate || 0);
        return dateB - dateA;
      });

      // Apply client-side pagination
      const startIndex = (page - 1) * pageSize;
      const paginatedHistory = sortedHistory.slice(
        startIndex,
        startIndex + pageSize
      );

      setApprovalHistory(paginatedHistory);

      // Calculate total records
      const totalRecordsCount = sortedHistory.length;
      setTotalRecords(totalRecordsCount);
      setTotalPages(Math.ceil(totalRecordsCount / pageSize));

      console.log("Final approval history result:", {
        totalItems: totalRecordsCount,
        currentPageItems: paginatedHistory.length,
        totalPages: Math.ceil(totalRecordsCount / pageSize),
        currentPage: page,
        pageSize: pageSize,
        sampleItems: paginatedHistory.slice(0, 3).map((item) => ({
          id: item.id,
          employeeName: item.employeeName,
          role: item.role,
          actionTaken: item.actionTaken,
          actionDate: item.actionDate,
        })),
      });

      // Show debug info if no results
      if (totalRecordsCount === 0) {
        console.warn("No approval history found. Debug info:", {
          currentUserEmail,
          apiResponses: {
            acting: actingHistory.length,
            supervising: supervisingHistory.length,
            approval: approvalHistoryData.length,
          },
        });
      }
    } catch (err) {
      console.error("Error fetching approval history:", err);
      showMessage("Failed to fetch approval history", true);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ---------------- Handle Leave Action ----------------
  const handleLeaveAction = async (leave, action) => {
    let endpoint = "";

    // Determine endpoint based on leave status
    if (
      leave.status === "PENDING_ACTING_OFFICER" ||
      leave.status === "PENDING_ACTING"
    ) {
      endpoint = `/leaves/${leave.id}/acting-action`;
    } else if (
      leave.status === "PENDING_SUPERVISING_OFFICER" ||
      leave.status === "PENDING_SUPERVISING"
    ) {
      endpoint = `/leaves/${leave.id}/supervising-action`;
    } else if (
      leave.status === "PENDING_APPROVAL_OFFICER" ||
      leave.status === "PENDING_APPROVAL"
    ) {
      endpoint = `/leaves/${leave.id}/approval-action`;
    } else {
      showMessage("This leave cannot be processed", true);
      return;
    }

    try {
      setLoading(true);

      // Check if token exists and is valid
      const currentToken = localStorage.getItem("token");
      const currentEmail = localStorage.getItem("email");

      if (!currentToken || !currentEmail) {
        showMessage("Authentication required. Please login again.", true);
        return;
      }

      console.log("Making API call to:", endpoint);
      console.log("Action:", action);
      console.log("Leave ID:", leave.id);

      const response = await API.post(endpoint, {
        action: action.toUpperCase(),
        comments: leave.comments || "",
      });

      console.log("API Response:", response);

      let successMessage = "Action successful";
      if (typeof response === "string") {
        successMessage = response.replace("✅ ", "");
      } else if (response && response.message) {
        successMessage = response.message;
      }

      // Special handling for approved maternity leave
      if (
        action.toUpperCase() === "APPROVE" &&
        leave.leaveType === "MATERNITY"
      ) {
        // Check if this is the final approval (approval officer)
        if (
          leave.status === "PENDING_APPROVAL_OFFICER" ||
          leave.status === "PENDING_APPROVAL"
        ) {
          successMessage = `${successMessage} 
        📋  Maternity Leave Approved `;
        } else {
          successMessage = `${successMessage}
         ✅ Maternity leave approved at your level. Proceeding to next approver.`;
        }
      }

      showMessage(successMessage);

      // Remove the leave from local state and refresh
      setAllPendingLeaves((prev) => prev.filter((l) => l.id !== leave.id));

      // Refresh the pending leaves list and history
      setTimeout(() => {
        fetchPendingLeavesInternal();
        fetchApprovalHistory(currentPage, itemsPerPage);
      }, 1000);
    } catch (err) {
      console.error("Error in handleLeaveAction:", err);

      // Handle specific error types
      if (
        err.message.includes("Token expired") ||
        err.message.includes("Invalid token")
      ) {
        showMessage("Session expired. Please login again.", true);
      } else {
        showMessage(err.message || "Failed to update leave status", true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch all pending leaves for the current user
  const fetchPendingLeavesInternal = async () => {
    try {
      console.log("Fetching pending leaves internally...");

      const [acting, supervising, approval] = await Promise.all([
        API.get("/leaves/pending/acting").catch((err) => {
          console.error("Error fetching acting leaves:", err);
          return [];
        }),
        API.get("/leaves/pending/supervising").catch((err) => {
          console.error("Error fetching supervising leaves:", err);
          return [];
        }),
        API.get("/leaves/pending/approval").catch((err) => {
          console.error("Error fetching approval leaves:", err);
          return [];
        }),
      ]);

      console.log("Acting leaves received:", acting);
      console.log("Supervising leaves received:", supervising);
      console.log("Approval leaves received:", approval);

      // Combine all leaves with role identification
      const combinedLeaves = [
        ...acting.map((l) => ({ ...l, role: "Acting Officer" })),
        ...supervising.map((l) => ({ ...l, role: "Supervising Officer" })),
        ...approval.map((l) => ({ ...l, role: "Approval Officer" })),
      ];

      setAllPendingLeaves(combinedLeaves);
    } catch (err) {
      console.error("Error in fetchPendingLeavesInternal:", err);
      showMessage("Failed to fetch pending leaves", true);
    }
  };

  // Get role icon based on the role type
  const getRoleIcon = (role) => {
    switch (role) {
      case "Acting Officer":
        return <User size={isMobile ? 12 : 16} className="me-1" />;
      case "Supervising Officer":
        return <UserCog size={isMobile ? 12 : 16} className="me-1" />;
      case "Approval Officer":
        return <UserCheck size={isMobile ? 12 : 16} className="me-1" />;
      default:
        return <Shield size={isMobile ? 12 : 16} className="me-1" />;
    }
  };

  // Get role color based on the role type
  const getRoleColor = (role) => {
    switch (role) {
      case "Acting Officer":
        return "bg-info-subtle text-info";
      case "Supervising Officer":
        return "bg-warning-subtle text-warning";
      case "Approval Officer":
        return "bg-success-subtle text-success";
      default:
        return "bg-secondary-subtle text-secondary";
    }
  };

  // Initialize component
  useEffect(() => {
    if (!token || !email) return;

    fetchCurrentUser();
    fetchEmployeeDetails();
    fetchPendingLeavesInternal();
    fetchApprovalHistory(1, itemsPerPage);
  }, [email, token, itemsPerPage]);

  // Handle page change for history
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchApprovalHistory(page, itemsPerPage);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    fetchApprovalHistory(1, newItemsPerPage);
  };

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
                <p className="mb-0">Please log in to access approvals.</p>
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

      {/* Sidebar - Desktop Fixed, Mobile Overlay */}
      <div
        className={`d-none d-lg-block position-fixed`}
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

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <>
          <div
            className="position-fixed w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
            style={{ zIndex: 1040, top: "60px" }}
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="position-fixed d-lg-none"
            style={{
              top: "60px",
              left: sidebarOpen ? 0 : "-280px",
              bottom: 0,
              width: "280px",
              zIndex: 1050,
              transition: "left 0.3s ease",
            }}
          >
            <EmployeeSidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div
        className="main-content"
        style={{
          marginLeft: isMobile ? "0" : "280px",
          marginTop: "60px",
          minHeight: "calc(100vh - 60px)",
          padding: isMobile ? "10px" : "20px",
        }}
      >
        {/* Header Component */}
        <EmployeeDashboard />

        {/* Approvals Section */}
        <div className="container-fluid px-0 py-3">
          <div className="glass-card rounded-4 slide-in">
            {/* Loading indicator for employee data */}
            {loadingEmployeeData && (
              <div className="d-flex align-items-center p-3 mb-3 rounded bg-light">
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></div>
                <span className="text-muted">Loading employee details...</span>
              </div>
            )}

            {/* Success & Error Messages */}
            {success && (
              <div
                className="d-flex align-items-center p-3 mb-3 rounded"
                style={{
                  backgroundColor: "#d1edff",
                  color: "#065F46",
                  border: "1px solid #b3d9ff",
                }}
              >
                <CheckCircle size={20} className="me-2" />
                <span>
                  <strong>Success!</strong> {success}
                </span>
              </div>
            )}

            {error && (
              <div
                className="d-flex align-items-center p-3 mb-3 rounded"
                style={{
                  backgroundColor: "#FEE2E2",
                  color: "#991B1B",
                  border: "1px solid #EF4444",
                }}
              >
                <XCircle size={20} className="me-2" />
                <span>
                  <strong>Error!</strong> {error}
                </span>
              </div>
            )}

            {/* Header */}
            <div
              className={`border-bottom ${
                isMobile ? "p-3" : "p-4"
              } d-flex align-items-center justify-content-between flex-wrap`}
            >
              <div className="d-flex align-items-center mb-2 mb-sm-0">
                <div
                  className="rounded-circle p-2 me-3"
                  style={{ background: "rgba(31, 41, 55, 0.1)" }}
                >
                  <CheckCircle size={20} style={{ color: "#1f2937" }} />
                </div>
                <h6 className="mb-0 fw-semibold text-dark">
                  PENDING APPROVALS
                </h6>
              </div>

              {allPendingLeaves.length > 0 && (
                <span className="badge bg-danger rounded-pill">
                  {allPendingLeaves.length} pending
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-0">
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Processing your action...</p>
                </div>
              )}

              {!loading && allPendingLeaves.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <CheckCircle size={48} className="mb-3 opacity-50" />
                  <p className="mb-0">All caught up!</p>
                  <small>No pending approvals assigned to you</small>
                </div>
              ) : !loading ? (
                <>
                  {/* Mobile Card View */}
                  {isMobile ? (
                    <div className="p-3">
                      {allPendingLeaves
                        .slice()
                        .sort((a, b) => {
                          const dateA = new Date(
                            a.receivedDate ||
                              a.requestDate ||
                              a.createdAt ||
                              a.dateSubmitted
                          );
                          const dateB = new Date(
                            b.receivedDate ||
                              b.requestDate ||
                              b.createdAt ||
                              b.dateSubmitted
                          );
                          return dateB - dateA; // newest first
                        })
                        .map((leave) => (
                          <MobileApprovalCard
                            key={leave.id}
                            leave={leave}
                            employeeDetails={employeeDetails}
                            onApprove={(leave) =>
                              handleLeaveAction(leave, "APPROVE")
                            }
                            onReject={(leave) =>
                              handleLeaveAction(leave, "REJECT")
                            }
                            loading={loading}
                            formatEmployeeName={formatEmployeeName}
                            getLeaveTypeDisplayName={getLeaveTypeDisplayName}
                            calculateDuration={calculateDuration}
                            getRoleIcon={getRoleIcon}
                            getRoleColor={getRoleColor}
                          />
                        ))}
                    </div>
                  ) : (
                    /* Desktop Table View */
                    <div className="table-responsive">
                      <table
                        className="table table-sm table-hover mb-0 small"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <thead
                          style={{ background: "rgba(211, 225, 240, 0.8)" }}
                        >
                          <tr>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark">
                              <div className="d-flex align-items-center justify-content-center text-center">
                                <div>
                                  <div className="d-flex align-items-center justify-content-center mb-1">
                                    <Inbox size={14} className="me-1" />
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      lineHeight: "1.1",
                                    }}
                                  >
                                    <div>DATE</div>
                                    <div>RECEIVED</div>
                                  </div>
                                </div>
                              </div>
                            </th>
                            <th
                              className="border-0 py-3 px-1 fw-semibold text-dark"
                              style={{ width: "120px" }}
                            >
                              <div className="d-flex align-items-center">
                                <User size={16} className="me-2" />
                                EMPLOYEE
                              </div>
                            </th>
                            <th
                              className="border-0 py-3 px-1 fw-semibold text-dark"
                              style={{ width: "130px" }}
                            >
                              <div className="d-flex align-items-center justify-content-center text-center">
                                <div>
                                  <div className="d-flex align-items-center justify-content-center mb-1">
                                    <FileText size={14} className="me-1" />
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      lineHeight: "1.1",
                                    }}
                                  >
                                    <div>LEAVE</div>
                                    <div>TYPE</div>
                                  </div>
                                </div>
                              </div>
                            </th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark">
                              <div className="d-flex align-items-center">
                                <Calendar size={16} className="me-2" />
                                DURATION
                              </div>
                            </th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark">
                              <div className="d-flex align-items-center justify-content-center text-center">
                                <div>
                                  <div className="d-flex align-items-center justify-content-center mb-1">
                                    <Users size={14} className="me-1" />
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      lineHeight: "1.1",
                                    }}
                                  >
                                    <div>APPROVAL</div>
                                    <div>CHAIN</div>
                                  </div>
                                </div>
                              </div>
                            </th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark">
                              <div className="d-flex align-items-center">
                                <Settings size={16} className="me-2" />
                                ACTIONS
                              </div>
                            </th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark">
                              <div className="d-flex align-items-center">
                                <Shield size={16} className="me-2" />
                                YOUR ROLE
                              </div>
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {allPendingLeaves
                            .slice()
                            .sort((a, b) => {
                              const dateA = new Date(
                                a.receivedDate ||
                                  a.requestDate ||
                                  a.createdAt ||
                                  a.dateSubmitted
                              );
                              const dateB = new Date(
                                b.receivedDate ||
                                  b.requestDate ||
                                  b.createdAt ||
                                  b.dateSubmitted
                              );
                              return dateB - dateA; // newest first
                            })
                            .map((leave) => (
                              <tr key={leave.id}>
                                <td className="py-3 px-3">
                                  <div className="fw-semibold text-dark mb-1">
                                    {leave.receivedDate
                                      ? new Date(
                                          leave.receivedDate
                                        ).toLocaleDateString()
                                      : new Date(
                                          leave.requestDate ||
                                            leave.createdAt ||
                                            leave.dateSubmitted
                                        ).toLocaleDateString()}
                                  </div>
                                  <div className="small text-muted">
                                    {leave.receivedDate
                                      ? new Date(
                                          leave.receivedDate
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : new Date(
                                          leave.requestDate ||
                                            leave.createdAt ||
                                            leave.dateSubmitted
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                  </div>
                                </td>

                                <td
                                  className="py-3 px-3"
                                  style={{ width: "120px" }}
                                >
                                  <div className="d-flex align-items-center">
                                    <div
                                      className="rounded-circle p-2 me-2"
                                      style={{
                                        background: "rgba(31, 41, 55, 0.1)",
                                        width: "32px",
                                        height: "32px",
                                      }}
                                    >
                                      <User
                                        size={14}
                                        style={{ color: "#1f2937" }}
                                      />
                                    </div>
                                    <div
                                      className="fw-semibold text-dark"
                                      style={{ fontSize: "0.75rem" }}
                                    >
                                      {formatEmployeeName(leave)}
                                    </div>
                                  </div>
                                </td>

                                <td
                                  className="py-3 px-3"
                                  style={{ width: "130px" }}
                                >
                                  <div>
                                    <span
                                      className="badge  text-dark px-2 py-1 rounded-pill fw-semibold d-block mb-2"
                                      style={{
                                        fontSize: "0.6rem",
                                        backgroundColor: "#bbc0c7",
                                      }}
                                    >
                                      {getLeaveTypeDisplayName(leave.leaveType)}
                                    </span>
                                    {leave.leaveType === "MATERNITY" &&
                                      leave.maternityLeaveType && (
                                        <div className="mb-2 ">
                                          <span
                                            className="badge px-2 py-1 rounded-pill fw-semibold"
                                            style={{
                                              backgroundColor:
                                                "rgba(236, 72, 153, 0.1)",
                                              color: "#be185d",
                                            }}
                                          >
                                            {leave.maternityLeaveType.replace(
                                              /_/g,
                                              " "
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    <div
                                      className="small text-muted"
                                      style={{
                                        fontSize: "0.65rem",
                                        lineHeight: "1.3",
                                      }}
                                    >
                                      <MessageSquare
                                        size={10}
                                        className="me-1 "
                                      />
                                      {leave.reason || "No reason provided"}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-1">
                                  {leave.leaveType === "MATERNITY" ? (
                                    <div>
                                      <div className="fw-semibold text-dark mb-1">
                                        {new Date(
                                          leave.startDate
                                        ).toLocaleDateString([], {
                                          month: "2-digit",
                                          day: "2-digit",
                                          year: "numeric",
                                        })}
                                      </div>
                                      <div className="small text-primary mb-1">
                                        <Clock size={12} className="me-1" />
                                        {(() => {
                                          const paymentTypeLabels = {
                                            FULL_PAY: "Full Pay - 84 Days",
                                            HALF_PAY: "Half Pay - 84 Days",
                                            NO_PAY: "No Pay - 84 Days",
                                          };
                                          return (
                                            paymentTypeLabels[
                                              leave.maternityPaymentType
                                            ] || "84 Days"
                                          );
                                        })()}
                                      </div>
                                      <div
                                        className="small text-muted"
                                        style={{ fontSize: "0.65rem" }}
                                      >
                                        End date: Set by admin after approval
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="fw-semibold text-dark mb-1">
                                        {leave.leaveType === "SHORT" ||
                                        leave.leaveType === "SHORT_LEAVE"
                                          ? new Date(
                                              leave.startDate
                                            ).toLocaleDateString([], {
                                              month: "2-digit",
                                              day: "2-digit",
                                              year: "numeric",
                                            })
                                          : leave.leaveType === "HALF_DAY"
                                          ? `${new Date(
                                              leave.startDate
                                            ).toLocaleDateString([], {
                                              month: "2-digit",
                                              day: "2-digit",
                                              year: "numeric",
                                            })} (${
                                              leave.halfDayPeriod || "MORNING"
                                            } period)`
                                          : `${new Date(
                                              leave.startDate
                                            ).toLocaleDateString([], {
                                              month: "2-digit",
                                              day: "2-digit",
                                              year: "numeric",
                                            })} → ${new Date(
                                              leave.endDate
                                            ).toLocaleDateString([], {
                                              month: "2-digit",
                                              day: "2-digit",
                                              year: "numeric",
                                            })}`}
                                      </div>
                                      <div className="small text-muted">
                                        <Clock size={12} className="me-1" />
                                        {calculateDuration(
                                          leave.leaveType,
                                          leave.startDate,
                                          leave.endDate,
                                          leave.shortLeaveStartTime,
                                          leave.shortLeaveEndTime,
                                          leave.halfDayPeriod
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                <td
                                  className="py-3 px-0"
                                  style={{ minWidth: "300px" }}
                                >
                                  <ApprovalFlow
                                    leave={leave}
                                    employeeDetails={employeeDetails}
                                    isCompact={false}
                                    isMobile={false}
                                  />
                                </td>

                                <td
                                  className="py-3 px-2"
                                  style={{ width: "180px" }}
                                >
                                  <div className="d-flex gap-2">
                                    <button
                                      className="btn btn-sm btn-success rounded-2 d-flex align-items-center justify-content-center fw-semibold shadow-sm"
                                      style={{
                                        fontSize: "0.6rem",
                                        width: "80px",
                                        height: "28px",
                                      }}
                                      onClick={() =>
                                        handleLeaveAction(leave, "APPROVE")
                                      }
                                      disabled={loading}
                                      title="Click to approve leave request"
                                    >
                                      {loading ? (
                                        <span
                                          className="spinner-border spinner-border-sm"
                                          role="status"
                                        ></span>
                                      ) : (
                                        <>
                                          <CheckCircle
                                            size={12}
                                            className="me-1"
                                          />
                                          APPROVE
                                        </>
                                      )}
                                    </button>

                                    <button
                                      className="btn btn-sm btn-danger rounded-2 d-flex align-items-center justify-content-center fw-semibold shadow-sm"
                                      style={{
                                        fontSize: "0.6rem",
                                        width: "75px",
                                        height: "28px",
                                      }}
                                      onClick={() =>
                                        handleLeaveAction(leave, "REJECT")
                                      }
                                      disabled={loading}
                                      title="Click to reject leave request"
                                    >
                                      {loading ? (
                                        <span
                                          className="spinner-border spinner-border-sm"
                                          role="status"
                                        ></span>
                                      ) : (
                                        <>
                                          <XCircle size={12} className="me-1" />
                                          REJECT
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </td>

                                <td
                                  className="py-3 px-3"
                                  style={{ width: "60px" }}
                                >
                                  <span
                                    className={`badge px-2 py-1 rounded-pill d-inline-flex align-items-center ${getRoleColor(
                                      leave.role
                                    )}`}
                                    style={{ fontSize: "0.25rem" }}
                                  >
                                    {getRoleIcon(leave.role)}
                                    <span style={{ fontSize: "0.60rem" }}>
                                      {leave.role}
                                    </span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Approval History Section */}
          <div className="glass-card rounded-4 mt-4">
            <div
              className={`border-bottom ${
                isMobile ? "p-3" : "p-4"
              } d-flex align-items-center justify-content-between flex-wrap`}
            >
              <div className="d-flex align-items-center mb-2 mb-sm-0">
                <div
                  className="rounded-circle p-2 me-3"
                  style={{ background: "rgba(31, 41, 55, 0.1)" }}
                >
                  <Clock size={20} style={{ color: "#1f2937" }} />
                </div>
                <h6 className="mb-0 fw-semibold text-dark">APPROVAL HISTORY</h6>
              </div>
            </div>

            <div className="p-0">
              {historyLoading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading approval history...</p>
                </div>
              )}

              {!historyLoading && approvalHistory.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Clock size={48} className="mb-3 opacity-50" />
                  <p className="mb-0">No approval history found</p>
                  <small>Your previous approvals will appear here</small>
                </div>
              ) : !historyLoading ? (
                <>
                  {/* Mobile Card View for History */}
                  {isMobile ? (
                    <div className="p-3">
                      {approvalHistory.map((leave) => (
                        <MobileHistoryCard
                          key={`${leave.id}-${leave.role}`}
                          leave={leave}
                          employeeDetails={employeeDetails}
                          formatEmployeeName={formatEmployeeName}
                          getLeaveTypeDisplayName={getLeaveTypeDisplayName}
                          calculateDuration={calculateDuration}
                          getRoleIcon={getRoleIcon}
                          getRoleColor={getRoleColor}
                        />
                      ))}
                    </div>
                  ) : (
                    /* Desktop Table View for History */
                    <div className="table-responsive">
                      <table
                        className="table table-sm table-hover mb-0 small"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <thead
                          style={{ background: "rgba(211, 225, 240, 0.8)" }}
                        >
                          <tr>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark">
                              <div className="d-flex align-items-center justify-content-center text-center">
                                <div>
                                  <div className="d-flex align-items-center justify-content-center mb-1">
                                    <Clock size={14} className="me-1" />
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      lineHeight: "1.1",
                                    }}
                                  >
                                    <div>ACTION</div>
                                    <div>DATE</div>
                                  </div>
                                </div>
                              </div>
                            </th>
                            <th
                              className="border-0 py-3 px-1 fw-semibold text-dark"
                              style={{ width: "120px" }}
                            >
                              <div className="d-flex align-items-center">
                                <User size={16} className="me-2" />
                                EMPLOYEE
                              </div>
                            </th>
                            <th
                              className="border-0 py-3 px-1 fw-semibold text-dark"
                              style={{ width: "130px" }}
                            >
                              <div className="d-flex align-items-center justify-content-center text-center">
                                <div>
                                  <div className="d-flex align-items-center justify-content-center mb-1">
                                    <FileText size={14} className="me-1" />
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      lineHeight: "1.1",
                                    }}
                                  >
                                    <div>LEAVE</div>
                                    <div>TYPE</div>
                                  </div>
                                </div>
                              </div>
                            </th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark">
                              <div className="d-flex align-items-center">
                                <Calendar size={16} className="me-2" />
                                DURATION
                              </div>
                            </th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark">
                              <div className="d-flex align-items-center justify-content-center text-center">
                                <div>
                                  <div className="d-flex align-items-center justify-content-center mb-1">
                                    <Users size={14} className="me-1" />
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      lineHeight: "1.1",
                                    }}
                                  >
                                    <div>APPROVAL</div>
                                    <div>CHAIN</div>
                                  </div>
                                </div>
                              </div>
                            </th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark">
                              <div className="d-flex align-items-center">
                                <CheckCircle size={16} className="me-2" />
                                ACTION TAKEN
                              </div>
                            </th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark">
                              <div className="d-flex align-items-center">
                                <Shield size={16} className="me-2" />
                                YOUR ROLE
                              </div>
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {approvalHistory.map((leave) => {
                            const actionDate = new Date(
                              leave.actionDate ||
                                leave.approvedAt ||
                                leave.rejectedAt ||
                                leave.createdAt
                            );

                            const actionTaken =
                              leave.actionTaken ||
                              leave.action ||
                              (leave.status?.includes("APPROVED")
                                ? "APPROVED"
                                : leave.status?.includes("REJECTED")
                                ? "REJECTED"
                                : leave.status || "UNKNOWN");

                            return (
                              <tr key={`${leave.id}-${leave.role}`}>
                                <td className="py-3 px-3">
                                  <div className="fw-semibold text-dark mb-1">
                                    {actionDate.toLocaleDateString()}
                                  </div>
                                  <div className="small text-muted">
                                    {actionDate.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </td>

                                <td
                                  className="py-3 px-3"
                                  style={{ width: "120px" }}
                                >
                                  <div className="d-flex align-items-center">
                                    <div
                                      className="rounded-circle p-2 me-2"
                                      style={{
                                        background: "rgba(31, 41, 55, 0.1)",
                                        width: "32px",
                                        height: "32px",
                                      }}
                                    >
                                      <User
                                        size={14}
                                        style={{ color: "#1f2937" }}
                                      />
                                    </div>
                                    <div
                                      className="fw-semibold text-dark"
                                      style={{ fontSize: "0.75rem" }}
                                    >
                                      {formatEmployeeName(leave)}
                                    </div>
                                  </div>
                                </td>

                                <td
                                  className="py-3 px-3"
                                  style={{ width: "130px" }}
                                >
                                  <div>
                                    <span
                                      className="badge text-dark px-2 py-1 rounded-pill fw-semibold d-block mb-2"
                                      style={{
                                        fontSize: "0.6rem",
                                        backgroundColor: "#bbc0c7",
                                      }}
                                    >
                                      {getLeaveTypeDisplayName(leave.leaveType)}
                                    </span>
                                    {leave.leaveType === "MATERNITY" &&
                                      leave.maternityLeaveType && (
                                        <div className="mb-2">
                                          <span
                                            className="badge px-2 py-1 rounded-pill fw-semibold"
                                            style={{
                                              backgroundColor:
                                                "rgba(236, 72, 153, 0.1)",
                                              color: "#be185d",
                                            }}
                                          >
                                            {leave.maternityLeaveType.replace(
                                              /_/g,
                                              " "
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    <div
                                      className="small text-muted"
                                      style={{
                                        fontSize: "0.65rem",
                                        lineHeight: "1.3",
                                      }}
                                    >
                                      <MessageSquare
                                        size={10}
                                        className="me-1"
                                      />
                                      {leave.reason || "No reason provided"}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-1">
                                  {leave.leaveType === "MATERNITY" ? (
                                    <div>
                                      <div className="fw-semibold text-dark mb-1">
                                        {new Date(
                                          leave.startDate
                                        ).toLocaleDateString([], {
                                          month: "2-digit",
                                          day: "2-digit",
                                          year: "numeric",
                                        })}
                                      </div>
                                      <div className="small text-primary mb-1">
                                        <Clock size={12} className="me-1" />
                                        {(() => {
                                          const paymentTypeLabels = {
                                            FULL_PAY: "Full Pay - 84 Days",
                                            HALF_PAY: "Half Pay - 84 Days",
                                            NO_PAY: "No Pay - 84 Days",
                                          };
                                          return (
                                            paymentTypeLabels[
                                              leave.maternityPaymentType
                                            ] || "84 Days"
                                          );
                                        })()}
                                      </div>
                                      <div
                                        className="small text-muted"
                                        style={{ fontSize: "0.65rem" }}
                                      >
                                        {leave.endDate ? (
                                          <>
                                            End:{" "}
                                            {new Date(
                                              leave.endDate
                                            ).toLocaleDateString([], {
                                              month: "2-digit",
                                              day: "2-digit",
                                              year: "numeric",
                                            })}
                                          </>
                                        ) : (
                                          "End date: Set by admin"
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="fw-semibold text-dark mb-1">
                                        {leave.leaveType === "SHORT" ||
                                        leave.leaveType === "SHORT_LEAVE"
                                          ? new Date(
                                              leave.startDate
                                            ).toLocaleDateString([], {
                                              month: "2-digit",
                                              day: "2-digit",
                                              year: "numeric",
                                            })
                                          : leave.leaveType === "HALF_DAY"
                                          ? `${new Date(
                                              leave.startDate
                                            ).toLocaleDateString([], {
                                              month: "2-digit",
                                              day: "2-digit",
                                              year: "numeric",
                                            })} (${
                                              leave.halfDayPeriod || "MORNING"
                                            } period)`
                                          : `${new Date(
                                              leave.startDate
                                            ).toLocaleDateString([], {
                                              month: "2-digit",
                                              day: "2-digit",
                                              year: "numeric",
                                            })} → ${new Date(
                                              leave.endDate
                                            ).toLocaleDateString([], {
                                              month: "2-digit",
                                              day: "2-digit",
                                              year: "numeric",
                                            })}`}
                                      </div>
                                      <div className="small text-muted">
                                        <Clock size={12} className="me-1" />
                                        {calculateDuration(
                                          leave.leaveType,
                                          leave.startDate,
                                          leave.endDate,
                                          leave.shortLeaveStartTime,
                                          leave.shortLeaveEndTime,
                                          leave.halfDayPeriod
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                <td
                                  className="py-3 px-0"
                                  style={{ minWidth: "300px" }}
                                >
                                  <ApprovalFlow
                                    leave={leave}
                                    employeeDetails={employeeDetails}
                                    isCompact={false}
                                    isMobile={false}
                                  />
                                </td>

                                <td className="py-3 px-1">
                                  <span
                                    className={`badge px-2 py-1 rounded-pill fw-semibold ${
                                      actionTaken === "APPROVED"
                                        ? "bg-success text-white"
                                        : actionTaken === "REJECTED"
                                        ? "bg-danger text-white"
                                        : "bg-secondary text-white"
                                    }`}
                                    style={{ fontSize: "0.55rem" }}
                                  >
                                    {actionTaken === "APPROVED" ? (
                                      <>
                                        <CheckCircle
                                          size={12}
                                          className="me-1"
                                        />
                                        APPROVED
                                      </>
                                    ) : actionTaken === "REJECTED" ? (
                                      <>
                                        <XCircle size={12} className="me-1" />
                                        REJECTED
                                      </>
                                    ) : (
                                      actionTaken
                                    )}
                                  </span>
                                </td>

                                <td className="py-3 px-1">
                                  <span
                                    className={`badge px-2 py-1 rounded-pill d-inline-flex align-items-center ${getRoleColor(
                                      leave.role
                                    )}`}
                                    style={{ fontSize: "0.6rem" }}
                                  >
                                    {getRoleIcon(leave.role)}
                                    <span style={{ fontSize: "0.6rem" }}>
                                      {leave.role}
                                    </span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination - Desktop Only */}
                  {totalPages > 1 && !isMobile && (
                    <div
                      className="d-flex justify-content-between align-items-center px-4 py-3 border-top"
                      style={{
                        backgroundColor: "rgba(248, 249, 250, 0.8)",
                        borderColor: "rgba(220, 220, 220, 0.5)",
                      }}
                    >
                      {/* Left side - Show entries dropdown and info */}
                      <div className="d-flex align-items-center">
                        <div className="d-flex align-items-center me-4">
                          <span className="text-sm text-muted me-2">Show:</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) =>
                              handleItemsPerPageChange(parseInt(e.target.value))
                            }
                            className="form-select form-select-sm"
                            style={{
                              width: "80px",
                              fontSize: "0.875rem",
                              padding: "0.25rem 0.5rem",
                            }}
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                          <span className="text-sm text-muted ms-2">
                            entries
                          </span>
                        </div>

                        <div className="text-sm text-muted">
                          Showing{" "}
                          <strong>
                            {Math.min(
                              (currentPage - 1) * itemsPerPage + 1,
                              totalRecords
                            )}
                          </strong>{" "}
                          to{" "}
                          <strong>
                            {Math.min(currentPage * itemsPerPage, totalRecords)}
                          </strong>{" "}
                          of <strong>{totalRecords}</strong> entries
                        </div>
                      </div>

                      {/* Right side - Pagination controls */}
                      <div className="d-flex align-items-center">
                        {/* Previous button */}
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`btn btn-sm me-2 d-flex align-items-center ${
                            currentPage === 1
                              ? "btn-outline-secondary disabled"
                              : "btn-outline-primary"
                          }`}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.75rem",
                          }}
                        >
                          <ChevronLeft size={14} className="me-1" />
                          Previous
                        </button>

                        {/* Page numbers */}
                        <div className="d-flex align-items-center me-2">
                          {(() => {
                            const pages = [];
                            const maxVisiblePages = 5;

                            if (totalPages <= maxVisiblePages) {
                              for (let i = 1; i <= totalPages; i++) {
                                pages.push(i);
                              }
                            } else {
                              if (currentPage <= 3) {
                                for (let i = 1; i <= 4; i++) {
                                  pages.push(i);
                                }
                                pages.push("...");
                                pages.push(totalPages);
                              } else if (currentPage >= totalPages - 2) {
                                pages.push(1);
                                pages.push("...");
                                for (
                                  let i = totalPages - 3;
                                  i <= totalPages;
                                  i++
                                ) {
                                  pages.push(i);
                                }
                              } else {
                                pages.push(1);
                                pages.push("...");
                                for (
                                  let i = currentPage - 1;
                                  i <= currentPage + 1;
                                  i++
                                ) {
                                  pages.push(i);
                                }
                                pages.push("...");
                                pages.push(totalPages);
                              }
                            }

                            return pages.map((page, index) => (
                              <React.Fragment key={index}>
                                {page === "..." ? (
                                  <span
                                    className="px-2 py-1 text-muted small"
                                    style={{ fontSize: "0.75rem" }}
                                  >
                                    ...
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handlePageChange(page)}
                                    className={`btn btn-sm me-1 ${
                                      currentPage === page
                                        ? "btn-primary"
                                        : "btn-outline-primary"
                                    }`}
                                    style={{
                                      fontSize: "0.75rem",
                                      padding: "0.25rem 0.5rem",
                                      minWidth: "32px",
                                    }}
                                  >
                                    {page}
                                  </button>
                                )}
                              </React.Fragment>
                            ));
                          })()}
                        </div>

                        {/* Next button */}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`btn btn-sm d-flex align-items-center ${
                            currentPage === totalPages
                              ? "btn-outline-secondary disabled"
                              : "btn-outline-primary"
                          }`}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.75rem",
                          }}
                        >
                          Next
                          <ChevronRight size={14} className="ms-1" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mobile Pagination */}
                  {totalPages > 1 && isMobile && (
                    <div className="border-top p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="text-muted small">
                          Page {currentPage} of {totalPages} ({totalRecords}{" "}
                          total)
                        </div>
                        <select
                          value={itemsPerPage}
                          onChange={(e) =>
                            handleItemsPerPageChange(parseInt(e.target.value))
                          }
                          className="form-select form-select-sm"
                          style={{ width: "100px" }}
                        >
                          <option value={5}>Show 5</option>
                          <option value={10}>Show 10</option>
                          <option value={25}>Show 25</option>
                        </select>
                      </div>
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="btn btn-sm btn-outline-primary d-flex align-items-center"
                          style={{ fontSize: "0.8rem" }}
                        >
                          <ChevronLeft size={14} className="me-1" />
                          Prev
                        </button>
                        <span
                          className="btn btn-sm btn-primary disabled"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="btn btn-sm btn-outline-primary d-flex align-items-center"
                          style={{ fontSize: "0.8rem" }}
                        >
                          Next
                          <ChevronRight size={14} className="ms-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        /* Ensure proper spacing and glass effect */
        .glass-card {
          background: #bccee4f2;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        /* Mobile Card Styling */
        .approval-card-mobile,
        .history-card-mobile {
          transition: all 0.2s ease;
        }

        .approval-card-mobile:hover,
        .history-card-mobile:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
        }

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

        /* Hide scrollbars for cleaner look */
        .table-responsive::-webkit-scrollbar {
          height: 6px;
        }

        .table-responsive::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .table-responsive::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .table-responsive::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-select:focus {
          border-color: #86b7fe;
          outline: 0;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }

        .btn-outline-primary:hover:not(:disabled) {
          background-color: #0d6efd;
          border-color: #0d6efd;
          color: #fff;
        }

        .btn-primary {
          background-color: #0d6efd;
          border-color: #0d6efd;
          color: #fff;
        }

        /* Mobile responsive adjustments */
        @media (max-width: 991.98px) {
          .main-content {
            margin-left: 0 !important;
          }

          /* Compact spacing on mobile */
          .glass-card {
            border-radius: 1rem !important;
          }

          /* Mobile-friendly buttons */
          .btn-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.8rem;
          }

          /* Better mobile table scrolling */
          .table-responsive {
            border-radius: 0.5rem;
          }
        }

        @media (max-width: 576px) {
          /* Extra small screens */
          .badge {
            font-size: 0.7rem !important;
          }

          /* Stack buttons vertically on very small screens */
          .approval-card-mobile .d-flex.gap-2 {
            flex-direction: column;
          }

          .approval-card-mobile .d-flex.gap-2 .btn {
            margin-bottom: 0.5rem;
          }

          .approval-card-mobile .d-flex.gap-2 .btn:last-child {
            margin-bottom: 0;
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

        /* Enhanced mobile pagination */
        .btn.disabled {
          pointer-events: none;
          opacity: 0.65;
        }

        /* Touch-friendly spacing */
        @media (max-width: 768px) {
          .p-3 {
            padding: 1rem !important;
          }

          .mb-3 {
            margin-bottom: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Approvals;
