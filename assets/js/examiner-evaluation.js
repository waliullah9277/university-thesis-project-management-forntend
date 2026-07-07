checkAuth();

if (getUserRole() !== "EXAMINER") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const evaluationForm = document.getElementById("evaluationForm");
const projectSelect = document.getElementById("project");
const message = document.getElementById("message");
const evaluationList = document.getElementById("evaluationList");

const proposalInput = document.getElementById("proposal_marks");
const progressInput = document.getElementById("progress_marks");
const vivaInput = document.getElementById("viva_marks");
const totalInput = document.getElementById("total_marks");

function calculateTotal() {
  const proposal = Number(proposalInput.value) || 0;
  const progress = Number(progressInput.value) || 0;
  const viva = Number(vivaInput.value) || 0;

  totalInput.value = proposal + progress + viva;
}

proposalInput.addEventListener("input", calculateTotal);
progressInput.addEventListener("input", calculateTotal);
vivaInput.addEventListener("input", calculateTotal);


// Load examiner assigned viva projects
async function loadProjectsForEvaluation() {
  const data = await apiRequest("/api/viva/examiner/assigned/");

  console.log("Assigned Viva For Evaluation:", data);

  let vivas = [];

  if (Array.isArray(data)) {
    vivas = data;
  } else {
    vivas = data.data || data.vivas || data.results || [];
  }

  projectSelect.innerHTML = `<option value="">Select Project</option>`;

  if (vivas.length === 0) {
    projectSelect.innerHTML = `<option value="">No assigned viva found</option>`;
    return;
  }

  vivas.forEach(function(viva) {
    const projectId = getProjectId(viva);
    const projectName = getProjectName(viva);

    if (projectId) {
      projectSelect.innerHTML += `
        <option value="${projectId}">
          ${projectName}
        </option>
      `;
    }
  });
}


// Submit evaluation
evaluationForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const project = document.getElementById("project").value;
  const proposalMarks = Number(proposalInput.value);
  const progressMarks = Number(progressInput.value);
  const vivaMarks = Number(vivaInput.value);
  const remarks = document.getElementById("remarks").value;

  if (!project) {
    alert("Please select a project.");
    return;
  }

  if (proposalMarks < 0 || proposalMarks > 30) {
    alert("Proposal marks cannot exceed 30.");
    return;
  }

  if (progressMarks < 0 || progressMarks > 30) {
    alert("Progress marks cannot exceed 30.");
    return;
  }

  if (vivaMarks < 0 || vivaMarks > 40) {
    alert("Viva marks cannot exceed 40.");
    return;
  }

  message.textContent = "Submitting evaluation...";
  message.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest("/api/evaluation/", "POST", {
    project: Number(project),
    proposal_marks: proposalMarks,
    progress_marks: progressMarks,
    viva_marks: vivaMarks,
    remarks: remarks,
  });

  console.log("Submit Evaluation:", data);

  if (data.success || data.id || data.data?.id) {
    message.textContent = "Evaluation submitted successfully.";
    message.className = "mt-4 text-sm text-green-600";

    evaluationForm.reset();
    totalInput.value = "";
    loadEvaluations();
  } else {
    message.textContent = data.message || data.detail || "Evaluation submit failed.";
    message.className = "mt-4 text-sm text-red-600";
  }
});


// Load examiner evaluations
async function loadEvaluations() {
  const data = await apiRequest("/api/evaluation/examiner/");

  console.log("Examiner Evaluations:", data);

  if (data.success === false) {
    evaluationList.innerHTML = `<p class="text-red-500">Failed to load evaluations.</p>`;
    return;
  }

  let evaluations = [];

  if (Array.isArray(data)) {
    evaluations = data;
  } else {
    evaluations = data.data || data.evaluations || data.results || [];
  }

  if (evaluations.length === 0) {
    evaluationList.innerHTML = `<p class="text-gray-500">No evaluation submitted yet.</p>`;
    return;
  }

  evaluationList.innerHTML = "";

  evaluations.forEach(function(evaluation) {
    const total = getTotalMarks(evaluation);

    evaluationList.innerHTML += `
      <div class="border rounded-lg p-5 bg-gray-50">
        <div class="flex justify-between items-start gap-3">
          <div>
            <h3 class="text-lg font-bold">${getEvaluationProjectName(evaluation)}</h3>
            <p class="text-sm text-gray-500">Total: ${total}/100</p>
          </div>

          ${getPublishBadge(evaluation.published)}
        </div>

        <div class="mt-4 grid grid-cols-3 gap-3 text-center">
          <div class="bg-white p-3 rounded border">
            <p class="text-sm text-gray-500">Proposal</p>
            <p class="text-xl font-bold">${evaluation.proposal_marks}</p>
          </div>

          <div class="bg-white p-3 rounded border">
            <p class="text-sm text-gray-500">Progress</p>
            <p class="text-xl font-bold">${evaluation.progress_marks}</p>
          </div>

          <div class="bg-white p-3 rounded border">
            <p class="text-sm text-gray-500">Viva</p>
            <p class="text-xl font-bold">${evaluation.viva_marks}</p>
          </div>
        </div>

        <p class="mt-4 text-gray-700">
          <strong>Remarks:</strong> ${evaluation.remarks || "-"}
        </p>
      </div>
    `;
  });
}


function getProjectId(viva) {
  if (viva.project && typeof viva.project === "object") {
    return viva.project.id;
  }

  if (viva.project) {
    return viva.project;
  }

  if (viva.project_id) {
    return viva.project_id;
  }

  return null;
}

function getProjectName(viva) {
  if (viva.project_title) return viva.project_title;
  if (viva.project && viva.project.title) return viva.project.title;
  if (viva.project && viva.project.name) return viva.project.name;
  if (viva.project) return `Project ID: ${viva.project}`;
  return "-";
}

function getEvaluationProjectName(evaluation) {
  if (evaluation.project_title) return evaluation.project_title;
  if (evaluation.project && evaluation.project.title) return evaluation.project.title;
  if (evaluation.project) return `Project ID: ${evaluation.project}`;
  return "-";
}

function getTotalMarks(evaluation) {
  return (
    Number(evaluation.proposal_marks || 0) +
    Number(evaluation.progress_marks || 0) +
    Number(evaluation.viva_marks || 0)
  );
}

function getPublishBadge(published) {
  if (published) {
    return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Published</span>`;
  }

  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Pending</span>`;
}


// Initial load
loadProjectsForEvaluation();
loadEvaluations();