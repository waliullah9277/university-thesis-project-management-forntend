const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const loginId = document.getElementById("login_id").value;
  const password = document.getElementById("password").value;
  const expectedRole = document.getElementById("expectedRole").value;

  message.textContent = "Logging in...";
  message.className = "text-sm text-blue-600 mt-4 text-center";

  const data = await apiRequest("/api/auth/login/", "POST", {
    login_id: loginId,
    password: password,
  });

  console.log("Login Response:", data);

  if (!data.success) {
    message.textContent = data.message || data.detail || "Login failed.";
    message.className = "text-sm text-red-600 mt-4 text-center";
    return;
  }

  if (data.user.role !== expectedRole) {
    message.textContent = `This login page is only for ${expectedRole}.`;
    message.className = "text-sm text-red-600 mt-4 text-center";
    return;
  }

  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  localStorage.setItem("role", data.user.role);

  if (data.force_password_change) {
    window.location.href = "first-password-change.html";
    return;
  }

  if (data.user.role === "SUPER_ADMIN") {
    window.location.href = "admin/dashboard.html";
  } else if (data.user.role === "STUDENT") {
    window.location.href = "student/dashboard.html";
  } else if (data.user.role === "SUPERVISOR") {
    window.location.href = "supervisor/dashboard.html";
  } else if (data.user.role === "EXAMINER") {
    window.location.href = "examiner/dashboard.html";
  }
});