checkAuth();

if (getUserRole() !== "STUDENT") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const teamForm = document.getElementById("teamForm");
const teamList = document.getElementById("teamList");
const message = document.getElementById("message");

let allTeams = [];

teamForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const payload = {
    name: document.getElementById("team_name").value,
    member_count: Number(document.getElementById("member_count").value),
  };

  message.textContent = "Creating team...";
  message.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest("/api/projects/teams/", "POST", payload);

  if (data.success === true || data.status === 201 || data.data?.id) {
    message.textContent = "Team created successfully.";
    message.className = "mt-4 text-sm text-green-600";
    teamForm.reset();
    loadTeams();
  } else {
    message.textContent = data.message || "Team create failed.";
    message.className = "mt-4 text-sm text-red-600";
  }
});

async function loadTeams() {
  teamList.innerHTML = `<p class="text-gray-500">Loading teams...</p>`;

  const data = await apiRequest("/api/projects/teams/");

  if (data.success === false) {
    teamList.innerHTML = `<p class="text-red-600">${data.message || "Failed to load teams."}</p>`;
    return;
  }

  const teams = data.data || data.results || data || [];
  allTeams = Array.isArray(teams) ? teams : [];

  if (allTeams.length === 0) {
    teamList.innerHTML = `<p class="text-gray-500">No team found.</p>`;
    return;
  }

  teamList.innerHTML = "";

  allTeams.forEach(function (team) {
    const members = team.member_infos || [];

    let membersHtml = "";

    if (members.length === 0) {
      membersHtml = `<p class="text-gray-500 text-sm">No member information added yet.</p>`;
    } else {
      members.forEach(function (member) {
        membersHtml += `
          <div class="bg-gray-50 border p-3 text-sm">
            <p><span class="font-semibold">Name:</span> ${member.name || "-"}</p>
            <p><span class="font-semibold">Student ID:</span> ${member.student_id || "-"}</p>
            <p><span class="font-semibold">Phone:</span> ${member.phone || "-"}</p>

            <div class="flex gap-2 mt-3">
              <button
                onclick="openEditMemberModal(${member.id})"
                class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
              >
                Edit
              </button>

              <button
                onclick="deleteMember(${member.id})"
                class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        `;
      });
    }

    const canAddMore = members.length < Number(team.member_count || 1);

    teamList.innerHTML += `
      <div class="bg-white border shadow-md p-5">
        <div class="flex justify-between items-start gap-3 mb-4">
          <div>
            <h3 class="text-lg font-bold text-gray-800">${team.name}</h3>
            <p class="text-gray-500 text-sm">Leader: ${team.leader_name || "-"}</p>
          </div>

          <span class="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-sm font-semibold">
            ${members.length}/${team.member_count || 1}
          </span>
        </div>

        <div class="space-y-2 mb-4">
          ${membersHtml}
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            onclick="openAddMemberModal(${team.id})"
            class="${
              canAddMore
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-400 cursor-not-allowed"
            } text-white px-4 py-2 text-sm font-medium"
            ${canAddMore ? "" : "disabled"}
          >
            Add Member
          </button>

          <button
            onclick="openTeamEditModal(${team.id})"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium"
          >
            Edit Team
          </button>

          <button
            onclick="deleteTeam(${team.id})"
            class="bg-red-700 hover:bg-red-800 text-white px-4 py-2 text-sm font-medium"
          >
            Delete Team
          </button>
        </div>
      </div>
    `;
  });
}

function openTeamEditModal(teamId) {
  const team = allTeams.find((item) => Number(item.id) === Number(teamId));

  if (!team) {
    showToast("Team not found.", "error");
    return;
  }

  document.getElementById("edit_team_id").value = team.id;
  document.getElementById("edit_team_name").value = team.name || "";
  document.getElementById("edit_member_count").value = team.member_count || 1;
  document.getElementById("teamEditMessage").textContent = "";

  document.getElementById("teamEditModal").classList.remove("hidden");
  document.getElementById("teamEditModal").classList.add("flex");
}

function closeTeamEditModal() {
  document.getElementById("teamEditModal").classList.add("hidden");
  document.getElementById("teamEditModal").classList.remove("flex");
}

async function updateTeam() {
  const teamId = document.getElementById("edit_team_id").value;

  const payload = {
    name: document.getElementById("edit_team_name").value,
    member_count: Number(document.getElementById("edit_member_count").value),
  };

  const msg = document.getElementById("teamEditMessage");
  msg.textContent = "Updating team...";
  msg.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest(
    `/api/projects/teams/${teamId}/update-delete/`,
    "PUT",
    payload
  );

  if (data.success) {
    msg.textContent = "Team updated successfully.";
    msg.className = "mt-4 text-sm text-green-600";
    loadTeams();

    setTimeout(() => {
      closeTeamEditModal();
    }, 600);
  } else {
    msg.textContent = data.message || "Team update failed.";
    msg.className = "mt-4 text-sm text-red-600";
  }
}

async function deleteTeam(teamId) {
  const confirmed = confirm("Are you sure you want to delete this team?");

  if (!confirmed) return;

  const data = await apiRequest(
    `/api/projects/teams/${teamId}/update-delete/`,
    "DELETE"
  );

  if (data.success) {
    showToast("Team deleted successfully.", "success");
    loadTeams();
  } else {
    showToast(data.message || "Team delete failed.", "error");
  }
}

function openAddMemberModal(teamId) {
  const team = allTeams.find((item) => Number(item.id) === Number(teamId));

  if (!team) {
    showToast("Team not found.", "error");
    return;
  }

  document.getElementById("memberModalTitle").textContent = "Add Member";
  document.getElementById("member_team_id").value = teamId;
  document.getElementById("member_id").value = "";
  document.getElementById("member_name").value = "";
  document.getElementById("member_student_id").value = "";
  document.getElementById("member_phone").value = "";
  document.getElementById("memberMessage").textContent = "";

  document.getElementById("memberModal").classList.remove("hidden");
  document.getElementById("memberModal").classList.add("flex");
}

function openEditMemberModal(memberId) {
  let foundMember = null;
  let foundTeam = null;

  allTeams.forEach(function (team) {
    const member = (team.member_infos || []).find(
      (item) => Number(item.id) === Number(memberId)
    );

    if (member) {
      foundMember = member;
      foundTeam = team;
    }
  });

  if (!foundMember) {
    showToast("Member not found.", "error");
    return;
  }

  document.getElementById("memberModalTitle").textContent = "Edit Member";
  document.getElementById("member_team_id").value = foundTeam.id;
  document.getElementById("member_id").value = foundMember.id;
  document.getElementById("member_name").value = foundMember.name || "";
  document.getElementById("member_student_id").value = foundMember.student_id || "";
  document.getElementById("member_phone").value = foundMember.phone || "";
  document.getElementById("memberMessage").textContent = "";

  document.getElementById("memberModal").classList.remove("hidden");
  document.getElementById("memberModal").classList.add("flex");
}

function closeMemberModal() {
  document.getElementById("memberModal").classList.add("hidden");
  document.getElementById("memberModal").classList.remove("flex");
}

async function saveMember() {
  const teamId = document.getElementById("member_team_id").value;
  const memberId = document.getElementById("member_id").value;

  const payload = {
    name: document.getElementById("member_name").value,
    student_id: document.getElementById("member_student_id").value,
    phone: document.getElementById("member_phone").value,
  };

  const msg = document.getElementById("memberMessage");

  if (!payload.name || !payload.student_id) {
    msg.textContent = "Member name and student ID are required.";
    msg.className = "mt-4 text-sm text-red-600";
    return;
  }

  msg.textContent = "Saving member...";
  msg.className = "mt-4 text-sm text-blue-600";

  let data;

  if (memberId) {
    data = await apiRequest(
      `/api/projects/teams/members/${memberId}/update-delete/`,
      "PUT",
      payload
    );
  } else {
    data = await apiRequest(
      `/api/projects/teams/${teamId}/members/add/`,
      "POST",
      payload
    );
  }

  if (data.success) {
    msg.textContent = "Member saved successfully.";
    msg.className = "mt-4 text-sm text-green-600";
    loadTeams();

    setTimeout(() => {
      closeMemberModal();
    }, 600);
  } else {
    msg.textContent = data.message || "Member save failed.";
    msg.className = "mt-4 text-sm text-red-600";
  }
}

async function deleteMember(memberId) {
  const confirmed = confirm("Are you sure you want to delete this member?");

  if (!confirmed) return;

  const data = await apiRequest(
    `/api/projects/teams/members/${memberId}/update-delete/`,
    "DELETE"
  );

  if (data.success) {
    showToast("Member deleted successfully.", "success");
    loadTeams();
  } else {
    showToast(data.message || "Member delete failed.", "error");
  }
}

loadTeams();