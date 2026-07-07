checkAuth();

const allowedRoles = ["STUDENT", "SUPERVISOR", "EXAMINER"];

if (!allowedRoles.includes(getUserRole())) {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const noticeList = document.getElementById("noticeList");

async function loadNotices() {
  noticeList.innerHTML = `<p class="text-gray-500">Loading notices...</p>`;

  const data = await apiRequest("/api/notifications/notices/");

  console.log("User Notices:", data);

  if (data.success === false) {
    noticeList.innerHTML = `<p class="text-red-500">Failed to load notices.</p>`;
    return;
  }

  let notices = Array.isArray(data) ? data : data.data || data.notices || data.results || [];

  if (notices.length === 0) {
    noticeList.innerHTML = `<p class="text-gray-500">No notice found.</p>`;
    return;
  }

  noticeList.innerHTML = "";

  notices.forEach(function(notice) {
    noticeList.innerHTML += `
      <div class="border rounded-lg p-5 bg-gray-50">
        <div class="flex justify-between items-start gap-3">
          <h3 class="text-lg font-bold">${notice.title || "-"}</h3>
          <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">Notice</span>
        </div>

        <p class="text-gray-700 mt-3">${notice.description || notice.message || "-"}</p>

        <div class="mt-4 text-xs text-gray-500">
          <p><strong>Published By:</strong> ${notice.created_by_name || notice.author_name || "Admin"}</p>
          <p>${notice.created_at ? formatDate(notice.created_at) : ""}</p>
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

loadNotices();