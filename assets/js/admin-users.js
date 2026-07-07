checkAuth();

if (getUserRole() !== "SUPER_ADMIN") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const createUserForm = document.getElementById("createUserForm");
const userTableBody = document.getElementById("userTableBody");
const message = document.getElementById("message");

const roleSelect = document.getElementById("role");
const studentIdBox = document.getElementById("studentIdBox");
const emailBox = document.getElementById("emailBox");


// Role change করলে Student ID / Email field show-hide হবে
roleSelect.addEventListener("change", function () {
  const role = roleSelect.value;

  if (role === "STUDENT") {
    studentIdBox.style.display = "block";
    emailBox.style.display = "none";
  } else {
    studentIdBox.style.display = "none";
    emailBox.style.display = "block";
  }
});


// Default hide/show
studentIdBox.style.display = "none";


// User Create
createUserForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const role = document.getElementById("role").value;
  const studentId = document.getElementById("student_id").value;
  const email = document.getElementById("email").value;
  const firstName = document.getElementById("first_name").value;
  const lastName = document.getElementById("last_name").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;

  let userData = {
    first_name: firstName,
    last_name: lastName,
    phone: phone,
    role: role,
    password: password,
  };

  if (role === "STUDENT") {
    userData.student_id = studentId;
  } else {
    userData.email = email;
  }

  message.textContent = "Creating user...";
  message.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest("/api/auth/users/create/", "POST", userData);

  console.log(data);

  if (data.success) {
    message.textContent = "User created successfully.";
    message.className = "mt-4 text-sm text-green-600";

    createUserForm.reset();
    studentIdBox.style.display = "none";
    emailBox.style.display = "block";

    loadUsers();
  } else {
    message.textContent = data.message || "User create failed.";
    message.className = "mt-4 text-sm text-red-600";
  }
});


// User List Load
async function loadUsers() {
  const data = await apiRequest("/api/auth/users/");

  console.log(data);

  userTableBody.innerHTML = "";

  if (!data.success) {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="p-4 text-center text-red-500">
          Failed to load users.
        </td>
      </tr>
    `;
    return;
  }

  let users = data.data || data.users || [];

  if (users.length === 0) {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="p-4 text-center text-gray-500">
          No users found.
        </td>
      </tr>
    `;
    return;
  }

  users.forEach(function (user) {
    const userIdOrEmail = user.role === "STUDENT" 
      ? user.student_id 
      : user.email;

    const statusText = user.is_active ? "Active" : "Inactive";
    const statusClass = user.is_active ? "text-green-600" : "text-red-600";

    const actionText = user.is_active ? "Deactivate" : "Activate";
    const actionClass = user.is_active 
      ? "bg-red-600 hover:bg-red-700" 
      : "bg-green-600 hover:bg-green-700";

    userTableBody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="p-3 border">${user.id}</td>
        <td class="p-3 border">${user.first_name} ${user.last_name}</td>
        <td class="p-3 border">${userIdOrEmail || "-"}</td>
        <td class="p-3 border">${user.phone || "-"}</td>
        <td class="p-3 border">${user.role}</td>
        <td class="p-3 border ${statusClass} font-semibold">${statusText}</td>
        <td class="p-3 border">
          <button 
            onclick="toggleUserStatus(${user.id}, ${user.is_active})"
            class="${actionClass} text-white px-3 py-1 rounded"
          >
            ${actionText}
          </button>
        </td>
      </tr>
    `;
  });
}


// Active / Deactive User
async function toggleUserStatus(userId, currentStatus) {
  const newStatus = !currentStatus;

  const confirmAction = confirm(
    newStatus 
      ? "Are you sure you want to activate this user?"
      : "Are you sure you want to deactivate this user?"
  );

  if (!confirmAction) {
    return;
  }

  const data = await apiRequest(`/api/auth/users/${userId}/status/`, "PATCH", {
    is_active: newStatus,
  });

  console.log(data);

  if (data.success) {
    alert("User status updated successfully.");
    loadUsers();
  } else {
    alert(data.message || "Failed to update user status.");
  }
}


// Page load হলে user list load হবে
loadUsers();