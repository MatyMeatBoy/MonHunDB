// Wilds App - Mirror of Rise app.js adapted for Wilds data
const GROUP_OVERRIDES_WILDS = {};

const ELEMENT_ORDER = ["fire", "water", "thunder", "ice", "dragon", "blast", "poison", "paralysis", "sleep", "stun", "exhaust"];
const RANK_ORDER = ["Low Rank", "High Rank", "Master Rank"];

let monstersWilds = [];
let currentRankWilds = null;
let langWilds = localStorage.getItem("mh-lang") || "es";

let selectedMonsterWilds = "";
const comboboxElWilds = document.getElementById("monster-combobox-wilds");
const triggerElWilds = document.getElementById("monster-trigger-wilds");
const triggerIconElWilds = triggerElWilds.querySelector(".trigger-icon");
const triggerLabelElWilds = triggerElWilds.querySelector(".trigger-label");
const panelElWilds = document.getElementById("monster-panel-wilds");
const searchElWilds = document.getElementById("monster-search-wilds");
const listElWilds = document.getElementBy running