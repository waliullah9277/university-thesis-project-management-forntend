checkAuth();

if (getUserRole() !== "SUPERVISOR") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const projectList = document.getElementById("projectList");
const feedbackModal = document.getElementById("feedbackModal");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackMessage = document.getElementById("feedbackMessage");
const feedbackList = document.getElementById("feedbackList");


// Load assigned projects
async function loadAssignedProjects() {
  projectList.innerHTML = `<p class="text-gray-500">Loading projects...</p>`;

  const data = await apiRequest("/api/projects/supervisor/assigned/");

  console.log("Assigned Projects:", data);

  if (data.success === false) {
    projectList.innerHTML = `
      <p class="text-red-500">Failed to load assigned projects.</p>
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
      <p class="text-gray-500">No assigned project found.</p>
    `;
    return;
  }

  projectList.innerHTML = "";

  projects.forEach(function(project) {
    projectList.innerHTML += `
      <div class="bg-gray-50 border rounded-lg p-5">
        <div class="flex justify-between items-start gap-3">
          <div>
            <h3 class="text-lg font-bold">${project.title || "-"}</h3>
            <p class="text-sm text-gray-500">${project.project_type || "-"}</p>
          </div>

          ${getStatusBadge(project.status)}
        </div>

        <p class="text-gray-700 mt-3">
          ${project.description || "-"}
        </p>

        <div class="text-sm text-gray-600 mt-4 space-y-1">
          <p><strong>Team:</strong> ${getTeamName(project)}</p>
          <p><strong>Technology:</strong> ${project.technology_stack || "-"}</p>
          <p><strong>Project ID:</strong> ${project.id}</p>
        </div>

        <button
          onclick="openFeedbackModal(${project.id})"
          class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Give Feedback
        </button>
      </div>
    `;
  });
}


// Open feedback modal
function openFeedbackModal(projectId) {
  document.getElementById("feedback_project_id").value = projectId;
  document.getElementById("comment").value = "";
  feedbackMessage.textContent = "";

  feedbackModal.classList.remove("hidden");
  feedbackModal.classList.add("flex");

  loadFeedbacks(projectId);
}


// Close feedback modal
function closeFeedbackModal() {
  feedbackModal.classList.add("hidden");
  feedbackModal.classList.remove("flex");
}


// Submit feedback
feedbackForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const projectId = document.getElementById("feedback_project_id").value;
  const comment = document.getElementById("comment").value;

  feedbackMessage.textContent = "Submitting feedback...";
  feedbackMessage.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest(`/api/projects/${projectId}/feedback/`, "POST", {
    comment: comment,
  });

  console.log("Feedback Submit:", data);

  if (data.success || data.id) {
    feedbackMessage.textContent = "Feedback submitted successfully.";
    feedbackMessage.className = "mt-4 text-sm text-green-600";

    document.getElementById("comment").value = "";
    loadFeedbacks(projectId);
  } else {
    feedbackMessage.textContent = data.message || "Feedback submit failed.";
    feedbackMessage.className = "mt-4 text-sm text-red-600";
  }
});


// Load feedbacks
async function loadFeedbacks(projectId) {
  feedbackList.innerHTML = `<p class="text-gray-500">Loading feedbacks...</p>`;

  const data = await apiRequest(`/api/projects/${projectId}/feedbacks/`);

  console.log("Feedbacks:", data);

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
      <p class="text-gray-500">No feedback found.</p>
    `;
    return;
  }

  feedbackList.innerHTML = "";

  feedbacks.forEach(function(feedback) {
    feedbackList.innerHTML += `
      <div class="border rounded-lg p-3 bg-gray-50">
        <p class="text-gray-700">${feedback.comment || "-"}</p>
        <p class="text-xs text-gray-500 mt-2">
          ${feedback.created_at ? formatDate(feedback.created_at) : ""}
        </p>
      </div>
    `;
  });
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


// Close modal when clicking outside box
feedbackModal.addEventListener("click", function(event) {
  if (event.target === feedbackModal) {
    closeFeedbackModal();
  }
});


// Initial load
loadAssignedProjects();