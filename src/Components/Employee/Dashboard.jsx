import React, { useState, useEffect } from "react";
import { Award, AlertCircle, RefreshCw, Menu } from "lucide-react";
import Navbar from "../Navbar/Navbar";
import EmployeeSidebar from "../Navbar/EmployeeSidebar";
import "../CSS/EmployeeDashboard.css";
import EmployeeDashboard from "./EmployeeDashboard";
import API from "../../utils/apiUtils";

// ---------------- Leave Entitlement Card (Responsive) ----------------
const LeaveEntitlementCard = ({ entitlement, onRefresh, isMobile }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getLeaveTypeColor = (type) => {
    const colors = {
      CASUAL: {
        bg: "#ffffff",
        accent: "#21c269",
        text: "#333333",
        lightBg: "rgba(8, 189, 90, 0.862)",
        shadow: "0 8px 12px rgba(0, 0, 0, 0.1)",
        border: "rgba(79, 172, 254, 0.2)",
      },
      SICK: {
        bg: "#ffffff",
        accent: "#2e7abd",
        text: "#333333",
        lightBg: "rgb(37, 110, 174)",
        shadow: "0 8px 12px rgba(0, 0, 0, 0.1)",
        border: "rgba(229, 101, 243, 0.2)",
      },
      DUTY: {
        bg: "#ffffff",
        accent: "#1ae3a4",
        text: "#333333",
        lightBg: "#1ae3a4",
        shadow: "0 8px 12px rgba(0, 0, 0, 0.1)",
        border: "rgba(229, 101, 243, 0.2)",
      },
      MATERNITY: {
        bg: "#ffffff",
        accent: "#95900f",
        text: "#333333",
        lightBg: "#95912285",
        shadow: "0 8px 12px rgba(0, 0, 0, 0.1)",
        border: "rgba(250, 242, 17, 0.418)",
      },
    };
    return colors[type] || colors.CASUAL;
  };

  const getLeaveTypeDisplayName = (leaveType) => {
    const displayNames = {
      CASUAL: "CASUAL LEAVE",
      SICK: "MEDICAL LEAVE",
      DUTY: "DUTY LEAVE",
      MATERNITY: "MATERNITY LEAVE",
      SHORT: "SHORT LEAVE",
      HALF_DAY: "HALF DAY LEAVE",
    };
    return displayNames[leaveType] || leaveType.replace("_", " ");
  };

  const colors = getLeaveTypeColor(entitlement.leaveType);
  const isUnlimited =
    entitlement.totalEntitlement === -1 || entitlement.isUnlimited;

  const effectiveUsedDays =
    entitlement.effectiveUsedDays || entitlement.usedDays || 0;
  const effectiveRemainingDays = isUnlimited
    ? "Unlimited"
    : entitlement.effectiveRemainingDays || entitlement.remainingDays || 0;

  const hasHalfDays = entitlement.hasHalfDays || false;
  const accumulatedHalfDays = entitlement.accumulatedHalfDays || 0;

  const usagePercentage = isUnlimited
    ? 0
    : entitlement.totalEntitlement > 0
    ? (effectiveUsedDays / entitlement.totalEntitlement) * 100
    : 0;

  const getUsedDaysText = () => {
    if (isUnlimited) {
      if (hasHalfDays && accumulatedHalfDays > 0) {
        return `${effectiveUsedDays} Used (${entitlement.usedDays} full + ${accumulatedHalfDays} half)`;
      }
      return `${effectiveUsedDays} Used`;
    } else {
      if (hasHalfDays && accumulatedHalfDays > 0) {
        return `${effectiveUsedDays} Used (${entitlement.usedDays} full + ${accumulatedHalfDays} half) • ${entitlement.totalEntitlement} Total`;
      }
      return `${effectiveUsedDays} Used • ${entitlement.totalEntitlement} Total`;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      className={`d-flex ${
        isMobile ? "flex-row" : "flex-column flex-sm-row"
      } align-items-start align-items-sm-center justify-content-between p-3 rounded-4 border position-relative overflow-hidden h-100 leave-card`}
      style={{
        background: colors.bg,
        color: colors.text,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: colors.shadow,
        border: `1px solid ${colors.border}`,
        marginBottom: isMobile ? "12px" : "16px",
        cursor: "pointer",
        minHeight: isMobile ? "140px" : "180px",
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `${colors.shadow}, 0 12px 24px rgba(0, 0, 0, 0.15)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = colors.shadow;
        }
      }}
    >
      <div className={`flex-grow-1 ${isMobile ? "me-3" : "mb-3 mb-sm-0"}`}>
        <h6
          className="fw-semibold mb-2"
          style={{
            fontSize: isMobile ? "0.85rem" : "clamp(0.8rem, 2.5vw, 0.9rem)",
            lineHeight: "1.2",
            letterSpacing: "0.3px",
            color: colors.text,
          }}
        >
          {getLeaveTypeDisplayName(entitlement.leaveType)}
        </h6>

        <div className="mb-2">
          <small
            style={{
              fontSize: isMobile ? "0.8rem" : "clamp(0.8rem, 2vw, 0.9rem)",
              opacity: 0.9,
              color: colors.text,
              fontWeight: "500",
              display: "block",
              marginBottom: "8px",
            }}
          >
            {getUsedDaysText()}
          </small>
        </div>

        {hasHalfDays && accumulatedHalfDays > 0 && (
          <div className="mb-2">
            <small
              style={{
                fontSize: isMobile ? "0.75rem" : "clamp(0.75rem, 1.6vw, 1rem)",
                opacity: 0.9,
                color: colors.accent,
                fontStyle: "italic",
                display: "block",
              }}
            >
              Includes {accumulatedHalfDays} half day
              {accumulatedHalfDays > 1 ? "s" : ""}
            </small>
          </div>
        )}

        {!isUnlimited && (
          <span
            className="px-2 py-1 rounded-pill d-inline-block"
            style={{
              fontSize: isMobile ? "0.6rem" : "clamp(0.6rem, 1.5vw, 0.65rem)",
              background:
                usagePercentage > 80
                  ? "rgba(220, 38, 38, 0.1)"
                  : `${colors.accent}20`,
              color: usagePercentage > 80 ? "#dc2626" : colors.accent,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              border:
                usagePercentage > 80
                  ? "1px solid rgba(220, 38, 38, 0.2)"
                  : `1px solid ${colors.accent}30`,
            }}
          >
            {usagePercentage.toFixed(1)}% used
          </span>
        )}
      </div>

      <div className="d-flex flex-column align-items-center align-items-sm-end">
        <div
          className="d-flex align-items-center justify-content-center fw-bold text-white rounded-circle mb-2"
          style={{
            width: isMobile ? "50px" : "clamp(50px, 8vw, 62px)",
            height: isMobile ? "50px" : "clamp(50px, 8vw, 62px)",
            backgroundColor: colors.lightBg,
            fontSize: isUnlimited
              ? isMobile
                ? "0.7rem"
                : "clamp(0.7rem, 1.5vw, 0.8rem)"
              : effectiveRemainingDays >= 100
              ? isMobile
                ? "1rem"
                : "clamp(1.1rem, 2vw, 1.2rem)"
              : isMobile
              ? "1.1rem"
              : "clamp(1.2rem, 2.2vw, 1.2rem)",
            boxShadow: `0 4px 12px ${colors.accent}40`,
          }}
        >
          {isUnlimited ? "∞" : effectiveRemainingDays}
        </div>
        <small
          className="text-center"
          style={{
            fontSize: isMobile ? "0.6rem" : "clamp(0.6rem, 1.2vw, 0.7rem)",
            opacity: 0.7,
            fontWeight: "600",
            color: colors.text,
            textTransform: "uppercase",
            letterSpacing: "0.3px",
            lineHeight: "1.2",
          }}
        >
          {isUnlimited
            ? "As Required"
            : effectiveRemainingDays === 1
            ? "Day Remaining"
            : "Days Remaining"}
        </small>
      </div>

      {/* Progress bar */}
      {!isUnlimited && (
        <div
          className="position-absolute bottom-0 start-0"
          style={{
            width: "100%",
            height: "4px",
            background: "rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              width: `${Math.min(usagePercentage, 100)}%`,
              height: "100%",
              background:
                usagePercentage > 80
                  ? "linear-gradient(90deg, #dc2626 0%, #ef4444 100%)"
                  : `linear-gradient(90deg, ${colors.accent} 0%, ${colors.accent}cc 100%)`,
              transition: "width 0.8s ease",
            }}
          />
        </div>
      )}

      {/* Special indicator for unlimited leave */}
      {isUnlimited && (
        <div
          className="position-absolute bottom-0 start-0"
          style={{
            width: "100%",
            height: "4px",
            background: `linear-gradient(90deg, ${colors.accent} 0%, ${colors.accent}cc 50%, ${colors.accent} 100%)`,
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
};

// ---------------- Short Leave Entitlement Card (Responsive) ----------------
const ShortLeaveEntitlementCard = ({
  shortLeaveEntitlement,
  onRefresh,
  isMobile,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const colors = {
    bg: "#ffffff",
    accent: "#1b90b7",
    text: "#333333",
    lightBg: "#1b90b7",
    shadow: "0 8px 12px rgba(0, 0, 0, 0.1)",
    border: "#288d6d63",
  };

  const usedShortLeaves = shortLeaveEntitlement.usedShortLeaves || 0;
  const totalShortLeaves = shortLeaveEntitlement.totalShortLeaves || 2;
  const remainingShortLeaves =
    shortLeaveEntitlement.remainingShortLeaves ||
    totalShortLeaves - usedShortLeaves;
  const month = shortLeaveEntitlement.month || new Date().getMonth() + 1;
  const year = shortLeaveEntitlement.year || new Date().getFullYear();

  const usagePercentage =
    totalShortLeaves > 0 ? (usedShortLeaves / totalShortLeaves) * 100 : 0;

  const getMonthName = (monthNum) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months[monthNum - 1] || "Unknown";
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      className={`d-flex ${
        isMobile ? "flex-row" : "flex-column flex-sm-row"
      } align-items-start align-items-sm-center justify-content-between p-3 rounded-4 border position-relative overflow-hidden h-100 leave-card`}
      style={{
        background: colors.bg,
        color: colors.text,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: colors.shadow,
        border: `1px solid ${colors.border}`,
        marginBottom: isMobile ? "12px" : "16px",
        cursor: "pointer",
        minHeight: isMobile ? "140px" : "180px",
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `${colors.shadow}, 0 12px 24px rgba(0, 0, 0, 0.15)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = colors.shadow;
        }
      }}
    >
      <div className={`flex-grow-1 ${isMobile ? "me-3" : "mb-3 mb-sm-0"}`}>
        <h6
          className="fw-semibold mb-2"
          style={{
            fontSize: isMobile ? "0.85rem" : "clamp(0.8rem, 2.5vw, 0.9rem)",
            lineHeight: "1.2",
            letterSpacing: "0.3px",
            color: colors.text,
          }}
        >
          SHORT LEAVE
        </h6>

        <div className="mb-2">
          <small
            style={{
              fontSize: isMobile ? "0.8rem" : "clamp(0.8rem, 2vw, 0.9rem)",
              opacity: 0.9,
              color: colors.text,
              fontWeight: "500",
              display: "block",
              marginBottom: "8px",
            }}
          >
            {usedShortLeaves} Used • {totalShortLeaves} Total
          </small>
        </div>

        <div className="mb-3">
          <span
            className="px-2 py-1 rounded-pill d-inline-block"
            style={{
              fontSize: isMobile ? "0.6rem" : "clamp(0.6rem, 1.5vw, 0.65rem)",
              background:
                usagePercentage > 80
                  ? "rgba(220, 38, 38, 0.1)"
                  : `${colors.accent}20`,
              color: usagePercentage > 80 ? "#dc2626" : colors.accent,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              border:
                usagePercentage > 80
                  ? "1px solid rgba(220, 38, 38, 0.2)"
                  : `1px solid ${colors.accent}30`,
            }}
          >
            {usagePercentage.toFixed(1)}% used
          </span>
        </div>

        <div>
          <small
            style={{
              fontSize: isMobile ? "1.1rem" : "clamp(1.1rem, 2.5vw, 1.4rem)",
              opacity: 0.9,
              color: colors.accent,
              fontWeight: "bold",
              fontStyle: "italic",
            }}
          >
            {getMonthName(month)} {year}
          </small>
        </div>
      </div>

      <div className="d-flex flex-column align-items-center align-items-sm-end">
        <div
          className="d-flex align-items-center justify-content-center fw-bold text-white rounded-circle mb-2"
          style={{
            width: isMobile ? "50px" : "clamp(50px, 8vw, 62px)",
            height: isMobile ? "50px" : "clamp(50px, 8vw, 62px)",
            backgroundColor: colors.lightBg,
            fontSize:
              remainingShortLeaves >= 10
                ? isMobile
                  ? "1rem"
                  : "clamp(1.1rem, 2vw, 1.2rem)"
                : isMobile
                ? "1.1rem"
                : "clamp(1.2rem, 2.2vw, 1.2rem)",
            boxShadow: `0 4px 12px ${colors.accent}40`,
          }}
        >
          {remainingShortLeaves}
        </div>

        <small
          className="text-center"
          style={{
            fontSize: isMobile ? "0.6rem" : "clamp(0.6rem, 1.2vw, 0.7rem)",
            opacity: 0.7,
            fontWeight: "600",
            color: colors.text,
            textTransform: "uppercase",
            letterSpacing: "0.3px",
            lineHeight: "1.2",
          }}
        >
          {remainingShortLeaves === 1 ? "Leave Remaining" : "Leaves Remaining"}
        </small>
      </div>

      <div
        className="position-absolute bottom-0 start-0"
        style={{
          width: "100%",
          height: "4px",
          background: "rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            width: `${Math.min(usagePercentage, 100)}%`,
            height: "100%",
            background:
              usagePercentage > 80
                ? "linear-gradient(90deg, #dc2626 0%, #ef4444 100%)"
                : `linear-gradient(90deg, ${colors.accent} 0%, ${colors.accent}cc 100%)`,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
};

// ---------------- Main Dashboard Component ----------------
const Dashboard = () => {
  let email, token;

  try {
    email = localStorage?.getItem("email") || "demo@example.com";
    token = localStorage?.getItem("token") || "demo-token";
  } catch (e) {
    email = "demo@example.com";
    token = "demo-token";
  }

  const [leaveEntitlements, setLeaveEntitlements] = useState([]);
  const [shortLeaveEntitlements, setShortLeaveEntitlements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showMessage = (message, isError = false) => {
    console.log(isError ? "Error:" : "Success:", message);
  };

  // Filter and order entitlements to show only the required ones
  const filterAndOrderEntitlements = (entitlements) => {
    const requiredTypes = ["CASUAL", "SICK", "DUTY"];

    return requiredTypes
      .map((type) => entitlements.find((e) => e.leaveType === type))
      .filter(Boolean); // Remove undefined entries
  };

  const fetchLeaveEntitlements = async () => {
    try {
      const entitlements = await API.get("/entitlements/my-entitlements");
      const entitlementsArray = Array.isArray(entitlements) ? entitlements : [];

      // Process entitlements to handle unlimited leave properly
      const processedEntitlements = entitlementsArray.map((entitlement) => {
        const isUnlimited = entitlement.totalEntitlement === -1;
        const halfDays = entitlement.accumulatedHalfDays || 0;

        let effectiveUsedDays, effectiveRemainingDays;

        if (isUnlimited) {
          effectiveUsedDays = entitlement.usedDays + halfDays * 0.5;
          effectiveRemainingDays = "Unlimited";
        } else {
          effectiveUsedDays = entitlement.usedDays + halfDays * 0.5;
          effectiveRemainingDays =
            entitlement.totalEntitlement - effectiveUsedDays;
        }

        return {
          ...entitlement,
          isUnlimited,
          effectiveUsedDays,
          effectiveRemainingDays,
          hasHalfDays: halfDays > 0,
        };
      });

      // Filter and order the entitlements
      const filteredEntitlements = filterAndOrderEntitlements(
        processedEntitlements
      );
      setLeaveEntitlements(filteredEntitlements);
    } catch (err) {
      console.error("Failed to fetch leave entitlements:", err);
      showMessage("Failed to fetch leave entitlements", true);
      setLeaveEntitlements([]);
    }
  };

  // const fetchShortLeaveEntitlements = async () => {
  //   try {
  //     if (!token) return;
  //     const response = await fetch(
  //       "http://localhost:8080/leaves/my-short-leave-entitlements",
  //       {
  //         method: "GET",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     if (response.ok) {
  //       const data = await response.json();
  //       // Only show current month's short leave
  //       const currentMonth = new Date().getMonth() + 1;
  //       const currentYear = new Date().getFullYear();
  //       const currentMonthData = Array.isArray(data)
  //         ? data.filter(
  //             (item) => item.month === currentMonth && item.year === currentYear
  //           )
  //         : [];
  //       setShortLeaveEntitlements(currentMonthData);
  //     } else {
  //       console.error("Failed to fetch short leave entitlements");
  //       setShortLeaveEntitlements([]);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching short leave entitlements:", error);
  //     setShortLeaveEntitlements([]);
  //   }
  // };

  const fetchShortLeaveEntitlements = async () => {
    try {
      const data = await API.get("/leaves/my-short-leave-entitlements");

      // Only show current month's short leave
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const currentMonthData = Array.isArray(data)
        ? data.filter(
            (item) => item.month === currentMonth && item.year === currentYear
          )
        : [];

      setShortLeaveEntitlements(currentMonthData);
    } catch (error) {
      console.error("Error fetching short leave entitlements:", error);
      setShortLeaveEntitlements([]);
    }
  };

  const refreshAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLeaveEntitlements(),
        fetchShortLeaveEntitlements(),
      ]);
      setLastRefresh(new Date());
      showMessage("Leave entitlements refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
      showMessage("Failed to refresh data", true);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data when component mounts and when localStorage changes
  useEffect(() => {
    if (!token || !email) return;

    refreshAllData();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "leaveDataUpdated") {
        refreshAllData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom event listener for same-tab updates
    const handleCustomRefresh = () => {
      refreshAllData();
    };

    window.addEventListener("refreshLeaveData", handleCustomRefresh);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("refreshLeaveData", handleCustomRefresh);
    };
  }, [token, email]);

  // Add a method to trigger refresh from other components
  useEffect(() => {
    window.refreshDashboardData = refreshAllData;
    return () => {
      delete window.refreshDashboardData;
    };
  }, []);

  if (!token || !email) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning d-flex align-items-center shadow-lg border-0 rounded-4">
              <AlertCircle size={20} className="me-3 text-warning" />
              <div>
                <h6 className="mb-1 fw-semibold">Authentication Required</h6>
                <p className="mb-0">
                  Please log in to access the employee dashboard.
                </p>
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
        style={{
          marginLeft: isMobile ? "0" : "280px",
          marginTop: "60px",
          minHeight: "calc(100vh - 60px)",
        }}
      >
        {/* Dashboard Header Component */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <EmployeeDashboard />
        </div>

        {/* Leave Summary Section */}
        <div className={`container-fluid ${isMobile ? "px-3" : "px-4"} py-4`}>
          <div className="glass-card rounded-4">
            <div className={`p-${isMobile ? "3" : "4"}`}>
              <div
                className={`d-flex ${
                  isMobile ? "flex-column" : "flex-column flex-sm-row"
                } align-items-start align-items-sm-center justify-content-between mb-4`}
              >
                <div
                  className={`d-flex align-items-center ${
                    isMobile ? "mb-3" : "mb-2 mb-sm-0"
                  }`}
                >
                  <Award
                    size={isMobile ? 20 : 24}
                    className="text-success me-2"
                  />
                  <h5
                    className="mb-0 fw-bold text-dark"
                    style={{
                      fontSize: isMobile
                        ? "1.1rem"
                        : "clamp(1.1rem, 2.5vw, 1.3rem)",
                    }}
                  >
                    LEAVE SUMMARY
                  </h5>
                </div>
                <div
                  className={`d-flex ${
                    isMobile ? "flex-column gap-2" : "align-items-center gap-3"
                  }`}
                >
                  {lastRefresh && (
                    <small
                      className="text-muted"
                      style={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                    >
                      Last updated: {lastRefresh.toLocaleTimeString()}
                    </small>
                  )}
                  <button
                    onClick={refreshAllData}
                    disabled={loading}
                    className={`btn btn-outline-primary ${
                      isMobile ? "btn-sm" : "btn-sm"
                    } rounded-3 d-flex align-items-center justify-content-center`}
                    title="Refresh all leave data"
                    style={{ minWidth: isMobile ? "120px" : "auto" }}
                  >
                    <RefreshCw
                      size={14}
                      className={`me-1 ${loading ? "spin" : ""}`}
                    />
                    {loading ? "Updating..." : "Refresh"}
                  </button>
                  <span
                    className="fw-semibold text-success"
                    style={{
                      fontSize: isMobile
                        ? "1.2rem"
                        : "clamp(1.2rem, 4vw, 1.5rem)",
                    }}
                  >
                    {new Date().getFullYear()}
                  </span>
                </div>
              </div>

              {loading && (
                <div className="d-flex align-items-center justify-content-center py-3 mb-4">
                  <div
                    className="spinner-border spinner-border-sm text-primary me-2"
                    role="status"
                  ></div>
                  <span
                    className="text-muted"
                    style={{ fontSize: isMobile ? "0.85rem" : "1rem" }}
                  >
                    Updating leave entitlements...
                  </span>
                </div>
              )}

              {/* Mobile Layout */}
              {isMobile ? (
                <div className="row g-2">
                  {/* Short Leave Entitlements - Current Month Only */}
                  {shortLeaveEntitlements.map((shortLeave, index) => (
                    <div
                      key={`short-${shortLeave.month}-${shortLeave.year}-${index}`}
                      className="col-12"
                    >
                      <ShortLeaveEntitlementCard
                        shortLeaveEntitlement={shortLeave}
                        onRefresh={refreshAllData}
                        isMobile={isMobile}
                      />
                    </div>
                  ))}

                  {/* Regular Leave Entitlements - Only CASUAL, SICK, DUTY */}
                  {leaveEntitlements.map((entitlement, index) => (
                    <div
                      key={`${entitlement.leaveType}-${
                        entitlement.year || new Date().getFullYear()
                      }-${index}`}
                      className="col-12"
                    >
                      <LeaveEntitlementCard
                        entitlement={entitlement}
                        onRefresh={refreshAllData}
                        isMobile={isMobile}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop Layout */
                <div className="row g-3">
                  {/* Short Leave Entitlements - Current Month Only */}
                  {shortLeaveEntitlements.map((shortLeave, index) => (
                    <div
                      key={`short-${shortLeave.month}-${shortLeave.year}-${index}`}
                      className="col-12 col-sm-6 col-lg-4 col-xl-3"
                    >
                      <ShortLeaveEntitlementCard
                        shortLeaveEntitlement={shortLeave}
                        onRefresh={refreshAllData}
                        isMobile={isMobile}
                      />
                    </div>
                  ))}

                  {/* Regular Leave Entitlements - Only CASUAL, SICK, DUTY */}
                  {leaveEntitlements.map((entitlement, index) => (
                    <div
                      key={`${entitlement.leaveType}-${
                        entitlement.year || new Date().getFullYear()
                      }-${index}`}
                      className="col-12 col-sm-6 col-lg-4 col-xl-3"
                    >
                      <LeaveEntitlementCard
                        entitlement={entitlement}
                        onRefresh={refreshAllData}
                        isMobile={isMobile}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* No entitlements message */}
              {!loading &&
                leaveEntitlements.length === 0 &&
                shortLeaveEntitlements.length === 0 && (
                  <div className="text-center py-5">
                    <AlertCircle
                      size={isMobile ? 36 : 48}
                      className="text-muted mb-3"
                    />
                    <h6
                      className="text-muted"
                      style={{
                        fontSize: isMobile
                          ? "1rem"
                          : "clamp(1rem, 2.5vw, 1.2rem)",
                      }}
                    >
                      No entitlements found
                    </h6>
                    <p
                      className="text-muted small"
                      style={{
                        fontSize: isMobile
                          ? "0.8rem"
                          : "clamp(0.8rem, 2vw, 0.9rem)",
                        maxWidth: "300px",
                        margin: "0 auto",
                      }}
                    >
                      Your leave entitlements will appear here once they are set
                      up.
                    </p>
                    <button
                      onClick={refreshAllData}
                      className="btn btn-outline-primary btn-sm mt-3"
                      disabled={loading}
                    >
                      <RefreshCw size={14} className="me-1" />
                      Try Refresh
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        /* Glass effect for cards */
        .glass-card {
          background: #bccee4f2;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        /* Leave card hover effects - disabled on mobile */
        .leave-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (min-width: 992px) {
          .leave-card:hover {
            transform: translateY(-2px);
          }
        }

        /* Refresh button spin animation */
        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Mobile responsive adjustments */
        @media (max-width: 991.98px) {
          .main-content {
            margin-left: 0 !important;
          }

          /* Better mobile spacing */
          .container-fluid {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }

          /* Mobile card adjustments */
          .leave-card {
            margin-bottom: 0.75rem;
            min-height: 120px !important;
          }

          /* Mobile button improvements */
          .btn-sm {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
          }
        }

        @media (max-width: 576px) {
          /* Extra small screens */
          .container-fluid {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }

          .glass-card {
            border-radius: 1rem !important;
          }

          /* Adjust card padding for very small screens */
          .leave-card {
            padding: 0.75rem !important;
            min-height: 110px !important;
          }

          /* Stack header elements better on small screens */
          .d-flex.flex-column.gap-2 {
            gap: 0.5rem !important;
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

        /* Smooth transitions for responsive changes */
        * {
          transition: margin 0.3s ease, padding 0.3s ease;
        }

        /* Loading spinner animation */
        .spinner-border {
          animation: spinner-border 0.75s linear infinite;
        }

        @keyframes spinner-border {
          to {
            transform: rotate(360deg);
          }
        }

        /* Enhanced mobile touch targets */
        @media (max-width: 768px) {
          button {
            min-height: 44px; /* iOS recommended touch target size */
          }

          .btn-sm {
            min-height: 38px;
          }
        }

        /* Progressive enhancement for larger screens */
        @media (min-width: 1200px) {
          .leave-card:hover {
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
          }
        }

        /* Dark mode consideration for accessibility */
        @media (prefers-color-scheme: dark) {
          .glass-card {
            background: #bccee4f2;
          }
        }

        /* Reduced motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .leave-card,
          .spin,
          * {
            animation: none !important;
            transition: none !important;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .leave-card {
            border: 2px solid #000;
          }

          .glass-card {
            border: 2px solid #000;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
