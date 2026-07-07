checkAuth();

const allowedRoles = ["STUDENT", "SUPERVISOR", "EXAMINER", "SUPER_ADMIN"];

if (!allowedRoles.includes(getUserRole())) {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const notificationList = document.getElementById("notificationList");

async function loadNotifications() {
  notificationList.innerHTML = `<p class="text-gray-500">Loading notifications...</p>`;

  const data = await apiRequest("/api/notifications/");

  console.log("Notifications:", data);

  if (data.success === false) {
    notificationList.innerHTML = `
      <p class="text-red-500">Failed to load notifications.</p>
    `;
    return;
  }

  let notifications = [];

  if (Array.isArray(data)) {
    notifications = data;
  } else {
    notifications = data.data || data.notifications || data.results || [];
  }

  if (notifications.length === 0) {
    notificationList.innerHTML = `
      <p class="text-gray-500">No notification found.</p>
    `;
    return;
  }

  notificationList.innerHTML = "";

  notifications.forEach(function(notification) {
    const isRead = notification.is_read || notification.read || false;

    notificationList.innerHTML += `
      <div class="border rounded-lg p-5 ${isRead ? "bg-gray-50" : "bg-blue-50 border-blue-200"}">
        <div class="flex justify-between items-start gap-4">
          <div>
            <h3 class="text-lg font-bold">
              ${notification.title || "Notification"}
            </h3>

            <p class="text-gray-700 mt-2">
              ${notification.message || notification.description || notification.content || "-"}
            </p>

            <p class="text-xs text-gray-500 mt-3">
              ${notification.created_at ? formatDate(notification.created_at) : ""}
            </p>
          </div>

          <div>
            ${
              isRead
                ? `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Read</span>`
                : `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">Unread</span>`
            }
          </div>
        </div>

        ${
          isRead
            ? ""
            : `
              <button
                onclick="markAsRead(${notification.id})"
                class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Mark as Read
              </button>
            `
        }
      </div>
    `;
  });
}

async function markAsRead(notificationId) {
  const data = await apiRequest(`/api/notifications/${notificationId}/read/`, "PATCH", {});

  console.log("Mark Read:", data);

  if (data.success || data.id || data.data?.id || data.message) {
    loadNotifications();
  } else {
    alert(data.message || data.detail || "Failed to mark notification as read.");
  }
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

loadNotifications();