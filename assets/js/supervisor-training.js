checkAuth();

if (getUserRole() !== "SUPERVISOR") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const trainingList = document.getElementById("trainingList");
const feedbackModal = document.getElementById("feedbackModal");
const feedbackForm = document.getElementById("feedbackForm");
const message = document.getElementById("message");
const previousFeedbackList = document.getElementById("previousFeedbackList");

async function loadSupervisorTraining() {
  trainingList.innerHTML = `<p class="text-gray-500">Loading...</p>`;

  const data = await apiRequest("/api/training/supervisor/");

  console.log("Supervisor Training:", data);

  if (data.success === false) {
    trainingList.innerHTML = `
      <p class="text-red-500">Failed to load assigned training.</p>
    `;
    return;
  }

  let trainings = [];

  if (Array.isArray(data)) {
    trainings = data;
  } else {
    trainings = data.data || data.trainings || data.results || [];
  }

  if (trainings.length === 0) {
    trainingList.innerHTML = `
      <p class="text-gray-500">No assigned training found.</p>
    `;
    return;
  }

  trainingList.innerHTML = "";

  trainings.forEach(function(training) {
    trainingList.innerHTML += `
      <div class="border rounded-lg p-5 bg-gray-50">
        <div class="flex justify-between items-start gap-3">
          <div>
            <h3 class="text-lg font-bold">${getCompanyName(training)}</h3>
            <p class="text-sm text-gray-500">${training.designation || "-"}</p>
          </div>

          ${statusBadge(training.status)}
        </div>

        <div class="text-sm text-gray-600 mt-4 space-y-1">
          <p><strong>Student:</strong> ${getStudentName(training)}</p>
          <p><strong>Duration:</strong> ${training.start_date || "-"} to ${training.end_date || "-"}</p>
          <p><strong>Description:</strong> ${training.description || "-"}</p>
          <p><strong>Current Feedback:</strong> ${training.feedback || "Not given yet"}</p>
        </div>

        <button
          onclick="openFeedbackModal(${training.id}, \`${safeText(training.feedback || "")}\`)"
          class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Give Feedback
        </button>
      </div>
    `;
  });
}

function openFeedbackModal(trainingId, currentFeedback) {
  document.getElementById("training_id").value = trainingId;
  document.getElementById("feedback").value = "";
  message.textContent = "";

  feedbackModal.classList.remove("hidden");
  feedbackModal.classList.add("flex");

  loadPreviousFeedbacks(trainingId);
}

async function loadPreviousFeedbacks(trainingId) {
  previousFeedbackList.innerHTML = `<p class="text-gray-500">Loading feedbacks...</p>`;

  const data = await apiRequest(`/api/training/${trainingId}/feedback/`);

  console.log("Supervisor Previous Feedbacks:", data);

  if (data.success === false) {
    previousFeedbackList.innerHTML = `
      <p class="text-red-500">
        ${data.message || "Failed to load feedbacks."}
      </p>
    `;
    return;
  }

  let feedbacks = Array.isArray(data) ? data : data.data || data.feedbacks || [];

  if (feedbacks.length === 0) {
    previousFeedbackList.innerHTML = `<p class="text-gray-500">No feedback found.</p>`;
    return;
  }

  previousFeedbackList.innerHTML = "";

  feedbacks.forEach(function(feedback) {
    previousFeedbackList.innerHTML += `
      <div class="border rounded-lg p-3 bg-gray-50">
        <p class="text-gray-700">${feedback.comment || "-"}</p>

        <div class="mt-2 text-xs text-gray-500">
          <p><strong>Supervisor:</strong> ${feedback.supervisor_name || "Supervisor"}</p>
          <p>${feedback.created_at ? formatDate(feedback.created_at) : ""}</p>
        </div>
      </div>
    `;
  });
}

function closeFeedbackModal() {
  feedbackModal.classList.add("hidden");
  feedbackModal.classList.remove("flex");
}

feedbackForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const trainingId = document.getElementById("training_id").value;
  const feedback = document.getElementById("feedback").value;

  message.textContent = "Submitting feedback...";
  message.className = "mt-4 text-sm text-blue-600";

const data = await apiRequest(`/api/training/${trainingId}/feedback/`, "PATCH", {
  comment: feedback,
});

  console.log("Training Feedback:", data);

  if (data.success || data.id || data.data?.id || data.message) {
  message.textContent = "Feedback submitted successfully.";
  message.className = "mt-4 text-sm text-green-600";

  document.getElementById("feedback").value = "";

  loadSupervisorTraining();
  loadPreviousFeedbacks(trainingId);
} else {
  message.textContent = data.message || data.detail || "Feedback submit failed.";
  message.className = "mt-4 text-sm text-red-600";
}
});

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

function statusBadge(status) {
  if (status === "APPROVED") {
    return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Approved</span>`;
  }

  if (status === "REJECTED") {
    return `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">Rejected</span>`;
  }

  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">Pending</span>`;
}

function safeText(text) {
  return String(text)
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}

feedbackModal.addEventListener("click", function(event) {
  if (event.target === feedbackModal) {
    closeFeedbackModal();
  }
});

loadSupervisorTraining();

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