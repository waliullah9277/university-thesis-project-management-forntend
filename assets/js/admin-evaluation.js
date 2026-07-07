checkAuth();

if (getUserRole() !== "SUPER_ADMIN") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const evaluationTableBody = document.getElementById("evaluationTableBody");


async function loadAdminEvaluations() {
  evaluationTableBody.innerHTML = `
    <tr>
      <td colspan="9" class="p-4 text-center text-gray-500">
        Loading evaluations...
      </td>
    </tr>
  `;

  const data = await apiRequest("/api/evaluation/admin/");

  console.log("Admin Evaluations:", data);

  if (data.success === false) {
    evaluationTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="p-4 text-center text-red-500">
          Failed to load evaluations.
        </td>
      </tr>
    `;
    return;
  }

  let evaluations = [];

  if (Array.isArray(data)) {
    evaluations = data;
  } else {
    evaluations = data.data || data.evaluations || data.results || [];
  }

  if (evaluations.length === 0) {
    evaluationTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="p-4 text-center text-gray-500">
          No evaluation found.
        </td>
      </tr>
    `;
    return;
  }

  evaluationTableBody.innerHTML = "";

  evaluations.forEach(function(evaluation) {
    const total = getTotalMarks(evaluation);

    evaluationTableBody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="p-3 border">${evaluation.id}</td>
        <td class="p-3 border">${getProjectName(evaluation)}</td>
        <td class="p-3 border">${getExaminerName(evaluation)}</td>
        <td class="p-3 border">${evaluation.proposal_marks}</td>
        <td class="p-3 border">${evaluation.progress_marks}</td>
        <td class="p-3 border">${evaluation.viva_marks}</td>
        <td class="p-3 border font-bold">${total}/100</td>
        <td class="p-3 border">${getPublishBadge(evaluation.published)}</td>

        <td class="p-3 border">
          ${
            evaluation.published
              ? `<span class="text-green-600 font-semibold">Published</span>`
              : `
                <button
                  onclick="publishEvaluation(${evaluation.id})"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                >
                  Publish
                </button>
              `
          }
        </td>
      </tr>
    `;
  });
}


async function publishEvaluation(evaluationId) {
  const confirmPublish = confirm("Are you sure you want to publish this result?");

  if (!confirmPublish) {
    return;
  }

  const data = await apiRequest(`/api/evaluation/${evaluationId}/publish/`, "PATCH", {
    published: true,
  });

  console.log("Publish Evaluation:", data);

  if (data.success || data.id || data.data?.published === true || data.published === true) {
    alert("Result published successfully.");
    loadAdminEvaluations();
  } else {
    alert(data.message || data.detail || "Failed to publish result.");
  }
}


function getProjectName(evaluation) {
  if (evaluation.project_title) return evaluation.project_title;
  if (evaluation.project && evaluation.project.title) return evaluation.project.title;
  if (evaluation.project) return `Project ID: ${evaluation.project}`;
  return "-";
}

function getExaminerName(evaluation) {
  if (evaluation.examiner_name) return evaluation.examiner_name;
  if (evaluation.examiner && evaluation.examiner.first_name) {
    return `${evaluation.examiner.first_name} ${evaluation.examiner.last_name}`;
  }
  if (evaluation.examiner) return `Examiner ID: ${evaluation.examiner}`;
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


loadAdminEvaluations();