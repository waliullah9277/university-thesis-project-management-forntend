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

const studentProjectSearchInput = document.getElementById("studentProjectSearchInput");

let allStudentProjects = [];
let currentStudentProjectPage = 1;
const studentProjectPerPage = 2;

async function loadTeamsForDropdown() {
  const data = await apiRequest("/api/projects/teams/");

  let teams = Array.isArray(data)
    ? data
    : data.data || data.teams || data.results || [];

  teamSelect.innerHTML = `<option value="">Select Team</option>`;

  if (teams.length === 0) {
    teamSelect.innerHTML = `<option value="">No team found</option>`;
    return;
  }

  teams.forEach(function(team) {
    teamSelect.innerHTML += `
      <option value="${team.id}">
        ${team.name}
      </option>
    `;
  });
}

projectForm.addEventListener("submit", async function(event) {
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
    if (data.team) {
      message.textContent = data.team[0];
    } else {
      message.textContent = data.message || data.detail || JSON.stringify(data);
    }

    message.className = "mt-4 text-sm text-red-600";
  }
});

async function loadProjects() {
  projectList.innerHTML = `<p class="text-gray-500">Loading projects...</p>`;

  const data = await apiRequest("/api/projects/");

  console.log("Projects:", data);

  if (data.success === false) {
    projectList.innerHTML = `<p class="text-red-500">Failed to load projects.</p>`;
    return;
  }

  const projects = Array.isArray(data)
    ? data
    : data.data || data.projects || data.results || [];

  allStudentProjects = projects;
  currentStudentProjectPage = 1;
  renderStudentProjects(allStudentProjects);
}

function renderStudentProjects(projects) {
  if (projects.length === 0) {
    projectList.innerHTML = `<p class="text-gray-500">No project found.</p>`;
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

  paginatedProjects.forEach(function(project) {
    projectList.innerHTML += `
      <div class="border rounded-lg p-5 bg-gray-50">
        <div class="flex justify-between items-start gap-3">
          <div>
            <h3 class="text-lg font-bold">${project.title || "-"}</h3>
            <p class="text-gray-500 text-sm mt-1">${project.project_type || "-"}</p>
          </div>

          ${getStatusBadge(project.status)}
        </div>

        <p class="mt-3 text-gray-700">
          ${project.description || "-"}
        </p>

        <div class="mt-4 text-sm text-gray-600 space-y-1">
          <p><strong>Technology:</strong> ${project.technology_stack || "-"}</p>
          <p><strong>Team:</strong> ${getTeamName(project)}</p>
          <p><strong>Supervisor:</strong> ${getSupervisorName(project)}</p>
        </div>

        <button
          onclick="openFeedbackModal(${project.id})"
          class="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
        >
          View Feedbacks
        </button>
      </div>
    `;
  });

  renderPagination(
    "studentProjectPagination",
    projects.length,
    currentStudentProjectPage,
    studentProjectPerPage,
    "changeStudentProjectPage"
  );
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
  return allStudentProjects.filter(function(project) {
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
  studentProjectSearchInput.addEventListener("input", function() {
    const keyword = studentProjectSearchInput.value.toLowerCase();
    currentStudentProjectPage = 1;

    renderStudentProjects(getFilteredStudentProjects(keyword));
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

  feedbacks.forEach(function(feedback) {
    feedbackList.innerHTML += `
      <div class="border rounded-lg p-4 bg-gray-50">
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
  if (project.team && project.team.name) return project.team.name;
  if (project.team) return `Team ID: ${project.team}`;
  return "-";
}

function getSupervisorName(project) {
  if (project.supervisor_name) return project.supervisor_name;

  if (project.supervisor && project.supervisor.first_name) {
    return `${project.supervisor.first_name} ${project.supervisor.last_name}`;
  }

  if (project.supervisor) return `Supervisor ID: ${project.supervisor}`;

  return "Not Assigned";
}

function getStatusBadge(status) {
  if (status === "APPROVED") {
    return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Approved</span>`;
  }

  if (status === "REJECTED") {
    return `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">Rejected</span>`;
  }

  if (status === "IN_PROGRESS") {
    return `<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">In Progress</span>`;
  }

  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Pending</span>`;
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
  feedbackModal.addEventListener("click", function(event) {
    if (event.target === feedbackModal) {
      closeFeedbackModal();
    }
  });
}

loadTeamsForDropdown();
loadProjects();