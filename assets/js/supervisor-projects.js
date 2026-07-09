checkAuth();

if (getUserRole() !== "SUPERVISOR") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const projectTableBody = document.getElementById("projectTableBody");
const supervisorProjectSearchInput = document.getElementById(
  "supervisorProjectSearchInput"
);

const detailsModal = document.getElementById("detailsModal");
const detailsBox = document.getElementById("detailsBox");

const reviewModal = document.getElementById("reviewModal");
const reviewMessage = document.getElementById("reviewMessage");

const feedbackModal = document.getElementById("feedbackModal");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackMessage = document.getElementById("feedbackMessage");
const feedbackList = document.getElementById("feedbackList");

let allSupervisorProjects = [];

async function loadAssignedProjects() {
  projectTableBody.innerHTML = `
    <tr>
      <td colspan="9" class="p-4 text-center text-gray-500">
        Loading projects...
      </td>
    </tr>
  `;

  const data = await apiRequest("/api/projects/supervisor/assigned/");

  if (data.success === false) {
    projectTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="p-4 text-center text-red-500">
          ${data.message || "Failed to load assigned projects."}
        </td>
      </tr>
    `;
    return;
  }

  const projects = Array.isArray(data)
    ? data
    : data.data || data.projects || data.results || [];

  allSupervisorProjects = projects.sort((a, b) => a.id - b.id);
  renderProjectTable(allSupervisorProjects);
}

function renderProjectTable(projects) {
  projectTableBody.innerHTML = "";

  if (!projects || projects.length === 0) {
    projectTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="p-4 text-center text-gray-500">
          No assigned project found.
        </td>
      </tr>
    `;
    return;
  }

  projects.forEach(function (project) {
    projectTableBody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="p-3 border">${project.id}</td>

        <td class="p-3 border w-[240px] break-words align-top">
          <div class="font-bold text-gray-800 text-base">
            ${project.title || "-"}
          </div>
          <div class="text-xs text-gray-500 mt-1 line-clamp-2">
            ${project.description || "No description"}
          </div>
        </td>
        <td class="p-3 border">${getSupervisorName(project)}</td>

        <td class="p-3 border">${project.project_type || "-"}</td>
        <td class="p-3 border">${getTeamName(project)}</td>
        <td class="p-3 border">${project.technology_stack || "-"}</td>
        <td class="p-3 border">${getStatusBadge(project.status)}</td>

        <td class="p-3 border">
          <button onclick="openDetailsModal(${project.id})" class="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1">
            Details
          </button>
        </td>

        <td class="p-3 border">
          <button onclick="openReviewModal(${project.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1">
            Review
          </button>
        </td>

        <td class="p-3 border">
          <button onclick="openFeedbackModal(${project.id})" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1">
            Feedback
          </button>
        </td>
      </tr>
    `;
  });
}

if (supervisorProjectSearchInput) {
  supervisorProjectSearchInput.addEventListener("input", function () {
    const keyword = supervisorProjectSearchInput.value.toLowerCase();

    const filtered = allSupervisorProjects.filter(function (project) {
      const text = `
        ${project.title || ""}
        ${project.project_type || ""}
        ${project.description || ""}
        ${project.technology_stack || ""}
        ${project.status || ""}
        ${getTeamName(project)}
      `.toLowerCase();

      return text.includes(keyword);
    });

    renderProjectTable(filtered);
  });
}

function openDetailsModal(projectId) {
  const project = allSupervisorProjects.find(
    (item) => Number(item.id) === Number(projectId)
  );

  if (!project) {
    showToast("Project not found.", "error");
    return;
  }

  detailsBox.innerHTML = `
    <div class="space-y-5">
      <div class="border bg-white p-5">
        <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
          <div>
            <h3 class="text-2xl font-bold text-gray-800">
              ${project.title || "Untitled Project"}
            </h3>
            <p class="text-gray-500 mt-1">
              Team: ${getTeamName(project)}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            ${getStatusBadge(project.status)}
            <span class="bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold">
              ${project.project_type || "-"}
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-blue-50 border border-blue-100 p-4">
          <p class="font-semibold text-blue-700 mb-1">Technology Stack</p>
          <p class="text-gray-700">${project.technology_stack || "-"}</p>
        </div>

        <div class="bg-green-50 border border-green-100 p-4">
          <p class="font-semibold text-green-700 mb-1">Supervisor</p>
          <p class="text-gray-700">You are assigned supervisor</p>
        </div>

        <div class="bg-purple-50 border border-purple-100 p-4">
          <p class="font-semibold text-purple-700 mb-1">Project Type</p>
          <p class="text-gray-700">${project.project_type || "-"}</p>
        </div>

        <div class="bg-orange-50 border border-orange-100 p-4">
          <p class="font-semibold text-orange-700 mb-1">Submitted At</p>
          <p class="text-gray-700">
            ${project.created_at ? formatDate(project.created_at) : "-"}
          </p>
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

  detailsModal.classList.remove("hidden");
  detailsModal.classList.add("flex");
}

function closeDetailsModal() {
  detailsModal.classList.add("hidden");
  detailsModal.classList.remove("flex");
}

function openReviewModal(projectId) {
  const project = allSupervisorProjects.find(
    (item) => Number(item.id) === Number(projectId)
  );

  document.getElementById("review_project_id").value = projectId;
  document.getElementById("review_status").value = project?.status || "";
  document.getElementById("review_comment").value = "";
  reviewMessage.textContent = "";

  reviewModal.classList.remove("hidden");
  reviewModal.classList.add("flex");
}

function closeReviewModal() {
  reviewModal.classList.add("hidden");
  reviewModal.classList.remove("flex");
}

async function submitProposalReview() {
  const projectId = document.getElementById("review_project_id").value;
  const status = document.getElementById("review_status").value;
  const comment = document.getElementById("review_comment").value;

  if (!status) {
    reviewMessage.textContent = "Please select a review action.";
    reviewMessage.className = "mt-4 text-sm text-red-600";
    return;
  }

  reviewMessage.textContent = "Submitting review...";
  reviewMessage.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest(
    `/api/projects/supervisor/review/${projectId}/`,
    "PATCH",
    {
      status,
      comment,
    }
  );

  if (data.success) {
    reviewMessage.textContent = "Project status updated successfully.";
    reviewMessage.className = "mt-4 text-sm text-green-600";
    loadAssignedProjects();

    setTimeout(() => {
      closeReviewModal();
    }, 700);
  } else {
    reviewMessage.textContent = data.message || "Project review failed.";
    reviewMessage.className = "mt-4 text-sm text-red-600";
  }
}

function openFeedbackModal(projectId) {
  document.getElementById("feedback_project_id").value = projectId;
  document.getElementById("comment").value = "";
  feedbackMessage.textContent = "";

  feedbackModal.classList.remove("hidden");
  feedbackModal.classList.add("flex");

  loadFeedbacks(projectId);
}

function closeFeedbackModal() {
  feedbackModal.classList.add("hidden");
  feedbackModal.classList.remove("flex");
}

feedbackForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const projectId = document.getElementById("feedback_project_id").value;
  const comment = document.getElementById("comment").value;

  feedbackMessage.textContent = "Submitting feedback...";
  feedbackMessage.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest(`/api/projects/${projectId}/feedback/`, "POST", {
    comment,
  });

  if (data.success || data.id || data.data?.id) {
    feedbackMessage.textContent = "Feedback submitted successfully.";
    feedbackMessage.className = "mt-4 text-sm text-green-600";
    document.getElementById("comment").value = "";
    loadFeedbacks(projectId);
  } else {
    feedbackMessage.textContent =
      data.message || data.detail || "Feedback submit failed.";
    feedbackMessage.className = "mt-4 text-sm text-red-600";
  }
});

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
    feedbackList.innerHTML = `<p class="text-gray-500">No feedback found.</p>`;
    return;
  }

  feedbackList.innerHTML = "";

  feedbacks.forEach(function (feedback) {
    feedbackList.innerHTML += `
      <div class="border p-3 bg-gray-50">
        <p class="text-gray-700">${feedback.comment || "-"}</p>
        <p class="text-xs text-gray-500 mt-2">
          ${feedback.created_at ? formatDate(feedback.created_at) : ""}
        </p>
      </div>
    `;
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

  return "Not Assigned";
}


function getStatusText(status) {
  return status ? status.replaceAll("_", " ") : "PENDING";
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

  return `<span class="bg-gray-100 text-gray-700 px-3 py-1 text-xs font-semibold">${getStatusText(status)}</span>`;
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

[detailsModal, reviewModal, feedbackModal].forEach(function (modal) {
  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
    });
  }
});

loadAssignedProjects();