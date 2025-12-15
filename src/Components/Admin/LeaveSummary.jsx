import React, { useEffect, useState } from "react";
import { FaEye, FaSearch, FaDownload, FaFileExport } from "react-icons/fa";

// Import the real API
import API from "../../API/axios";

// Loading Dots Component
const LoadingDots = ({ message = "Loading..." }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px",
        minHeight: "300px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "linear-gradient(45deg, #185a9d 0%, #43cea2 100%)",
              animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <p
        style={{
          color: "#555",
          fontSize: "16px",
          fontWeight: "500",
          margin: 0,
        }}
      >
        {message}
      </p>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default function LeaveSummary() {
  const [entitlements, setEntitlements] = useState([]);
  const [filteredEntitlements, setFilteredEntitlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEntitlement, setEditingEntitlement] = useState(null);

  // Selection state
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchEntitlements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get("/admin/entitlements");
      console.log("✅ Entitlements fetched successfully:", response.data);

      if (response.data && response.data.length > 0) {
        console.log("First employee data structure:", response.data[0]);
        console.log(
          "Short leave monthly details:",
          response.data[0].shortLeaveMonthlyDetails
        );
      }

      setEntitlements(response.data);
      setFilteredEntitlements(response.data);
    } catch (error) {
      console.error(
        "❌ Fetch entitlements error:",
        error.response?.data || error.message
      );
      setError(error.response?.data || "Failed to fetch entitlements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntitlements();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    let filtered = [...entitlements];

    // Search by employee name or email
    if (searchTerm) {
      filtered = filtered.filter(
        (ent) =>
          ent.employeeDetails?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ent.employeeDetails?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ent.employeeDetails?.fullName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by department
    if (departmentFilter) {
      filtered = filtered.filter(
        (ent) => ent.employeeDetails?.department === departmentFilter
      );
    }

    setFilteredEntitlements(filtered);
    setCurrentPage(1);

    // Clear selections when filters change
    setSelectedEmployees([]);
    setSelectAll(false);
  }, [searchTerm, departmentFilter, entitlements]);

  // Get unique departments for filter
  const uniqueDepartments = [
    ...new Set(
      entitlements.map((ent) => ent.employeeDetails?.department).filter(Boolean)
    ),
  ];

  // Pagination calculations
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredEntitlements.slice(
    indexOfFirstRow,
    indexOfLastRow
  );
  const totalPages = Math.ceil(filteredEntitlements.length / rowsPerPage);

  const resetFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
  };

  // Selection handlers
  const handleSelectEmployee = (employeeEmail) => {
    setSelectedEmployees((prev) => {
      const isSelected = prev.includes(employeeEmail);
      if (isSelected) {
        return prev.filter((email) => email !== employeeEmail);
      } else {
        return [...prev, employeeEmail];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(
        currentRows.map((emp) => emp.employeeDetails?.email).filter(Boolean)
      );
    }
    setSelectAll(!selectAll);
  };

  // Update selectAll state based on current selections
  useEffect(() => {
    const currentPageEmails = currentRows
      .map((emp) => emp.employeeDetails?.email)
      .filter(Boolean);
    const allCurrentSelected =
      currentPageEmails.length > 0 &&
      currentPageEmails.every((email) => selectedEmployees.includes(email));
    setSelectAll(allCurrentSelected);
  }, [selectedEmployees, currentRows]);

  // Calculate totals based only on casual leave
  const calculateTotalsFromCasualLeave = (emp) => {
    const casualLeave = emp.entitlements?.find((e) => e.leaveType === "CASUAL");

    const totalUsed = casualLeave?.usedDays || 0;
    const totalRemaining = casualLeave?.remainingDays || 0;

    return { totalUsed, totalRemaining };
  };

  const exportToCSV = () => {
    const headers = [
      "Employee Name",
      "Email",
      "Department",
      "Casual Used",
      "Casual Total",
      "Medical Used",
      "Medical Total",
      "Jan Short Leave",
      "Feb Short Leave",
      "Mar Short Leave",
      "Apr Short Leave",
      "May Short Leave",
      "Jun Short Leave",
      "Jul Short Leave",
      "Aug Short Leave",
      "Sep Short Leave",
      "Oct Short Leave",
      "Nov Short Leave",
      "Dec Short Leave",
      "Short Leave-Used",
      "Short Leave-Total Allowed",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredEntitlements.map((emp) => {
        const casualLeave = emp.entitlements?.find(
          (e) => e.leaveType === "CASUAL"
        );
        const sickLeave = emp.entitlements?.find(
          (e) => e.leaveType === "MEDICAL"
        );

        const monthlyData = emp.shortLeaveMonthlyDetails || {};
        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        // total short leave used
        const totalShortLeaveUsed = months.reduce((sum, month) => {
          return sum + (monthlyData[month]?.used || 0);
        }, 0);

        // keep 2/2 format as text
        const monthlyShortLeaveData = months.map((month) => {
          const used = monthlyData[month]?.used || 0;
          const total = monthlyData[month]?.total || 2;
          return `'${used}/${total}`;
        });

        return [
          emp.employeeDetails?.fullName || emp.employeeDetails?.name,
          emp.employeeDetails?.email,
          emp.employeeDetails?.department,
          casualLeave?.usedDays || 0,
          casualLeave?.totalEntitlement || 0,
          sickLeave?.usedDays || 0,
          sickLeave?.totalEntitlement || 0,
          ...monthlyShortLeaveData,
          totalShortLeaveUsed,
          24,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Leave_Summary_All_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  // Export selected employees' leave summary
  const exportSelectedToCSV = () => {
    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee to export.");
      return;
    }

    const selectedEntitlements = entitlements.filter((emp) =>
      selectedEmployees.includes(emp.employeeDetails?.email)
    );

    const headers = [
      "Employee Name",
      "Email",
      "Department",
      "Designation",
      "Casual Used",
      "Casual Total",
      "Casual Remaining",
      "Medical Used",
      "Medical Total",
      "Medical Remaining",
      "Duty Leave Used",
      "Jan Short Leave",
      "Feb Short Leave",
      "Mar Short Leave",
      "Apr Short Leave",
      "May Short Leave",
      "Jun Short Leave",
      "Jul Short Leave",
      "Aug Short Leave",
      "Sep Short Leave",
      "Oct Short Leave",
      "Nov Short Leave",
      "Dec Short Leave",
      "Short Leave-Total Used",
      "Short Leave-Total Allowed",
      "Short Leave-Remaining",
    ];

    const csvContent = [
      headers.join(","),
      ...selectedEntitlements.map((emp) => {
        const casualLeave = emp.entitlements?.find(
          (e) => e.leaveType === "CASUAL"
        );
        const sickLeave = emp.entitlements?.find(
          (e) => e.leaveType === "MEDICAL"
        );
        const dutyLeave = emp.entitlements?.find((e) => e.leaveType === "DUTY");

        const monthlyData = emp.shortLeaveMonthlyDetails || {};
        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        // total short leave used
        const totalShortLeaveUsed = months.reduce((sum, month) => {
          return sum + (monthlyData[month]?.used || 0);
        }, 0);

        // keep 2/2 format as text
        const monthlyShortLeaveData = months.map((month) => {
          const used = monthlyData[month]?.used || 0;
          const total = monthlyData[month]?.total || 2;
          return `'${used}/${total}`;
        });

        const shortLeaveRemaining = 24 - totalShortLeaveUsed;

        return [
          emp.employeeDetails?.fullName || emp.employeeDetails?.name,
          emp.employeeDetails?.email,
          emp.employeeDetails?.department,
          emp.employeeDetails?.designation,
          casualLeave?.usedDays || 0,
          casualLeave?.totalEntitlement || 0,
          casualLeave?.remainingDays || 0,
          sickLeave?.usedDays || 0,
          sickLeave?.totalEntitlement || 0,
          sickLeave?.remainingDays || 0,
          dutyLeave?.usedDays || 0,
          ...monthlyShortLeaveData,
          totalShortLeaveUsed,
          24,
          shortLeaveRemaining,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Selected_Employees_Leave_Summary_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  // Employee Details Modal Component
  const EmployeeDetailsModal = ({ employee, onClose }) => {
    const [detailedEntitlements, setDetailedEntitlements] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(true);

    useEffect(() => {
      const fetchDetailedEntitlements = async () => {
        try {
          const response = await API.get(
            `/admin/entitlements/${employee.employeeDetails?.email}`
          );
          setDetailedEntitlements(response.data);
        } catch (error) {
          console.error("Error fetching detailed entitlements:", error);
        } finally {
          setLoadingDetails(false);
        }
      };

      if (employee) {
        fetchDetailedEntitlements();
      }
    }, [employee]);

    if (!employee) return null;

    return (
      <div className="modal-overlay">
        <div className="modal" style={{ width: "800px", maxWidth: "90vw" }}>
          <div className="modal-header">
            <h3 style={{ color: "white", margin: 0 }}>
              Employee Entitlement Details
            </h3>
            <button className="btn-close" onClick={onClose}>
              ✖
            </button>
          </div>
          <div style={{ padding: "20px" }}>
            {loadingDetails ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                Loading details...
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>
                    Employee Information
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "15px",
                    }}
                  >
                    <div>
                      <label style={{ fontWeight: "bold" }}>Name:</label>
                      <span style={{ marginLeft: "10px" }}>
                        {employee.employeeDetails?.fullName ||
                          employee.employeeDetails?.name}
                      </span>
                    </div>
                    <div>
                      <label style={{ fontWeight: "bold" }}>Email:</label>
                      <span style={{ marginLeft: "10px" }}>
                        {employee.employeeDetails?.email}
                      </span>
                    </div>
                    <div>
                      <label style={{ fontWeight: "bold" }}>Department:</label>
                      <span style={{ marginLeft: "10px" }}>
                        {employee.employeeDetails?.department}
                      </span>
                    </div>
                    <div>
                      <label style={{ fontWeight: "bold" }}>Designation:</label>
                      <span style={{ marginLeft: "10px" }}>
                        {employee.employeeDetails?.designation}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ marginBottom: "15px", color: "#0056b3" }}>
                    Leave Entitlement Summary ({detailedEntitlements?.year})
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "15px",
                    }}
                  >
                    {detailedEntitlements?.entitlements
                      ?.filter((ent) => ent.leaveType !== "MATERNITY")
                      .map((ent) => (
                        <div
                          key={ent.leaveType}
                          style={{
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "15px",
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          <div style={{ marginBottom: "10px" }}>
                            <h5 style={{ margin: "0 0 10px 0", color: "#333" }}>
                              {ent.leaveType === "SICK"
                                ? "MEDICAL"
                                : ent.leaveType.replace("_", " ")}{" "}
                              LEAVE
                            </h5>
                          </div>
                          <div>
                            {/* Show full details for non-duty leave types */}
                            {ent.leaveType !== "DUTY" ? (
                              <>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "5px",
                                  }}
                                >
                                  <label style={{ fontWeight: "bold" }}>
                                    Total:
                                  </label>
                                  <span>{ent.totalEntitlement}</span>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "5px",
                                  }}
                                >
                                  <label style={{ fontWeight: "bold" }}>
                                    Used:
                                  </label>
                                  <span
                                    style={{
                                      color: "#dc3545",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {ent.usedDays}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "10px",
                                  }}
                                >
                                  <label style={{ fontWeight: "bold" }}>
                                    Remaining:
                                  </label>
                                  <span
                                    style={{
                                      color: "#28a745",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {ent.remainingDays}
                                  </span>
                                </div>
                                {ent.accumulatedHalfDays > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <label style={{ fontWeight: "bold" }}>
                                      Half Days:
                                    </label>
                                    <span>{ent.accumulatedHalfDays}</span>
                                  </div>
                                )}
                                <div
                                  style={{
                                    width: "100%",
                                    backgroundColor: "#e9ecef",
                                    borderRadius: "4px",
                                    marginTop: "10px",
                                    height: "8px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${
                                        (ent.usedDays / ent.totalEntitlement) *
                                        100
                                      }%`,
                                      backgroundColor: "#007bff",
                                      height: "100%",
                                      borderRadius: "4px",
                                    }}
                                  ></div>
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    marginTop: "5px",
                                    textAlign: "center",
                                  }}
                                >
                                  {(
                                    (ent.usedDays / ent.totalEntitlement) *
                                    100
                                  ).toFixed(1)}
                                  % Used
                                </div>
                              </>
                            ) : (
                              /* Show only used days for duty leave */
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "20px 0",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "24px",
                                    fontWeight: "bold",
                                    color: "#007bff",
                                    marginBottom: "5px",
                                  }}
                                >
                                  {ent.usedDays}
                                </div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#6c757d",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  Days Used
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {detailedEntitlements?.shortLeaveThisMonth && (
                  <div>
                    <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>
                      Short Leave Summary (
                      {new Date().toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                      )
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        backgroundColor: "#f8f9fa",
                        padding: "10px",
                        borderRadius: "4px",
                      }}
                    >
                      <div>
                        <label style={{ fontWeight: "bold" }}>Total:</label>
                        <span style={{ marginLeft: "5px" }}>
                          {detailedEntitlements.shortLeaveThisMonth.total}
                        </span>
                      </div>
                      <div>
                        <label style={{ fontWeight: "bold" }}>Used:</label>
                        <span style={{ marginLeft: "5px", color: "#dc3545" }}>
                          {detailedEntitlements.shortLeaveThisMonth.used}
                        </span>
                      </div>
                      <div>
                        <label style={{ fontWeight: "bold" }}>Remaining:</label>
                        <span style={{ marginLeft: "5px", color: "#28a745" }}>
                          {detailedEntitlements.shortLeaveThisMonth.remaining}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      {/* Header section - Always visible */}
      <div className="header-heading">
        <h3>Employee Leave Summary - {new Date().getFullYear()}</h3>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="btn-add"
            onClick={exportSelectedToCSV}
            disabled={selectedEmployees.length === 0}
            style={{
              background: selectedEmployees.length === 0 ? "#ccc" : "#17a2b8",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              padding: "4px 5px",

              cursor:
                selectedEmployees.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <FaFileExport /> Export Selected ({selectedEmployees.length})
          </button>
          <button
            className="btn-add"
            onClick={exportToCSV}
            style={{
              background: "#28a745",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              padding: "5px 6px",
            }}
          >
            <FaDownload /> Export All CSV
          </button>
        </div>
      </div>

      <div className="dashboard-paragraph">
        <p>Manage and view employee leave summary</p>
        {selectedEmployees.length > 0 && (
          <p style={{ color: "#17a2b8", marginTop: "5px" }}>
            {selectedEmployees.length} employee(s) selected
          </p>
        )}
      </div>

      {/* Content based on loading state */}
      {loading ? (
        <LoadingDots message="Loading summary of leaves..." />
      ) : error ? (
        <div
          style={{
            background: "#ffe6e6",
            color: "#c0392b",
            padding: "20px",
            marginBottom: "20px",
            borderRadius: "4px",
            textAlign: "center",
          }}
        >
          <p>Error: {error}</p>
          <button
            onClick={fetchEntitlements}
            style={{
              background: "#007bff",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Search and Filters */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "15px",
              marginBottom: "20px",
              padding: "20px",
              background: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <div style={{ position: "relative" }}>
              <FaSearch
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6c757d",
                }}
              />
              <input
                type="text"
                placeholder="Search by employee name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  paddingLeft: "35px",
                  padding: "8px 8px 8px 35px",
                  border: "2px solid #e9ecef",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  padding: "8px",
                  border: "2px solid #e9ecef",
                  borderRadius: "4px",
                  minWidth: "150px",
                }}
              >
                <option value="">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <button
                onClick={resetFilters}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div
            style={{
              marginBottom: "15px",
              color: "#6c757d",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <p>
              Showing {currentRows.length} of {filteredEntitlements.length}{" "}
              employees
            </p>
          </div>

          {/* Summary Statistics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                background: "#e3f2fd",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <h5
                style={{
                  margin: "0 0 5px 0",
                  color: "#1976d2",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Total Employees
              </h5>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
                {filteredEntitlements.length}
              </p>
            </div>

            <div
              style={{
                background: "#f3e5f5",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <h5
                style={{
                  margin: "0 0 5px 0",
                  color: "#7b1fa2",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Departments
              </h5>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
                {uniqueDepartments.length}
              </p>
            </div>
            <div
              style={{
                background: "#e8f5e8",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <h5
                style={{
                  margin: "0 0 5px 0",
                  color: "#388e3c",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Avg Casual Used
              </h5>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
                {filteredEntitlements.length > 0
                  ? (
                      filteredEntitlements.reduce((sum, emp) => {
                        const totals = calculateTotalsFromCasualLeave(emp);
                        return sum + totals.totalUsed;
                      }, 0) / filteredEntitlements.length
                    ).toFixed(1)
                  : "0.0"}
              </p>
            </div>
            <div
              style={{
                background: "#fff3e0",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <h5
                style={{
                  margin: "0 0 5px 0",
                  color: "#f57c00",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Avg Casual Remaining
              </h5>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
                {filteredEntitlements.length > 0
                  ? (
                      filteredEntitlements.reduce((sum, emp) => {
                        const totals = calculateTotalsFromCasualLeave(emp);
                        return sum + totals.totalRemaining;
                      }, 0) / filteredEntitlements.length
                    ).toFixed(1)
                  : "0.0"}
              </p>
            </div>
          </div>

          {/* Entitlements Table */}
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              marginBottom: "20px",
            }}
          >
            <table className="user-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      style={{
                        cursor: "pointer",
                        transform: "scale(1.2)",
                      }}
                    />
                  </th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Casual Leave</th>
                  <th>Medical Leave</th>
                  <th>Duty Leave</th>
                  <th>Short Leave (Monthly)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((emp) => {
                    const casualLeave = emp.entitlements?.find(
                      (e) => e.leaveType === "CASUAL"
                    );

                    const medicalLeave = emp.entitlements?.find(
                      (e) => e.leaveType === "SICK"
                    );
                    const dutyLeave = emp.entitlements?.find(
                      (e) => e.leaveType === "DUTY"
                    );
                    const shortLeave = emp.entitlements?.find(
                      (e) => e.leaveType === "SHORT_LEAVE"
                    );

                    return (
                      <tr key={emp.employeeDetails?.email}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(
                              emp.employeeDetails?.email
                            )}
                            onChange={() =>
                              handleSelectEmployee(emp.employeeDetails?.email)
                            }
                            style={{
                              cursor: "pointer",
                              transform: "scale(1.2)",
                            }}
                          />
                        </td>
                        <td>
                          <div>
                            <div
                              style={{
                                fontWeight: "bold",
                                fontSize: "14px",
                                color: "#2c3e50",
                              }}
                            >
                              {emp.employeeDetails?.fullName ||
                                emp.employeeDetails?.name}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                              {emp.employeeDetails?.email}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                marginTop: "5px",
                              }}
                            >
                              {emp.employeeDetails?.designation}
                            </div>
                          </div>
                        </td>
                        <td>{emp.employeeDetails?.department}</td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              fontSize: "14px",
                              gap: "2px",
                            }}
                          >
                            <div>
                              <span
                                style={{ color: "#dc3545", fontWeight: "600" }}
                              >
                                {casualLeave?.usedDays || 0}
                              </span>
                              <span
                                style={{
                                  margin: "0 4px",
                                  color: "#6c757d",
                                  fontWeight: "500",
                                }}
                              >
                                /
                              </span>
                              <span
                                style={{ color: "#2c3e50", fontWeight: "600" }}
                              >
                                {casualLeave?.totalEntitlement || 0}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#6c757d",
                                fontStyle: "italic",
                              }}
                            >
                              ({casualLeave?.remainingDays || 0} left)
                            </div>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              fontSize: "14px",
                              gap: "2px",
                            }}
                          >
                            <div>
                              <span
                                style={{ color: "#dc3545", fontWeight: "600" }}
                              >
                                {medicalLeave?.usedDays || 0}
                              </span>
                              <span
                                style={{
                                  margin: "0 4px",
                                  color: "#6c757d",
                                  fontWeight: "500",
                                }}
                              >
                                /
                              </span>
                              <span
                                style={{ color: "#2c3e50", fontWeight: "600" }}
                              >
                                {medicalLeave?.totalEntitlement || 0}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#6c757d",
                                fontStyle: "italic",
                              }}
                            >
                              ({medicalLeave?.remainingDays || 0} left)
                            </div>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              fontSize: "16px",
                              fontWeight: "700",
                              color: "#007bff",
                              padding: "10px 0",
                            }}
                          >
                            {dutyLeave?.usedDays || 0}
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              fontSize: "11px",
                              gap: "1px",
                              maxWidth: "350px",
                            }}
                          >
                            {emp.shortLeaveMonthlyDetails ? (
                              <>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "2px 8px",
                                    width: "100%",
                                  }}
                                >
                                  {Object.entries(
                                    emp.shortLeaveMonthlyDetails
                                  ).map(([month, data]) => (
                                    <div
                                      key={month}
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "10px",
                                        padding: "1px 2px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: "600",
                                          color: "#495057",
                                          minWidth: "28px",
                                        }}
                                      >
                                        {month.substring(0, 3)}:
                                      </span>
                                      <span>
                                        <span
                                          style={{
                                            color: "#dc3545",
                                            fontWeight: "600",
                                          }}
                                        >
                                          {data.used || 0}
                                        </span>
                                        <span
                                          style={{
                                            margin: "0 1px",
                                            color: "#6c757d",
                                          }}
                                        >
                                          /
                                        </span>
                                        <span
                                          style={{
                                            color: "#28a745",
                                            fontWeight: "600",
                                          }}
                                        >
                                          {data.total || 2}
                                        </span>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div
                                  style={{
                                    borderTop: "1px solid #dee2e6",
                                    marginTop: "3px",
                                    paddingTop: "3px",
                                    width: "100%",
                                    textAlign: "center",
                                    fontWeight: "bold",
                                    fontSize: "11px",
                                  }}
                                >
                                  Total:{" "}
                                  {Object.values(
                                    emp.shortLeaveMonthlyDetails
                                  ).reduce(
                                    (sum, monthData) =>
                                      sum + (monthData.used || 0),
                                    0
                                  )}
                                  /24
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <span
                                    style={{
                                      color: "#dc3545",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {shortLeave?.usedDays || 0}
                                  </span>
                                  <span
                                    style={{
                                      margin: "0 4px",
                                      color: "#6c757d",
                                      fontWeight: "500",
                                    }}
                                  >
                                    /
                                  </span>
                                  <span
                                    style={{
                                      color: "#2c3e50",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {shortLeave?.totalEntitlement || 24}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#6c757d",
                                    fontStyle: "italic",
                                  }}
                                >
                                  ({shortLeave?.remainingDays || 24} left)
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="actions-cell">
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <FaEye
                              style={{
                                cursor: "pointer",
                                fontSize: "30px",
                                color: "#007bff",
                                padding: "6px",
                                borderRadius: "4px",
                                transition: "all 0.2s",
                                backgroundColor: "transparent",
                                border: "1px solid transparent",
                              }}
                              onClick={() => setSelectedEmployee(emp)}
                              title="View Details"
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#e7f3ff";
                                e.target.style.border = "1px solid #007bff";
                                e.target.style.transform = "scale(1.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "transparent";
                                e.target.style.border = "1px solid transparent";
                                e.target.style.transform = "scale(1)";
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        padding: "20px",
                      }}
                    >
                      No employee entitlements found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <label>
                Rows per page:{" "}
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "5px 8px",
                    border: "2px solid #ccc",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "7px 12px",
                  border: "none",
                  fontWeight: "bold",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  background: currentPage === 1 ? "#ccc" : "#6c757d",
                  color: "white",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                Previous
              </button>

              <span
                style={{
                  margin: "0 5px",
                  fontWeight: "bold",
                  color: "#6e6d6d",
                }}
              >
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                style={{
                  padding: "7px 12px",
                  border: "none",
                  fontWeight: "bold",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  background: currentPage === totalPages ? "#ccc" : "#6c757d",
                  color: "white",
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      <style jsx>{`
        .dashboard {
          padding: 30px;
          height: 88vh;
          overflow-y: auto;
          background-color: #f8f9fa;
        }

        .header-heading {
          display: flex;
          justify-content: space-between;
          font-size: 25px;
          text-transform: uppercase;
          color: #0056b3;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .dashboard-paragraph {
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          color: #ba2b92;
          margin-top: 2px;
          margin-bottom: 25px;
        }

        .btn-add {
          padding: 12px 12px;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 13px;
          background: #2b5876;
          color: white;
          border: none;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .btn-add:hover {
          background: black;
        }

        .btn-add:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-add:disabled:hover {
          background: #ccc;
        }

        .user-table {
          width: 100%;
          border-collapse: collapse;
          background-color: white;
        }

        .user-table th,
        .user-table td {
          padding: 12px 8px;
          font-size: 12px;
          border: 1px solid #e9ecef;
          text-align: center;
          vertical-align: middle;
          text-transform: uppercase;
        }

        .user-table td {
          font-weight: bold;
          font-size: 12px;
          color: #5a5959;
        }

        .user-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
          position: sticky;
          top: 0;
          z-index: 10;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }

        .user-table tbody tr:hover {
          background-color: #f8f9fa;
          transition: background-color 0.2s;
        }

        .actions-cell {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .actions-cell {
          text-align: center !important;
          vertical-align: middle !important;
          padding: 8px !important;
        }

        .actions-cell > div {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 8px !important;
        }

        .modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background-color: rgba(0, 0, 0, 0.6) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 999999 !important;
          visibility: visible !important;
          opacity: 1 !important;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal {
          position: relative;
          background-color: white;
          border-radius: 12px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          display: block;
          visibility: visible;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          padding: 15px 20px !important;
          margin: 0 !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          background: linear-gradient(
            135deg,
            #185a9d 0%,
            #43cea2 100%
          ) !important;
          border-radius: 12px 12px 0 0 !important;
          border-bottom: 2px solid #e9ecef;
        }

        .btn-close {
          background: #dc3545 !important;
          color: white !important;
          border: none !important;
          padding: 8px 12px !important;
          cursor: pointer !important;
          font-weight: bold !important;
          border-radius: 4px !important;
          font-size: 16px !important;
          transition: background 0.2s;
        }

        .btn-close:hover {
          background: #c82333 !important;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin: 15px 0;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
