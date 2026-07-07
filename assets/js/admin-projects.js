checkAuth();

if (getUserRole() !== "SUPER_ADMIN") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const projectTableBody = document.getElementById("projectTableBody");

let supervisors = [];


// Load supervisors from user list
async function loadSupervisors() {
  const data = await apiRequest("/api/auth/users/");

  console.log("Users:", data);

  let users = [];

  if (Array.isArray(data)) {
    users = data;
  } else {
    users = data.data || data.users || [];
  }

  supervisors = users.filter(function(user) {
    return user.role === "SUPERVISOR" && user.is_active === true;
  });
}


// Load all projects
async function loadProjects() {
  projectTableBody.innerHTML = `
    <tr>
      <td colspan="9" class="p-4 text-center text-gray-500">
        Loading projects...
      </td>
    </tr>
  `;

  await loadSupervisors();

  const data = await apiRequest("/api/projects/admin/list/");

  console.log("Projects:", data);

  if (data.success === false) {
    projectTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="p-4 text-center text-red-500">
          Failed to load projects.
        </td>
      </tr>
    `;
    return;
  }

  let projects = [];

  if (Array.isArray(data)) {
    projects = data;
  } else {
    projects = data.data || data.projects || [];
  }

  if (projects.length === 0) {
    projectTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="p-4 text-center text-gray-500">
          No project found.
        </td>
      </tr>
    `;
    return;
  }

  projectTableBody.innerHTML = "";

  projects.forEach(function(project) {
    const supervisorName = getSupervisorName(project);
    const statusBadge = getStatusBadge(project.status);
    const supervisorOptions = getSupervisorOptions(project.supervisor);

    projectTableBody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="p-3 border">${project.id}</td>

        <td class="p-3 border">
          <div class="font-semibold">${project.title || "-"}</div>
          <div class="text-sm text-gray-500">${project.description || ""}</div>
        </td>

        <td class="p-3 border">${project.project_type || "-"}</td>

        <td class="p-3 border">
          ${getTeamName(project)}
        </td>

        <td class="p-3 border">
          ${project.technology_stack || "-"}
        </td>

        <td class="p-3 border">
          ${supervisorName}
        </td>

        <td class="p-3 border">
          ${statusBadge}
        </td>

        <td class="p-3 border">
          <div class="flex gap-2">
            <select 
              id="supervisor-${project.id}"
              class="border px-2 py-1 rounded w-40"
            >
              <option value="">Select</option>
              ${supervisorOptions}
            </select>

            <button
              onclick="assignSupervisor(${project.id})"
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
            >
              Assign
            </button>
          </div>
        </td>

        <td class="p-3 border">
          <div class="flex gap-2">
            <select 
              id="status-${project.id}"
              class="border px-2 py-1 rounded w-36"
            >
              <option value="">Select</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              onclick="updateProjectStatus(${project.id})"
              class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
            >
              Update
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}


// Get team name safely
function getTeamName(project) {
  if (project.team_name) {
    return project.team_name;
  }

  if (project.team && project.team.name) {
    return project.team.name;
  }

  if (project.team) {
    return `Team ID: ${project.team}`;
  }

  return "-";
}


// Get supervisor name safely
function getSupervisorName(project) {
  if (project.supervisor_name) {
    return project.supervisor_name;
  }

  if (project.supervisor && project.supervisor.first_name) {
    return `${project.supervisor.first_name} ${project.supervisor.last_name}`;
  }

  if (project.supervisor) {
    return `Supervisor ID: ${project.supervisor}`;
  }

  return `<span class="text-red-500">Not Assigned</span>`;
}


// Supervisor dropdown options
function getSupervisorOptions(currentSupervisorId) {
  let options = "";

  supervisors.forEach(function(supervisor) {
    const fullName = `${supervisor.first_name} ${supervisor.last_name}`;
    const selected = currentSupervisorId === supervisor.id ? "selected" : "";

    options += `
      <option value="${supervisor.id}" ${selected}>
        ${fullName}
      </option>
    `;
  });

  return options;
}


// Status badge
function getStatusBadge(status) {
  if (status === "APPROVED") {
    return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Approved</span>`;
  }

  if (status === "REJECTED") {
    return `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">Rejected</span>`;
  }

  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Pending</span>`;
}


// Assign supervisor
async function assignSupervisor(projectId) {
  const supervisorId = document.getElementById(`supervisor-${projectId}`).value;

  if (!supervisorId) {
    alert("Please select a supervisor.");
    return;
  }

  const data = await apiRequest(`/api/projects/${projectId}/assign-supervisor/`, "PATCH", {
    supervisor_id: Number(supervisorId),
  });

  console.log("Assign Supervisor:", data);

  if (data.success) {
    alert("Supervisor assigned successfully.");
    loadProjects();
  } else {
    alert(data.message || "Failed to assign supervisor.");
  }
}


// Update project status
async function updateProjectStatus(projectId) {
  const status = document.getElementById(`status-${projectId}`).value;

  if (!status) {
    alert("Please select project status.");
    return;
  }

  const data = await apiRequest(`/api/projects/${projectId}/status/`, "PATCH", {
    status: status,
  });

  console.log("Update Status:", data);

  if (data.success) {
    alert("Project status updated successfully.");
    loadProjects();
  } else {
    alert(data.message || "Failed to update project status.");
  }
}


// Initial load
loadProjects();