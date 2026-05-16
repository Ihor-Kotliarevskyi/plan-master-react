const MN = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];

const DEF_CATS = [
  { name: "Підготовчі",       color: "#009c9c" },
  { name: "Проектування",     color: "#db30f1" },
  { name: "Дозвільні",        color: "#00eeff" },
  { name: "Земляні",          color: "#815c0c" },
  { name: "Конструктив",      color: "#791800" },
  { name: "Інженерні мережі", color: "#00a2ff" },
  { name: "Оздоблення",       color: "#b0f70d" },
  { name: "Благоустрій",      color: "#069452" },
];

const DEF_PROJ = { name: "Мій проєкт", sm: 0, sy: 2026, nm: 12 };

const DEF_TASKS = [
  { n: 1,  name: "Технічне завдання та дизайн-проєкт", cat: 1, ms: 0, ws: 0, me: 0, we: 3, prog: 100, budget: 45000,  spent: 43000,  deps: [] },
  { n: 2,  name: "Погодження з орендодавцем",           cat: 2, ms: 0, ws: 0, me: 1, we: 1, prog: 100, budget: 5000,   spent: 5000,   deps: [1] },
  { n: 3,  name: "Демонтажні роботи",                   cat: 0, ms: 1, ws: 1, me: 1, we: 3, prog: 100, budget: 38000,  spent: 40000,  deps: [2] },
  { n: 4,  name: "Чорнова електрика",                   cat: 5, ms: 1, ws: 3, me: 2, we: 2, prog: 100, budget: 62000,  spent: 61500,  deps: [3] },
  { n: 5,  name: "Чорнова сантехніка",                  cat: 5, ms: 1, ws: 3, me: 2, we: 2, prog: 100, budget: 29000,  spent: 28000,  deps: [3] },
  { n: 6,  name: "Стяжка підлоги",                      cat: 4, ms: 2, ws: 2, me: 3, we: 0, prog: 100, budget: 54000,  spent: 54000,  deps: [4, 5] },
  { n: 7,  name: "Штукатурка стін",                     cat: 6, ms: 3, ws: 0, me: 4, we: 1, prog: 80,  budget: 71000,  spent: 56000,  deps: [6] },
  { n: 8,  name: "Монтаж перегородок",                  cat: 4, ms: 3, ws: 1, me: 4, we: 0, prog: 90,  budget: 33000,  spent: 30000,  deps: [6] },
  { n: 9,  name: "Стеля — гіпсокартон",                 cat: 4, ms: 4, ws: 0, me: 4, we: 3, prog: 60,  budget: 48000,  spent: 28000,  deps: [7] },
  { n: 10, name: "Укладання плитки (кухня, санвузол)",  cat: 6, ms: 4, ws: 1, me: 5, we: 0, prog: 40,  budget: 39000,  spent: 15000,  deps: [7] },
  { n: 11, name: "Фінішна електрика та освітлення",     cat: 5, ms: 5, ws: 0, me: 5, we: 3, prog: 0,   budget: 41000,  spent: 0,      deps: [9] },
  { n: 12, name: "Укладання паркету",                   cat: 6, ms: 5, ws: 1, me: 6, we: 0, prog: 0,   budget: 67000,  spent: 0,      deps: [10] },
  { n: 13, name: "Малярні роботи",                      cat: 6, ms: 5, ws: 2, me: 6, we: 2, prog: 0,   budget: 52000,  spent: 0,      deps: [9] },
  { n: 14, name: "Встановлення дверей",                 cat: 4, ms: 6, ws: 1, me: 6, we: 3, prog: 0,   budget: 58000,  spent: 0,      deps: [12, 13] },
  { n: 15, name: "Монтаж меблів та кухні",              cat: 6, ms: 7, ws: 0, me: 7, we: 3, prog: 0,   budget: 185000, spent: 0,      deps: [14] },
  { n: 16, name: "Встановлення сантехніки",             cat: 5, ms: 7, ws: 0, me: 7, we: 2, prog: 0,   budget: 34000,  spent: 0,      deps: [14] },
  { n: 17, name: "Прибирання та здача об'єкту",         cat: 0, ms: 7, ws: 3, me: 8, we: 0, prog: 0,   budget: 12000,  spent: 0,      deps: [15, 16] },
];

const CAT_PALETTE = [
  "#ff3c00", "#f1ad00", "#b0f70d", "#1dda04",
  "#069452", "#00eeff", "#8dc2db", "#00a2ff",
  "#0891b2", "#009c9c", "#118de6", "#344d5f",
  "#db30f1", "#815c0c", "#791800", "#9d174d",
];
