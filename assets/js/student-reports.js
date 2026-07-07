checkAuth();

if (getUserRole() !== "STUDENT") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const reportForm = document.getElementById("reportForm");
const message = document.getElementById("message");
const reportList = document.getElementById("reportList");
const projectSelect = document.getElementById("project");


// Load student projects into dropdown
async function loadProjectsForDropdown() {
  const data = await apiRequest("/api/projects/");

  console.log("Student Projects:", data);

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


// Submit report
reportForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const project = document.getElementById("project").value;
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;

  if (!project) {
    alert("Please select a project.");
    return;
  }

  message.textContent = "Submitting report...";
  message.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest("/api/reports/", "POST", {
    project: Number(project),
    title: title,
    description: description,
  });

  console.log("Submit Report:", data);

  if (data.success || data.id) {
    message.textContent = "Report submitted successfully.";
    message.className = "mt-4 text-sm text-green-600";

    reportForm.reset();
    loadReports();
  } else {
    message.textContent = data.message || "Report submit failed.";
    message.className = "mt-4 text-sm text-red-600";
  }
});


// Load student reports
async function loadReports() {
  const data = await apiRequest("/api/reports/");

  console.log("Student Reports:", data);

  if (data.success === false) {
    reportList.innerHTML = `
      <p class="text-red-500">Failed to load reports.</p>
    `;
    return;
  }

  let reports = [];

  if (Array.isArray(data)) {
    reports = data;
  } else {
    reports = data.data || data.reports || [];
  }

  if (reports.length === 0) {
    reportList.innerHTML = `
      <p class="text-gray-500">No progress report submitted yet.</p>
    `;
    return;
  }

  reportList.innerHTML = "";

  reports.forEach(function(report) {
    reportList.innerHTML += `
      <div class="border rounded-lg p-5 bg-gray-50">
        <div class="flex justify-between items-start gap-3">
          <div>
            <h3 class="text-lg font-bold">${report.title || "-"}</h3>
            <p class="text-sm text-gray-500">
              Project: ${getProjectName(report)}
            </p>
          </div>

          ${getReportStatusBadge(report.status)}
        </div>

        <p class="mt-3 text-gray-700">
          ${report.description || "-"}
        </p>

        <div class="mt-4 text-sm text-gray-600 space-y-1">
          <p><strong>Supervisor Comment:</strong> ${report.supervisor_comment || "Not reviewed yet"}</p>
          <p><strong>Submitted:</strong> ${report.created_at ? formatDate(report.created_at) : "-"}</p>
        </div>
      </div>
    `;
  });
}


// Project name safely
function getProjectName(report) {
  if (report.project_title) {
    return report.project_title;
  }

  if (report.project && report.project.title) {
    return report.project.title;
  }

  if (report.project) {
    return `Project ID: ${report.project}`;
  }

  return "-";
}


// Report status badge
function getReportStatusBadge(status) {
  if (status === "REVIEWED") {
    return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Reviewed</span>`;
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


// Initial load
loadProjectsForDropdown();
loadReports();