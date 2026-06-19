// Korea University Cafeteria App Data Config
// Contains specific KU dining halls, menus, and local persistence helper functions

const CAFETERIAS = [
  {
    id: "student_hall",
    name: "학생회관 학생식당",
    campus: "인문계 캠퍼스",
    location: "학생회관 2층",
    hours: "중식 11:00 ~ 14:00",
    initialCongestion: { smooth: 8, moderate: 4, crowded: 2 },
    menus: [
      { id: "sh_menu_1", name: "베이컨마늘필라프", type: "main", likes: 24, dislikes: 2 },
      { id: "sh_menu_2", name: "닭다리살스테이크", type: "main", likes: 38, dislikes: 1 },
      { id: "sh_menu_3", name: "콘소메알감자튀김", type: "side", likes: 18, dislikes: 3 },
      { id: "sh_menu_4", name: "그린샐러드&드레싱", type: "side", likes: 9, dislikes: 4 },
      { id: "sh_menu_5", name: "유부장국", type: "side", likes: 11, dislikes: 2 },
      { id: "sh_menu_6", name: "피클&할라피뇨", type: "side", likes: 4, dislikes: 5 }
    ]
  },
  {
    id: "aegineung",
    name: "자연계 학생식당",
    campus: "자연계 캠퍼스",
    location: "애기능생활관 1층",
    hours: "중식 11:00 ~ 13:30",
    initialCongestion: { smooth: 3, moderate: 12, crowded: 8 },
    menus: [
      { id: "ae_menu_1", name: "냉김치말이국수", type: "main", likes: 45, dislikes: 3 },
      { id: "ae_menu_2", name: "왕만두찜", type: "main", likes: 32, dislikes: 2 },
      { id: "ae_menu_3", name: "유부초밥", type: "main", likes: 27, dislikes: 1 },
      { id: "ae_menu_4", name: "양배추샐러드", type: "side", likes: 8, dislikes: 4 },
      { id: "ae_menu_5", name: "배추김치", type: "side", likes: 10, dislikes: 3 },
      { id: "ae_menu_6", name: "단무지", type: "side", likes: 5, dislikes: 4 }
    ]
  },
  {
    id: "sanhak",
    name: "산학관 학생식당",
    campus: "자연계 캠퍼스",
    location: "산학관 지하 1층",
    hours: "중식 11:20 ~ 13:50",
    initialCongestion: { smooth: 15, moderate: 5, crowded: 1 },
    menus: [
      { id: "sa_menu_1", name: "치즈돈까스", type: "main", likes: 52, dislikes: 0 },
      { id: "sa_menu_2", name: "쫄면야채무침", type: "main", likes: 29, dislikes: 4 },
      { id: "sa_menu_3", name: "시금치된장국", type: "side", likes: 14, dislikes: 2 },
      { id: "sa_menu_4", name: "볼어묵야채볶음", type: "side", likes: 21, dislikes: 3 },
      { id: "sa_menu_5", name: "그린샐러드", type: "side", likes: 7, dislikes: 2 },
      { id: "sa_menu_6", name: "매실차", type: "side", likes: 33, dislikes: 1 }
    ]
  }
];

// LocalStorage initializer
function initializeLocalData() {
  const storedData = localStorage.getItem("KU_CAFETERIA_VOTES");
  if (storedData) {
    return JSON.parse(storedData);
  }

  // Set initial seed configurations
  const data = {};
  CAFETERIAS.forEach(c => {
    data[c.id] = {
      congestion: { ...c.initialCongestion },
      menus: c.menus.reduce((acc, m) => {
        acc[m.id] = { likes: m.likes, dislikes: m.dislikes };
        return acc;
      }, {})
    };
  });

  localStorage.setItem("KU_CAFETERIA_VOTES", JSON.stringify(data));
  return data;
}

function saveLocalData(data) {
  localStorage.setItem("KU_CAFETERIA_VOTES", JSON.stringify(data));
}

// Convert congestion counts into a percentage and category label
function calculateCongestionStatus(votes) {
  const { smooth, moderate, crowded } = votes;
  const total = smooth + moderate + crowded;
  if (total === 0) return { percent: 0, label: "정보 없음", color: "#64748b" };

  // Calculate weighted average index: smooth=10%, moderate=50%, crowded=90%
  const score = ((smooth * 10) + (moderate * 50) + (crowded * 90)) / total;

  let label = "여유 😊";
  let color = "#10b981"; // green
  if (score > 65) {
    label = "혼잡 😫";
    color = "#ef4444"; // red
  } else if (score > 35) {
    label = "보통 😐";
    color = "#f59e0b"; // yellow
  }

  return { percent: Math.round(score), label, color, total };
}

window.kuSubwayData = {
  CAFETERIAS,
  initializeLocalData,
  saveLocalData,
  calculateCongestionStatus
};
