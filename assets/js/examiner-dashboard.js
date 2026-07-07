checkAuth();

if (getUserRole() !== "EXAMINER") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

async function loadExaminerDashboard() {
  const data = await apiRequest("/api/dashboard/examiner/");

  console.log("Examiner Dashboard:", data);

  if (data.success === false) {
    alert(data.message || "Failed to load dashboard.");
    return;
  }

  const dashboard = data.data || data;

  document.getElementById("assignedViva").textContent =
    dashboard.assigned_viva || dashboard.total_assigned_viva || 0;

  document.getElementById("completedViva").textContent =
    dashboard.completed_viva || dashboard.total_completed_viva || 0;

  document.getElementById("pendingViva").textContent =
    dashboard.pending_viva || dashboard.total_pending_viva || 0;
}

loadExaminerDashboard();