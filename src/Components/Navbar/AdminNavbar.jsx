import React, { useState, useEffect } from "react";
import API from "axios";
import { FaBell, FaBars, FaTimes } from "react-icons/fa";
import "../CSS/Navbar.css";

import Logo from "../../Assets/DCDLogo.png";

export default function AdminNavbar({ onMenuToggle, isSidebarOpen }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const token = localStorage.getItem("token");

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // useEffect(() => {
  //   if (!token) return;

  //   // fetch notifications
  //   axios
  //     .get("http://localhost:8080/admin/notifications", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     })
  //     .then((res) => setNotifications(res.data))
  //     .catch((err) => console.error("Notifications error:", err));

  //   // fetch logged-in admin details
  //   axios
  //     .get("http://localhost:8080/employee/me", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     })
  //     .then((res) => {
  //       setUser(res.data);
  //     })
  //     .catch((err) => console.error("User fetch error:", err));
  // }, [token]);

  useEffect(() => {
    if (!token) return;

    // fetch notifications
    API.get("/admin/notifications")
      .then((res) => setNotifications(res.data))
      .catch((err) => console.error("Notifications error:", err));

    // fetch logged-in admin details
    API.get("/employee/me")
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => console.error("User fetch error:", err));
  }, [token]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".notification-wrapper")) {
        setShowNotifications(false);
      }
      if (!event.target.closest(".user-profile")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Get appropriate title based on screen size
  const getTitle = () => {
    if (window.innerWidth <= 320) {
      return "DCD - SL";
    } else if (window.innerWidth <= 480) {
      return "Dept. of Cooperative Dev. - Sri Lanka";
    } else if (window.innerWidth <= 600) {
      return "Department of Cooperative Development";
    } else {
      return "Department of Cooperative Development - Sri Lanka";
    }
  };

  // Get appropriate subtitle based on screen size
  const getSubtitle = () => {
    if (window.innerWidth <= 320) {
      return "Central";
    } else {
      return "Central Province";
    }
  };

  // helper: get initials
  const getInitials = (name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0].toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const handleNotificationClick = (e, notif) => {
    e.stopPropagation();
    setSelectedNotification(notif);
    setShowNotifications(false);
  };

  const handleNotificationToggle = (e) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
  };

  const handleUserMenuToggle = (e) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="header">
      <div className="header-left">
        {/* Menu button for mobile */}
        <button
          className="menu-button"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <FaTimes size={15} /> : <FaBars size={15} />}
        </button>

        <img src={Logo} alt="DCD Logo" className="logo" />
        <div className="header-text">
          <h1>{getTitle()}</h1>
          <p>{getSubtitle()}</p>
        </div>
      </div>

      <div className="header-right">
        {/* Notifications */}
        <div
          className="notification-wrapper"
          onClick={handleNotificationToggle}
        >
          <FaBell size={isMobile ? 18 : 21} color="#ffffff" />
          {notifications.length > 0 && (
            <span className="notification-badge">{notifications.length}</span>
          )}

          {showNotifications && (
            <div className="notification-dropdown">
              {notifications.length === 0 ? (
                <p className="no-notifications">No notifications</p>
              ) : (
                notifications.map((notif, index) => (
                  <div
                    key={index}
                    className="notification-item"
                    onClick={(e) => handleNotificationClick(e, notif)}
                  >
                    <p>
                      <strong>{notif.email}</strong>
                    </p>
                    <p>{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedNotification && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedNotification(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedNotification(null)}
              className="close-btn"
              aria-label="Close modal"
            >
              ✖
            </button>
            <h3>Password Change Details</h3>
            <p>
              <strong>Email:</strong> {selectedNotification.email}
            </p>
            <p>
              <strong>Old Password:</strong> {selectedNotification.oldPassword}
            </p>
            <p>
              <strong>New Password:</strong> {selectedNotification.newPassword}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
