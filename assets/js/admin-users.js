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

const userSearchInput = document.getElementById("userSearchInput");

let allUsers = [];
let currentUserPage = 1;
const userPerPage = 4;

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

studentIdBox.style.display = "none";

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

  console.log("Create User:", data);

  if (data.success === true || data.status === 201 || data.data?.id || data.id) {
  message.textContent = "User created successfully.";
  message.className = "mt-4 text-sm text-green-600";

  createUserForm.reset();
  loadUsers();
} else {
  message.textContent = data.message || data.detail || JSON.stringify(data);
  message.className = "mt-4 text-sm text-red-600";
}
});

async function loadUsers() {
  userTableBody.innerHTML = `
  <tr>
    <td colspan="7">
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-500">Loading users...</span>
      </div>
    </td>
  </tr>
`;

  const data = await apiRequest("/api/auth/users/");

  console.log("Users:", data);

  if (data.success === false) {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="p-4 text-center text-red-500">
          Failed to load users.
        </td>
      </tr>
    `;
    return;
  }

  let users = [];

  if (Array.isArray(data)) {
    users = data;
  } else {
    users = data.data || data.users || data.results || [];
  }

  allUsers = users;
  allUsers = users.sort((a, b) => a.id - b.id);
  currentUserPage = 1;
  renderUsers(allUsers);
}

function renderUsers(users) {
  userTableBody.innerHTML = "";

  if (users.length === 0) {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="p-4 text-center text-gray-500">
          No users found.
        </td>
      </tr>
    `;

    renderPagination("userPagination", 0, currentUserPage, userPerPage, "changeUserPage");
    return;
  }

  const paginatedUsers = paginateItems(users, currentUserPage, userPerPage);

  paginatedUsers.forEach(function (user) {
    const userIdOrEmail = user.role === "STUDENT" ? user.student_id : user.email;
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    const statusText = user.is_active ? "Active" : "Inactive";
    const statusClass = user.is_active ? "text-green-600" : "text-red-600";

    const actionText = user.is_active ? "Deactivate" : "Activate";
    const actionClass = user.is_active
      ? "bg-red-600 hover:bg-red-700"
      : "bg-green-600 hover:bg-green-700";

    userTableBody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="p-3 border">${user.id}</td>
        <td class="p-3 border">${fullName || "-"}</td>
        <td class="p-3 border">${userIdOrEmail || "-"}</td>
        <td class="p-3 border">${user.phone || "-"}</td>
        <td class="p-3 border">${user.role || "-"}</td>
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

  renderPagination(
    "userPagination",
    users.length,
    currentUserPage,
    userPerPage,
    "changeUserPage"
  );
}

function changeUserPage(page) {
  currentUserPage = page;

  const keyword = userSearchInput ? userSearchInput.value.toLowerCase() : "";

  if (keyword) {
    const filteredUsers = getFilteredUsers(keyword);
    renderUsers(filteredUsers);
  } else {
    renderUsers(allUsers);
  }
}

function getFilteredUsers(keyword) {
  return allUsers.filter(function (user) {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`;

    const text = `
      ${fullName}
      ${user.email || ""}
      ${user.student_id || ""}
      ${user.phone || ""}
      ${user.role || ""}
      ${user.is_active ? "active" : "inactive"}
    `.toLowerCase();

    return text.includes(keyword);
  });
}

if (userSearchInput) {
  userSearchInput.addEventListener("input", function () {
    const keyword = userSearchInput.value.toLowerCase();
    currentUserPage = 1;

    const filteredUsers = getFilteredUsers(keyword);
    renderUsers(filteredUsers);
  });
}

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

  console.log("Toggle User Status:", data);

  if (data.success || data.id || data.data?.id || data.message) {
    alert("User status updated successfully.");
    loadUsers();
  } else {
    alert(data.message || data.detail || "Failed to update user status.");
  }
}

loadUsers();