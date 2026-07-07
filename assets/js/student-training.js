checkAuth();

if (getUserRole() !== "STUDENT") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const companySelect = document.getElementById("company");
const trainingForm = document.getElementById("trainingForm");
const trainingList = document.getElementById("trainingList");
const message = document.getElementById("message");

async function loadCompanies() {
  const data = await apiRequest("/api/training/companies/");

  let companies = Array.isArray(data)
    ? data
    : data.data || data.companies || [];

  companySelect.innerHTML = `<option value="">Select Company</option>`;

  companies.forEach((company) => {
    companySelect.innerHTML += `
      <option value="${company.id}">
        ${company.name || company.company_name}
      </option>
    `;
  });
}

trainingForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const data = await apiRequest("/api/training/student/", "POST", {
    title: document.getElementById("title").value,
    company: Number(document.getElementById("company").value),
    designation: document.getElementById("designation").value,
    start_date: document.getElementById("start_date").value,
    end_date: document.getElementById("end_date").value,
    description: document.getElementById("description").value,
  });

  if (data.success || data.id || data.data?.id) {
    message.textContent = "Training submitted successfully.";
    message.className = "mt-4 text-sm text-green-600";
    trainingForm.reset();
    loadTraining();
  } else {
    console.log("Training Submit Error:", data);

    let errorMessage = "Training submit failed.";

    if (data.message) {
      errorMessage = data.message;
    } else if (data.detail) {
      errorMessage = data.detail;
    } else {
      errorMessage = JSON.stringify(data);
    }

    message.textContent = errorMessage;
    message.className = "mt-4 text-sm text-red-600";
  }
});

async function loadTraining() {
  const data = await apiRequest("/api/training/student/");

  let trainings = Array.isArray(data)
    ? data
    : data.data || data.trainings || [];

  if (trainings.length === 0) {
    trainingList.innerHTML = `<p class="text-gray-500">No training submitted yet.</p>`;
    return;
  }

  trainingList.innerHTML = "";

  trainings.forEach((training) => {
    trainingList.innerHTML += `
      <div class="border rounded-lg p-5 bg-gray-50">
        <div class="flex justify-between">
          <h3 class="text-lg font-bold">${getCompanyName(training)}</h3>
          ${statusBadge(training.status)}
        </div>

        <p class="text-gray-600 mt-2"><strong>Designation:</strong> ${training.designation || "-"}</p>
        <p class="text-gray-600"><strong>Duration:</strong> ${training.start_date || "-"} to ${training.end_date || "-"}</p>
        <p class="text-gray-700 mt-3">${training.description || "-"}</p>

        <p class="text-sm text-gray-600 mt-3">
          <strong>Supervisor:</strong> ${getSupervisorName(training)}
        </p>

        <p class="text-sm text-gray-600 mt-1">
          <strong>Feedback:</strong> ${training.feedback || "Not given yet"}
        </p>

        <button
  onclick="openFeedbackModal(${training.id})"
  class="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
>
  Feedback
</button>
      </div>
    `;
  });
}

function getCompanyName(training) {
  if (training.company_name) return training.company_name;
  if (training.company && training.company.name) return training.company.name;
  if (training.company) return `Company ID: ${training.company}`;
  return "-";
}

function getSupervisorName(training) {
  if (training.supervisor_name) return training.supervisor_name;
  if (training.supervisor && training.supervisor.first_name) {
    return `${training.supervisor.first_name} ${training.supervisor.last_name}`;
  }
  return "Not Assigned";
}

function statusBadge(status) {
  if (status === "APPROVED")
    return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Approved</span>`;
  if (status === "REJECTED")
    return `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">Rejected</span>`;
  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">Pending</span>`;
}

loadCompanies();
loadTraining();

const feedbackModal = document.getElementById("feedbackModal");
const feedbackList = document.getElementById("feedbackList");

function openFeedbackModal(trainingId) {
  feedbackModal.classList.remove("hidden");
  feedbackModal.classList.add("flex");

  loadTrainingFeedbacks(trainingId);
}

function closeFeedbackModal() {
  feedbackModal.classList.add("hidden");
  feedbackModal.classList.remove("flex");
}

async function loadTrainingFeedbacks(trainingId) {
  feedbackList.innerHTML = `<p class="text-gray-500">Loading feedbacks...</p>`;

  const data = await apiRequest(`/api/training/${trainingId}/feedback/`);

  console.log("Training Feedbacks:", data);

  if (data.success === false) {
    feedbackList.innerHTML = `
      <p class="text-red-500">
        ${data.message || "Failed to load feedbacks."}
      </p>
    `;
    return;
  }

  let feedbacks = Array.isArray(data) ? data : data.data || data.feedbacks || [];

  if (feedbacks.length === 0) {
    feedbackList.innerHTML = `<p class="text-gray-500">No feedback found.</p>`;
    return;
  }

  feedbackList.innerHTML = "";

  feedbacks.forEach(function(feedback) {
    feedbackList.innerHTML += `
      <div class="border rounded-lg p-4 bg-gray-50">
        <p class="text-gray-700">${feedback.comment || "-"}</p>

        <div class="mt-3 text-xs text-gray-500">
          <p><strong>Supervisor:</strong> ${feedback.supervisor_name || "Supervisor"}</p>
          <p>${feedback.created_at ? formatDate(feedback.created_at) : ""}</p>
        </div>
      </div>
    `;
  });
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

feedbackModal.addEventListener("click", function(event) {
  if (event.target === feedbackModal) {
    closeFeedbackModal();
  }
});