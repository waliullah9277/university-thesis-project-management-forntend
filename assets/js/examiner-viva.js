checkAuth();

if (getUserRole() !== "EXAMINER") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const vivaList = document.getElementById("vivaList");


// Load assigned viva
async function loadAssignedViva() {
  vivaList.innerHTML = `<p class="text-gray-500">Loading viva schedules...</p>`;

  const data = await apiRequest("/api/viva/examiner/assigned/");

  console.log("Assigned Viva:", data);

  if (data.success === false) {
    vivaList.innerHTML = `
      <p class="text-red-500">Failed to load assigned viva.</p>
    `;
    return;
  }

  let vivas = [];

  if (Array.isArray(data)) {
    vivas = data;
  } else {
    vivas = data.data || data.vivas || data.results || [];
  }

  if (vivas.length === 0) {
    vivaList.innerHTML = `
      <p class="text-gray-500">No assigned viva found.</p>
    `;
    return;
  }

  vivaList.innerHTML = "";

  vivas.forEach(function(viva) {
    vivaList.innerHTML += `
      <div class="bg-gray-50 border rounded-lg p-5">
        <div class="flex justify-between items-start gap-3">
          <div>
            <h3 class="text-lg font-bold">${getProjectName(viva)}</h3>
            <p class="text-sm text-gray-500">Viva ID: ${viva.id}</p>
          </div>

          ${getVivaStatusBadge(viva.status)}
        </div>

        <div class="text-sm text-gray-600 mt-4 space-y-1">
          <p><strong>Date:</strong> ${viva.date || "-"}</p>
          <p><strong>Time:</strong> ${viva.time || "-"}</p>
          <p><strong>Room:</strong> ${viva.room || "-"}</p>
          <p><strong>Project Type:</strong> ${getProjectType(viva)}</p>
          <p><strong>Team:</strong> ${getTeamName(viva)}</p>
        </div>

        <div class="mt-4 flex gap-2">
          <select
            id="status-${viva.id}"
            class="border px-3 py-2 rounded-lg"
          >
            <option value="">Select Status</option>
            <option value="SCHEDULED" ${viva.status === "SCHEDULED" ? "selected" : ""}>Scheduled</option>
            <option value="COMPLETED" ${viva.status === "COMPLETED" ? "selected" : ""}>Completed</option>
            <option value="CANCELLED" ${viva.status === "CANCELLED" ? "selected" : ""}>Cancelled</option>
          </select>

          <button
            onclick="updateVivaStatus(${viva.id})"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Update
          </button>
        </div>
      </div>
    `;
  });
}


// Update viva status
async function updateVivaStatus(vivaId) {
  const status = document.getElementById(`status-${vivaId}`).value;

  if (!status) {
    alert("Please select viva status.");
    return;
  }

  try {
    const data = await apiRequest(`/api/viva/${vivaId}/status/`, "PATCH", {
      status: status,
    });

    console.log("Update Viva Status Response:", data);

    if (
      data.success === true ||
      data.id ||
      data.status === status ||
      data.data?.status === status ||
      data.message?.toLowerCase().includes("success") ||
      data.message?.toLowerCase().includes("updated")
    ) {
      alert(data.message || "Viva status updated successfully.");
      loadAssignedViva();
      return;
    }

    alert(data.message || data.detail || "Failed to update viva status.");
  } catch (error) {
    console.error("Update Viva Status Error:", error);
    alert("Something went wrong while updating viva status.");
  }
}


// Project name safely
function getProjectName(viva) {
  // Case 1: direct project title
  if (viva.project_title) {
    return viva.project_title;
  }

  // Case 2: nested project object
  if (viva.project && viva.project.title) {
    return viva.project.title;
  }

  // Case 3: project object has name
  if (viva.project && viva.project.name) {
    return viva.project.name;
  }

  // Case 4: project is only ID
  if (viva.project) {
    return `Project ID: ${viva.project}`;
  }

  return "-";
}


// Project type safely
function getProjectType(viva) {
  if (viva.project_type) {
    return viva.project_type;
  }

  if (viva.project && viva.project.project_type) {
    return viva.project.project_type;
  }

  if (viva.project && viva.project.type) {
    return viva.project.type;
  }

  return "-";
}


// Team name safely
function getTeamName(viva) {
  // Case 1: direct team name
  if (viva.team_name) {
    return viva.team_name;
  }

  // Case 2: project_team_name
  if (viva.project_team_name) {
    return viva.project_team_name;
  }

  // Case 3: nested project -> team -> name
  if (viva.project && viva.project.team && viva.project.team.name) {
    return viva.project.team.name;
  }

  // Case 4: nested project -> team_name
  if (viva.project && viva.project.team_name) {
    return viva.project.team_name;
  }

  // Case 5: team object directly inside viva
  if (viva.team && viva.team.name) {
    return viva.team.name;
  }

  // Case 6: team id inside project
  if (viva.project && viva.project.team) {
    return `Team ID: ${viva.project.team}`;
  }

  // Case 7: direct team id
  if (viva.team) {
    return `Team ID: ${viva.team}`;
  }

  return "-";
}


// Viva status badge
function getVivaStatusBadge(status) {
  if (status === "COMPLETED") {
    return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Completed</span>`;
  }

  if (status === "CANCELLED") {
    return `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">Cancelled</span>`;
  }

  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Scheduled</span>`;
}


// Initial load
loadAssignedViva();