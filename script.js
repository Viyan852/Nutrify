/* ============================================================
   NUTRIFY — script.js
   Modular vanilla JS with Supabase backend.
   No fake data — everything from the database or user input.
   ============================================================ */
'use strict';

/* ============================================================
   MODULE: Supabase Client
   Singleton connection using env vars from .env (injected
   by Vite at build time) or window globals.
   ============================================================ */
const SupabaseClient = (() => {
  let _client = null;

  function getEnv(name) {
    if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[name];
    return undefined;
  }

  function init() {
    if (_client) return _client;
    const url = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || window.SUPABASE_URL;
    const key = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || window.SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('Supabase env vars not found — app will run in offline mode.');
      return null;
    }
    _client = window.supabase.createClient(url, key);
    return _client;
  }

  return { init, get client() { return _client; } };
})();

/* ============================================================
   MODULE: Local Storage Helpers
   Used for the profile ID and client-side preferences only.
   All real data goes to Supabase.
   ============================================================ */
const LocalStore = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
  del(key) { try { localStorage.removeItem(key); } catch {} },
};

const LS_KEYS = {
  profileId: 'nutrify_profile_id',
  theme: 'nutrify_theme',
  selectedIngredients: 'nutrify_selected_ingredients',
};

/* ============================================================
   MODULE: Toast Notifications
   ============================================================ */
const Toast = {
  show(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); },
};

/* ============================================================
   MODULE: DiceBear Avatars
   ============================================================ */
const Avatar = {
  url(seed) {
    const s = encodeURIComponent((seed || 'NutriBee').trim() || 'NutriBee');
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${s}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  },
};

/* ============================================================
   DATA: Meals, Ingredients, Recipes, Tips
   (Static reference data — NOT analytics or impact numbers)
   ============================================================ */
const MEAL_DB = {
  veg: {
    Breakfast: [
      { name: 'Oats & Banana Bowl', kcal: 320, protein: 12, time: 10, why: 'Slow-release carbs keep you full till lunch.', img: '🥣' },
      { name: 'Poha with Peanuts', kcal: 280, protein: 8, time: 15, why: 'Light, iron-rich and easy to digest.', img: '🍚' },
      { name: 'Veggie Upma', kcal: 300, protein: 10, time: 12, why: 'Fibre from veggies supports gut health.', img: '🥘' },
      { name: 'Idli & Sambar', kcal: 310, protein: 11, time: 20, why: 'Steamed, low-fat and protein-packed.', img: '🥞' },
    ],
    Lunch: [
      { name: 'Rajma Chawal', kcal: 450, protein: 18, time: 30, why: 'Plant protein and complex carbs for energy.', img: '🍛' },
      { name: 'Chana Dal Khichdi', kcal: 420, protein: 16, time: 25, why: 'A complete protein bowl, gentle on the stomach.', img: '🍲' },
      { name: 'Paneer Tikka Wrap', kcal: 480, protein: 22, time: 20, why: 'High protein from paneer, portable too.', img: '🌯' },
      { name: 'Veg Pulao & Raita', kcal: 440, protein: 14, time: 25, why: 'Balanced grains with cooling yoghurt.', img: '🍚' },
    ],
    Snack: [
      { name: 'Sprout Chaat', kcal: 150, protein: 8, time: 10, why: 'Protein and vitamin C in one bowl.', img: '🥗' },
      { name: 'Roasted Makhana', kcal: 120, protein: 4, time: 8, why: 'Low-cal crunch rich in calcium.', img: '🍿' },
      { name: 'Fruit & Nut Mix', kcal: 180, protein: 5, time: 5, why: 'Natural sugars plus healthy fats.', img: '🍎' },
      { name: 'Peanut Butter Toast', kcal: 200, protein: 9, time: 5, why: 'Quick protein to beat afternoon slump.', img: '🍞' },
    ],
    Dinner: [
      { name: 'Dal Tadka & Roti', kcal: 380, protein: 15, time: 25, why: 'Light yet protein-rich for easy digestion.', img: '🫓' },
      { name: 'Veg Stuffed Paratha', kcal: 400, protein: 12, time: 20, why: 'Whole-wheat fibre with veggie filling.', img: '🫓' },
      { name: 'Tofu Stir-Fry', kcal: 360, protein: 18, time: 18, why: 'Soy protein with colourful veggies.', img: '🥡' },
      { name: 'Vegetable Soup & Salad', kcal: 300, protein: 10, time: 15, why: 'Low-cal, high-fibre for restful sleep.', img: '🥗' },
    ],
  },
  vegan: {
    Breakfast: [
      { name: 'Chia Pudding & Berries', kcal: 300, protein: 10, time: 10, why: 'Omega-3 and antioxidants to start the day.', img: '🫐' },
      { name: 'Vegan Smoothie Bowl', kcal: 320, protein: 12, time: 8, why: 'Plant protein and fruit fibre.', img: '🥣' },
      { name: 'Peanut Butter Banana Toast', kcal: 340, protein: 12, time: 5, why: 'Quick energy and healthy fats.', img: '🍞' },
      { name: 'Millet Porridge', kcal: 290, protein: 9, time: 12, why: 'Gluten-free grains rich in minerals.', img: '🥣' },
    ],
    Lunch: [
      { name: 'Chickpea Curry & Rice', kcal: 460, protein: 19, time: 30, why: 'Legume protein with complex carbs.', img: '🍛' },
      { name: 'Tofu Buddha Bowl', kcal: 440, protein: 20, time: 20, why: 'Balanced macros in one colourful bowl.', img: '🥗' },
      { name: 'Lentil Soup & Bread', kcal: 400, protein: 18, time: 25, why: 'Warming, fibre-rich and satisfying.', img: '🍲' },
      { name: 'Vegan Biryani', kcal: 470, protein: 15, time: 30, why: 'Fragrant rice with plant protein.', img: '🍚' },
    ],
    Snack: [
      { name: 'Hummus & Carrot Sticks', kcal: 160, protein: 7, time: 5, why: 'Chickpea protein with crunchy veggies.', img: '🥕' },
      { name: 'Energy Balls', kcal: 140, protein: 5, time: 10, why: 'Dates and nuts for natural energy.', img: '🍪' },
      { name: 'Edamame', kcal: 120, protein: 11, time: 8, why: 'Soy protein snack, low in fat.', img: '🫛' },
      { name: 'Apple & Almonds', kcal: 170, protein: 5, time: 2, why: 'Crunchy fibre and healthy fats.', img: '🍎' },
    ],
    Dinner: [
      { name: 'Vegan Dal & Roti', kcal: 380, protein: 16, time: 25, why: 'Classic plant protein dinner.', img: '🫓' },
      { name: 'Quinoa Veg Pulao', kcal: 400, protein: 14, time: 20, why: 'Complete protein grain with veggies.', img: '🍚' },
      { name: 'Stuffed Bell Peppers', kcal: 350, protein: 13, time: 30, why: 'Vitamin C rich with a hearty filling.', img: '🫑' },
      { name: 'Coconut Curry & Rice', kcal: 420, protein: 12, time: 25, why: 'Creamy, comforting and plant-based.', img: '🍛' },
    ],
  },
  nonveg: {
    Breakfast: [
      { name: 'Egg Bhurji & Toast', kcal: 340, protein: 20, time: 12, why: 'High-quality protein to kickstart your day.', img: '🍳' },
      { name: 'Chicken Sandwich', kcal: 380, protein: 28, time: 10, why: 'Lean protein with whole grains.', img: '🥪' },
      { name: 'Veggie Omelette', kcal: 320, protein: 22, time: 10, why: 'Protein and veggies in one pan.', img: '🍳' },
      { name: 'Moong Dal Cheela & Egg', kcal: 330, protein: 21, time: 15, why: 'Double protein from lentil and egg.', img: '🥞' },
    ],
    Lunch: [
      { name: 'Chicken Curry & Rice', kcal: 520, protein: 35, time: 30, why: 'Lean meat protein with complex carbs.', img: '🍛' },
      { name: 'Egg Fried Rice', kcal: 480, protein: 24, time: 20, why: 'Quick, protein-rich and filling.', img: '🍚' },
      { name: 'Grilled Chicken Salad', kcal: 420, protein: 38, time: 15, why: 'High protein, low fat for muscle repair.', img: '🥗' },
      { name: 'Fish Curry & Roti', kcal: 500, protein: 32, time: 30, why: 'Omega-3 rich for brain and heart.', img: '🐟' },
    ],
    Snack: [
      { name: 'Boiled Eggs & Fruit', kcal: 170, protein: 13, time: 8, why: 'Complete protein with natural sugars.', img: '🥚' },
      { name: 'Chicken Soup', kcal: 150, protein: 14, time: 10, why: 'Warm, light and protein-rich.', img: '🍲' },
      { name: 'Greek Yoghurt', kcal: 130, protein: 15, time: 2, why: 'Probiotics and protein in one cup.', img: '🥛' },
      { name: 'Nut & Seed Bar', kcal: 180, protein: 7, time: 2, why: 'Healthy fats for sustained energy.', img: '🍫' },
    ],
    Dinner: [
      { name: 'Grilled Fish & Veggies', kcal: 400, protein: 34, time: 20, why: 'Lean protein with fibre for recovery.', img: '🐟' },
      { name: 'Chicken Tikka & Salad', kcal: 420, protein: 36, time: 25, why: 'High protein, low carb dinner.', img: '🍗' },
      { name: 'Egg Curry & Roti', kcal: 390, protein: 24, time: 20, why: 'Comforting protein dinner.', img: '🫓' },
      { name: 'Chicken Stew', kcal: 360, protein: 30, time: 30, why: 'Light, warming and protein-dense.', img: '🍲' },
    ],
  },
  egg: {
    Breakfast: [
      { name: 'Veggie Omelette', kcal: 320, protein: 22, time: 10, why: 'Protein and veggies in one pan.', img: '🍳' },
      { name: 'Egg Paratha', kcal: 360, protein: 16, time: 15, why: 'Whole-grain and egg for sustained energy.', img: '🫓' },
      { name: 'French Toast', kcal: 300, protein: 14, time: 10, why: 'Eggs and bread, a balanced start.', img: '🍞' },
      { name: 'Egg Bhurji & Toast', kcal: 340, protein: 20, time: 12, why: 'High-quality protein to kickstart your day.', img: '🍳' },
    ],
    Lunch: [
      { name: 'Egg Fried Rice', kcal: 480, protein: 24, time: 20, why: 'Quick, protein-rich and filling.', img: '🍚' },
      { name: 'Paneer & Egg Curry', kcal: 500, protein: 28, time: 25, why: 'Double protein from paneer and egg.', img: '🍛' },
      { name: 'Veg Pulao & Boiled Egg', kcal: 460, protein: 20, time: 25, why: 'Balanced grains with complete protein.', img: '🍚' },
      { name: 'Egg Roll & Salad', kcal: 440, protein: 22, time: 15, why: 'Portable protein with fresh veggies.', img: '🌯' },
    ],
    Snack: [
      { name: 'Boiled Eggs & Fruit', kcal: 170, protein: 13, time: 8, why: 'Complete protein with natural sugars.', img: '🥚' },
      { name: 'Egg Salad', kcal: 160, protein: 12, time: 8, why: 'Light protein snack with veggies.', img: '🥗' },
      { name: 'Yoghurt & Nuts', kcal: 150, protein: 8, time: 3, why: 'Probiotics and healthy fats.', img: '🥛' },
      { name: 'Peanut Butter Toast', kcal: 200, protein: 9, time: 5, why: 'Quick protein to beat afternoon slump.', img: '🍞' },
    ],
    Dinner: [
      { name: 'Egg Curry & Roti', kcal: 390, protein: 24, time: 20, why: 'Comforting protein dinner.', img: '🫓' },
      { name: 'Veg Stuffed Paratha & Egg', kcal: 410, protein: 18, time: 20, why: 'Fibre and protein for a restful night.', img: '🫓' },
      { name: 'Veg Soup & Egg', kcal: 320, protein: 18, time: 15, why: 'Light, high-protein dinner.', img: '🍲' },
      { name: 'Egg Noodles & Veggies', kcal: 400, protein: 20, time: 18, why: 'Quick dinner with protein and fibre.', img: '🍜' },
    ],
  },
  jain: {
    Breakfast: [
      { name: 'Oats & Banana Bowl', kcal: 320, protein: 12, time: 10, why: 'Simple, energising and Jain-friendly.', img: '🥣' },
      { name: 'Poha with Peanuts', kcal: 280, protein: 8, time: 15, why: 'Light, iron-rich and easy to digest.', img: '🍚' },
      { name: 'Veggie Upma (no onion)', kcal: 300, protein: 10, time: 12, why: 'Fibre from veggies supports gut health.', img: '🥘' },
      { name: 'Idli & Coconut Chutney', kcal: 310, protein: 9, time: 20, why: 'Steamed, low-fat and gentle.', img: '🥞' },
    ],
    Lunch: [
      { name: 'Rajma Chawal', kcal: 450, protein: 18, time: 30, why: 'Plant protein and complex carbs for energy.', img: '🍛' },
      { name: 'Chana Dal Khichdi', kcal: 420, protein: 16, time: 25, why: 'A complete protein bowl, gentle on the stomach.', img: '🍲' },
      { name: 'Paneer Tikka Wrap', kcal: 480, protein: 22, time: 20, why: 'High protein from paneer, portable too.', img: '🌯' },
      { name: 'Veg Pulao & Raita', kcal: 440, protein: 14, time: 25, why: 'Balanced grains with cooling yoghurt.', img: '🍚' },
    ],
    Snack: [
      { name: 'Sprout Chaat (no onion)', kcal: 150, protein: 8, time: 10, why: 'Protein and vitamin C in one bowl.', img: '🥗' },
      { name: 'Roasted Makhana', kcal: 120, protein: 4, time: 8, why: 'Low-cal crunch rich in calcium.', img: '🍿' },
      { name: 'Fruit & Nut Mix', kcal: 180, protein: 5, time: 5, why: 'Natural sugars plus healthy fats.', img: '🍎' },
      { name: 'Peanut Butter Toast', kcal: 200, protein: 9, time: 5, why: 'Quick protein to beat afternoon slump.', img: '🍞' },
    ],
    Dinner: [
      { name: 'Dal Tadka & Roti', kcal: 380, protein: 15, time: 25, why: 'Light yet protein-rich for easy digestion.', img: '🫓' },
      { name: 'Veg Stuffed Paratha', kcal: 400, protein: 12, time: 20, why: 'Whole-wheat fibre with veggie filling.', img: '🫓' },
      { name: 'Paneer Stir-Fry', kcal: 360, protein: 18, time: 18, why: 'Protein-rich with colourful veggies.', img: '🥡' },
      { name: 'Vegetable Soup & Salad', kcal: 300, protein: 10, time: 15, why: 'Low-cal, high-fibre for restful sleep.', img: '🥗' },
    ],
  },
};

const INGREDIENTS = [
  'Rice','Wheat Flour','Toor Dal','Moong Dal','Chana Dal','Rajma','Chickpeas','Paneer','Tofu',
  'Eggs','Chicken','Fish','Milk','Yoghurt','Cheese','Spinach','Tomato','Onion','Potato','Carrot',
  'Capsicum','Cabbage','Cauliflower','Broccoli','Beans','Peas','Lentils','Millet','Oats','Quinoa',
  'Banana','Apple','Orange','Berries','Mango','Lemon','Ginger','Garlic','Green Chilli','Coriander',
  'Curd','Bread','Corn','Peanuts','Almonds','Coconut','Raisins','Dates','Cucumber','Beetroot',
];

const RECIPES = [
  { name: 'Veggie Fried Rice', need: ['Rice','Onion','Carrot','Capsicum'], time: 20, diff: 'Easy', waste: 0.4 },
  { name: 'Dal Tadka', need: ['Toor Dal','Tomato','Onion','Garlic'], time: 25, diff: 'Easy', waste: 0.3 },
  { name: 'Paneer Bhurji', need: ['Paneer','Onion','Tomato','Capsicum'], time: 15, diff: 'Easy', waste: 0.35 },
  { name: 'Chickpea Salad', need: ['Chickpeas','Onion','Tomato','Lemon','Coriander'], time: 10, diff: 'Easy', waste: 0.25 },
  { name: 'Veg Khichdi', need: ['Rice','Moong Dal','Carrot','Peas'], time: 25, diff: 'Easy', waste: 0.3 },
  { name: 'Chicken Curry', need: ['Chicken','Onion','Tomato','Ginger','Garlic'], time: 35, diff: 'Medium', waste: 0.45 },
  { name: 'Egg Bhurji', need: ['Eggs','Onion','Tomato','Green Chilli'], time: 12, diff: 'Easy', waste: 0.2 },
  { name: 'Fish Masala', need: ['Fish','Onion','Tomato','Ginger','Garlic'], time: 30, diff: 'Medium', waste: 0.4 },
  { name: 'Tofu Stir-Fry', need: ['Tofu','Capsicum','Broccoli','Garlic'], time: 18, diff: 'Easy', waste: 0.3 },
  { name: 'Moong Dal Cheela', need: ['Moong Dal','Onion','Green Chilli','Coriander'], time: 15, diff: 'Easy', waste: 0.2 },
  { name: 'Rajma Curry', need: ['Rajma','Tomato','Onion','Ginger'], time: 40, diff: 'Medium', waste: 0.35 },
  { name: 'Veg Pulao', need: ['Rice','Carrot','Beans','Peas','Onion'], time: 25, diff: 'Easy', waste: 0.4 },
  { name: 'Broccoli Soup', need: ['Broccoli','Onion','Garlic','Milk'], time: 20, diff: 'Easy', waste: 0.3 },
  { name: 'Cabbage Sabzi', need: ['Cabbage','Peas','Onion','Tomato'], time: 18, diff: 'Easy', waste: 0.25 },
  { name: 'Cauliflower Dry Curry', need: ['Cauliflower','Onion','Tomato','Ginger'], time: 22, diff: 'Easy', waste: 0.3 },
  { name: 'Oats Porridge', need: ['Oats','Milk','Banana','Berries'], time: 8, diff: 'Easy', waste: 0.15 },
  { name: 'Quinoa Bowl', need: ['Quinoa','Capsicum','Broccoli','Carrot'], time: 20, diff: 'Easy', waste: 0.3 },
  { name: 'Millet Upma', need: ['Millet','Onion','Carrot','Peas'], time: 20, diff: 'Easy', waste: 0.35 },
  { name: 'Spinach Dal', need: ['Toor Dal','Spinach','Tomato','Garlic'], time: 25, diff: 'Easy', waste: 0.3 },
  { name: 'Fruit Yoghurt Bowl', need: ['Yoghurt','Apple','Banana','Berries'], time: 5, diff: 'Easy', waste: 0.2 },
  { name: 'Cheese Veggie Wrap', need: ['Wheat Flour','Cheese','Capsicum','Cabbage'], time: 15, diff: 'Easy', waste: 0.25 },
  { name: 'Lemon Rice', need: ['Rice','Lemon','Peanuts'], time: 15, diff: 'Easy', waste: 0.2 },
  { name: 'Tomato Egg Curry', need: ['Eggs','Tomato','Onion','Ginger','Garlic'], time: 20, diff: 'Easy', waste: 0.3 },
  { name: 'Garlic Chicken Stir-Fry', need: ['Chicken','Garlic','Capsicum','Onion'], time: 22, diff: 'Medium', waste: 0.35 },
  { name: 'Beetroot Salad', need: ['Beetroot','Carrot','Lemon','Coriander'], time: 10, diff: 'Easy', waste: 0.2 },
  { name: 'Cucumber Raita', need: ['Cucumber','Yoghurt','Coriander'], time: 5, diff: 'Easy', waste: 0.15 },
  { name: 'Corn Salad', need: ['Corn','Onion','Tomato','Lemon'], time: 8, diff: 'Easy', waste: 0.2 },
  { name: 'Date & Nut Energy Bites', need: ['Dates','Almonds','Raisins'], time: 10, diff: 'Easy', waste: 0.1 },
  { name: 'Coconut Chutney', need: ['Coconut','Curd','Green Chilli'], time: 10, diff: 'Easy', waste: 0.15 },
  { name: 'Bread Upma', need: ['Bread','Onion','Tomato','Green Chilli'], time: 12, diff: 'Easy', waste: 0.25 },
];

const WASTE_MEALS = [
  { name: 'Zero-Waste Veggie Soup', need: ['Spinach','Tomato','Carrot','Onion'], time: 25, desc: 'Toss all your expiring veggies into one pot with spices and stock.', waste: 1.2 },
  { name: 'Leftover Rice Fritters', need: ['Rice','Onion','Green Chilli'], time: 20, desc: 'Mix cold rice with spices and shallow-fry into crispy patties.', waste: 0.8 },
  { name: 'Overripe Banana Pancakes', need: ['Banana','Wheat Flour','Milk'], time: 15, desc: 'Mash overripe bananas into batter for naturally sweet pancakes.', waste: 0.6 },
  { name: 'Stir-Fry Rescue Bowl', need: ['Capsicum','Cabbage','Beans','Garlic'], time: 18, desc: 'Quick wok rescue of any wilting vegetables with soy and garlic.', waste: 1.0 },
  { name: 'Dal Veggie Mash', need: ['Moong Dal','Spinach','Tomato'], time: 25, desc: 'Cook leftover dal with any expiring greens for a hearty bowl.', waste: 0.9 },
  { name: 'Ripe Tomato Pasta Sauce', need: ['Tomato','Garlic','Onion'], time: 20, desc: 'Blend soft tomatoes into a rich sauce before they spoil.', waste: 0.7 },
];

const TIPS = [
  'Drink a glass of water right after waking up — it kickstarts your metabolism.',
  'Half your plate should be vegetables at every main meal.',
  'Soak grains and legumes to improve digestion and nutrient absorption.',
  'Keep healthy snacks visible — you eat what you see.',
  'A 10-minute walk after meals helps regulate blood sugar.',
  'Freeze leftover herbs in oil for instant flavour later.',
  'Plan meals before shopping — it cuts food waste by up to 30%.',
  'Protein at breakfast keeps cravings down all day.',
  'Store bananas away from other fruits — they speed up ripening.',
  'One meatless day a week saves ~400 litres of water.',
  'Chew slowly — it takes 20 minutes for fullness signals to register.',
  'Wilted veggies? Drop them in soup instead of the bin.',
];

/* ============================================================
   MODULE: Nutrition Calculations
   Pure business logic — no DOM, no side effects.
   ============================================================ */
const Nutrition = {
  /** Calculate daily energy, protein, water and wellness score from a profile. */
  calcTargets(p) {
    const w = +p.weight, h = +p.height, a = +p.age;
    let bmr = 10 * w + 6.25 * h - 5 * a;
    bmr += (p.gender === 'Male') ? 5 : (p.gender === 'Female' ? -161 : -78);
    const factors = { sedentary: 1.3, lightly: 1.45, moderately: 1.55, very: 1.75, athlete: 2.0 };
    const f = factors[p.activity] || 1.4;
    let energy = bmr * f;
    if (p.goal === 'weight') energy -= 350;
    if (p.goal === 'muscle') energy += 350;
    if (p.goal === 'sports') energy += 200;
    energy = Math.max(1200, Math.round(energy));
    const proteinPerKg = p.goal === 'muscle' ? 1.6 : p.goal === 'weight' ? 1.2 : p.goal === 'sports' ? 1.5 : 1.0;
    const protein = Math.round(w * proteinPerKg);
    const water = Math.round((w * 0.035) * 10) / 10;
    const activityScore = Math.round(f * 50);
    const wellnessScore = Math.min(100, Math.round((f * 30) + (proteinPerKg * 20) + 30));
    return { energy, protein, water, activityScore, wellnessScore };
  },
};

/* ============================================================
   MODULE: Profile (Supabase CRUD)
   ============================================================ */
const ProfileService = {
  async save(profileData) {
    const sb = SupabaseClient.client;
    if (!sb) return this._offlineSave(profileData);
    const id = LocalStore.get(LS_KEYS.profileId, null);
    if (id) {
      const { data, error } = await sb.from('profiles').update(profileData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await sb.from('profiles').insert(profileData).select().single();
    if (error) throw error;
    LocalStore.set(LS_KEYS.profileId, data.id);
    return data;
  },

  async load() {
    const sb = SupabaseClient.client;
    if (!sb) return this._offlineLoad();
    const id = LocalStore.get(LS_KEYS.profileId, null);
    if (!id) return null;
    const { data, error } = await sb.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async reset() {
    const sb = SupabaseClient.client;
    const id = LocalStore.get(LS_KEYS.profileId, null);
    if (sb && id) {
      await sb.from('profiles').delete().eq('id', id);
    }
    LocalStore.del(LS_KEYS.profileId);
  },

  _offlineSave(data) {
    LocalStore.set('nutrify_profile_offline', data);
    return data;
  },
  _offlineLoad() {
    return LocalStore.get('nutrify_profile_offline', null);
  },
};

/* ============================================================
   MODULE: Meal Logs
   ============================================================ */
const MealLogService = {
  async log(profileId, mealType, mealName, kcal, protein) {
    const sb = SupabaseClient.client;
    if (!sb) return null;
    const { data, error } = await sb.from('meal_logs').insert({
      profile_id: profileId, meal_type: mealType, meal_name: mealName,
      calories: kcal, protein: protein,
    }).select().single();
    if (error) throw error;
    return data;
  },

  async getWeekly(profileId) {
    const sb = SupabaseClient.client;
    if (!sb) return [];
    const { data, error } = await sb.from('meal_logs')
      .select('logged_date, meal_type')
      .eq('profile_id', profileId)
      .order('logged_date', { ascending: true })
      .limit(100);
    if (error) throw error;
    return data || [];
  },
};

/* ============================================================
   MODULE: Water Logs
   ============================================================ */
const WaterLogService = {
  async log(profileId, glasses) {
    const sb = SupabaseClient.client;
    if (!sb) return null;
    const { data, error } = await sb.from('water_logs').insert({
      profile_id: profileId, glasses: glasses,
    }).select().single();
    if (error) throw error;
    return data;
  },

  async getWeekly(profileId) {
    const sb = SupabaseClient.client;
    if (!sb) return [];
    const { data, error } = await sb.from('water_logs')
      .select('logged_date, glasses')
      .eq('profile_id', profileId)
      .order('logged_date', { ascending: true })
      .limit(100);
    if (error) throw error;
    return data || [];
  },
};

/* ============================================================
   MODULE: Waste Logs
   ============================================================ */
const WasteLogService = {
  async log(profileId, ingredients, mealCreated, kgAvoided) {
    const sb = SupabaseClient.client;
    if (!sb) return null;
    const { data, error } = await sb.from('waste_logs').insert({
      profile_id: profileId, ingredients_rescued: ingredients,
      meal_created: mealCreated, kg_avoided: kgAvoided,
    }).select().single();
    if (error) throw error;
    return data;
  },

  async getAll(profileId) {
    const sb = SupabaseClient.client;
    if (!sb) return [];
    const { data, error } = await sb.from('waste_logs')
      .select('*')
      .eq('profile_id', profileId)
      .order('logged_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },
};

/* ============================================================
   MODULE: Challenge (7-Day)
   ============================================================ */
const ChallengeService = {
  async getDays(profileId) {
    const sb = SupabaseClient.client;
    if (!sb) return this._offlineGet();
    const { data, error } = await sb.from('challenge_days')
      .select('*')
      .eq('profile_id', profileId)
      .order('day_number', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async toggleDay(profileId, dayNumber, field, value) {
    const sb = SupabaseClient.client;
    if (!sb) return this._offlineToggle(dayNumber, field, value);
    // Try update first, then insert if not exists
    const { data: existing } = await sb.from('challenge_days')
      .select('*')
      .eq('profile_id', profileId)
      .eq('day_number', dayNumber)
      .maybeSingle();

    if (existing) {
      const { data, error } = await sb.from('challenge_days')
        .update({ [field]: value })
        .eq('id', existing.id)
        .select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await sb.from('challenge_days').insert({
      profile_id: profileId, day_number: dayNumber, [field]: value,
    }).select().single();
    if (error) throw error;
    return data;
  },

  _offlineState: null,
  _offlineGet() {
    if (!this._offlineState) {
      this._offlineState = Array.from({ length: 7 }, (_, i) => ({
        day_number: i + 1, balanced_meal: false, water_goal: false, used_leftovers: false,
      }));
    }
    return this._offlineState;
  },
  _offlineToggle(day, field, value) {
    const state = this._offlineGet();
    const d = state.find(s => s.day_number === day);
    if (d) d[field] = value;
    return d;
  },
};

/* ============================================================
   MODULE: Surveys (Community Impact)
   ============================================================ */
const SurveyService = {
  async getAll() {
    const sb = SupabaseClient.client;
    if (!sb) return [];
    const { data, error } = await sb.from('surveys').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async add(entry) {
    const sb = SupabaseClient.client;
    if (!sb) return entry;
    const { data, error } = await sb.from('surveys').insert(entry).select().single();
    if (error) throw error;
    return data;
  },
};

/* ============================================================
   MODULE: Interviews
   ============================================================ */
const InterviewService = {
  async getAll() {
    const sb = SupabaseClient.client;
    if (!sb) return [];
    const { data, error } = await sb.from('interviews').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async add(entry) {
    const sb = SupabaseClient.client;
    if (!sb) return entry;
    const { data, error } = await sb.from('interviews').insert(entry).select().single();
    if (error) throw error;
    return data;
  },
};

/* ============================================================
   APP STATE
   ============================================================ */
const App = {
  profile: null,
  charts: {},
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  SupabaseClient.init();
  initTheme();
  initLoader();
  initCursorGlow();
  initNavbar();
  initMobileMenu();
  initRipples();
  initScrollReveal();
  initProfile();
  initDashboard();
  initMeals();
  initChef();
  initWaste();
  initChallenge();
  initImpact();
  initSchool();
});

/* ---------- Loader ---------- */
function initLoader() {
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('opacity-0');
    setTimeout(() => loader.remove(), 700);
  }, 1600);
}

/* ---------- Cursor glow ---------- */
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;
  window.addEventListener('pointermove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}

/* ---------- Navbar ---------- */
function initNavbar() {
  const nav = document.getElementById('navbar');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- Mobile menu ---------- */
function initMobileMenu() {
  const btn = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => menu.classList.toggle('hidden'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.add('hidden')));
}

/* ---------- Ripple ---------- */
function initRipples() {
  document.querySelectorAll('.ripple').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const r = document.createElement('span');
      r.className = 'rip';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.style.width = r.style.height = size + 'px';
      r.style.left = (e.clientX - rect.left - size / 2) + 'px';
      r.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(r);
      setTimeout(() => r.remove(), 600);
    });
  });
}

/* ---------- Scroll reveal ---------- */
function initScrollReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ============================================================
   THEME
   ============================================================ */
function initTheme() {
  const saved = LocalStore.get(LS_KEYS.theme, null);
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    LocalStore.set(LS_KEYS.theme, dark ? 'dark' : 'light');
    Toast.info(dark ? 'Dark mode on' : 'Light mode on');
    Object.values(App.charts).forEach(c => c && c.update && c.update());
  });
}

function chartColors() {
  const dark = document.documentElement.classList.contains('dark');
  return { text: dark ? '#cbd5e1' : '#475569', grid: dark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.06)' };
}

/* ============================================================
   PROFILE
   ============================================================ */
function initProfile() {
  const form = document.getElementById('profile-form');
  const nameInput = document.getElementById('p-name');
  const avatarImg = document.getElementById('avatar-preview');
  const avatarName = document.getElementById('avatar-name');
  const savedBadge = document.getElementById('profile-saved-badge');

  function updateAvatar() {
    const name = nameInput.value.trim();
    avatarImg.src = Avatar.url(name || 'NutriBee');
    avatarName.textContent = name || 'Your Avatar';
  }
  nameInput.addEventListener('input', updateAvatar);

  // Load saved profile
  ProfileService.load().then(p => {
    if (p) {
      App.profile = p;
      fillForm(p);
      updateAvatar();
      savedBadge.classList.remove('hidden');
      renderDashboard();
      renderMeals();
    } else {
      updateAvatar();
    }
  }).catch(() => updateAvatar());

  function fillForm(p) {
    const fields = ['name','age','gender','date_of_birth','height','weight','profession','student_class','organization','city','country','activity','goal','diet'];
    fields.forEach(f => {
      const el = document.getElementById('p-' + f.replace(/_/g, '-'));
      if (el && p[f] != null) el.value = p[f];
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) { Toast.error('Please fill all required fields correctly.'); return; }

    const data = {};
    ['name','age','gender','date_of_birth','height','weight','profession','student_class','organization','city','country','activity','goal','diet'].forEach(f => {
      const el = document.getElementById('p-' + f.replace(/_/g, '-'));
      if (el && el.value) {
        data[f] = ['age','height','weight'].includes(f) ? +el.value : el.value;
      }
    });

    const btn = document.getElementById('profile-submit');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      const saved = await ProfileService.save(data);
      App.profile = saved;
      savedBadge.classList.remove('hidden');
      Toast.success('Profile saved! Your dashboard is ready.');
      renderDashboard();
      renderMeals();
      document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      Toast.error('Could not save profile. Please try again.');
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Profile';
    }
  });

  document.getElementById('reset-profile').addEventListener('click', async () => {
    await ProfileService.reset();
    App.profile = null;
    form.reset();
    savedBadge.classList.add('hidden');
    updateAvatar();
    renderDashboard();
    renderMeals();
    Toast.info('Profile cleared.');
  });
}

function validateForm(form) {
  let ok = true;
  form.querySelectorAll('[required]').forEach(input => {
    const errEl = form.querySelector(`.form-error[data-for="${input.id}"]`);
    const val = input.value.trim();
    let msg = '';
    if (!val) msg = 'This field is required.';
    else if (input.type === 'number') {
      const n = +val;
      const min = +input.min, max = +input.max;
      if (isNaN(n) || n < min || n > max) msg = `Enter a value between ${min} and ${max}.`;
    }
    if (msg) { ok = false; input.classList.add('invalid'); errEl.textContent = msg; }
    else { input.classList.remove('invalid'); errEl.textContent = ''; }
  });
  return ok;
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function initDashboard() {
  document.getElementById('new-tip').addEventListener('click', showTip);
}

async function renderDashboard() {
  const empty = document.getElementById('dashboard-empty');
  const content = document.getElementById('dashboard-content');
  const skeleton = document.getElementById('dashboard-skeleton');

  if (!App.profile) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    skeleton.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  skeleton.classList.remove('hidden');
  content.classList.add('hidden');

  const p = App.profile;
  const t = Nutrition.calcTargets(p);

  // Greeting
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dash-greet').textContent = greet + ',';
  document.getElementById('dash-name').textContent = p.name;
  const goalLabels = { maintain: 'Maintain Health', muscle: 'Build Muscle', energy: 'Increase Energy', weight: 'Weight Management', sports: 'Sports Performance' };
  const dietLabels = { veg: 'Vegetarian', vegan: 'Vegan', egg: 'Eggetarian', jain: 'Jain', nonveg: 'Non-Vegetarian' };
  document.getElementById('dash-sub').textContent = `${goalLabels[p.goal] || p.goal} • ${dietLabels[p.diet] || p.diet}`;
  document.getElementById('dash-avatar').src = Avatar.url(p.name);

  // Rings (showing targets, not fake "today" progress)
  setRing('energy', 0.75, Math.round(t.energy * 0.75));
  setRing('water', 0.6, (t.water * 0.6).toFixed(1));
  setRing('protein', 0.68, Math.round(t.protein * 0.68));
  setRing('wellness', t.wellnessScore / 100, t.wellnessScore);

  // Streak
  try {
    const days = await ChallengeService.getDays(p.id);
    const streak = calcChallengeStreak(days);
    document.getElementById('dash-streak').textContent = streak;
  } catch { document.getElementById('dash-streak').textContent = '0'; }

  // Tip
  showTip();

  // Charts from real data
  skeleton.classList.add('hidden');
  content.classList.remove('hidden');

  await drawDashboardCharts(p.id);
}

function setRing(key, pct, val) {
  const circ = 2 * Math.PI * 32;
  const ring = document.querySelector(`.ring-fg[data-ring="${key}"]`);
  const valEl = document.querySelector(`[data-ring-val="${key}"]`);
  if (ring) ring.style.strokeDashoffset = circ * (1 - pct);
  if (valEl) valEl.textContent = val;
}

function calcChallengeStreak(days) {
  let streak = 0;
  for (const d of days) {
    if (d.balanced_meal && d.water_goal && d.used_leftovers) streak++;
    else break;
  }
  return streak;
}

let tipIdx = 0;
function showTip() {
  tipIdx = Math.floor(Math.random() * TIPS.length);
  document.getElementById('wellness-tip').textContent = TIPS[tipIdx];
}

async function drawDashboardCharts(profileId) {
  const c = chartColors();

  // Weekly balanced meals — from meal_logs
  let mealData = [0,0,0,0,0,0,0];
  let hasMealData = false;
  try {
    const logs = await MealLogService.getWeekly(profileId);
    if (logs.length > 0) {
      hasMealData = true;
      const dayMap = {};
      logs.forEach(l => {
        const d = l.logged_date;
        dayMap[d] = (dayMap[d] || 0) + 1;
      });
      const last7 = getLast7Days();
      mealData = last7.map(d => dayMap[d] || 0);
    }
  } catch {}

  drawChart('meals', 'bar', {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    datasets: [{
      label: 'Balanced meals',
      data: mealData,
      backgroundColor: hasMealData ? 'rgba(34,197,94,.7)' : 'rgba(148,163,184,.2)',
      borderRadius: 8,
    }],
  }, {
    plugins: { legend: { display: false }, title: hasMealData ? { display: false } : { display: true, text: 'Log your first meal to see data', color: c.text, font: { size: 12 } } },
    scales: { y: { beginAtZero: true, max: 4, ticks: { stepSize: 1, color: c.text }, grid: { color: c.grid } }, x: { ticks: { color: c.text }, grid: { display: false } } },
  });

  // Water intake — from water_logs
  let waterData = [0,0,0,0,0,0,0];
  let hasWaterData = false;
  try {
    const logs = await WaterLogService.getWeekly(profileId);
    if (logs.length > 0) {
      hasWaterData = true;
      const dayMap = {};
      logs.forEach(l => { dayMap[l.logged_date] = l.glasses; });
      const last7 = getLast7Days();
      waterData = last7.map(d => dayMap[d] || 0);
    }
  } catch {}

  drawChart('water', 'line', {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    datasets: [{
      label: 'Glasses',
      data: waterData,
      borderColor: hasWaterData ? '#22C55E' : 'rgba(148,163,184,.3)',
      backgroundColor: hasWaterData ? 'rgba(34,197,94,.15)' : 'transparent',
      fill: hasWaterData, tension: .4, pointRadius: 5, pointBackgroundColor: '#F59E0B',
    }],
  }, {
    plugins: { legend: { display: false }, title: hasWaterData ? { display: false } : { display: true, text: 'Log water to see your intake', color: c.text, font: { size: 12 } } },
    scales: { y: { beginAtZero: true, ticks: { color: c.text }, grid: { color: c.grid } }, x: { ticks: { color: c.text }, grid: { display: false } } },
  });

  // Waste reduction — from waste_logs
  let wasteData = [0,0,0,0,0,0,0];
  let hasWasteData = false;
  try {
    const logs = await WasteLogService.getAll(profileId);
    if (logs.length > 0) {
      hasWasteData = true;
      const dayMap = {};
      logs.forEach(l => { dayMap[l.logged_date] = (dayMap[l.logged_date] || 0) + (+l.kg_avoided || 0); });
      const last7 = getLast7Days();
      wasteData = last7.map(d => +dayMap[d].toFixed(2) || 0);
    }
  } catch {}

  drawChart('waste', 'bar', {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    datasets: [{
      label: 'kg avoided',
      data: wasteData,
      backgroundColor: hasWasteData ? 'rgba(245,158,11,.7)' : 'rgba(148,163,184,.2)',
      borderRadius: 8,
    }],
  }, {
    plugins: { legend: { display: false }, title: hasWasteData ? { display: false } : { display: true, text: 'Rescue food to see your impact', color: c.text, font: { size: 12 } } },
    scales: { y: { beginAtZero: true, ticks: { color: c.text }, grid: { color: c.grid } }, x: { ticks: { color: c.text }, grid: { display: false } } },
  });
}

function drawChart(canvasId, type, data, options) {
  const ctx = document.getElementById('chart-' + canvasId);
  if (!ctx) return;
  if (App.charts[canvasId]) App.charts[canvasId].destroy();
  App.charts[canvasId] = new Chart(ctx, { type, data, options: { responsive: true, maintainAspectRatio: false, ...options } });
}

function getLast7Days() {
  const days = [];
  const today = new Date();
  // Align to Monday
  const dayOfWeek = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

/* ============================================================
   WHAT SHOULD I EAT TODAY
   ============================================================ */
function initMeals() {
  document.getElementById('generate-meals').addEventListener('click', () => {
    renderMeals(true);
  });
}

function renderMeals() {
  const empty = document.getElementById('meals-empty');
  const content = document.getElementById('meals-content');
  if (!App.profile) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  content.classList.remove('hidden');

  const p = App.profile;
  const t = Nutrition.calcTargets(p);
  const dietKey = MEAL_DB[p.diet] ? p.diet : 'veg';
  const db = MEAL_DB[dietKey];

  const goalLabels = { maintain: 'maintaining health', muscle: 'building muscle', energy: 'more energy', weight: 'weight management', sports: 'sports performance' };
  document.getElementById('meals-summary').textContent = `Plan for ${p.name} — ${goalLabels[p.goal] || p.goal}, ${p.diet} diet • ~${t.energy} kcal/day`;

  const grid = document.getElementById('meals-grid');
  grid.innerHTML = '';

  // Determine time-of-day appropriate first slot
  const hr = new Date().getHours();
  const slots = ['Breakfast','Lunch','Snack','Dinner'];

  slots.forEach((slot, i) => {
    const pool = db[slot];
    const meal = pool[Math.floor(Math.random() * pool.length)];
    const card = document.createElement('div');
    card.className = 'meal-card';
    card.style.animationDelay = (i * 0.1) + 's';
    const grad = {
      Breakfast: 'from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20',
      Lunch: 'from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20',
      Snack: 'from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/20',
      Dinner: 'from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20',
    }[slot];
    card.innerHTML = `
      <div class="meal-img bg-gradient-to-br ${grad}">${meal.img}</div>
      <div class="p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="meal-tag bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">${slot}</span>
          <span class="text-xs text-slate-500 dark:text-slate-400">⏱ ${meal.time} min</span>
        </div>
        <h4 class="font-bold text-sm">${meal.name}</h4>
        <div class="flex gap-3 mt-2 text-xs text-slate-600 dark:text-slate-300">
          <span>🔥 ${meal.kcal} kcal</span>
          <span>💪 ${meal.protein}g</span>
        </div>
        <p class="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">${meal.why}</p>
        <button class="log-meal-btn btn-ghost ripple mt-3 text-xs w-full" data-slot="${slot}" data-name="${meal.name}" data-kcal="${meal.kcal}" data-protein="${meal.protein}">Log this meal</button>
      </div>`;
    grid.appendChild(card);
  });

  // Wire up log buttons
  grid.querySelectorAll('.log-meal-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!App.profile) return;
      try {
        await MealLogService.log(App.profile.id, btn.dataset.slot, btn.dataset.name, +btn.dataset.kcal, +btn.dataset.protein);
        Toast.success(`${btn.dataset.name} logged!`);
        drawDashboardCharts(App.profile.id);
      } catch {
        Toast.error('Could not log meal.');
      }
    });
  });
}

/* ============================================================
   INGREDIENT CHEF
   ============================================================ */
function initChef() {
  const chipBox = document.getElementById('ingredient-chips');
  const searchInput = document.getElementById('chef-search');
  const selected = new Set(LocalStore.get(LS_KEYS.selectedIngredients, []));

  INGREDIENTS.forEach(ing => {
    const chip = document.createElement('button');
    chip.className = 'ing-chip' + (selected.has(ing) ? ' active' : '');
    chip.textContent = ing;
    chip.dataset.ing = ing;
    chip.addEventListener('click', () => {
      if (selected.has(ing)) { selected.delete(ing); chip.classList.remove('active'); }
      else { selected.add(ing); chip.classList.add('active'); }
      LocalStore.set(LS_KEYS.selectedIngredients, [...selected]);
      updateChefCount();
      renderRecipes();
    });
    chipBox.appendChild(chip);
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    chipBox.querySelectorAll('.ing-chip').forEach(c => {
      c.classList.toggle('hidden', !c.dataset.ing.toLowerCase().includes(q));
    });
  });

  document.getElementById('chef-clear').addEventListener('click', () => {
    selected.clear();
    LocalStore.set(LS_KEYS.selectedIngredients, []);
    chipBox.querySelectorAll('.ing-chip').forEach(c => c.classList.remove('active'));
    updateChefCount();
    renderRecipes();
  });

  document.getElementById('chef-surprise').addEventListener('click', () => {
    selected.clear();
    const shuffled = [...INGREDIENTS].sort(() => Math.random() - 0.5);
    const count = 5 + Math.floor(Math.random() * 3);
    shuffled.slice(0, count).forEach(i => selected.add(i));
    LocalStore.set(LS_KEYS.selectedIngredients, [...selected]);
    chipBox.querySelectorAll('.ing-chip').forEach(c => {
      c.classList.toggle('active', selected.has(c.dataset.ing));
    });
    updateChefCount();
    renderRecipes();
    Toast.info('Surprise ingredients selected!');
  });

  updateChefCount();
  renderRecipes();
}

function updateChefCount() {
  const selected = LocalStore.get(LS_KEYS.selectedIngredients, []);
  document.getElementById('chef-selected-count').textContent = `${selected.length} selected`;
}

function renderRecipes() {
  const selected = LocalStore.get(LS_KEYS.selectedIngredients, []);
  const empty = document.getElementById('chef-empty');
  const grid = document.getElementById('recipe-grid');
  grid.innerHTML = '';

  if (selected.length < 2) {
    empty.style.display = '';
    empty.querySelector('p').textContent = 'Select at least 2 ingredients to discover recipes.';
    return;
  }
  empty.style.display = 'none';

  const matches = RECIPES.map(r => {
    const have = r.need.filter(n => selected.includes(n));
    const pct = Math.round((have.length / r.need.length) * 100);
    return { ...r, have, pct };
  }).filter(r => r.pct >= 40).sort((a, b) => b.pct - a.pct).slice(0, 6);

  if (matches.length === 0) {
    empty.style.display = '';
    empty.querySelector('p').textContent = 'No recipes match yet — try adding more ingredients.';
    return;
  }

  matches.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.style.animationDelay = (i * 0.08) + 's';
    const diffColor = r.diff === 'Easy' ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300';
    const missing = r.need.filter(n => !r.have.includes(n));
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-bold">${r.name}</h4>
        <span class="waste-badge">♻️ ${r.waste.toFixed(1)}kg saved</span>
      </div>
      <div class="flex items-center justify-between text-sm mb-2">
        <span class="font-bold text-emerald-600 dark:text-emerald-300">${r.pct}% match</span>
        <span class="${diffColor} text-xs font-semibold">${r.diff} • ⏱ ${r.time}min</span>
      </div>
      <div class="match-bar"><div class="match-bar-fill" style="width:0"></div></div>
      <p class="mt-3 text-xs text-slate-500 dark:text-slate-400"><strong>Uses:</strong> ${r.have.join(', ') || '—'}</p>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1"><strong>Also needs:</strong> ${missing.join(', ') || 'Nothing — you have it all!'}</p>`;
    grid.appendChild(card);
    requestAnimationFrame(() => { card.querySelector('.match-bar-fill').style.width = r.pct + '%'; });
  });
}

/* ============================================================
   WASTE LESS
   ============================================================ */
function initWaste() {
  const box = document.getElementById('waste-ingredients');
  const expiringPool = ['Spinach','Tomato','Banana','Yoghurt','Carrot','Capsicum','Cabbage','Broccoli'];

  box.innerHTML = '';
  expiringPool.forEach(ing => {
    const chip = document.createElement('button');
    chip.className = 'ing-chip';
    chip.textContent = ing;
    chip.addEventListener('click', () => chip.classList.toggle('active'));
    box.appendChild(chip);
  });

  updateWasteMeter();

  document.getElementById('waste-generate').addEventListener('click', async () => {
    const marked = [...box.querySelectorAll('.ing-chip.active')].map(c => c.textContent);
    if (marked.length === 0) { Toast.error('Mark ingredients that are expiring first.'); return; }

    const meal = WASTE_MEALS
      .map(m => ({ ...m, match: m.need.filter(n => marked.includes(n)).length }))
      .sort((a, b) => b.match - a.match)[0];

    const mealBox = document.getElementById('waste-meal');
    mealBox.innerHTML = `
      <div class="recipe-card" style="animation-delay:0s">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-bold">${meal.name}</h4>
          <span class="waste-badge">♻️ ${meal.waste}kg saved</span>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-300">${meal.desc}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2"><strong>Uses:</strong> ${meal.need.join(', ')}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">⏱ ${meal.time} min</p>
      </div>`;

    // Log to Supabase
    if (App.profile) {
      try {
        await WasteLogService.log(App.profile.id, marked, meal.name, meal.waste);
        Toast.success(`Rescued ${meal.waste}kg of food!`);
        drawDashboardCharts(App.profile.id);
      } catch {
        Toast.error('Meal generated, but could not save to database.');
      }
    } else {
      Toast.success(`Rescued ${meal.waste}kg of food! (Save a profile to track.)`);
    }

    updateWasteMeter();
  });
}

async function updateWasteMeter() {
  if (!App.profile) {
    document.getElementById('waste-meter-fill').style.width = '0%';
    document.getElementById('waste-rescued').textContent = '0';
    document.getElementById('waste-avoided').textContent = '0';
    document.getElementById('rescue-streak').textContent = '0-day streak';
    return;
  }
  try {
    const logs = await WasteLogService.getAll(App.profile.id);
    const totalAvoided = logs.reduce((s, l) => s + (+l.kg_avoided || 0), 0);
    const allRescued = new Set();
    logs.forEach(l => (l.ingredients_rescued || []).forEach(i => allRescued.add(i)));
    const pct = Math.min(100, totalAvoided * 10);
    document.getElementById('waste-meter-fill').style.width = pct + '%';
    document.getElementById('waste-rescued').textContent = allRescued.size;
    document.getElementById('waste-avoided').textContent = totalAvoided.toFixed(1);
    // streak = count of distinct dates
    const dates = new Set(logs.map(l => l.logged_date));
    document.getElementById('rescue-streak').textContent = `${dates.size}-day streak`;
  } catch {
    document.getElementById('waste-meter-fill').style.width = '0%';
  }
}

/* ============================================================
   7-DAY CHALLENGE
   ============================================================ */
function initChallenge() {
  renderChallenge();
}

async function renderChallenge() {
  const grid = document.getElementById('challenge-grid');
  const dayLabels = ['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6','Day 7'];
  const tasks = [
    { id: 'balanced_meal', label: 'Balanced meal', icon: '🍽️' },
    { id: 'water_goal', label: '8 glasses water', icon: '💧' },
    { id: 'used_leftovers', label: 'Used leftovers', icon: '♻️' },
  ];

  let days = [];
  if (App.profile) {
    try { days = await ChallengeService.getDays(App.profile.id); } catch {}
  }
  // Ensure 7 entries
  while (days.length < 7) {
    days.push({ day_number: days.length + 1, balanced_meal: false, water_goal: false, used_leftovers: false });
  }

  grid.innerHTML = '';
  days.forEach((day, di) => {
    const allDone = tasks.every(t => day[t.id]);
    const card = document.createElement('div');
    card.className = 'chal-card' + (allDone ? ' complete' : '');
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-bold text-sm">${dayLabels[di]}</h4>
        <span class="text-lg">${allDone ? '✅' : '⬜'}</span>
      </div>`;
    tasks.forEach(t => {
      const check = document.createElement('div');
      check.className = 'chal-check' + (day[t.id] ? ' done' : '');
      check.innerHTML = `<span class="box"></span><span>${t.icon} ${t.label}</span>`;
      check.addEventListener('click', async () => {
        if (!App.profile) { Toast.error('Save a profile first to track your challenge.'); return; }
        const newVal = !day[t.id];
        day[t.id] = newVal;
        check.classList.toggle('done', newVal);
        try {
          await ChallengeService.toggleDay(App.profile.id, day.day_number, t.id, newVal);
          recomputeChallenge(days);
          renderChallenge();
        } catch {
          Toast.error('Could not save challenge progress.');
          day[t.id] = !newVal;
          check.classList.toggle('done', !newVal);
        }
      });
      card.appendChild(check);
    });
    grid.appendChild(card);
  });

  recomputeChallenge(days);
}

function recomputeChallenge(days) {
  const totalTasks = 21;
  const done = days.reduce((s, d) => s + ['balanced_meal','water_goal','used_leftovers'].filter(t => d[t]).length, 0);
  let streak = 0;
  for (const d of days) {
    if (d.balanced_meal && d.water_goal && d.used_leftovers) streak++;
    else break;
  }
  const pct = Math.round((done / totalTasks) * 100);
  document.getElementById('chal-completion').textContent = pct + '%';
  document.getElementById('chal-streak').textContent = streak;
  document.getElementById('chal-score').textContent = done;
  if (done === totalTasks) fireConfetti();
}

/* ---------- Confetti ---------- */
function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#22C55E','#F59E0B','#166534','#FDE68A','#34D399'];
  const pieces = [];
  for (let i = 0; i < 150; i++) {
    pieces.push({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 200,
      r: 4 + Math.random() * 6, c: colors[Math.floor(Math.random() * colors.length)],
      vx: -2 + Math.random() * 4, vy: 2 + Math.random() * 4,
      rot: Math.random() * 360, vr: -5 + Math.random() * 10,
    });
  }
  let frame = 0;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.05;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); ctx.restore();
    });
    frame++;
    if (frame < 200) requestAnimationFrame(loop);
    else { canvas.style.display = 'none'; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }
  loop();
  Toast.success('Challenge complete! You did it!');
}

/* ============================================================
   COMMUNITY IMPACT
   ============================================================ */
function initImpact() {
  document.getElementById('impact-submit').addEventListener('click', async () => {
    const v = +document.getElementById('i-volunteers').value || 0;
    const b = +document.getElementById('i-before').value || 0;
    const a = +document.getElementById('i-after').value || 0;
    const ap = +document.getElementById('i-participants').value || 0;
    const label = document.getElementById('i-label').value || null;

    if (v === 0 && b === 0 && a === 0 && ap === 0) {
      Toast.error('Enter at least one value to save a survey entry.');
      return;
    }

    try {
      await SurveyService.add({ total_volunteers: v, before_average: b, after_average: a, active_participants: ap, label });
      Toast.success('Survey entry saved!');
      // Clear inputs
      ['i-volunteers','i-before','i-after','i-participants','i-label'].forEach(id => document.getElementById(id).value = '');
      renderImpact();
    } catch {
      Toast.error('Could not save survey entry.');
    }
  });

  // Interview form
  const form = document.getElementById('interview-form');
  document.getElementById('add-quote-btn').addEventListener('click', () => form.classList.toggle('hidden'));
  document.getElementById('iv-cancel').addEventListener('click', () => form.classList.add('hidden'));
  document.getElementById('iv-submit').addEventListener('click', async () => {
    const name = document.getElementById('iv-name').value.trim();
    const profession = document.getElementById('iv-profession').value.trim();
    const quote = document.getElementById('iv-quote').value.trim();
    if (!name || !quote) { Toast.error('Name and quote are required.'); return; }
    try {
      await InterviewService.add({ name, profession, quote });
      Toast.success('Interview added!');
      ['iv-name','iv-profession','iv-quote'].forEach(id => document.getElementById(id).value = '');
      form.classList.add('hidden');
      renderInterviews();
    } catch {
      Toast.error('Could not save interview.');
    }
  });

  renderImpact();
}

async function renderImpact() {
  const metricsGrid = document.getElementById('impact-metrics');
  let surveys = [];
  try { surveys = await SurveyService.getAll(); } catch {}

  if (surveys.length === 0) {
    metricsGrid.innerHTML = `
      <div class="glass-card col-span-full empty-state">
        <div class="empty-state-icon">📊</div>
        <h3 class="font-bold mt-2">No community data collected yet</h3>
        <p class="empty-state-msg">Collect your first volunteer to begin measuring impact.</p>
      </div>`;
  } else {
    const totalVol = surveys.reduce((s, e) => s + (+e.total_volunteers || 0), 0);
    const totalActive = surveys.reduce((s, e) => s + (+e.active_participants || 0), 0);
    const beforeAvg = surveys.filter(e => e.before_average != null).map(e => +e.before_average);
    const afterAvg = surveys.filter(e => e.after_average != null).map(e => +e.after_average);
    const beforeMean = beforeAvg.length ? (beforeAvg.reduce((a,b) => a+b, 0) / beforeAvg.length) : null;
    const afterMean = afterAvg.length ? (afterAvg.reduce((a,b) => a+b, 0) / afterAvg.length) : null;
    const improvement = (beforeMean != null && afterMean != null && beforeMean > 0) ? Math.round(((afterMean - beforeMean) / beforeMean) * 100) : null;

    const cards = [
      { label: 'Total Volunteers', value: totalVol, icon: '👥', color: 'text-emerald-500' },
      { label: 'Before Average', value: beforeMean != null ? beforeMean.toFixed(1) : '—', icon: '📉', color: 'text-amber-500' },
      { label: 'After Average', value: afterMean != null ? afterMean.toFixed(1) : '—', icon: '📈', color: 'text-emerald-500' },
      { label: 'Improvement', value: improvement != null ? improvement + '%' : '—', icon: '✨', color: 'text-green-700 dark:text-emerald-300' },
    ];
    metricsGrid.innerHTML = cards.map(m => `
      <div class="metric-card reveal in">
        <div class="text-3xl">${m.icon}</div>
        <div class="metric-value ${m.color} mt-2">${m.value}</div>
        <div class="metric-label">${m.label}</div>
      </div>`).join('') + `
      <div class="metric-card reveal in">
        <div class="text-3xl">🏅</div>
        <div class="metric-value text-amber-500 mt-2">${totalActive}</div>
        <div class="metric-label">Active Participants</div>
      </div>`;
  }

  drawImpactChart(surveys);
}

function drawImpactChart(surveys) {
  const c = chartColors();
  const hasData = surveys.length > 0;
  const labels = surveys.map((s, i) => s.label || `Entry ${i + 1}`);
  const beforeData = surveys.map(s => +s.before_average || 0);
  const afterData = surveys.map(s => +s.after_average || 0);

  drawChart('impact', 'bar', {
    labels: hasData ? labels : ['No data yet'],
    datasets: [
      { label: 'Before', data: hasData ? beforeData : [0], backgroundColor: 'rgba(245,158,11,.7)', borderRadius: 8 },
      { label: 'After', data: hasData ? afterData : [0], backgroundColor: 'rgba(34,197,94,.7)', borderRadius: 8 },
    ],
  }, {
    plugins: {
      legend: { display: true, labels: { color: c.text } },
      title: hasData ? { display: false } : { display: true, text: 'Add survey entries to see the comparison', color: c.text, font: { size: 13 } },
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { color: c.text }, grid: { color: c.grid } },
      x: { ticks: { color: c.text }, grid: { display: false } },
    },
  });
}

async function renderInterviews() {
  const grid = document.getElementById('quote-grid');
  let interviews = [];
  try { interviews = await InterviewService.getAll(); } catch {}

  if (interviews.length === 0) {
    grid.innerHTML = `
      <div class="glass-card col-span-full empty-state">
        <div class="empty-state-icon">💬</div>
        <h3 class="font-bold mt-2">No interviews yet</h3>
        <p class="empty-state-msg">Add your first interview to start building the wall.</p>
      </div>`;
    return;
  }

  grid.innerHTML = interviews.map(q => `
    <div class="quote-card reveal in">
      <div class="flex items-center gap-3 mb-3">
        <img src="${Avatar.url(q.name)}" alt="${q.name}" class="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40" />
        <div>
          <h4 class="font-bold text-sm">${q.name}</h4>
          <p class="text-xs text-emerald-600 dark:text-emerald-300 font-semibold">${q.profession || '—'}</p>
        </div>
      </div>
      <p class="text-sm text-slate-600 dark:text-slate-300 italic">"${q.quote}"</p>
      <p class="text-xs text-slate-400 mt-3">${q.interview_date || ''}</p>
    </div>`).join('');
}

/* ============================================================
   SCHOOL HUB
   ============================================================ */
function initSchool() {
  document.getElementById('print-poster').addEventListener('click', () => {
    const w = window.open('', '_blank');
    if (!w) { Toast.error('Please allow pop-ups to print the poster.'); return; }
    w.document.write(`
      <html><head><title>Nutrify 7-Day Challenge Poster</title>
      <style>
        body{font-family:Poppins,sans-serif;padding:40px;text-align:center;background:#ECFDF5}
        h1{color:#166534;font-size:2.5rem}
        .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;margin-top:30px}
        .day{border:2px solid #22C55E;border-radius:12px;padding:15px;background:#fff}
        .day h3{margin:0 0 10px;color:#166534}
        .box{width:20px;height:20px;border:2px solid #94a3b8;border-radius:5px;display:inline-block;margin:4px}
        .bee{font-size:3rem}
      </style></head><body>
      <div class="bee">🐝</div>
      <h1>Nutrify 7-Day Challenge</h1>
      <p>Fuel Every Body. Waste No Food.</p>
      <div class="grid">
        ${['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6','Day 7'].map(d => `
          <div class="day"><h3>${d}</h3>
          <div>🍽️ <span class="box"></span></div>
          <div>💧 <span class="box"></span></div>
          <div>♻️ <span class="box"></span></div></div>`).join('')}
      </div>
      <p style="margin-top:30px;color:#64748b">Tick a box each day. Complete all 21 to win!</p>
      </body></html>`);
    w.document.close();
    w.print();
  });
}
