import React, { useEffect, useState } from "react";
import API from "../../API/axios";
import AddEmployee from "./AdminAddEmployee";
import "../CSS/Admin.css";
import { FaEllipsisH } from "react-icons/fa";

export default function EmployeeAdmin() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const API_BASE = "/admin/users";

  const fetchUsers = async () => {
    try {
      const res = await API.get(API_BASE);
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("❌ Fetch users error:", err.response?.data || err.message);
      alert("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let data = [...users];
    if (departmentFilter) {
      data = data.filter(
        (u) => u.department?.toLowerCase() === departmentFilter.toLowerCase()
      );
    }
    if (roleFilter) {
      data = data.filter((u) =>
        u.roles?.some((r) => r.toLowerCase() === roleFilter.toLowerCase())
      );
    }
    if (designationFilter) {
      data = data.filter(
        (u) => u.designation?.toLowerCase() === designationFilter.toLowerCase()
      );
    }
    setFilteredUsers(data);
    setCurrentPage(1);
  }, [departmentFilter, roleFilter, designationFilter, users]);

  const deleteUser = async (email) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await API.delete(`${API_BASE}/${email}`);
        alert("🗑️ User deleted successfully");
        fetchUsers();
      } catch (err) {
        console.error("❌ Delete error:", err.response?.data || err.message);
        alert("Failed to delete user");
      }
    }
  };

  const departments = [
    ...new Set(users.map((u) => u.department).filter(Boolean)),
  ];
  const roles = [...new Set(users.flatMap((u) => u.roles || []))];
  const designations = [
    ...new Set(users.map((u) => u.designation).filter(Boolean)),
  ];

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredUsers.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  // Fixed EditEmployee component - moved inside the main component
  const EditEmployee = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ ...user });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await API.put(`/admin/users/${user.email}`, formData);
        alert("✅ Employee updated successfully");
        onSuccess();
      } catch (err) {
        console.error("❌ Update error:", err.response?.data || err.message);
        alert("Failed to update employee");
      }
    };

    return (
      <form onSubmit={handleSubmit} className="edit-employee-form">
        <label>
          Email:{" "}
          <input
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
            disabled
          />{" "}
        </label>

        <label>
          Name:{" "}
          <input
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
          />{" "}
        </label>

        <label>
          Password:{" "}
          <input
            name="password"
            value={formData.password || ""}
            onChange={handleChange}
            type="password"
          />{" "}
        </label>

        <label>
          Roles (comma separated):
          <input
            name="roles"
            value={formData.roles?.join(", ") || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                roles: e.target.value.split(",").map((r) => r.trim()),
              })
            }
          />
        </label>

        <label>
          Full Name:{" "}
          <input
            name="fullName"
            value={formData.fullName || ""}
            onChange={handleChange}
          />{" "}
        </label>

        <label>
          Department:
          <select
            name="department"
            value={formData.department || ""}
            onChange={handleChange}
          >
            <option value="">Select Department</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
          </select>
        </label>

        <label>
          Designation:{" "}
          <input
            name="designation"
            value={formData.designation || ""}
            onChange={handleChange}
          />{" "}
        </label>

        <label>
          Join Date:{" "}
          <input
            type="date"
            name="joinDate"
            value={formData.joinDate || ""}
            onChange={handleChange}
          />{" "}
        </label>

        <label>
          Phone Number:{" "}
          <input
            name="phoneNumber"
            value={formData.phoneNumber || ""}
            onChange={handleChange}
          />{" "}
        </label>

        <label>
          Address:{" "}
          <input
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
          />{" "}
        </label>

        <label>
          Date of Birth:{" "}
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth || ""}
            onChange={handleChange}
          />{" "}
        </label>

        <label>
          Gender:
          <select
            name="gender"
            value={formData.gender || ""}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label>
          Marital Status:
          <select
            name="maritalStatus"
            value={formData.maritalStatus || ""}
            onChange={handleChange}
          >
            <option value="">Select Marital Status</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
          </select>
        </label>

        <label>
          Employment Type:{" "}
          <input
            name="employmentType"
            value={formData.employmentType || ""}
            onChange={handleChange}
          />{" "}
        </label>

        <label>
          National ID:{" "}
          <input
            name="nationalId"
            value={formData.nationalId || ""}
            onChange={handleChange}
          />{" "}
        </label>

        <label>
          Emergency Contact:{" "}
          <input
            name="emergencyContact"
            value={formData.emergencyContact || ""}
            onChange={handleChange}
          />{" "}
        </label>

        <div className="edit-actions">
          <button type="button" onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" className="btn-save">
            Save
          </button>
          <button
            type="button"
            className="btn-delete"
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this user?")
              ) {
                deleteUser(user.email);
                onClose();
              }
            }}
          >
            Delete
          </button>
        </div>
      </form>
    );
  };

  // Debug function to check state
  const handleAddEmployeeClick = () => {
    console.log("Add Employee clicked, setting isAdding to true");
    setIsAdding(true);
  };

  const handleActionClick = (user) => {
    console.log("Action clicked for user:", user);
    setSelectedUser(user);
  };

  return (
    <div className="dashboard">
      <div className="header-heading">
        <h3>Employee Management</h3>
      </div>

      <div className="dashboard-paragraph">
        <p>Manage your team members and their account permissions here.</p>
      </div>

      <div className="filters">
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((dep) => (
            <option key={dep} value={dep}>
              {dep}
            </option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <select
          value={designationFilter}
          onChange={(e) => setDesignationFilter(e.target.value)}
        >
          <option value="">All Designations</option>
          {designations.map((des) => (
            <option key={des} value={des}>
              {des}
            </option>
          ))}
        </select>

        <button
          className="btn-reset"
          onClick={() => {
            setDepartmentFilter("");
            setRoleFilter("");
            setDesignationFilter("");
          }}
        >
          Reset
        </button>
      </div>

      <div className="add-employee">
        <button className="btn-add" onClick={handleAddEmployeeClick}>
          Add Employee
        </button>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Full Name</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Join Date</th>
            <th>Roles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentRows.length > 0 ? (
            currentRows.map((user) => (
              <tr key={user.email}>
                <td>{user.email}</td>
                <td>{user.name}</td>
                <td>{user.fullName}</td>
                <td>{user.department}</td>
                <td>{user.designation}</td>
                <td>{user.joinDate}</td>
                <td>{user.roles?.join(", ")}</td>
                <td className="actions-cell">
                  <FaEllipsisH
                    className="icon-btn update-icon"
                    onClick={() => handleActionClick(user)}
                    title="Update Employee"
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="no-users">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <label>
          Rows per page:{" "}
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </label>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Add Employee Modal - Fixed */}
      {isAdding && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <button
                className="btn-close"
                onClick={() => {
                  console.log("Closing add employee modal");
                  setIsAdding(false);
                }}
              >
                ✖
              </button>
            </div>
            <AddEmployee
              onSuccess={() => {
                console.log("Employee added successfully");
                fetchUsers();
                setIsAdding(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Employee Modal - Fixed */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              {/* <h2>Edit Employee</h2> */}
              <button
                className="btn-close"
                onClick={() => {
                  console.log("Closing edit employee modal");
                  setSelectedUser(null);
                }}
              >
                ✖
              </button>
            </div>
            <EditEmployee
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onSuccess={() => {
                fetchUsers();
                setSelectedUser(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
