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


// Load teams into dropdown
async function loadTeamsForDropdown() {
  const data = await apiRequest("/api/projects/teams/");

  console.log("Teams:", data);

  let teams = [];

  if (Array.isArray(data)) {
    teams = data;
  } else {
    teams = data.data || data.teams || [];
  }

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


// Project Submit
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
    description: description,
    technology_stack: technologyStack,
  });

  console.log("Submit Project:", data);

  if (data.success || data.id) {
    message.textContent = "Project submitted successfully.";
    message.className = "mt-4 text-sm text-green-600";

    projectForm.reset();
    loadProjects();
  } else {
    message.textContent = data.message || "Project submit failed.";
    message.className = "mt-4 text-sm text-red-600";
  }
});


// Load my projects
async function loadProjects() {
  const data = await apiRequest("/api/projects/");

  console.log("Projects:", data);

  if (data.success === false) {
    projectList.innerHTML = `
      <p class="text-red-500">Failed to load projects.</p>
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
    projectList.innerHTML = `
      <p class="text-gray-500">No project submitted yet.</p>
    `;
    return;
  }

  projectList.innerHTML = "";

  projects.forEach(function(project) {
    projectList.innerHTML += `
      <div class="border rounded-lg p-5 bg-gray-50">
        <div class="flex justify-between items-start gap-3">
          <div>
            <h3 class="text-lg font-bold">${project.title}</h3>
            <p class="text-gray-500 text-sm mt-1">${project.project_type}</p>
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
}


// Open feedback modal
function openFeedbackModal(projectId) {
  feedbackModal.classList.remove("hidden");
  feedbackModal.classList.add("flex");

  loadFeedbacks(projectId);
}


// Close feedback modal
function closeFeedbackModal() {
  feedbackModal.classList.add("hidden");
  feedbackModal.classList.remove("flex");
}


// Load project feedbacks
async function loadFeedbacks(projectId) {
  feedbackList.innerHTML = `
    <p class="text-gray-500">Loading feedbacks...</p>
  `;

  const data = await apiRequest(`/api/projects/${projectId}/feedbacks/`);

  console.log("Student Feedbacks:", data);

  if (data.success === false) {
    feedbackList.innerHTML = `
      <p class="text-red-500">Failed to load feedbacks.</p>
    `;
    return;
  }

  let feedbacks = [];

  if (Array.isArray(data)) {
    feedbacks = data;
  } else {
    feedbacks = data.data || data.feedbacks || [];
  }

  if (feedbacks.length === 0) {
    feedbackList.innerHTML = `
      <p class="text-gray-500">No feedback found for this project.</p>
    `;
    return;
  }

  feedbackList.innerHTML = "";

  feedbacks.forEach(function(feedback) {
    feedbackList.innerHTML += `
      <div class="border rounded-lg p-4 bg-gray-50">
        <p class="text-gray-700">
          ${feedback.comment || "-"}
        </p>

        <div class="mt-3 text-xs text-gray-500">
          <p><strong>Supervisor:</strong> ${getFeedbackAuthor(feedback)}</p>
          <p>${feedback.created_at ? formatDate(feedback.created_at) : ""}</p>
        </div>
      </div>
    `;
  });
}


// Feedback author safely
function getFeedbackAuthor(feedback) {
  if (feedback.supervisor_name) {
    return feedback.supervisor_name;
  }

  if (feedback.user_name) {
    return feedback.user_name;
  }

  if (feedback.created_by_name) {
    return feedback.created_by_name;
  }

  if (feedback.supervisor && feedback.supervisor.first_name) {
    return `${feedback.supervisor.first_name} ${feedback.supervisor.last_name}`;
  }

  return "Supervisor";
}


// Team name safely
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


// Supervisor name safely
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

  return "Not Assigned";
}


// Status Badge
function getStatusBadge(status) {
  if (status === "APPROVED") {
    return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Approved</span>`;
  }

  if (status === "REJECTED") {
    return `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">Rejected</span>`;
  }

  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Pending</span>`;
}


// Date format
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


// Modal outside click close
feedbackModal.addEventListener("click", function(event) {
  if (event.target === feedbackModal) {
    closeFeedbackModal();
  }
});


// Initial load
loadTeamsForDropdown();
loadProjects();