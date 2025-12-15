import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaDownload,
  FaUser,
  FaHistory,
  FaEye,
  FaTimes,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import API from "../../API/axios";

const LeaveHistorySummary = () => {
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear() - 1
  );
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Employee History Modal State
  const [showEmployeeHistory, setShowEmployeeHistory] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeHistoryData, setEmployeeHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Selected Employees Summary State
  const [showSelectedSummary, setShowSelectedSummary] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedEmployeesData, setSelectedEmployeesData] = useState([]);
  const [loadingSelectedSummary, setLoadingSelectedSummary] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [departments, setDepartments] = useState([]);

  // Form state for new/edit entry
  const [formData, setFormData] = useState({
    employeeEmail: "",
    year: selectedYear,
    casualUsed: 0,
    casualTotal: 21,
    medicalUsed: 0,
    medicalTotal: 24,
    dutyUsed: 0,
    shortLeaveMonthlyDetails: {},
    notes: "",
  });

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

  useEffect(() => {
    fetchAllUsers();
    fetchAvailableYears();
    initializeShortLeaveData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchHistoricalData();
    }
  }, [selectedYear]);

  useEffect(() => {
    // Extract unique departments from employees
    const uniqueDepartments = [
      ...new Set(
        employees
          .map((emp) => emp.employeeDetails?.department)
          .filter((dept) => dept)
      ),
    ];
    setDepartments(uniqueDepartments);
  }, [employees]);

  const initializeShortLeaveData = () => {
    const shortLeaveData = {};
    months.forEach((month) => {
      shortLeaveData[month] = { used: 0, total: 2 };
    });
    setFormData((prev) => ({
      ...prev,
      shortLeaveMonthlyDetails: shortLeaveData,
    }));
  };

  const fetchAllUsers = async () => {
    try {
      const response = await API.get("/admin/users");
      setAllEmployees(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch employees");
    }
  };

  const fetchAvailableYears = async () => {
    try {
      const response = await API.get(
        "/admin/historical-leave-summaries/available-years"
      );
      const currentYear = new Date().getFullYear();
      const years = [];

      for (let year = currentYear - 1; year >= currentYear - 10; year--) {
        years.push(year);
      }

      setAvailableYears(years);
    } catch (error) {
      console.error("Error fetching available years:", error);
    }
  };

  const fetchHistoricalData = async () => {
    setLoading(true);
    try {
      const response = await API.get(
        `/admin/historical-leave-summaries/year/${selectedYear}`
      );
      if (response.data.success) {
        setEmployees(response.data.data || []);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching historical data:", error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch selected employees data for previous year
  const fetchSelectedEmployeesData = async () => {
    if (selectedEmployees.length === 0) {
      setError("Please select employees to view summary");
      return;
    }

    setLoadingSelectedSummary(true);
    try {
      const promises = selectedEmployees.map((email) =>
        API.get(
          `/admin/historical-leave-summaries/employee/${email}/year/${selectedYear}`
        )
      );

      const responses = await Promise.all(promises);
      const employeesData = responses.map((response, index) => ({
        email: selectedEmployees[index],
        data: response.data.success ? response.data.data : null,
        employeeDetails: allEmployees.find(
          (emp) => emp.email === selectedEmployees[index]
        ),
      }));

      setSelectedEmployeesData(employeesData);
      setShowSelectedSummary(true);
    } catch (error) {
      console.error("Error fetching selected employees data:", error);
      setError("Failed to fetch selected employees data");
    } finally {
      setLoadingSelectedSummary(false);
    }
  };

  // Fetch employee's historical leave data across all years
  const fetchEmployeeHistory = async (employeeEmail) => {
    setLoadingHistory(true);
    try {
      const response = await API.get(
        `/admin/historical-leave-summaries/employee/${employeeEmail}`
      );
      if (response.data.success) {
        setEmployeeHistoryData(response.data.data || []);
      } else {
        setEmployeeHistoryData([]);
      }
    } catch (error) {
      console.error("Error fetching employee history:", error);
      setEmployeeHistoryData([]);
      setError("Failed to fetch employee history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const showEmployeeHistoryModal = async (employee) => {
    const employeeDetails = employee.employeeDetails || employee;
    setSelectedEmployee(employeeDetails);
    setShowEmployeeHistory(true);
    await fetchEmployeeHistory(employeeDetails.email);
  };

  const handleEmployeeSelection = (email, isSelected) => {
    if (isSelected) {
      setSelectedEmployees((prev) => [...prev, email]);
    } else {
      setSelectedEmployees((prev) => prev.filter((e) => e !== email));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allEmails = filteredEmployees.map(
        (emp) => emp.employeeDetails?.email || emp.email
      );
      setSelectedEmployees(allEmails);
    } else {
      setSelectedEmployees([]);
    }
  };

  // Filter employees based on search and department
  const filteredEmployees = employees.filter((employee) => {
    const employeeDetails = employee.employeeDetails || {};
    const name = employeeDetails.fullName || employeeDetails.name || "";
    const email = employeeDetails.email || "";
    const department = employeeDetails.department || "";

    const matchesSearch =
      searchTerm === "" ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === "" || department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  // Calculate statistics
  const totalEmployees = filteredEmployees.length;
  const avgCasualUsed =
    totalEmployees > 0
      ? (
          filteredEmployees.reduce(
            (sum, emp) => sum + (emp.historicalSummary?.casualUsed || 0),
            0
          ) / totalEmployees
        ).toFixed(1)
      : 0;
  const avgCasualRemaining =
    totalEmployees > 0
      ? (
          filteredEmployees.reduce(
            (sum, emp) =>
              sum +
              ((emp.historicalSummary?.casualTotal || 21) -
                (emp.historicalSummary?.casualUsed || 0)),
            0
          ) / totalEmployees
        ).toFixed(1)
      : 21;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await API.post(
        "/admin/historical-leave-summaries/employee",
        formData
      );

      if (response.data.success) {
        setSuccessMessage("Historical leave summary saved successfully");
        setShowAddForm(false);
        setEditingEmployee(null);
        resetForm();
        fetchHistoricalData();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(response.data.message || "Failed to save historical summary");
      }
    } catch (error) {
      console.error("Error saving historical summary:", error);
      setError(
        error.response?.data?.message || "Failed to save historical summary"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    const historicalSummary = employee.historicalSummary;
    setFormData({
      employeeEmail: historicalSummary.employeeEmail,
      year: historicalSummary.year,
      casualUsed: historicalSummary.casualUsed,
      casualTotal: historicalSummary.casualTotal,
      sickUsed: historicalSummary.sickUsed,
      sickTotal: historicalSummary.sickTotal,
      dutyUsed: historicalSummary.dutyUsed,
      shortLeaveMonthlyDetails:
        historicalSummary.shortLeaveMonthlyDetails || {},
      notes: historicalSummary.notes || "",
    });
    setEditingEmployee(employee);
    setShowAddForm(true);
  };

  const handleDelete = async (email, year) => {
    if (
      !window.confirm(
        `Are you sure you want to delete historical data for ${email} (${year})?`
      )
    ) {
      return;
    }

    try {
      const response = await API.delete(
        `/admin/historical-leave-summaries/employee/${email}/year/${year}`
      );

      if (response.data.success) {
        setSuccessMessage("Historical summary deleted successfully");
        fetchHistoricalData();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(
          response.data.message || "Failed to delete historical summary"
        );
      }
    } catch (error) {
      console.error("Error deleting historical summary:", error);
      setError(
        error.response?.data?.message || "Failed to delete historical summary"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      employeeEmail: "",
      year: selectedYear,
      casualUsed: 0,
      casualTotal: 21,
      sickUsed: 0,
      sickTotal: 24,
      dutyUsed: 0,
      shortLeaveMonthlyDetails: {},
      notes: "",
    });
    initializeShortLeaveData();
  };

  const handleShortLeaveChange = (month, field, value) => {
    setFormData((prev) => ({
      ...prev,
      shortLeaveMonthlyDetails: {
        ...prev.shortLeaveMonthlyDetails,
        [month]: {
          ...prev.shortLeaveMonthlyDetails[month],
          [field]: parseInt(value) || 0,
        },
      },
    }));
  };

  // Export all employees data for selected year
  const exportToCSV = () => {
    if (filteredEmployees.length === 0) {
      setError("No data to export");
      return;
    }

    const headers = [
      "Employee Email",
      "Employee Name",
      "Department",
      "Year",
      "Casual Used",
      "Casual Total",
      "Medical Used",
      "Medical Total",
      "Duty Used",
      ...months.map((month) => `${month.substring(0, 3)} Short Leave`),
      "Total Short Leave Used",
      "Notes",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredEmployees.map((emp) => {
        const summary = emp.historicalSummary || {};
        const employeeDetails = emp.employeeDetails || {};
        const shortLeave = summary.shortLeaveMonthlyDetails || {};

        const totalShortUsed = months.reduce((total, month) => {
          return total + (shortLeave[month]?.used || 0);
        }, 0);

        return [
          employeeDetails.email || "",
          employeeDetails.fullName || employeeDetails.name || "",
          employeeDetails.department || "",
          selectedYear,
          summary.casualUsed || 0,
          summary.casualTotal || 21,
          summary.sickUsed || 0,
          summary.sickTotal || 24,
          summary.dutyUsed || 0,
          ...months.map(
            (month) =>
              `'${shortLeave[month]?.used || 0}/${
                shortLeave[month]?.total || 2
              }`
          ),
          totalShortUsed,
          `"${summary.notes || ""}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Leave_Summary_${selectedYear}.csv`;
    a.click();
  };

  // Export selected employees data
  const exportSelectedEmployeesCSV = () => {
    if (selectedEmployeesData.length === 0) {
      setError("No selected employees data to export");
      return;
    }

    const headers = [
      "Employee Email",
      "Employee Name",
      "Department",
      "Year",
      "Casual Used",
      "Casual Total",
      "Casual Remaining",
      "Medical Used",
      "Medical Total",
      "Medical Remaining",
      "Duty Used",
      ...months.map((month) => `${month.substring(0, 3)} Short Leave`),
      "Total Short Leave Used",
      "Total Short Leave Available",
      "Short Leave Remaining",
      "Notes",
    ];

    const csvContent = [
      headers.join(","),
      ...selectedEmployeesData
        .filter((empData) => empData.data)
        .map((empData) => {
          const summary = empData.data;
          const employeeDetails = empData.employeeDetails || {};
          const shortLeave = summary.shortLeaveMonthlyDetails || {};

          const totalShortUsed = months.reduce((total, month) => {
            return total + (shortLeave[month]?.used || 0);
          }, 0);

          const totalShortAvailable = months.reduce((total, month) => {
            return total + (shortLeave[month]?.total || 0);
          }, 0);

          return [
            employeeDetails.email || "",
            employeeDetails.fullName || employeeDetails.name || "",
            employeeDetails.department || "",
            selectedYear,
            summary.casualUsed || 0,
            summary.casualTotal || 21,
            (summary.casualTotal || 21) - (summary.casualUsed || 0),
            summary.sickUsed || 0,
            summary.sickTotal || 24,
            (summary.sickTotal || 24) - (summary.sickUsed || 0),
            summary.dutyUsed || 0,
            ...months.map(
              (month) =>
                `'${shortLeave[month]?.used || 0}/${
                  shortLeave[month]?.total || 2
                }`
            ),
            totalShortUsed,
            totalShortAvailable,
            totalShortAvailable - totalShortUsed,
            `"${summary.notes || ""}"`,
          ].join(",");
        }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Selected_Employees_Leave_Summary_${selectedYear}.csv`;
    a.click();
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header-heading">
        <h3>Leave Records Management</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={fetchSelectedEmployeesData}
            disabled={selectedEmployees.length === 0 || loadingSelectedSummary}
            style={{
              background: "#17a2b8",
              color: "white",
              border: "none",
              padding: "4px 5px",
              borderRadius: "4px",
              cursor:
                selectedEmployees.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              opacity: selectedEmployees.length === 0 ? 0.5 : 1,
              fontSize: "13px",
            }}
          >
            <FaDownload /> EXPORT SELECTED ({selectedEmployees.length})
          </button>

          <button
            onClick={exportToCSV}
            disabled={filteredEmployees.length === 0}
            style={{
              background: "#28a745",
              color: "white",
              border: "none",
              padding: "5px 5px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "13px",
            }}
          >
            <FaDownload /> EXPORT ALL CSV
          </button>
        </div>
      </div>
      <div className="dashboard-paragraph">
        <p>Manage leave data for previous years</p>
      </div>

      {/* Selection Status and Add Button */}
      <div
        style={{
          background: "#f8f9fa",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #e9ecef",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <span style={{ color: "#17a2b8" }}>
            {selectedEmployees.length} EMPLOYEE(S) SELECTED
          </span>
          <button
            className="btn-add"
            onClick={() => setShowAddForm(true)}
            style={{
              background: "#28a745",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "8px 15px",
            }}
          >
            <FaPlus /> Add Leave Records
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div
          style={{
            background: "#d4edda",
            color: "#155724",
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "4px",
            border: "1px solid #c3e6cb",
          }}
        >
          {successMessage}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#f8d7da",
            color: "#721c24",
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "4px",
            border: "1px solid #f5c6cb",
          }}
        >
          {error}
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "20px",
          alignItems: "center",
          background: "white",
          padding: "15px",
          borderRadius: "8px",
          border: "1px solid #e9ecef",
        }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <FaSearch
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#666",
            }}
          />
          <input
            type="text"
            placeholder="Search by employee name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 8px 8px 35px",
              border: "2px solid #e9ecef",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "2px solid #e9ecef",
            borderRadius: "4px",
            fontSize: "14px",
            minWidth: "150px",
          }}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          style={{
            padding: "8px 12px",
            border: "2px solid #0056b3",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#0056b3",
            minWidth: "100px",
          }}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearchTerm("");
            setDepartmentFilter("");
            setSelectedEmployees([]);
          }}
          style={{
            background: "#6c757d",
            color: "white",
            border: "none",
            padding: "8px 15px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      {/* Selected Employees Summary Modal */}
      {showSelectedSummary && (
        <div className="modal-overlay">
          <div
            className="modal"
            style={{ width: "95%", maxWidth: "1400px", maxHeight: "90vh" }}
          >
            <div className="modal-header">
              <h3 style={{ color: "white", margin: 0 }}>
                <FaUser style={{ marginRight: "10px" }} />
                Selected Employees Leave Summary - {selectedYear}
              </h3>
              <button
                className="btn-close"
                onClick={() => {
                  setShowSelectedSummary(false);
                  setSelectedEmployeesData([]);
                }}
              >
                ✖
              </button>
            </div>

            <div style={{ padding: "20px", overflowY: "auto" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  background: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 5px 0", color: "#0056b3" }}>
                    {selectedEmployeesData.length} Selected Employees
                  </h4>
                  <p style={{ margin: 0, color: "#666" }}>
                    Leave summary for {selectedYear}
                  </p>
                </div>
                <button
                  onClick={exportSelectedEmployeesCSV}
                  style={{
                    background: "#17a2b8",
                    color: "white",
                    border: "none",
                    padding: "10px 15px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <FaDownload /> Export Selected CSV
                </button>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
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
                    {selectedEmployeesData.map((empData, index) => {
                      if (!empData.data) {
                        return (
                          <tr key={index}>
                            <td>
                              <div>
                                <div style={{ fontWeight: "bold" }}>
                                  {empData.employeeDetails?.fullName ||
                                    empData.employeeDetails?.name ||
                                    "N/A"}
                                </div>
                                <div
                                  style={{ fontSize: "12px", color: "#666" }}
                                >
                                  {empData.email}
                                </div>
                              </div>
                            </td>
                            <td>
                              {empData.employeeDetails?.department || "N/A"}
                            </td>
                            <td
                              colSpan="5"
                              style={{ textAlign: "center", color: "#dc3545" }}
                            >
                              No data available for {selectedYear}
                            </td>
                          </tr>
                        );
                      }

                      const summary = empData.data;
                      const shortLeave = summary.shortLeaveMonthlyDetails || {};

                      const totalShortUsed = months.reduce((total, month) => {
                        return total + (shortLeave[month]?.used || 0);
                      }, 0);

                      const totalShortAvailable = months.reduce(
                        (total, month) => {
                          return total + (shortLeave[month]?.total || 0);
                        },
                        0
                      );

                      return (
                        <tr key={index}>
                          <td>
                            <div>
                              <div style={{ fontWeight: "bold" }}>
                                {empData.employeeDetails?.fullName ||
                                  empData.employeeDetails?.name ||
                                  "N/A"}
                              </div>
                              <div style={{ fontSize: "12px", color: "#666" }}>
                                {empData.email}
                              </div>
                            </div>
                          </td>
                          <td>
                            {empData.employeeDetails?.department || "N/A"}
                          </td>
                          <td>
                            <div>
                              <span
                                style={{
                                  color:
                                    summary.casualUsed > summary.casualTotal
                                      ? "#dc3545"
                                      : "#28a745",
                                }}
                              >
                                {summary.casualUsed || 0} /{" "}
                                {summary.casualTotal || 21}
                              </span>
                              <div style={{ fontSize: "11px", color: "#666" }}>
                                (
                                {(summary.casualTotal || 21) -
                                  (summary.casualUsed || 0)}{" "}
                                LEFT)
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <span
                                style={{
                                  color:
                                    summary.sickUsed > summary.sickTotal
                                      ? "#dc3545"
                                      : "#28a745",
                                }}
                              >
                                {summary.sickUsed || 0} /{" "}
                                {summary.sickTotal || 24}
                              </span>
                              <div style={{ fontSize: "11px", color: "#666" }}>
                                (
                                {(summary.sickTotal || 24) -
                                  (summary.sickUsed || 0)}{" "}
                                LEFT)
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{ color: "#17a2b8", fontWeight: "bold" }}
                            >
                              {summary.dutyUsed || 0}
                            </span>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(6, 1fr)",
                                gap: "2px",
                                fontSize: "10px",
                              }}
                            >
                              {months.map((month, idx) => {
                                const monthData = shortLeave[month];
                                return (
                                  <div
                                    key={month}
                                    style={{
                                      textAlign: "center",
                                      color:
                                        (monthData?.used || 0) >
                                        (monthData?.total || 2)
                                          ? "#dc3545"
                                          : "#28a745",
                                    }}
                                  >
                                    <div style={{ fontWeight: "bold" }}>
                                      {month.substring(0, 3).toUpperCase()}:
                                    </div>
                                    <div>
                                      {monthData?.used || 0}/
                                      {monthData?.total || 2}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div
                              style={{
                                marginTop: "5px",
                                textAlign: "center",
                                fontSize: "11px",
                                color:
                                  totalShortUsed > totalShortAvailable
                                    ? "#dc3545"
                                    : "#28a745",
                                fontWeight: "bold",
                              }}
                            >
                              TOTAL: {totalShortUsed}/{totalShortAvailable}
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={() =>
                                showEmployeeHistoryModal({
                                  employeeDetails: empData.employeeDetails,
                                })
                              }
                              style={{
                                background: "#6f42c1",
                                color: "white",
                                border: "none",
                                padding: "5px 8px",
                                borderRadius: "3px",
                                cursor: "pointer",
                              }}
                              title="View Full History"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee History Modal */}
      {showEmployeeHistory && (
        <div className="modal-overlay">
          <div
            className="modal"
            style={{ width: "95%", maxWidth: "1400px", maxHeight: "90vh" }}
          >
            <div className="modal-header">
              <h3 style={{ color: "white", margin: 0 }}>
                <FaHistory style={{ marginRight: "10px" }} />
                Leave History for{" "}
                {selectedEmployee?.fullName || selectedEmployee?.name}
              </h3>
              <button
                className="btn-close"
                onClick={() => {
                  setShowEmployeeHistory(false);
                  setSelectedEmployee(null);
                  setEmployeeHistoryData([]);
                }}
              >
                ✖
              </button>
            </div>

            <div style={{ padding: "20px", overflowY: "auto" }}>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 5px 0", color: "#0056b3" }}>
                    {selectedEmployee?.fullName || selectedEmployee?.name}
                  </h4>
                  <p style={{ margin: "0", color: "#666" }}>
                    <strong>Email:</strong> {selectedEmployee?.email} |
                    <strong> Department:</strong>{" "}
                    {selectedEmployee?.department || "N/A"}
                  </p>
                </div>
              </div>

              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ fontSize: "18px", color: "#666" }}>
                    Loading employee history...
                  </div>
                </div>
              ) : employeeHistoryData.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    color: "#666",
                  }}
                >
                  <h4>No historical leave data found</h4>
                  <p>This employee has no previous year leave records.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Casual Leave</th>
                        <th>Medical Leave</th>
                        <th>Duty Leave</th>
                        <th>Short Leave</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeHistoryData
                        .sort((a, b) => b.year - a.year)
                        .map((summary, index) => {
                          const shortLeave =
                            summary.shortLeaveMonthlyDetails || {};

                          const totalShortUsed = months.reduce(
                            (total, month) => {
                              return total + (shortLeave[month]?.used || 0);
                            },
                            0
                          );

                          const totalShortAvailable = months.reduce(
                            (total, month) => {
                              return total + (shortLeave[month]?.total || 0);
                            },
                            0
                          );

                          return (
                            <tr key={index}>
                              <td>
                                <strong style={{ color: "#0056b3" }}>
                                  {summary.year}
                                </strong>
                              </td>
                              <td>
                                <span
                                  style={{
                                    color:
                                      summary.casualUsed > summary.casualTotal
                                        ? "#dc3545"
                                        : "#28a745",
                                  }}
                                >
                                  {summary.casualUsed || 0} /{" "}
                                  {summary.casualTotal || 21}
                                </span>
                                <div
                                  style={{ fontSize: "11px", color: "#666" }}
                                >
                                  Remaining:{" "}
                                  {(summary.casualTotal || 21) -
                                    (summary.casualUsed || 0)}
                                </div>
                              </td>
                              <td>
                                <span
                                  style={{
                                    color:
                                      summary.sickUsed > summary.sickTotal
                                        ? "#dc3545"
                                        : "#28a745",
                                  }}
                                >
                                  {summary.sickUsed || 0} /{" "}
                                  {summary.sickTotal || 24}
                                </span>
                                <div
                                  style={{ fontSize: "11px", color: "#666" }}
                                >
                                  Remaining:{" "}
                                  {(summary.sickTotal || 24) -
                                    (summary.sickUsed || 0)}
                                </div>
                              </td>
                              <td>
                                <span style={{ color: "#17a2b8" }}>
                                  {summary.dutyUsed || 0}
                                </span>
                              </td>
                              <td>
                                <span
                                  style={{
                                    color:
                                      totalShortUsed > totalShortAvailable
                                        ? "#dc3545"
                                        : "#28a745",
                                  }}
                                >
                                  {totalShortUsed} / {totalShortAvailable}
                                </span>
                                <div
                                  style={{ fontSize: "11px", color: "#666" }}
                                >
                                  Remaining:{" "}
                                  {totalShortAvailable - totalShortUsed}
                                </div>
                              </td>
                              <td>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    maxWidth: "200px",
                                  }}
                                >
                                  {summary.notes || "No notes"}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div
            className="modal"
            style={{ width: "90%", maxWidth: "1200px", maxHeight: "90vh" }}
          >
            <div className="modal-header">
              <h3 style={{ color: "white", margin: 0 }}>
                {editingEmployee ? "Edit" : "Add"} Historical Leave Summary (
                {selectedYear})
              </h3>
              <button
                className="btn-close"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEmployee(null);
                  resetForm();
                }}
              >
                ✖
              </button>
            </div>

            <div style={{ padding: "20px", overflowY: "auto" }}>
              <form onSubmit={handleSubmit}>
                {/* Employee Selection */}
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Employee Email:
                  </label>
                  <input
                    type="email"
                    value={formData.employeeEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        employeeEmail: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e9ecef",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                    required
                    disabled={editingEmployee}
                  />
                </div>

                {/* Leave Entitlements */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                    marginBottom: "30px",
                  }}
                >
                  {/* Casual Leave */}
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      background: "#f8f9fa",
                    }}
                  >
                    <h5 style={{ margin: "0 0 15px 0", color: "#0056b3" }}>
                      Casual Leave
                    </h5>
                    <div style={{ marginBottom: "10px" }}>
                      <label>Used Days:</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.casualUsed}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            casualUsed: parseFloat(e.target.value) || 0,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "5px",
                          marginTop: "5px",
                        }}
                      />
                    </div>
                    <div>
                      <label>Total Days:</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.casualTotal}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            casualTotal: parseInt(e.target.value) || 21,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "5px",
                          marginTop: "5px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Medical Leave */}
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      background: "#f8f9fa",
                    }}
                  >
                    <h5 style={{ margin: "0 0 15px 0", color: "#0056b3" }}>
                      Medical Leave
                    </h5>
                    <div style={{ marginBottom: "10px" }}>
                      <label>Used Days:</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.sickUsed}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            sickUsed: parseFloat(e.target.value) || 0,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "5px",
                          marginTop: "5px",
                        }}
                      />
                    </div>
                    <div>
                      <label>Total Days:</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.sickTotal}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            sickTotal: parseInt(e.target.value) || 24,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "5px",
                          marginTop: "5px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Duty Leave */}
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      background: "#f8f9fa",
                    }}
                  >
                    <h5 style={{ margin: "0 0 15px 0", color: "#0056b3" }}>
                      Duty Leave
                    </h5>
                    <div style={{ textAlign: "center" }}>
                      <label>Used Days:</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.dutyUsed}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            dutyUsed: parseFloat(e.target.value) || 0,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "5px",
                          marginTop: "5px",
                        }}
                      />
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6c757d",
                          marginTop: "5px",
                        }}
                      >
                        (Unlimited entitlement)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Short Leave Monthly Details */}
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ marginBottom: "15px", color: "#0056b3" }}>
                    Short Leave Monthly Details
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "15px",
                    }}
                  >
                    {months.map((month) => (
                      <div
                        key={month}
                        style={{
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          padding: "10px",
                          background: "#f8f9fa",
                        }}
                      >
                        <h6 style={{ margin: "0 0 10px 0", color: "#333" }}>
                          {month}
                        </h6>
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            max="2"
                            value={
                              formData.shortLeaveMonthlyDetails[month]?.used ||
                              0
                            }
                            onChange={(e) =>
                              handleShortLeaveChange(
                                month,
                                "used",
                                e.target.value
                              )
                            }
                            style={{ width: "60px", padding: "3px" }}
                            placeholder="Used"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            min="0"
                            value={
                              formData.shortLeaveMonthlyDetails[month]?.total ||
                              2
                            }
                            onChange={(e) =>
                              handleShortLeaveChange(
                                month,
                                "total",
                                e.target.value
                              )
                            }
                            style={{ width: "60px", padding: "3px" }}
                            placeholder="Total"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Notes (Optional):
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e9ecef",
                      borderRadius: "4px",
                      fontSize: "14px",
                      minHeight: "60px",
                    }}
                    placeholder="Add any additional notes about these leave records..."
                  />
                </div>

                {/* Submit Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingEmployee(null);
                      resetForm();
                    }}
                    style={{
                      padding: "10px 20px",
                      background: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: "10px 20px",
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    <FaSave />
                    {loading
                      ? "Saving..."
                      : editingEmployee
                      ? "Update"
                      : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "18px", color: "#666" }}>
            Loading historical data...
          </div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            background: "#f8f9fa",
            borderRadius: "8px",
            color: "#666",
          }}
        >
          <h4>No leave data found for {selectedYear}</h4>
          <p>
            {employees.length === 0
              ? `Click "Add Leave Records" to start adding records for this year.`
              : "Try adjusting your search filters or select a different year."}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={
                      filteredEmployees.length > 0 &&
                      selectedEmployees.length === filteredEmployees.length
                    }
                  />
                </th>
                <th>EMPLOYEE</th>
                <th>DEPARTMENT</th>
                <th>CASUAL LEAVE</th>
                <th>MEDICAL LEAVE</th>
                <th>DUTY LEAVE</th>
                <th>SHORT LEAVE </th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee, index) => {
                const summary = employee.historicalSummary || {};
                const employeeDetails = employee.employeeDetails || {};
                const shortLeave = summary.shortLeaveMonthlyDetails || {};
                const employeeEmail = employeeDetails.email || "";

                const totalShortUsed = months.reduce((total, month) => {
                  return total + (shortLeave[month]?.used || 0);
                }, 0);

                const totalShortAvailable = months.reduce((total, month) => {
                  return total + (shortLeave[month]?.total || 0);
                }, 0);

                return (
                  <tr
                    key={index}
                    style={{
                      background: selectedEmployees.includes(employeeEmail)
                        ? "#e3f2fd"
                        : "white",
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employeeEmail)}
                        onChange={(e) =>
                          handleEmployeeSelection(
                            employeeEmail,
                            e.target.checked
                          )
                        }
                      />
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: "bold", color: "#0056b3" }}>
                          {employeeDetails.fullName ||
                            employeeDetails.name ||
                            "N/A"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {employeeDetails.email}
                        </div>
                        <div style={{ fontSize: "11px", color: "#999" }}>
                          {employeeDetails.position || ""}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          background: "#e9ecef",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {employeeDetails.department || "N/A"}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span
                          style={{
                            color:
                              summary.casualUsed > summary.casualTotal
                                ? "#dc3545"
                                : "#28a745",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                        >
                          {summary.casualUsed || 0} /{" "}
                          {summary.casualTotal || 21}
                        </span>
                        <div style={{ fontSize: "11px", color: "#666" }}>
                          (
                          {(summary.casualTotal || 21) -
                            (summary.casualUsed || 0)}{" "}
                          LEFT)
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span
                          style={{
                            color:
                              summary.sickUsed > summary.sickTotal
                                ? "#dc3545"
                                : "#28a745",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                        >
                          {summary.sickUsed || 0} / {summary.sickTotal || 24}
                        </span>
                        <div style={{ fontSize: "11px", color: "#666" }}>
                          ({(summary.sickTotal || 24) - (summary.sickUsed || 0)}{" "}
                          LEFT)
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          color: "#17a2b8",
                          fontSize: "16px",
                          fontWeight: "bold",
                        }}
                      >
                        {summary.dutyUsed || 0}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(6, 1fr)",
                          gap: "2px",
                          fontSize: "9px",
                        }}
                      >
                        {months.map((month, idx) => {
                          const monthData = shortLeave[month];
                          return (
                            <div
                              key={month}
                              style={{
                                textAlign: "center",
                                color:
                                  (monthData?.used || 0) >
                                  (monthData?.total || 2)
                                    ? "#dc3545"
                                    : "#28a745",
                              }}
                            >
                              <div style={{ fontWeight: "bold" }}>
                                {month.substring(0, 3).toUpperCase()}:
                              </div>
                              <div>
                                {monthData?.used || 0}/{monthData?.total || 2}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div
                        style={{
                          marginTop: "5px",
                          textAlign: "center",
                          fontSize: "11px",
                          color:
                            totalShortUsed > totalShortAvailable
                              ? "#dc3545"
                              : "#28a745",
                          fontWeight: "bold",
                          padding: "2px",
                          background: "#f8f9fa",
                          borderRadius: "3px",
                        }}
                      >
                        TOTAL: {totalShortUsed}/{totalShortAvailable}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "3px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(employee)}
                          style={{
                            background: "#ffc107",
                            color: "#212529",
                            border: "none",
                            padding: "4px 6px",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() =>
                            handleDelete(summary.employeeEmail, summary.year)
                          }
                          style={{
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "4px 6px",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveHistorySummary;
