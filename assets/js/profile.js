checkAuth();

const profileBox = document.getElementById("profileBox");
const changePasswordForm = document.getElementById("changePasswordForm");
const passwordMessage = document.getElementById("passwordMessage");
const passwordModal = document.getElementById("passwordModal");
const imageInput = document.getElementById("imageInput");
const profileImage = document.getElementById("profileImage");

let currentUserImageKey = null;

async function loadProfile() {
  const data = await apiRequest("/api/auth/profile/");

  console.log("Profile:", data);

  if (data.success === false) {
    profileBox.innerHTML = `
      <p class="text-red-500 text-center">Failed to load profile.</p>
    `;
    return;
  }

  const user = data.data || data.user || data;

  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User";

  const uniqueUserId =
    user.id ||
    user.email ||
    user.student_id ||
    localStorage.getItem("role") ||
    "default";

  currentUserImageKey = `profile_image_${uniqueUserId}`;

  const savedImage = localStorage.getItem(currentUserImageKey);

  if (savedImage) {
    profileImage.src = savedImage;
  } else {
    profileImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff`;
  }

  profileBox.innerHTML = `
    <div class="border rounded-lg p-6 bg-gray-50 space-y-3">
      <h2 class="text-2xl font-bold text-center mb-4">${fullName}</h2>

      <p><strong>Email:</strong> ${user.email || "-"}</p>
      <p><strong>Student ID:</strong> ${user.student_id || "-"}</p>
      <p><strong>Phone:</strong> ${user.phone || "-"}</p>
      <p><strong>Role:</strong> ${user.role || "-"}</p>
      <p><strong>Status:</strong> ${user.is_active ? "Active" : "Inactive"}</p>
    </div>
  `;
}

imageInput.addEventListener("change", function(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  if (!currentUserImageKey) {
    alert("Profile is not loaded yet. Please refresh and try again.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    const imageData = e.target.result;

    profileImage.src = imageData;
    localStorage.setItem(currentUserImageKey, imageData);
  };

  reader.readAsDataURL(file);
});

function openPasswordModal() {
  passwordModal.classList.remove("hidden");
  passwordModal.classList.add("flex");

  passwordMessage.textContent = "";
  changePasswordForm.reset();
}

function closePasswordModal() {
  passwordModal.classList.add("hidden");
  passwordModal.classList.remove("flex");
}

changePasswordForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const currentPassword = document.getElementById("current_password").value;
  const newPassword = document.getElementById("new_password").value;
  const confirmPassword = document.getElementById("confirm_password").value;

  if (newPassword !== confirmPassword) {
    passwordMessage.textContent = "New password and confirm password do not match.";
    passwordMessage.className = "mt-4 text-sm text-red-600 text-center";
    return;
  }

  passwordMessage.textContent = "Changing password...";
  passwordMessage.className = "mt-4 text-sm text-blue-600 text-center";

  const data = await apiRequest("/api/auth/change-password/", "POST", {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });

  console.log("Change Password:", data);

  if (data.success || data.message) {
    passwordMessage.textContent = data.message || "Password changed successfully.";
    passwordMessage.className = "mt-4 text-sm text-green-600 text-center";

    changePasswordForm.reset();

    setTimeout(function() {
      closePasswordModal();
      window.location.href = "profile.html";
    }, 800);
  } else {
    passwordMessage.textContent = data.message || data.detail || JSON.stringify(data);
    passwordMessage.className = "mt-4 text-sm text-red-600 text-center";
  }
});

passwordModal.addEventListener("click", function(event) {
  if (event.target === passwordModal) {
    closePasswordModal();
  }
});

loadProfile();