checkAuth();

if (getUserRole() !== "STUDENT") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const projectForm = document.getElementById("projectForm");
const message = document.getElementById("message");
const projectList = document.getElementById("projectList");
const teamSelect = document.getElementById("team");

const feedbackModal = document.getElementById("feedbackModal");
const feedbackList = document.getElementById("feedbackList");

const studentProjectSearchInput = document.getElementById(
  "studentProjectSearchInput"
);

let allStudentProjects = [];
let currentStudentProjectPage = 1;
const studentProjectPerPage = 2;

async function loadTeamsForDropdown() {
  const data = await apiRequest("/api/projects/teams/");

  const teams = Array.isArray(data)
    ? data
    : data.data || data.teams || data.results || [];

  teamSelect.innerHTML = `<option value="">Select Team</option>`;

  if (teams.length === 0) {
    teamSelect.innerHTML = `<option value="">No team found</option>`;
    return;
  }

  teams.forEach(function (team) {
    teamSelect.innerHTML += `
      <option value="${team.id}">
        ${team.name}
      </option>
    `;
  });
}

projectForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const team = document.getElementById("team").value;
  const title = document.getElementById("title").value;
  const projectType = document.getElementById("project_type").value;
  const description = document.getElementById("description").value;
  const technologyStack = document.getElementById("technology_stack").value;

  if (!team) {
    alert("Please select a team.");
    return;
  }

  message.textContent = "Submitting project...";
  message.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest("/api/projects/", "POST", {
    team: Number(team),
    title: title,
    project_type: projectType,
    type: projectType,
    description: description,
    technology_stack: technologyStack,
  });

  if (data.success || data.id || data.data?.id) {
    message.textContent = "Project submitted successfully.";
    message.className = "mt-4 text-sm text-green-600";

    projectForm.reset();
    loadProjects();
  } else {
    message.textContent =
      data.team?.[0] || data.message || data.detail || "Project submit failed.";
    message.className = "mt-4 text-sm text-red-600";
  }
});

async function loadProjects() {
  projectList.innerHTML = `<p class="text-gray-500">Loading projects...</p>`;

  const data = await apiRequest("/api/projects/");

  if (data.success === false) {
    projectList.innerHTML = `
      <div class="bg-red-50 border border-red-200 p-4 text-red-600">
        ${data.message || "Failed to load projects."}
      </div>
    `;
    return;
  }

  const projects = Array.isArray(data)
    ? data
    : data.data || data.projects || data.results || [];

  allStudentProjects = projects.sort((a, b) => a.id - b.id);
  currentStudentProjectPage = 1;
  renderStudentProjects(allStudentProjects);
}

function renderStudentProjects(projects) {
  if (projects.length === 0) {
    projectList.innerHTML = `
      <div class="bg-yellow-50 border border-yellow-200 p-5 text-yellow-700">
        No project found.
      </div>
    `;

    renderPagination(
      "studentProjectPagination",
      0,
      currentStudentProjectPage,
      studentProjectPerPage,
      "changeStudentProjectPage"
    );
    return;
  }

  const paginatedProjects = paginateItems(
    projects,
    currentStudentProjectPage,
    studentProjectPerPage
  );

  projectList.innerHTML = "";

  paginatedProjects.forEach(function (project) {
    projectList.innerHTML += getProjectCard(project);
  });

  renderPagination(
    "studentProjectPagination",
    projects.length,
    currentStudentProjectPage,
    studentProjectPerPage,
    "changeStudentProjectPage"
  );
}

function getProjectCard(project) {
  return `
    <div class="bg-white border shadow-md p-6 hover:shadow-lg transition">
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-5">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">
            ${project.title || "Untitled Project"}
          </h3>

          <div class="flex flex-wrap gap-2 mt-3">
            ${getStatusBadge(project.status)}
            <span class="bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold">
              ${project.project_type || "PROJECT"}
            </span>
          </div>
        </div>

        <button
          onclick="openFeedbackModal(${project.id})"
          class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 font-medium"
        >
          View Feedbacks
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-sm">
        <div class="bg-blue-50 border border-blue-100 p-4">
          <p class="text-blue-700 font-semibold mb-1">Technology Stack</p>
          <p class="text-gray-700">${project.technology_stack || "-"}</p>
        </div>

        <div class="bg-green-50 border border-green-100 p-4">
          <p class="text-green-700 font-semibold mb-1">Supervisor Name</p>
          <p class="text-gray-700">${getSupervisorName(project)}</p>
        </div>

        <div class="bg-purple-50 border border-purple-100 p-4">
          <p class="text-purple-700 font-semibold mb-1">Team Name</p>
          <p class="text-gray-700">${getTeamName(project)}</p>
        </div>

        <div class="bg-orange-50 border border-orange-100 p-4">
          <p class="text-orange-700 font-semibold mb-1">Project Type</p>
          <p class="text-gray-700">${project.project_type || "-"}</p>
        </div>
      </div>

      <div class="bg-gray-50 border p-4">
        <p class="font-semibold text-gray-800 mb-2">Project Description</p>
        <p class="text-gray-700 leading-relaxed">
          ${project.description || "No description added."}
        </p>
      </div>
    </div>
  `;
}

function changeStudentProjectPage(page) {
  currentStudentProjectPage = page;

  const keyword = studentProjectSearchInput
    ? studentProjectSearchInput.value.toLowerCase()
    : "";

  if (keyword) {
    renderStudentProjects(getFilteredStudentProjects(keyword));
  } else {
    renderStudentProjects(allStudentProjects);
  }
}

function getFilteredStudentProjects(keyword) {
  return allStudentProjects.filter(function (project) {
    const text = `
      ${project.title || ""}
      ${project.project_type || ""}
      ${project.description || ""}
      ${project.technology_stack || ""}
      ${project.status || ""}
      ${getTeamName(project)}
      ${getSupervisorName(project)}
    `.toLowerCase();

    return text.includes(keyword);
  });
}

if (studentProjectSearchInput) {
  studentProjectSearchInput.addEventListener("input", function () {
    const keyword = studentProjectSearchInput.value.toLowerCase();
    currentStudentProjectPage = 1;

    if (keyword) {
      renderStudentProjects(getFilteredStudentProjects(keyword));
    } else {
      renderStudentProjects(allStudentProjects);
    }
  });
}

function openFeedbackModal(projectId) {
  feedbackModal.classList.remove("hidden");
  feedbackModal.classList.add("flex");
  loadFeedbacks(projectId);
}

function closeFeedbackModal() {
  feedbackModal.classList.add("hidden");
  feedbackModal.classList.remove("flex");
}

async function loadFeedbacks(projectId) {
  feedbackList.innerHTML = `<p class="text-gray-500">Loading feedbacks...</p>`;

  const data = await apiRequest(`/api/projects/${projectId}/feedbacks/`);

  if (data.success === false) {
    feedbackList.innerHTML = `<p class="text-red-500">Failed to load feedbacks.</p>`;
    return;
  }

  const feedbacks = Array.isArray(data)
    ? data
    : data.data || data.feedbacks || data.results || [];

  if (feedbacks.length === 0) {
    feedbackList.innerHTML = `<p class="text-gray-500">No feedback found for this project.</p>`;
    return;
  }

  feedbackList.innerHTML = "";

  feedbacks.forEach(function (feedback) {
    feedbackList.innerHTML += `
      <div class="border p-4 bg-gray-50">
        <p class="text-gray-700">${feedback.comment || "-"}</p>

        <div class="mt-3 text-xs text-gray-500">
          <p><strong>Supervisor:</strong> ${getFeedbackAuthor(feedback)}</p>
          <p>${feedback.created_at ? formatDate(feedback.created_at) : ""}</p>
        </div>
      </div>
    `;
  });
}

function getFeedbackAuthor(feedback) {
  if (feedback.supervisor_name) return feedback.supervisor_name;
  if (feedback.user_name) return feedback.user_name;
  if (feedback.created_by_name) return feedback.created_by_name;

  if (feedback.supervisor && feedback.supervisor.first_name) {
    return `${feedback.supervisor.first_name} ${feedback.supervisor.last_name}`;
  }

  return "Supervisor";
}


function getTeamName(project) {
  if (project.team_name) return project.team_name;

  if (project.team && typeof project.team === "object") {
    if (project.team.name) return project.team.name;
    if (project.team.team_name) return project.team.team_name;
  }

  return "Team Not Found";
}

function getSupervisorName(project) {
  if (project.supervisor_name) return project.supervisor_name;

  if (project.supervisor && typeof project.supervisor === "object") {
    const fullName = `${project.supervisor.first_name || ""} ${
      project.supervisor.last_name || ""
    }`.trim();

    if (fullName) return fullName;
    if (project.supervisor.email) return project.supervisor.email;
  }

  return "Not Assigned";
}


function getStatusBadge(status) {
  if (status === "PENDING")
    return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 text-xs font-semibold">Pending</span>`;
  if (status === "SUPERVISOR_ASSIGNED")
    return `<span class="bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">Supervisor Assigned</span>`;
  if (status === "PROPOSAL_APPROVED")
    return `<span class="bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">Proposal Approved</span>`;
  if (status === "REVISION_REQUIRED")
    return `<span class="bg-orange-100 text-orange-700 px-3 py-1 text-xs font-semibold">Revision Required</span>`;
  if (status === "REJECTED")
    return `<span class="bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">Rejected</span>`;
  if (status === "IN_PROGRESS")
    return `<span class="bg-purple-100 text-purple-700 px-3 py-1 text-xs font-semibold">In Progress</span>`;
  if (status === "READY_FOR_VIVA")
    return `<span class="bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-semibold">Ready For Viva</span>`;
  if (status === "COMPLETED")
    return `<span class="bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold">Completed</span>`;

  return `<span class="bg-gray-100 text-gray-700 px-3 py-1 text-xs font-semibold">Pending</span>`;
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

if (feedbackModal) {
  feedbackModal.addEventListener("click", function (event) {
    if (event.target === feedbackModal) {
      closeFeedbackModal();
    }
  });
}

loadTeamsForDropdown();
loadProjects();