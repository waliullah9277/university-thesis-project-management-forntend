checkAuth();

if (getUserRole() !== "SUPER_ADMIN") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const companyForm = document.getElementById("companyForm");
const companyMessage = document.getElementById("companyMessage");
const trainingTableBody = document.getElementById("trainingTableBody");

let supervisors = [];

companyForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const data = await apiRequest("/api/training/companies/", "POST", {
    name: document.getElementById("company_name").value,
    address: document.getElementById("address").value,
    contact_email: document.getElementById("contact_email").value,
    contact_phone: document.getElementById("contact_phone").value,
  });

  if (data.success || data.id || data.data?.id) {
    companyMessage.textContent = "Company created successfully.";
    companyMessage.className = "mt-4 text-sm text-green-600";
    companyForm.reset();
  } else {
    companyMessage.textContent = data.message || data.detail || "Company create failed.";
    companyMessage.className = "mt-4 text-sm text-red-600";
  }
});

async function loadSupervisors() {
  const data = await apiRequest("/api/auth/users/");
  let users = Array.isArray(data) ? data : data.data || data.users || [];
  supervisors = users.filter(user => user.role === "SUPERVISOR" && user.is_active !== false);
}

async function loadAdminTraining() {
  await loadSupervisors();

  const data = await apiRequest("/api/training/admin/");

  let trainings = Array.isArray(data) ? data : data.data || data.trainings || [];

  if (trainings.length === 0) {
    trainingTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="p-4 text-center text-gray-500">No training request found.</td>
      </tr>
    `;
    return;
  }

  trainingTableBody.innerHTML = "";

  trainings.forEach(training => {
    trainingTableBody.innerHTML += `
      <tr>
        <td class="p-3 border">${training.id}</td>
        <td class="p-3 border">${getStudentName(training)}</td>
        <td class="p-3 border">${getCompanyName(training)}</td>
        <td class="p-3 border">${training.designation || "-"}</td>
        <td class="p-3 border">${getSupervisorName(training)}</td>
        <td class="p-3 border">${statusBadge(training.status)}</td>

        <td class="p-3 border">
          <div class="flex gap-2">
            <select id="supervisor-${training.id}" class="border px-2 py-1 rounded">
              <option value="">Select</option>
              ${supervisorOptions(training.supervisor)}
            </select>

            <button onclick="assignSupervisor(${training.id})" class="bg-blue-600 text-white px-3 py-1 rounded">
              Assign
            </button>
          </div>
        </td>

        <td class="p-3 border">
          <div class="flex gap-2">
            <select id="status-${training.id}" class="border px-2 py-1 rounded">
              <option value="">Select</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button onclick="updateTrainingStatus(${training.id})" class="bg-green-600 text-white px-3 py-1 rounded">
              Update
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

async function assignSupervisor(trainingId) {
  const supervisorId = document.getElementById(`supervisor-${trainingId}`).value;

  if (!supervisorId) {
    alert("Please select supervisor.");
    return;
  }

  const data = await apiRequest(`/api/training/${trainingId}/assign-supervisor/`, "PATCH", {
    supervisor_id: Number(supervisorId),
  });

  if (data.success || data.id || data.data?.id) {
    alert("Supervisor assigned successfully.");
    loadAdminTraining();
  } else {
    alert(data.message || data.detail || "Assign failed.");
  }
}

async function updateTrainingStatus(trainingId) {
  const status = document.getElementById(`status-${trainingId}`).value;

  if (!status) {
    alert("Please select status.");
    return;
  }

  const data = await apiRequest(`/api/training/${trainingId}/status/`, "PATCH", {
    status: status,
  });

  if (data.success || data.id || data.data?.id) {
    alert("Training status updated.");
    loadAdminTraining();
  } else {
    alert(data.message || data.detail || "Status update failed.");
  }
}

function supervisorOptions(currentSupervisorId) {
  let options = "";

  supervisors.forEach(supervisor => {
    const selected = currentSupervisorId === supervisor.id ? "selected" : "";
    options += `
      <option value="${supervisor.id}" ${selected}>
        ${supervisor.first_name} ${supervisor.last_name}
      </option>
    `;
  });

  return options;
}

function getStudentName(training) {
  if (training.student_name) return training.student_name;
  if (training.student && training.student.first_name) return `${training.student.first_name} ${training.student.last_name}`;
  if (training.student) return `Student ID: ${training.student}`;
  return "-";
}

function getCompanyName(training) {
  if (training.company_name) return training.company_name;
  if (training.company && training.company.name) return training.company.name;
  if (training.company) return `Company ID: ${training.company}`;
  return "-";
}

function getSupervisorName(training) {
  if (training.supervisor_name) return training.supervisor_name;
  if (training.supervisor && training.supervisor.first_name) return `${training.supervisor.first_name} ${training.supervisor.last_name}`;
  if (training.supervisor) return `Supervisor ID: ${training.supervisor}`;
  return "Not Assigned";
}

function statusBadge(status) {
  if (status === "APPROVED") return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Approved</span>`;
  if (status === "REJECTED") return `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">Rejected</span>`;
  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">Pending</span>`;
}

loadAdminTraining();