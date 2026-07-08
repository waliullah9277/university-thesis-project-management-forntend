const API_BASE_URL = "https://thesis-project-management-project.onrender.com";

function getAccessToken() {
  return localStorage.getItem("access");
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
    } catch (e) {
      data = {};
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
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