const LOCAL_API_URL = "http://127.0.0.1:8000";
const LIVE_API_URL = "https://thesis-project-management-project.onrender.com";

const API_BASE_URL =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost"
    ? LOCAL_API_URL
    : LIVE_API_URL;

function getAccessToken() {
  return localStorage.getItem("access");
}

function getErrorMessage(data) {
  if (!data) {
    return "Something went wrong.";
  }

  if (data.message) {
    return data.message;
  }

  if (data.detail) {
    return data.detail;
  }

  const firstKey = Object.keys(data)[0];

  if (firstKey && Array.isArray(data[firstKey])) {
    return data[firstKey][0];
  }

  if (firstKey && typeof data[firstKey] === "string") {
    return data[firstKey];
  }

  return "Something went wrong.";
}

async function apiRequest(endpoint, method = "GET", body = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = getAccessToken();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    let data = {};

    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: getErrorMessage(data),
        ...data,
      };
    }

    return {
      success: true,
      status: response.status,
      ...data,
    };
  } catch (error) {
    console.error("API Error:", error);

    return {
      success: false,
      message: "Server connection failed. Please check backend server.",
    };
  }
}