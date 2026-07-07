function showToast(message, type = "success") {
  let toastBox = document.getElementById("toastBox");

  if (!toastBox) {
    toastBox = document.createElement("div");
    toastBox.id = "toastBox";
    toastBox.className = "fixed top-5 right-5 z-50 space-y-3";
    document.body.appendChild(toastBox);
  }

  const colorClass =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : type === "warning"
      ? "bg-yellow-600"
      : "bg-blue-600";

  const toast = document.createElement("div");
  toast.className = `${colorClass} text-white px-5 py-3 rounded-lg shadow-lg`;
  toast.textContent = message;

  toastBox.appendChild(toast);

  setTimeout(function () {
    toast.remove();
  }, 3000);
}

function showLoading(container, message = "Loading...") {
  container.innerHTML = `
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-500">${message}</span>
    </div>
  `;
}

function showEmpty(container, message = "No data found.") {
  container.innerHTML = `
    <div class="text-center py-8 bg-gray-50 border rounded-lg">
      <p class="text-gray-500">${message}</p>
    </div>
  `;
}

function showError(container, message = "Something went wrong.") {
  container.innerHTML = `
    <div class="text-center py-8 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-600">${message}</p>
    </div>
  `;
}

function confirmAction(message) {
  return confirm(message);
}