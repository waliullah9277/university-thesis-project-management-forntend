const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const loginId = document.getElementById("login_id").value;
  const password = document.getElementById("password").value;

  message.textContent = "Logging in...";
  message.className = "text-center mt-4 text-sm text-blue-600";

  const data = await apiRequest("/api/auth/login/", "POST", {
    login_id: loginId,
    password: password,
  });

  console.log(data);

  if (data.success) {
    saveAuthData(data);

    message.textContent = "Login successful!";
    message.className = "text-center mt-4 text-sm text-green-600";

    if (data.force_password_change) {
      window.location.href = "first-password-change.html";
    } else {
      redirectByRole(data.user.role);
    }
  } else {
    message.textContent = data.message || "Invalid login information.";
    message.className = "text-center mt-4 text-sm text-red-600";
  }
});