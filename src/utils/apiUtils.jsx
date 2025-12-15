import { API_BASE_URL } from "../config/config";

// Generic API call function

export const apiCall = async (endpoint, options = {}) => {
  let token;
  try {
    token = localStorage?.getItem("token") || null;
  } catch (e) {
    token = null;
  }

  const config = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, config);
    const data = await response.text();

    if (!response.ok) {
      throw new Error(data || `HTTP error! status: ${response.status}`);
    }

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};

/**
 * API object with HTTP methods
 */
export const API = {
  get: (endpoint) => apiCall(endpoint),
  post: (endpoint, data) =>
    apiCall(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  put: (endpoint, data) =>
    apiCall(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (endpoint) =>
    apiCall(endpoint, {
      method: "DELETE",
    }),
  patch: (endpoint, data) =>
    apiCall(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export default API;
