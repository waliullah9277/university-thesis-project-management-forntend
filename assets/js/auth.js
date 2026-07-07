function saveAuthData(data) {
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  localStorage.setItem("role", data.user.role);
  localStorage.setItem("user", JSON.stringify(data.user));
}

function logoutUser() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("role");
  localStorage.removeItem("user");

  window.location.href = "../login.html";
}

function checkAuth() {
  const token = localStorage.getItem("access");

  if (!token) {
    window.location.href = "../login.html";
  }
}

function getUserRole() {
  return localStorage.getItem("role");
}

function redirectByRole(role) {
  if (role === "SUPER_ADMIN") {
    window.location.href = "admin/dashboard.html";
  } else if (role === "STUDENT") {
    window.location.href = "student/dashboard.html";
  } else if (role === "SUPERVISOR") {
    window.location.href = "supervisor/dashboard.html";
  } else if (role === "EXAMINER") {
    window.location.href = "examiner/dashboard.html";
  } else {
    alert("Invalid user role.");
  }
}