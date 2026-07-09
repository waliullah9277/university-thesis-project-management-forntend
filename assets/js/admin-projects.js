checkAuth();

if (getUserRole() !== "SUPER_ADMIN") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const projectTableBody = document.getElementById("projectTableBody");
const projectSearchInput = document.getElementById("projectSearchInput");

let supervisors = [];
let allProjects = [];
let currentProjectPage = 1;
const projectPerPage = 4;

async function loadSupervisors() {
  const data = await apiRequest("/api/auth/users/");

  let users = Array.isArray(data)
    ? data
    : data.data || data.users || data.results || [];

  supervisors = users.filter(function(user) {
    return user.role === "SUPERVISOR" && user.is_active !== false;
  });
}

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

  const projects = Array.isArray(data)
    ? data
    : data.data || data.projects || data.results || [];

  allProjects = projects;
  allProjects = projects.sort((a, b) => a.id - b.id);
  currentProjectPage = 1;
  renderProjects(allProjects);
}

function renderProjects(projects) {
  if (projects.length === 0) {
    projectTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="p-4 text-center text-gray-500">
          No project found.
        </td>
      </tr>
    `;
    renderPagination("projectPagination", 0, currentProjectPage, projectPerPage, "changeProjectPage");
    return;
  }

  const paginatedProjects = paginateItems(projects, currentProjectPage, projectPerPage);

  projectTableBody.innerHTML = "";

  paginatedProjects.forEach(function(project) {
    const supervisorName = getSupervisorName(project);
    const supervisorOptions = getSupervisorOptions(project.supervisor);

    projectTableBody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="p-3 border">${project.id}</td>

        <td class="p-3 border">
          <div class="font-semibold">${project.title || "-"}</div>
          <div class="text-sm text-gray-500">${project.description || ""}</div>
        </td>

        <td class="p-3 border">${project.project_type || "-"}</td>
        <td class="p-3 border">${getTeamName(project)}</td>
        <td class="p-3 border">${project.technology_stack || "-"}</td>
        <td class="p-3 border">${supervisorName}</td>
        <td class="p-3 border">${getStatusBadge(project.status)}</td>

        <td class="p-3 border">
          <div class="flex gap-2">
            <select id="supervisor-${project.id}" class="border px-2 py-1 rounded w-40">
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

        
      </tr>
    `;
  });

  renderPagination(
    "projectPagination",
    projects.length,
    currentProjectPage,
    projectPerPage,
    "changeProjectPage"
  );
}

function changeProjectPage(page) {
  currentProjectPage = page;

  const keyword = projectSearchInput ? projectSearchInput.value.toLowerCase() : "";

  if (keyword) {
    renderProjects(getFilteredProjects(keyword));
  } else {
    renderProjects(allProjects);
  }
}

function getFilteredProjects(keyword) {
  return allProjects.filter(function(project) {
    const text = `
      ${project.title || ""}
      ${project.description || ""}
      ${project.project_type || ""}
      ${project.technology_stack || ""}
      ${project.status || ""}
      ${getTeamName(project)}
      ${getSupervisorName(project).replace(/<[^>]*>/g, "")}
    `.toLowerCase();

    return text.includes(keyword);
  });
}

if (projectSearchInput) {
  projectSearchInput.addEventListener("input", function() {
    const keyword = projectSearchInput.value.toLowerCase();
    currentProjectPage = 1;

    renderProjects(getFilteredProjects(keyword));
  });
}


function getTeamName(project) {
  if (project.team_name) return project.team_name;

  if (project.team && typeof project.team === "object") {
    if (project.team.name) return project.team.name;
    if (project.team.team_name) return project.team.team_name;
  }

  return `<span class="text-red-500">Team Not Found</span>`;
}


function getSupervisorName(project) {
  if (project.supervisor_name) return project.supervisor_name;

  if (project.supervisor && typeof project.supervisor === "object") {
    const fullName = `${project.supervisor.first_name || ""} ${project.supervisor.last_name || ""}`.trim();
    if (fullName) return fullName;
    if (project.supervisor.email) return project.supervisor.email;
  }

  const matchedSupervisor = supervisors.find(function (supervisor) {
    return Number(supervisor.id) === Number(project.supervisor);
  });

  if (matchedSupervisor) {
    const fullName = `${matchedSupervisor.first_name || ""} ${matchedSupervisor.last_name || ""}`.trim();
    return fullName || matchedSupervisor.email || "Supervisor";
  }

  return `<span class="text-red-500">Not Assigned</span>`;
}

function getSupervisorOptions(currentSupervisorId) {
  let options = "";

  supervisors.forEach(function(supervisor) {
    const fullName = `${supervisor.first_name || ""} ${supervisor.last_name || ""}`.trim();
    const selected = Number(currentSupervisorId) === Number(supervisor.id) ? "selected" : "";

    options += `
      <option value="${supervisor.id}" ${selected}>
        ${fullName || supervisor.email || supervisor.id}
      </option>
    `;
  });

  return options;
}

function getStatusBadge(status) {
  if (status === "PENDING") return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 text-xs font-semibold">Pending</span>`;
  if (status === "SUPERVISOR_ASSIGNED") return `<span class="bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">Supervisor Assigned</span>`;
  if (status === "PROPOSAL_APPROVED") return `<span class="bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">Proposal Approved</span>`;
  if (status === "REVISION_REQUIRED") return `<span class="bg-orange-100 text-orange-700 px-3 py-1 text-xs font-semibold">Revision Required</span>`;
  if (status === "REJECTED") return `<span class="bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">Rejected</span>`;
  if (status === "IN_PROGRESS") return `<span class="bg-purple-100 text-purple-700 px-3 py-1 text-xs font-semibold">In Progress</span>`;
  if (status === "READY_FOR_VIVA") return `<span class="bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-semibold">Ready For Viva</span>`;
  if (status === "COMPLETED") return `<span class="bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold">Completed</span>`;

  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Pending</span>`;
}

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

  if (data.success || data.id || data.data?.id || data.message) {
    alert("Supervisor assigned successfully.");
    loadProjects();
  } else {
    alert(data.message || data.detail || "Failed to assign supervisor.");
  }
}

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

  if (data.success || data.id || data.data?.id || data.message) {
    alert("Project status updated successfully.");
    loadProjects();
  } else {
    alert(data.message || data.detail || "Failed to update project status.");
  }
}

loadProjects();