let allProjects = {};
let currentId = "";
let tasks = [], proj = {}, cats = [];

let hiddenCats = new Set();
let filterCat = null;   // null = all visible, number = exclusive filter
let showContr = false;
let hidePast = false;

let editIdx = null;
let selCat = 0;
let nextN = 43;

let drag = null;
let rowDrag = null;

let finSort = { col: "n", dir: 1 };
let finFilters = { q: "", cat: [], stat: [], contr: [], budgetMin: "", budgetMax: "", onlyBudget: false };
let showEVM = true;
let ganttFilters = { contractor: [], pay: [] };

let groupBy = "none";
let collapsedGrps = new Set();
let chartInstances = [];
let customCharts = [];

let monoBarColor = null;
let taskSearch = '';

let tempCats = [];
