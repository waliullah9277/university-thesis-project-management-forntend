checkAuth();

if (getUserRole() !== "STUDENT") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const resultBox = document.getElementById("resultBox");

async function loadStudentResult() {
  resultBox.innerHTML = `<p class="text-gray-500">Loading result...</p>`;

  const data = await apiRequest("/api/evaluation/student/result/");

  console.log("Student Result:", data);

  if (data.success === false) {
    resultBox.innerHTML = `
      <div class="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
        ${data.message || data.detail || "Result is not published yet."}
      </div>
    `;
    return;
  }

  let result = getResultObject(data);

  if (!result) {
    resultBox.innerHTML = `
      <div class="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
        Result is not published yet.
      </div>
    `;
    return;
  }

  const proposal = Number(result.proposal_marks ?? result.proposal ?? 0);
  const progress = Number(result.progress_marks ?? result.progress ?? 0);
  const viva = Number(result.viva_marks ?? result.viva ?? 0);
  const total = proposal + progress + viva;

  resultBox.innerHTML = `
    <div class="border rounded-xl p-6 bg-gray-50">
      <div class="flex justify-between items-start gap-4 mb-6">
        <div>
          <h3 class="text-xl font-bold">${getProjectName(result)}</h3>
          <p class="text-gray-500 mt-1">Final Evaluation Result</p>
        </div>

        ${getPublishBadge(result.published)}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg border text-center">
          <p class="text-gray-500">Proposal</p>
          <p class="text-3xl font-bold">${proposal}</p>
        </div>

        <div class="bg-white p-4 rounded-lg border text-center">
          <p class="text-gray-500">Progress</p>
          <p class="text-3xl font-bold">${progress}</p>
        </div>

        <div class="bg-white p-4 rounded-lg border text-center">
          <p class="text-gray-500">Viva</p>
          <p class="text-3xl font-bold">${viva}</p>
        </div>
      </div>

      <div class="bg-white border rounded-lg p-5 mb-5 flex justify-between items-center">
        <p class="text-lg font-semibold">Total Marks</p>
        <p class="text-4xl font-bold">${total}/100</p>
      </div>

      <div class="bg-white border rounded-lg p-5 mb-5 flex justify-between items-center">
        <p class="text-lg font-semibold">Result</p>
        <p class="text-xl font-bold">${getResultText(total)}</p>
      </div>

      <div class="bg-white border rounded-lg p-5">
        <p class="font-semibold mb-2">Remarks</p>
        <p class="text-gray-700">${result.remarks || "-"}</p>
      </div>
    </div>
  `;
}

function getResultObject(data) {
  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] : null;
  }

  if (Array.isArray(data.data)) {
    return data.data.length > 0 ? data.data[0] : null;
  }

  if (Array.isArray(data.results)) {
    return data.results.length > 0 ? data.results[0] : null;
  }

  if (data.data && typeof data.data === "object") {
    return data.data;
  }

  if (data.result && typeof data.result === "object") {
    return data.result;
  }

  if (data.evaluation && typeof data.evaluation === "object") {
    return data.evaluation;
  }

  if (data.proposal_marks || data.progress_marks || data.viva_marks) {
    return data;
  }

  return null;
}

function getProjectName(result) {
  if (result.project_title) return result.project_title;
  if (result.project_name) return result.project_name;
  if (result.project && result.project.title) return result.project.title;
  if (result.project && result.project.name) return result.project.name;
  if (result.project) return `Project ID: ${result.project}`;
  return "-";
}

function getPublishBadge(published) {
  if (published === true) {
    return `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Published</span>`;
  }

  return `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Pending</span>`;
}

function getResultText(total) {
  if (total >= 80) return "Excellent";
  if (total >= 70) return "Very Good";
  if (total >= 60) return "Good";
  if (total >= 50) return "Pass";
  return "Fail";
}

loadStudentResult();