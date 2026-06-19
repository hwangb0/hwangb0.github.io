// KU Cafeteria App Core Logic
// Coordinates Light Mode UI screens, local persistence, ranking lists, and simulator interactions

document.addEventListener("DOMContentLoaded", () => {
  const { CAFETERIAS, initializeLocalData, saveLocalData, calculateCongestionStatus } = window.kuSubwayData;

  // ==========================================
  // APPLICATION STATE
  // ==========================================
  
  // Load user's personal active congestion votes from localStorage if they exist
  const loadUserCongestionVotes = () => {
    const saved = localStorage.getItem("KU_USER_CONGESTION_VOTES");
    return saved ? JSON.parse(saved) : { student_hall: null, aegineung: null, sanhak: null };
  };

  const loadUserMenuVotes = () => {
    const saved = localStorage.getItem("KU_USER_MENU_VOTES");
    return saved ? JSON.parse(saved) : {};
  };

  let state = {
    user: null, // Logged in student info
    votesData: initializeLocalData(), // Loaded from localStorage (global counts)
    userCongestionVotes: loadUserCongestionVotes(), // Personal active selections
    userMenuVotes: loadUserMenuVotes(), // Personal active menu selections (like/dislike)
    selectedCafeteriaId: null // Id of selected cafeteria (e.g. 'student_hall')
  };

  // ==========================================
  // DOM ELEMENTS
  // ==========================================
  const screens = {
    "screen-auth": document.getElementById("screen-auth"),
    "screen-cafeteria-list": document.getElementById("screen-cafeteria-list"),
    "screen-cafeteria-detail": document.getElementById("screen-cafeteria-detail")
  };

  const appHeader = document.getElementById("app-header");

  // Auth Screen inputs
  const btnLoginSubmit = document.getElementById("btn-login-submit");
  const btnLoginKakao = document.getElementById("btn-login-kakao");
  const btnLoginNaver = document.getElementById("btn-login-naver");

  // Cafeteria List elements
  const humanitiesCafesList = document.getElementById("humanities-cafes-list");
  const scienceCafesList = document.getElementById("science-cafes-list");

  // Detailed view elements
  const btnBackToList = document.getElementById("btn-back-to-list");
  const detailCafeName = document.getElementById("detail-cafe-name");
  const detailCafeLocation = document.getElementById("detail-cafe-location");
  const detailCongestionLabel = document.getElementById("detail-congestion-label");
  const detailCongestionBar = document.getElementById("detail-congestion-bar");
  const detailCongestionTotal = document.getElementById("detail-congestion-total");
  const detailMenuList = document.getElementById("detail-menu-list");
  const congestionVoteButtons = document.querySelectorAll(".btn-vote-congestion");

  // Toast
  const pushToast = document.getElementById("push-toast");
  const toastTitle = document.getElementById("toast-title");
  const toastText = document.getElementById("toast-text");
  const btnCloseToast = document.getElementById("btn-close-toast");

  // Simulator Panel elements
  const simVoteCongestionLotsBtn = document.getElementById("sim-vote-congestion-lots");
  const simResetCongestionBtn = document.getElementById("sim-reset-congestion");
  const simVoteMenuLotsBtn = document.getElementById("sim-vote-menu-lots");
  const simResetVotesBtn = document.getElementById("sim-reset-votes");

  // ==========================================
  // NAVIGATION ROUTING
  // ==========================================
  function navigateTo(screenId) {
    if (!state.user && screenId !== "screen-auth") {
      showToast("인증 필요", "학번 학생증 인증을 먼저 진행해 주세요.");
      return;
    }

    // Toggle screen class
    Object.values(screens).forEach(scr => scr.classList.remove("active"));
    screens[screenId].classList.add("active");

    // Populate data based on target screen
    if (screenId === "screen-cafeteria-list") {
      renderCafeteriaList();
    } else if (screenId === "screen-cafeteria-detail") {
      if (state.selectedCafeteriaId) {
        renderCafeteriaDetailView();
      }
    }

    lucide.createIcons();
  }

  btnBackToList.addEventListener("click", () => {
    navigateTo("screen-cafeteria-list");
  });

  // ==========================================
  // STUDENT LOGIN VERIFICATION
  // ==========================================
  function executeLogin(name, dept, studentId) {
    state.user = {
      name,
      dept,
      studentId
    };

    appHeader.style.display = "flex";
    
    showToast("인증 성공", `${name}님(학번: ${studentId}) 고대생 인증이 완료되었습니다.`);
    navigateTo("screen-cafeteria-list");
  }

  btnLoginSubmit.addEventListener("click", () => {
    const dept = document.getElementById("auth-dept").value.trim();
    const id = document.getElementById("auth-sid").value.trim();
    const name = document.getElementById("auth-name").value.trim();

    if (!dept || !id || !name) {
      showToast("오류", "모든 인증 항목을 입력해 주세요.");
      return;
    }
    
    // Validation check: Student ID must be numeric and 8 or 10 digits
    if (!/^\d{10}$/.test(id) && !/^\d{8}$/.test(id)) {
      showToast("유효성 오류", "학번은 8자리 또는 10자리 숫자로 입력해야 합니다.");
      return;
    }

    executeLogin(name, dept, id);
  });

  btnLoginKakao.addEventListener("click", () => {
    executeLogin("황보은(Kakao)", "한국사학과", "2026130207");
  });

  btnLoginNaver.addEventListener("click", () => {
    executeLogin("황보은(Naver)", "한국사학과", "2026130207");
  });

  // ==========================================
  // CAFETERIA LIST VIEW (SHOW MENUS AT A GLANCE)
  // ==========================================
  function renderCafeteriaList() {
    let humanitiesHTML = "";
    let scienceHTML = "";

    CAFETERIAS.forEach(c => {
      const stored = state.votesData[c.id];
      const status = calculateCongestionStatus(stored.congestion);
      
      // Render menus as beautiful tag components visible at a glance
      const menuTagsHTML = c.menus.map(m => `
        <span class="menu-tag">${m.name}</span>
      `).join("");

      const cardHTML = `
        <div class="cafeteria-card" data-id="${c.id}">
          <div class="card-header">
            <div class="card-title">${c.name}</div>
            <span class="card-badge" style="background-color: ${status.color};">${status.label}</span>
          </div>
          <div class="card-location">
            <i data-lucide="map-pin" style="width:11px; height:11px; stroke-width:3px;"></i>
            <span>${c.location} | ${c.hours}</span>
          </div>
          <div class="card-menus-preview">
            ${menuTagsHTML}
          </div>
        </div>
      `;

      if (c.campus === "인문계 캠퍼스") {
        humanitiesHTML += cardHTML;
      } else {
        scienceHTML += cardHTML;
      }
    });

    humanitiesCafesList.innerHTML = humanitiesHTML;
    scienceCafesList.innerHTML = scienceHTML;

    // Bind click events to cafeteria cards
    document.querySelectorAll(".cafeteria-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        state.selectedCafeteriaId = id;
        navigateTo("screen-cafeteria-detail");
      });
    });

    lucide.createIcons();
  }

  // ==========================================
  // CAFETERIA DETAILED VIEW & VOTING
  // ==========================================
  function renderCafeteriaDetailView() {
    const cafe = CAFETERIAS.find(c => c.id === state.selectedCafeteriaId);
    if (!cafe) return;

    const stored = state.votesData[cafe.id];
    const status = calculateCongestionStatus(stored.congestion);

    // 1. Update Cafeteria Meta Info
    detailCafeName.textContent = cafe.name;
    detailCafeLocation.textContent = `${cafe.campus} ${cafe.location} (운영시간: ${cafe.hours})`;
    
    // 2. Update Congestion Gauge Chart
    detailCongestionLabel.textContent = status.label;
    detailCongestionLabel.style.color = status.color;
    detailCongestionBar.style.width = `${status.percent}%`;
    detailCongestionBar.style.backgroundColor = status.color;
    detailCongestionTotal.textContent = `(${status.total}표 집계)`;

    // 3. Highlight currently active user's vote button
    const myVote = state.userCongestionVotes[cafe.id];
    congestionVoteButtons.forEach(btn => {
      const type = btn.getAttribute("data-vote");
      if (myVote === type) {
        btn.classList.add("selected");
      } else {
        btn.classList.remove("selected");
      }
    });

    // 4. Render Menu List with dynamic popularity rankings
    renderMenuList(cafe, stored.menus);
  }

  // Calculate menu rankings dynamically based on likes/dislikes ratio
  function renderMenuList(cafe, storedMenus) {
    const rankedMenus = cafe.menus.map(m => {
      const votes = storedMenus[m.id] || { likes: 0, dislikes: 0 };
      const score = votes.likes - votes.dislikes;
      return { ...m, likes: votes.likes, dislikes: votes.dislikes, score };
    });

    // Sort by score descending
    rankedMenus.sort((a, b) => b.score - a.score);

    let html = "";
    rankedMenus.forEach((m, index) => {
      let rankBadge = "";
      if (m.score > 0) {
        if (index === 0) rankBadge = `<span class="rank-badge" style="background:#ef4444; color:#fff;">BEST 👑</span>`;
        else if (index === 1) rankBadge = `<span class="rank-badge" style="background:#fbbf24; color:#191919;">2위 ⭐</span>`;
        else if (index === 2) rankBadge = `<span class="rank-badge" style="background:#3b82f6; color:#fff;">3위 ⭐</span>`;
      }

      // Check user's personal vote for this menu item
      const myMenuVote = state.userMenuVotes[m.id] || null;
      const likeSelected = myMenuVote === "like" ? "selected-like" : "";
      const dislikeSelected = myMenuVote === "dislike" ? "selected-dislike" : "";

      html += `
        <div class="menu-item-row" data-menu-id="${m.id}">
          <div class="menu-item-info">
            ${rankBadge}
            <span class="menu-item-name">${m.name}</span>
          </div>
          <div class="menu-item-votes">
            <button class="btn-menu-vote like ${likeSelected}" data-action="like">
              <i data-lucide="thumbs-up" style="width:11px; height:11px;"></i>
              <span>${m.likes}</span>
            </button>
            <button class="btn-menu-vote dislike ${dislikeSelected}" data-action="dislike">
              <i data-lucide="thumbs-down" style="width:11px; height:11px;"></i>
              <span>${m.dislikes}</span>
            </button>
          </div>
        </div>
      `;
    });

    detailMenuList.innerHTML = html;

    // Bind click events for menu upvote/downvote buttons
    detailMenuList.querySelectorAll(".btn-menu-vote").forEach(btn => {
      btn.addEventListener("click", () => {
        const row = btn.closest(".menu-item-row");
        const menuId = row.getAttribute("data-menu-id");
        const action = btn.getAttribute("data-action");

        submitMenuVote(state.selectedCafeteriaId, menuId, action);
      });
    });

    lucide.createIcons();
  }

  function submitMenuVote(cafeId, menuId, action) {
    const current = state.votesData[cafeId].menus[menuId];
    if (!current) return;

    const prevVote = state.userMenuVotes[menuId] || null; // 'like' | 'dislike' | null

    if (prevVote === action) {
      // Toggle off / Cancel vote
      if (action === "like") {
        current.likes = Math.max(0, current.likes - 1);
      } else {
        current.dislikes = Math.max(0, current.dislikes - 1);
      }
      state.userMenuVotes[menuId] = null;
      showToast("투표 취소", "선택한 메뉴 추천을 취소했습니다.");
    } else {
      // Change vote or cast new vote
      if (prevVote) {
        if (prevVote === "like") {
          current.likes = Math.max(0, current.likes - 1);
        } else {
          current.dislikes = Math.max(0, current.dislikes - 1);
        }
      }
      if (action === "like") {
        current.likes++;
        showToast("추천 투표", `[좋아요]를 선택했습니다.`);
      } else {
        current.dislikes++;
        showToast("비추천 투표", `[싫어요]를 선택했습니다.`);
      }
      state.userMenuVotes[menuId] = action;
    }

    saveLocalData(state.votesData);
    localStorage.setItem("KU_USER_MENU_VOTES", JSON.stringify(state.userMenuVotes));
    renderCafeteriaDetailView();
  }

  // ==========================================
  // SINGLE VOTE CHANGEABLE CONGESTION LOGIC
  // ==========================================
  congestionVoteButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (!state.selectedCafeteriaId) return;
      
      const votedType = btn.getAttribute("data-vote"); // 'smooth', 'moderate', 'crowded'
      const cafeId = state.selectedCafeteriaId;
      const prevVote = state.userCongestionVotes[cafeId];

      if (prevVote === votedType) {
        // Cancel vote! (Same button clicked again)
        state.votesData[cafeId].congestion[votedType] = Math.max(0, state.votesData[cafeId].congestion[votedType] - 1);
        state.userCongestionVotes[cafeId] = null;
        showToast("투표 취소", "혼잡도 선택을 취소했습니다.");
      } else {
        // If user has already voted for this cafeteria, decrement previous vote
        if (prevVote) {
          state.votesData[cafeId].congestion[prevVote] = Math.max(0, state.votesData[cafeId].congestion[prevVote] - 1);
        }
        // Increment new vote count
        state.votesData[cafeId].congestion[votedType]++;
        state.userCongestionVotes[cafeId] = votedType;
        
        const labelMapping = { smooth: "여유 😊", moderate: "보통 😐", crowded: "혼잡 😫" };
        showToast("혼잡도 투표 완료", `혼잡도를 [${labelMapping[votedType]}]로 변경했습니다.`);
      }
      
      saveLocalData(state.votesData);
      localStorage.setItem("KU_USER_CONGESTION_VOTES", JSON.stringify(state.userCongestionVotes));
      renderCafeteriaDetailView();
    });
  });

  // ==========================================
  // DEMO/SIMULATOR CONTROL PANEL INTERACTIONS
  // ==========================================

  // 1. Congestion simulator (Mass random votes)
  simVoteCongestionLotsBtn.addEventListener("click", () => {
    if (!state.selectedCafeteriaId) {
      showToast("오류", "상세 투표 화면에서 식당을 먼저 선택해 주세요.");
      return;
    }
    
    const cafeVotes = state.votesData[state.selectedCafeteriaId].congestion;
    
    for (let i = 0; i < 50; i++) {
      const rand = Math.random();
      if (state.selectedCafeteriaId === "aegineung") {
        if (rand < 0.6) cafeVotes.crowded++;
        else if (rand < 0.9) cafeVotes.moderate++;
        else cafeVotes.smooth++;
      } else {
        if (rand < 0.3) cafeVotes.smooth++;
        else if (rand < 0.7) cafeVotes.moderate++;
        else cafeVotes.crowded++;
      }
    }

    saveLocalData(state.votesData);
    renderCafeteriaDetailView();
    showToast("시뮬레이션 가동", `[50표]의 실시간 혼잡도 임의 투표를 식당에 가중 합산하였습니다.`);
  });

  // Reset Congestion
  simResetCongestionBtn.addEventListener("click", () => {
    if (!state.selectedCafeteriaId) return;
    
    const cafeId = state.selectedCafeteriaId;
    state.votesData[cafeId].congestion = { smooth: 0, moderate: 0, crowded: 0 };
    
    // Clear user's personal vote for this cafe
    state.userCongestionVotes[cafeId] = null;
    localStorage.setItem("KU_USER_CONGESTION_VOTES", JSON.stringify(state.userCongestionVotes));

    saveLocalData(state.votesData);
    renderCafeteriaDetailView();
    showToast("초기화 완료", "선택된 식당의 혼잡도 데이터가 0표로 초기화되었습니다.");
  });

  // 2. Menu preference simulator (Mass random votes)
  simVoteMenuLotsBtn.addEventListener("click", () => {
    if (!state.selectedCafeteriaId) {
      showToast("오류", "상세 투표 화면에서 식당을 먼저 선택해 주세요.");
      return;
    }

    const menuVotes = state.votesData[state.selectedCafeteriaId].menus;
    const menuIds = Object.keys(menuVotes);
    for (let i = 0; i < 100; i++) {
      const randomMenuId = menuIds[Math.floor(Math.random() * menuIds.length)];
      const rand = Math.random();
      
      if (randomMenuId.includes("menu_1") || randomMenuId.includes("menu_2")) {
        if (rand < 0.85) menuVotes[randomMenuId].likes++;
        else menuVotes[randomMenuId].dislikes++;
      } else {
        if (rand < 0.60) menuVotes[randomMenuId].likes++;
        else menuVotes[randomMenuId].dislikes++;
      }
    }

    saveLocalData(state.votesData);
    renderCafeteriaDetailView();
    showToast("시뮬레이션 가동", "반찬 선호도에 [100표]를 고르게 누적 분배하여 실시간 랭킹을 갱신했습니다.");
  });

  // Reset Menu Votes
  simResetVotesBtn.addEventListener("click", () => {
    if (!state.selectedCafeteriaId) return;
    
    const cafe = CAFETERIAS.find(c => c.id === state.selectedCafeteriaId);
    if (cafe) {
      cafe.menus.forEach(m => {
        state.userMenuVotes[m.id] = null;
      });
      localStorage.setItem("KU_USER_MENU_VOTES", JSON.stringify(state.userMenuVotes));
    }
    
    const menuVotes = state.votesData[state.selectedCafeteriaId].menus;
    Object.keys(menuVotes).forEach(id => {
      menuVotes[id] = { likes: 0, dislikes: 0 };
    });

    saveLocalData(state.votesData);
    renderCafeteriaDetailView();
    showToast("초기화 완료", "반찬 선호도 집계가 모두 0표로 재설정되었습니다.");
  });

  // ==========================================
  // TOAST DISPLAY MANAGER
  // ==========================================
  let toastTimer = null;

  function showToast(title, message) {
    toastTitle.textContent = title;
    toastText.textContent = message;
    pushToast.style.display = "flex";

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      pushToast.style.display = "none";
    }, 3000);
  }

  btnCloseToast.addEventListener("click", () => {
    pushToast.style.display = "none";
  });

  // Initialize Lucide Icons
  lucide.createIcons();
});
