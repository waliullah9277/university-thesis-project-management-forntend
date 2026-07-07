checkAuth();

if (getUserRole() !== "STUDENT") {
  alert("Access denied.");
  window.location.href = "../login.html";
}

const teamForm = document.getElementById("teamForm");
const message = document.getElementById("message");
const teamList = document.getElementById("teamList");


// Team Create
teamForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const teamName = document.getElementById("team_name").value;

  message.textContent = "Creating team...";
  message.className = "mt-4 text-sm text-blue-600";

  const data = await apiRequest("/api/projects/teams/", "POST", {
    name: teamName,
    members: []
  });

  console.log("Create Team:", data);

  if (data.success) {
    message.textContent = "Team created successfully.";
    message.className = "mt-4 text-sm text-green-600";

    teamForm.reset();
    loadTeams();
  } else {
    message.textContent = data.message || "Team create failed.";
    message.className = "mt-4 text-sm text-red-600";
  }
});


// Team List
async function loadTeams() {
  const data = await apiRequest("/api/projects/teams/");

  console.log("Teams:", data);

  if (data.success === false) {
    teamList.innerHTML = `
      <p class="text-red-500">Failed to load teams.</p>
    `;
    return;
  }

  let teams = [];

  if (Array.isArray(data)) {
    teams = data;
  } else {
    teams = data.data || data.teams || [];
  }

  if (teams.length === 0) {
    teamList.innerHTML = `
      <p class="text-gray-500">No team found. Please create your team.</p>
    `;
    return;
  }

  teamList.innerHTML = "";

  teams.forEach(function(team) {
    teamList.innerHTML += `
      <div class="border rounded-lg p-5 bg-gray-50">
        <h3 class="text-lg font-bold">${team.name}</h3>
        <p class="text-gray-500 mt-1">Team ID: ${team.id}</p>
        <p class="text-gray-500">Members: ${getMemberCount(team)}</p>
      </div>
    `;
  });
}


// Member count safely
function getMemberCount(team) {
  if (team.members && Array.isArray(team.members)) {
    return team.members.length;
  }

  if (team.member_count !== undefined) {
    return team.member_count;
  }

  return 0;
}


// Initial load
loadTeams();