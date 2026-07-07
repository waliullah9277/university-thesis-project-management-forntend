checkAuth();

if (getUserRole() !== "SUPER_ADMIN") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const companyForm = document.getElementById("companyForm");
const companyMessage = document.getElementById("companyMessage");
const trainingTableBody = document.getElementById("trainingTableBody");
const trainingSearchInput = document.getElementById("trainingSearchInput");

const companyList = document.getElementById("companyList");

let supervisors = [];
let allTrainings = [];

companyForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const data = await apiRequest("/api/training/companies/", "POST", {
    name: document.getElementById("company_name").value,
    address: document.getElementById("address").value,
    contact_email: document.getElementById("contact_email").value,
    contact_phone: document.getElementById("contact_phone").value,
  });

  console.log("Create Company:", data);

  if (data.success || data.id || data.data?.id) {
    companyMessage.textContent = "Company created successfully.";
    companyMessage.className = "mt-4 text-sm text-green-600";

    companyForm.reset();
    loadCompanies();
  } else {
    companyMessage.textContent = data.message || data.detail || JSON.stringify(data);
    companyMessage.className = "mt-4 text-sm text-red-600";
  }
});

async function loadCompanies() {
  if (!companyList) return;

  companyList.innerHTML = `<p class="text-gray-500">Loading companies...</p>`;

  const data = await apiRequest("/api/training/companies/");

  console.log("Companies:", data);

  let companies = Array.isArray(data)
    ? data
    : data.data || data.companies || data.results || [];

  if (companies.length === 0) {
    companyList.innerHTML = `<p class="text-gray-500">No company found.</p>`;
    return;
  }

  companyList.innerHTML = "";

  companies.forEach(company => {
    companyList.innerHTML += `
      <div class="border rounded-lg p-4 bg-gray-50">
        <h3 class="text-lg font-bold">${company.name || company.company_name || "-"}</h3>
        <p class="text-sm text-gray-600 mt-1">${company.address || "-"}</p>
        <p class="text-sm text-gray-600">${company.contact_email || "-"}</p>
        <p class="text-sm text-gray-600">${company.contact_phone || "-"}</p>
      </div>
    `;
  });
}

async function loadSupervisors() {
  const data = await apiRequest("/api/auth/users/");

  let users = Array.isArray(data)
    ? data
    : data.data || data.users || data.results || [];

  supervisors = users.filter(function(user) {
    return user.role === "SUPERVISOR" && user.is_active !== false;
  });
}

async function loadAdminTraining() {
  trainingTableBody.innerHTML = `
    <tr>
      <td colspan="8" class="p-4 text-center text-gray-500">
        Loading training requests...
      </td>
    </tr>
  `;

  await loadSupervisors();

  const data = await apiRequest("/api/training/admin/");

  console.log("Admin Training:", data);

  if (data.success === false) {
    trainingTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="p-4 text-center text-red-500">
          Failed to load training requests.
        </td>
      </tr>
    `;
    return;
  }

  let trainings = Array.isArray(data)
    ? data
    : data.data || data.trainings || data.results || [];

  allTrainings = trainings;
  allTrainings = trainings.sort((a, b) => a.id - b.id);
  renderTrainings(allTrainings);
}

function renderTrainings(trainings) {
  if (trainings.length === 0) {
    trainingTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="p-4 text-center text-gray-500">
          No training request found.
        </td>
      </tr>
    `;
    return;
  }

  trainingTableBody.innerHTML = "";

  trainings.forEach(training => {
    trainingTableBody.innerHTML += `
      <tr class="hover:bg-gray-50">
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
              <option value="PENDING" ${training.status === "PENDING" ? "selected" : ""}>Pending</option>
              <option value="ONGOING" ${training.status === "ONGOING" ? "selected" : ""}>Ongoing</option>
              <option value="APPROVED" ${training.status === "APPROVED" ? "selected" : ""}>Approved</option>
              <option value="REJECTED" ${training.status === "REJECTED" ? "selected" : ""}>Rejected</option>
              <option value="COMPLETED" ${training.status === "COMPLETED" ? "selected" : ""}>Completed</option>
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

if (trainingSearchInput) {
  trainingSearchInput.addEventListener("input", function() {
    const keyword = trainingSearchInput.value.toLowerCase();

    const filteredTrainings = allTrainings.filter(function(training) {
      const text = `
        ${training.title || ""}
        ${getStudentName(training)}
        ${getCompanyName(training)}
        ${training.designation || ""}
        ${getSupervisorName(training)}
        ${training.status || ""}
        ${training.description || ""}
      `.toLowerCase();

      return text.includes(keyword);
    });

    renderTrainings(filteredTrainings);
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

  console.log("Assign Training Supervisor:", data);

  if (data.success || data.id || data.data?.id || data.message) {
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

  console.log("Update Training Status:", data);

  if (data.success || data.id || data.data?.id || data.message) {
    alert("Training status updated.");
    loadAdminTraining();
  } else {
    alert(data.message || data.detail || "Status update failed.");
  }
}

function supervisorOptions(currentSupervisorId) {
  let options = "";

  supervisors.forEach(supervisor => {
    const selected = Number(currentSupervisorId) === Number(supervisor.id) ? "selected" : "";

    const fullName = `${supervisor.first_name || ""} ${supervisor.last_name || ""}`.trim();

    options += `
      <option value="${supervisor.id}" ${selected}>
        ${fullName || supervisor.email || supervisor.id}
      </option>
    `;
  });

  return options;
}

function getStudentName(training) {
  if (training.student_name) return training.student_name;

  if (training.student && training.student.first_name) {
    return `${training.student.first_name} ${training.student.last_name}`;
  }

  if (training.student_id) return training.student_id;

  if (training.student) return `Student ID: ${training.student}`;

  return "-";
}

function getCompanyName(training) {
  if (training.company_name) return training.company_name;

  if (training.company && training.company.name) {
    return training.company.name;
  }

  if (training.company && training.company.company_name) {
    return training.company.company_name;
  }

  if (training.company) return `Company ID: ${training.company}`;

  return "-";
}

function getSupervisorName(training) {
  if (training.supervisor_name) return training.supervisor_name;

  if (training.supervisor && training.supervisor.first_name) {
    return `${training.supervisor.first_name} ${training.supervisor.last_name}`;
  }

  if (training.supervisor) return `Supervisor ID: ${training.supervisor}`;

  return "Not Assigned";
}

function statusBadge(status) {
  if (status === "APPROVED") {
    return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Approved</span>`;
  }

  if (status === "REJECTED") {
    return `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">Rejected</span>`;
  }

  if (status === "ONGOING") {
    return `<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">Ongoing</span>`;
  }

  if (status === "COMPLETED") {
    return `<span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">Completed</span>`;
  }

  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">Pending</span>`;
}

loadCompanies();
loadAdminTraining();