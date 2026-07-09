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
  toggleCreateFields(roleSelect.value);
});

function toggleCreateFields(role) {
  if (role === "STUDENT") {
    studentIdBox.style.display = "block";
    emailBox.style.display = "none";
  } else {
    studentIdBox.style.display = "none";
    emailBox.style.display = "block";
  }
}

toggleCreateFields("");

createUserForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const role = document.getElementById("role").value;

  const userData = {
    first_name: document.getElementById("first_name").value,
    last_name: document.getElementById("last_name").value,
    phone: document.getElementById("phone").value,
    role: role,
    password: document.getElementById("password").value,
  };

  if (role === "STUDENT") {
    userData.student_id = document.getElementById("student_id").value;
  } else {
    userData.email = document.getElementById("email").value;
  }

  message.textContent = "Creating user...";
  message.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest("/api/auth/users/create/", "POST", userData);

  if (data.success === true || data.status === 201 || data.data?.id || data.id) {
    message.textContent = "User created successfully.";
    message.className = "mt-4 text-sm text-green-600";

    createUserForm.reset();
    toggleCreateFields("");
    loadUsers();
  } else {
    message.textContent = data.message || "User create failed.";
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

  if (data.success === false) {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="p-4 text-center text-red-500">
          ${data.message || "Failed to load users."}
        </td>
      </tr>
    `;
    return;
  }

  const users = Array.isArray(data)
    ? data
    : data.data || data.users || data.results || [];

  allUsers = users.sort((a, b) => a.id - b.id);
  currentUserPage = 1;
  renderUsers(allUsers);
}

function renderUsers(users) {
  userTableBody.innerHTML = "";

  if (!users || users.length === 0) {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="p-4 text-center text-gray-500">
          No users found.
        </td>
      </tr>
    `;

    renderUserPagination(0);
    return;
  }

  const paginatedUsers = paginateItems(users, currentUserPage, userPerPage);

  paginatedUsers.forEach(function (user) {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const userIdOrEmail = user.role === "STUDENT" ? user.student_id : user.email;

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
          <div class="flex flex-wrap gap-2">
            <button
              onclick="toggleUserStatus(${user.id}, ${user.is_active})"
              class="${actionClass} text-white px-3 py-1"
            >
              ${actionText}
            </button>

            <button
              onclick="openEditUserModal(${user.id})"
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1"
            >
              Edit
            </button>

            <button
              onclick="deleteUser(${user.id})"
              class="bg-red-800 hover:bg-red-900 text-white px-3 py-1"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  renderUserPagination(users.length);
}

function renderUserPagination(totalItems) {
  if (typeof renderPagination === "function") {
    renderPagination(
      "userPagination",
      totalItems,
      currentUserPage,
      userPerPage,
      "changeUserPage"
    );
  }
}

function changeUserPage(page) {
  currentUserPage = page;

  const keyword = userSearchInput ? userSearchInput.value.toLowerCase() : "";

  if (keyword) {
    renderUsers(getFilteredUsers(keyword));
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

    if (keyword) {
      renderUsers(getFilteredUsers(keyword));
    } else {
      renderUsers(allUsers);
    }
  });
}

async function toggleUserStatus(userId, currentStatus) {
  const newStatus = !currentStatus;

  const confirmed = confirm(
    newStatus
      ? "Are you sure you want to activate this user?"
      : "Are you sure you want to deactivate this user?"
  );

  if (!confirmed) return;

  const data = await apiRequest(`/api/auth/users/${userId}/status/`, "PATCH", {
    is_active: newStatus,
  });

  if (data.success) {
    showToast("User status updated successfully.", "success");
    loadUsers();
  } else {
    showToast(data.message || "Failed to update user status.", "error");
  }
}

function openEditUserModal(userId) {
  const modal = document.getElementById("editUserModal");

  if (!modal) {
    alert("Edit modal not found. Please add editUserModal in users.html");
    return;
  }

  const user = allUsers.find(function (item) {
    return Number(item.id) === Number(userId);
  });

  if (!user) {
    showToast("User not found.", "error");
    return;
  }

  document.getElementById("edit_user_id").value = user.id;
  document.getElementById("edit_role").value = user.role || "";
  document.getElementById("edit_student_id").value = user.student_id || "";
  document.getElementById("edit_email").value = user.email || "";
  document.getElementById("edit_first_name").value = user.first_name || "";
  document.getElementById("edit_last_name").value = user.last_name || "";
  document.getElementById("edit_phone").value = user.phone || "";
  document.getElementById("edit_is_active").value = user.is_active ? "true" : "false";
  document.getElementById("editUserMessage").textContent = "";

  toggleEditFields(user.role);

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeEditUserModal() {
  const modal = document.getElementById("editUserModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function toggleEditFields(role) {
  const studentInput = document.getElementById("edit_student_id");
  const emailInput = document.getElementById("edit_email");

  if (role === "STUDENT") {
    studentInput.parentElement.style.display = "block";
    emailInput.parentElement.style.display = "none";
  } else {
    studentInput.parentElement.style.display = "none";
    emailInput.parentElement.style.display = "block";
  }
}

const editRoleSelect = document.getElementById("edit_role");

if (editRoleSelect) {
  editRoleSelect.addEventListener("change", function () {
    toggleEditFields(editRoleSelect.value);
  });
}

const editUserForm = document.getElementById("editUserForm");

if (editUserForm) {
  editUserForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const userId = document.getElementById("edit_user_id").value;
    const role = document.getElementById("edit_role").value;

    const payload = {
      role: role,
      first_name: document.getElementById("edit_first_name").value,
      last_name: document.getElementById("edit_last_name").value,
      phone: document.getElementById("edit_phone").value,
      is_active: document.getElementById("edit_is_active").value === "true",
    };

    if (role === "STUDENT") {
      payload.student_id = document.getElementById("edit_student_id").value;
      payload.email = null;
    } else {
      payload.email = document.getElementById("edit_email").value;
      payload.student_id = null;
    }

    const data = await apiRequest(
      `/api/auth/users/${userId}/update/`,
      "PUT",
      payload
    );

    if (data.success) {
      showToast("User updated successfully.", "success");
      closeEditUserModal();
      loadUsers();
    } else {
      const editMessage = document.getElementById("editUserMessage");
      editMessage.textContent = data.message || "User update failed.";
      editMessage.className = "mt-4 text-sm text-red-600";
    }
  });
}

async function deleteUser(userId) {
  const confirmed = confirm("Are you sure you want to delete this user?");

  if (!confirmed) return;

  const data = await apiRequest(`/api/auth/users/${userId}/delete/`, "DELETE");

  if (data.success) {
    showToast("User deleted successfully.", "success");
    loadUsers();
  } else {
    showToast(data.message || "User delete failed.", "error");
  }
}

loadUsers();