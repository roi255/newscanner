/* data.js — multi-tenant data shaped like the SaaS API.
   Each institution is a tenant: its own access scope (branding accent + staff users)
   and student roster. In production:
     • GET /institutions                      → INSTITUTIONS (id, name, branding, recordCount)
     • POST /auth   {institutionId, staffId}  → scoped session token
     • GET /institutions/{id}/students        → metadata synced into the local cache
     • GET /students/{code}                   → single record (online fallback on cache miss) */
(function () {
  "use strict";

  function S(code, name, gender, regId, program, year, level, seat, balance, cached) {
    const deg = program.replace(/[^A-Za-z ]/g, "").trim().split(" ")[0].toUpperCase();
    const lvlNum = parseInt((level || "").replace(/\D/g, ""), 10) || 100;
    const intake = String((2026 - Math.floor(lvlNum / 100)) % 100).padStart(2, "0");
    return {
      code, name, firstName: name.split(" ")[0], gender, regId, program,
      year, level, seat, photo: null, balance, currency: "$",
      cached: cached !== false,
      classCode: deg + intake + "-SEP",
      semester: "Semester 2",
    };
  }

  const INSTITUTIONS = [
    {
      id: "ngu",
      name: "Northgate University",
      short: "NGU",
      location: "Accra Campus",
      accent: "#5b54d6",
      recordCount: 1240,
      session: { code: "CS 304", name: "Operating Systems", venue: "Hall B · Block 2", date: "29 May 2026", time: "09:00 – 11:00" },
      staff: [
        { id: "sarah.mensah", name: "Sarah Mensah", role: "Chief Invigilator" },
        { id: "daniel.osei", name: "Daniel Osei", role: "Invigilator" },
      ],
      students: [
        S("QR-7731-AX", "Amara Okonkwo", "Female", "NGU/2022/041182", "BSc. Computer Science", "Year 3", "Level 300", "B-14", 0),
        S("QR-2204-KP", "Daniel Mwangi", "Male", "NGU/2021/038907", "BSc. Software Engineering", "Year 4", "Level 400", "B-27", 420.5),
        S("QR-1029-Z", "Grace Adeyemi", "Female", "NGU/2022/041377", "BSc. Software Engineering", "Year 3", "Level 300", "B-19", 0),
        S("QR-8845-RT", "Joseph Banda", "Male", "NGU/2023/045561", "BSc. Computer Science", "Year 2", "Level 200", "B-31", 75.0),
        S("QR-6612-QW", "Kwame Asante", "Male", "NGU/2021/039114", "BSc. Information Systems", "Year 4", "Level 400", "B-03", 0),
        // Newly registered — not in the synced cache yet, forces an online fetch on scan.
        S("QR-9930-NEW", "Linda Chukwu", "Female", "NGU/2024/050771", "BSc. Computer Science", "Year 1", "Level 100", "B-40", 0, false),
      ],
    },
    {
      id: "rvp",
      name: "Riverside Polytechnic",
      short: "RVP",
      location: "Lakeside Campus",
      accent: "#0e7c86",
      recordCount: 860,
      session: { code: "ENG 210", name: "Thermodynamics", venue: "Workshop Hall", date: "29 May 2026", time: "13:00 – 15:00" },
      staff: [
        { id: "aisha.bello", name: "Aisha Bello", role: "Invigilator" },
      ],
      students: [
        S("RVP-3310-AA", "Peter Njoroge", "Male", "RVP/2022/11204", "HND Mechanical Eng.", "Year 2", "Level 200", "W-07", 0),
        S("RVP-4420-BB", "Mary Achieng", "Female", "RVP/2021/10880", "HND Civil Eng.", "Year 3", "Level 300", "W-12", 150.0),
        S("RVP-5530-CC", "Tunde Bakare", "Male", "RVP/2022/11377", "HND Electrical Eng.", "Year 2", "Level 200", "W-21", 0),
      ],
    },
    {
      id: "sac",
      name: "St. Augustine College",
      short: "SAC",
      location: "Hilltop Campus",
      accent: "#7a2e3a",
      recordCount: 520,
      session: { code: "LAW 101", name: "Constitutional Law", venue: "Auditorium A", date: "29 May 2026", time: "10:00 – 12:00" },
      staff: [
        { id: "maria.santos", name: "Maria Santos", role: "Invigilator" },
      ],
      students: [
        S("SAC-1100-DD", "Ruth Mensah", "Female", "SAC/2023/0455", "LLB Law", "Year 1", "Level 100", "A-02", 0),
        S("SAC-2200-EE", "Samuel Kofi", "Male", "SAC/2022/0388", "LLB Law", "Year 2", "Level 200", "A-09", 230.0),
        S("SAC-3300-FF", "Esther Owusu", "Female", "SAC/2023/0461", "LLB Law", "Year 1", "Level 100", "A-15", 0),
      ],
    },
    {
      id: "cit",
      name: "Crestwood Institute of Technology",
      short: "CIT",
      location: "Downtown Campus",
      accent: "#2456b8",
      recordCount: 980,
      session: { code: "IT 220", name: "Computer Networks", venue: "Lab 4 · Tech Block", date: "29 May 2026", time: "11:00 – 13:00" },
      staff: [{ id: "kevin.tan", name: "Kevin Tan", role: "Invigilator" }],
      students: [
        S("CIT-1010-GG", "Brian Otieno", "Male", "CIT/2022/22014", "BSc. Networking", "Year 2", "Level 200", "L-05", 0),
        S("CIT-2020-HH", "Nadia Hassan", "Female", "CIT/2021/21770", "BSc. Cybersecurity", "Year 3", "Level 300", "L-11", 90.0),
      ],
    },
    {
      id: "mlu",
      name: "Maple Leaf University",
      short: "MLU",
      location: "North Campus",
      accent: "#1f6f4a",
      recordCount: 1540,
      session: { code: "BIO 130", name: "Cell Biology", venue: "Science Hall", date: "29 May 2026", time: "14:00 – 16:00" },
      staff: [{ id: "olivia.park", name: "Olivia Park", role: "Chief Invigilator" }],
      students: [
        S("MLU-3030-II", "Henry Kamau", "Male", "MLU/2023/33051", "BSc. Biology", "Year 1", "Level 100", "S-18", 0),
        S("MLU-4040-JJ", "Sofia Reyes", "Female", "MLU/2022/32890", "BSc. Biochemistry", "Year 2", "Level 200", "S-24", 310.0),
      ],
    },
    {
      id: "hbs",
      name: "Harbor Business School",
      short: "HBS",
      location: "Marina Campus",
      accent: "#b06a16",
      recordCount: 640,
      session: { code: "FIN 305", name: "Corporate Finance", venue: "Lecture Theatre 2", date: "29 May 2026", time: "09:30 – 11:30" },
      staff: [{ id: "marcus.cole", name: "Marcus Cole", role: "Invigilator" }],
      students: [
        S("HBS-5050-KK", "Priya Nair", "Female", "HBS/2022/44012", "BBA Finance", "Year 2", "Level 200", "T-07", 0),
        S("HBS-6060-LL", "Daniel Wright", "Male", "HBS/2021/43880", "BBA Accounting", "Year 3", "Level 300", "T-13", 175.0),
      ],
    },
  ];

  function money(s, n) {
    return s + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getInstitution(id) {
    return INSTITUTIONS.find((i) => i.id === id) || null;
  }

  // Look up a record within a tenant by QR code or registration id.
  function fetchStudent(inst, codeOrReg) {
    if (!inst) return null;
    const q = (codeOrReg || "").trim().toLowerCase();
    return inst.students.find(
      (s) => s.code.toLowerCase() === q || s.regId.toLowerCase() === q
    ) || null;
  }

  function isAuthorized(student) {
    return !!student && student.balance <= 0;
  }

  // Seed history for a tenant from its first few cleared/owing students.
  function makeSeedLog(inst) {
    const times = ["08:52", "08:49", "08:47", "08:41", "08:38"];
    return inst.students.filter((s) => s.cached).slice(0, 5).map((s, i) => ({
      regId: s.regId, name: s.name, gender: s.gender, balance: s.balance,
      authorized: s.balance <= 0, at: times[i] || "08:30", seat: s.seat,
      method: i % 3 === 1 ? "lookup" : "scan", source: "cache",
    }));
  }

  window.EXAM_DATA = { INSTITUTIONS, money, getInstitution, fetchStudent, isAuthorized, makeSeedLog };
})();
