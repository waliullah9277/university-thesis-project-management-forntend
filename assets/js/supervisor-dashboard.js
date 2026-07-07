checkAuth();

if (getUserRole() !== "SUPERVISOR") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

async function loadSupervisorDashboard() {
  const data = await apiRequest("/api/dashboard/supervisor/");

  console.log("Supervisor Dashboard:", data);

  if (data.success === false) {
    alert(data.message || "Failed to load dashboard.");
    return;
  }

  const dashboard = data.data || data;

  document.getElementById("assignedProjects").textContent =
    dashboard.assigned_projects || dashboard.total_assigned_projects || 0;

  document.getElementById("pendingReports").textContent =
    dashboard.pending_reports || dashboard.total_pending_reports || 0;

  document.getElementById("reviewedReports").textContent =
    dashboard.reviewed_reports || dashboard.total_reviewed_reports || 0;
}

loadSupervisorDashboard();