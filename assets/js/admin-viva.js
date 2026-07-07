checkAuth();

if (getUserRole() !== "SUPER_ADMIN") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const vivaForm = document.getElementById("vivaForm");
const message = document.getElementById("message");
const projectSelect = document.getElementById("project");
const vivaTableBody = document.getElementById("vivaTableBody");

let examiners = [];


// Load approved projects into dropdown
async function loadProjectsForDropdown() {
  const data = await apiRequest("/api/projects/admin/list/");

  console.log("Admin Projects:", data);

  let projects = [];

  if (Array.isArray(data)) {
    projects = data;
  } else {
    projects = data.data || data.projects || [];
  }

  projectSelect.innerHTML = `<option value="">Select Project</option>`;

  if (projects.length === 0) {
    projectSelect.innerHTML = `<option value="">No project found</option>`;
    return;
  }

  projects.forEach(function(project) {
    projectSelect.innerHTML += `
      <option value="${project.id}">
        ${project.title}
      </option>
    `;
  });
}


// Load examiners from user list
async function loadExaminers() {
  const data = await apiRequest("/api/auth/users/");

  console.log("Users:", data);

  let users = [];

  if (Array.isArray(data)) {
    users = data;
  } else {
    users = data.data || data.users || [];
  }

  examiners = users.filter(function(user) {
    return user.role === "EXAMINER" && user.is_active === true;
  });
}


// Create viva
vivaForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const project = document.getElementById("project").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const room = document.getElementById("room").value;

  if (!project) {
    alert("Please select a project.");
    return;
  }

  message.textContent = "Creating viva schedule...";
  message.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest("/api/viva/", "POST", {
    project: Number(project),
    date: date,
    time: time + ":00",
    room: room,
  });

  console.log("Create Viva:", data);

  if (data.success || data.id) {
    message.textContent = "Viva schedule created successfully.";
    message.className = "mt-4 text-sm text-green-600";

    vivaForm.reset();
    loadVivas();
  } else {
    message.textContent = data.message || "Viva create failed.";
    message.className = "mt-4 text-sm text-red-600";
  }
});


// Load all viva schedules
async function loadVivas() {
  vivaTableBody.innerHTML = `
    <tr>
      <td colspan="8" class="p-4 text-center text-gray-500">
        Loading vivas...
      </td>
    </tr>
  `;

  await loadExaminers();

  const data = await apiRequest("/api/viva/");

  console.log("Vivas:", data);

  if (data.success === false) {
    vivaTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="p-4 text-center text-red-500">
          Failed to load vivas.
        </td>
      </tr>
    `;
    return;
  }

  let vivas = [];

  if (Array.isArray(data)) {
    vivas = data;
  } else {
    vivas = data.data || data.vivas || [];
  }

  if (vivas.length === 0) {
    vivaTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="p-4 text-center text-gray-500">
          No viva schedule found.
        </td>
      </tr>
    `;
    return;
  }

  vivaTableBody.innerHTML = "";

  vivas.forEach(function(viva) {
    vivaTableBody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="p-3 border">${viva.id}</td>

        <td class="p-3 border">
          ${getProjectName(viva)}
        </td>

        <td class="p-3 border">${viva.date || "-"}</td>
        <td class="p-3 border">${viva.time || "-"}</td>
        <td class="p-3 border">${viva.room || "-"}</td>

        <td class="p-3 border">
          ${getExaminerName(viva)}
        </td>

        <td class="p-3 border">
          ${getVivaStatusBadge(viva.status)}
        </td>

        <td class="p-3 border">
          <div class="flex gap-2">
            <select
              id="examiner-${viva.id}"
              class="border px-2 py-1 rounded w-40"
            >
              <option value="">Select</option>
              ${getExaminerOptions(viva.examiner)}
            </select>

            <button
              onclick="assignExaminer(${viva.id})"
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
            >
              Assign
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}


// Assign examiner
async function assignExaminer(vivaId) {
  const examinerId = document.getElementById(`examiner-${vivaId}`).value;

  if (!examinerId) {
    alert("Please select an examiner.");
    return;
  }

  const data = await apiRequest(`/api/viva/${vivaId}/assign-examiner/`, "PATCH", {
    examiner_id: Number(examinerId),
  });

  console.log("Assign Examiner:", data);

  if (data.success || data.id) {
    alert("Examiner assigned successfully.");
    loadVivas();
  } else {
    alert(data.message || "Failed to assign examiner.");
  }
}


// Project name safely
function getProjectName(viva) {
  if (viva.project_title) {
    return viva.project_title;
  }

  if (viva.project && viva.project.title) {
    return viva.project.title;
  }

  if (viva.project) {
    return `Project ID: ${viva.project}`;
  }

  return "-";
}


// Examiner name safely
function getExaminerName(viva) {
  if (viva.examiner_name) {
    return viva.examiner_name;
  }

  if (viva.examiner && viva.examiner.first_name) {
    return `${viva.examiner.first_name} ${viva.examiner.last_name}`;
  }

  if (viva.examiner) {
    return `Examiner ID: ${viva.examiner}`;
  }

  return `<span class="text-red-500">Not Assigned</span>`;
}


// Examiner dropdown options
function getExaminerOptions(currentExaminerId) {
  let options = "";

  examiners.forEach(function(examiner) {
    const fullName = `${examiner.first_name} ${examiner.last_name}`;
    const selected = currentExaminerId === examiner.id ? "selected" : "";

    options += `
      <option value="${examiner.id}" ${selected}>
        ${fullName}
      </option>
    `;
  });

  return options;
}


// Viva status badge
function getVivaStatusBadge(status) {
  if (status === "COMPLETED") {
    return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Completed</span>`;
  }

  if (status === "CANCELLED") {
    return `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">Cancelled</span>`;
  }

  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Scheduled</span>`;
}


// Initial load
loadProjectsForDropdown();
loadVivas();