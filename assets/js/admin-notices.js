checkAuth();

if (getUserRole() !== "SUPER_ADMIN") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const noticeForm = document.getElementById("noticeForm");
const message = document.getElementById("message");
const noticeList = document.getElementById("noticeList");

noticeForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const data = await apiRequest("/api/notifications/notices/", "POST", {
  title: document.getElementById("title").value,
  message: document.getElementById("description").value,
  description: document.getElementById("description").value,
  content: document.getElementById("description").value,

  });

  console.log("Create Notice:", data);

  if (data.success || data.id || data.data?.id) {
    message.textContent = "Notice published successfully.";
    message.className = "mt-4 text-sm text-green-600";

    noticeForm.reset();
    loadNotices();
  } else {
    message.textContent = data.message || data.detail || JSON.stringify(data);
    message.className = "mt-4 text-sm text-red-600";
  }
});

async function loadNotices() {
  noticeList.innerHTML = `<p class="text-gray-500">Loading notices...</p>`;

  const data = await apiRequest("/api/notifications/notices/");

  console.log("Notices:", data);

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
        <h3 class="text-lg font-bold">${notice.title || "-"}</h3>
        <p class="text-gray-700 mt-3">${notice.description || notice.message || "-"}</p>

        <div class="mt-4 text-xs text-gray-500">
          <p><strong>Created By:</strong> ${notice.created_by_name || notice.author_name || "Admin"}</p>
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