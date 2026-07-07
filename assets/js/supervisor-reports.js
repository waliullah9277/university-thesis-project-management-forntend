checkAuth();

if (getUserRole() !== "SUPERVISOR") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const reportList = document.getElementById("reportList");
const reviewModal = document.getElementById("reviewModal");
const reviewForm = document.getElementById("reviewForm");
const reviewMessage = document.getElementById("reviewMessage");


// Load supervisor reports
async function loadSupervisorReports() {
  reportList.innerHTML = `<p class="text-gray-500">Loading reports...</p>`;

  const data = await apiRequest("/api/reports/supervisor/");

  console.log("Supervisor Reports:", data);

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
      <p class="text-gray-500">No report found.</p>
    `;
    return;
  }

  reportList.innerHTML = "";

  reports.forEach(function(report) {
    reportList.innerHTML += `
      <div class="bg-gray-50 border rounded-lg p-5">
        <div class="flex justify-between items-start gap-3">
          <div>
            <h3 class="text-lg font-bold">${report.title || "-"}</h3>
            <p class="text-sm text-gray-500">
              Project: ${getProjectName(report)}
            </p>
          </div>

          ${getReportStatusBadge(report.status)}
        </div>

        <p class="text-gray-700 mt-3">
          ${report.description || "-"}
        </p>

        <div class="text-sm text-gray-600 mt-4 space-y-1">
          <p><strong>Report ID:</strong> ${report.id}</p>
          <p><strong>Student:</strong> ${getStudentName(report)}</p>
          <p><strong>Submitted:</strong> ${report.created_at ? formatDate(report.created_at) : "-"}</p>
          <p><strong>Supervisor Comment:</strong> ${report.supervisor_comment || "Not reviewed yet"}</p>
        </div>

        <button
          onclick="openReviewModal(${report.id}, '${report.status || ""}', \`${safeText(report.supervisor_comment || "")}\`)"
          class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Review
        </button>
      </div>
    `;
  });
}


// Open review modal
function openReviewModal(reportId, currentStatus, currentComment) {
  document.getElementById("review_report_id").value = reportId;
  document.getElementById("status").value = currentStatus || "";
  document.getElementById("supervisor_comment").value = currentComment || "";
  reviewMessage.textContent = "";

  reviewModal.classList.remove("hidden");
  reviewModal.classList.add("flex");
}


// Close review modal
function closeReviewModal() {
  reviewModal.classList.add("hidden");
  reviewModal.classList.remove("flex");
}


// Submit review
reviewForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const reportId = document.getElementById("review_report_id").value;
  const status = document.getElementById("status").value;
  const supervisorComment = document.getElementById("supervisor_comment").value;

  if (!status) {
    alert("Please select status.");
    return;
  }

  reviewMessage.textContent = "Submitting review...";
  reviewMessage.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest(`/api/reports/${reportId}/review/`, "PATCH", {
    status: status,
    supervisor_comment: supervisorComment,
  });

  console.log("Review Submit:", data);

  if (data.success || data.id) {
    reviewMessage.textContent = "Report reviewed successfully.";
    reviewMessage.className = "mt-4 text-sm text-green-600";

    loadSupervisorReports();

    setTimeout(function() {
      closeReviewModal();
    }, 700);
  } else {
    reviewMessage.textContent = data.message || "Review submit failed.";
    reviewMessage.className = "mt-4 text-sm text-red-600";
  }
});


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


// Student name safely
function getStudentName(report) {
  if (report.student_name) {
    return report.student_name;
  }

  if (report.student && report.student.first_name) {
    return `${report.student.first_name} ${report.student.last_name}`;
  }

  if (report.created_by_name) {
    return report.created_by_name;
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


// Prevent template string breaking
function safeText(text) {
  return String(text)
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}


// Close modal when clicking outside
reviewModal.addEventListener("click", function(event) {
  if (event.target === reviewModal) {
    closeReviewModal();
  }
});


// Initial load
loadSupervisorReports();