import { useState, useEffect } from "react";
import API from "../../API/axios";
import "../CSS/Admin.css";

export default function AdminAddEmployee({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    fullName: "",
    department: "",
    designation: "",
    joinDate: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    employmentType: "",
    nationalId: "",
    emergencyContact: "",
  });

  const [designations, setDesignations] = useState([]);
  const [newDesignation, setNewDesignation] = useState("");

  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      const res = await API.get("/designations");
      setDesignations(res.data);
    } catch (err) {
      console.error("Error Fetching Designations", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments");
      setDepartments(res.data);
    } catch (err) {
      console.error("Error Fetching Departments", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!formData.email || !formData.name || !formData.password) {
      setError("⚠️ Email, Name, and Password are required!");
      return;
    }

    try {
      const roles = ["EMPLOYEE"];
      const res = await API.post("/auth/register", { ...formData, roles });
      if (res.status === 200) {
        setMessage("✅ Employee Added Successfully!");
        setFormData({
          email: "",
          name: "",
          password: "",
          fullName: "",
          department: "",
          designation: "",
          joinDate: "",
          phoneNumber: "",
          address: "",
          dateOfBirth: "",
          gender: "",
          maritalStatus: "",
          employmentType: "",
          nationalId: "",
          emergencyContact: "",
        });

        if (onSuccess) onSuccess();
      }
    } catch (err) {
      if (err.response && err.response.data) setError(err.response.data);
      else setError("❌ Error Adding Employee");
    }
  };

  const handleAddDesignation = async () => {
    if (!newDesignation) return;
    try {
      await API.post("/designations", { name: newDesignation });
      fetchDesignations();
      setFormData((prev) => ({ ...prev, designation: newDesignation }));
      setNewDesignation("");
    } catch (err) {
      console.error(err);
      alert("❌ Error Adding Designation");
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment) return;
    try {
      await API.post("/departments", { name: newDepartment });
      fetchDepartments();
      setFormData((prev) => ({ ...prev, department: newDepartment }));
      setNewDepartment("");
    } catch (err) {
      console.error(err);
      alert("❌ Error Adding Department");
    }
  };

  return (
    <div className="add-employee-page">
      <div className="form-header">
        <h6>Add Employee</h6>
      </div>

      <form onSubmit={handleAddEmployee} className="add-employee-form">
        {message && <div className="message success">{message}</div>}
        {error && <div className="message error">{error}</div>}

        <div className="form-row">
          <input
            type="email"
            name="email"
            placeholder="Employee Email"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="text"
            name="name"
            placeholder="Employee Username"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Add New Department"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
          />
          <button type="button" onClick={handleAddDepartment}>
            ➕ Add
          </button>

          <select
            name="designation"
            value={formData.designation}
            onChange={handleChange}
          >
            <option value="">Select Designation</option>
            {designations.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Add New Designation"
            value={newDesignation}
            onChange={(e) => setNewDesignation(e.target.value)}
          />
          <button type="button" onClick={handleAddDesignation}>
            ➕ Add
          </button>
        </div>

        <div className="form-row">
          <div className="date-input-wrapper">
            <input
              type="date"
              name="joinDate"
              value={formData.joinDate}
              onChange={handleChange}
            />
            {!formData.joinDate && (
              <span className="date-placeholder">Join Date (MM/DD/YYYY)</span>
            )}
          </div>
          <input
            type="text"
            name="phoneNumber"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
          />
          <div className="date-input-wrapper">
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
            {!formData.dateOfBirth && (
              <span className="date-placeholder">
                Date of Birth (MM/DD/YYYY)
              </span>
            )}
          </div>
        </div>

        <div className="form-row">
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
          >
            <option value="">Marital Status</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
          </select>
        </div>

        <div className="form-row">
          <input
            type="text"
            name="employmentType"
            placeholder="Employment Type"
            value={formData.employmentType}
            onChange={handleChange}
          />
          <input
            type="text"
            name="nationalId"
            placeholder="National ID"
            value={formData.nationalId}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <input
            type="text"
            name="emergencyContact"
            placeholder="Emergency Contact"
            value={formData.emergencyContact}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <button type="submit">Add Employee</button>
        </div>
      </form>
    </div>
  );
}
