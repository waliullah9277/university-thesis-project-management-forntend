function paginateItems(items, currentPage, perPage) {
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  return items.slice(start, end);
}

function renderPagination(containerId, totalItems, currentPage, perPage, onPageChange) {
  const container = document.getElementById(containerId);

  if (!container) return;

  const totalPages = Math.ceil(totalItems / perPage);

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let buttons = "";

  buttons += `
    <button
      ${currentPage === 1 ? "disabled" : ""}
      class="px-3 py-1 border rounded ${currentPage === 1 ? "bg-gray-200 text-gray-400" : "bg-white hover:bg-blue-50"}"
      onclick="${onPageChange}(${currentPage - 1})"
    >
      Prev
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    buttons += `
      <button
        class="px-3 py-1 border rounded ${i === currentPage ? "bg-blue-600 text-white" : "bg-white hover:bg-blue-50"}"
        onclick="${onPageChange}(${i})"
      >
        ${i}
      </button>
    `;
  }

  buttons += `
    <button
      ${currentPage === totalPages ? "disabled" : ""}
      class="px-3 py-1 border rounded ${currentPage === totalPages ? "bg-gray-200 text-gray-400" : "bg-white hover:bg-blue-50"}"
      onclick="${onPageChange}(${currentPage + 1})"
    >
      Next
    </button>
  `;

  container.innerHTML = `
    <div class="flex flex-wrap gap-2 justify-center mt-6">
      ${buttons}
    </div>
  `;
}