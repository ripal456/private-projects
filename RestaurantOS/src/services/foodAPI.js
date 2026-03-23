/**
 * Food API Service
 * Fetches meal data from TheMealDB (https://www.themealdb.com/)
 * Free API - no authentication required
 */

const THEMEALDB_API = "https://www.themealdb.com/api/json/v1/1";

/**
 * Get meals by category
 * @param {string} category - Meal category (Seafood, Vegetarian, Pasta, etc.)
 * @returns {Promise<Array>} Array of meals
 */
export async function getMealsByCategory(category) {
  try {
    const response = await fetch(`${THEMEALDB_API}/filter.php?c=${category}`);
    if (!response.ok) throw new Error("Failed to fetch meals");
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

/**
 * Get meal details by ID
 * @param {string} id - Meal ID
 * @returns {Promise<Object>} Meal details
 */
export async function getMealDetails(id) {
  try {
    const response = await fetch(`${THEMEALDB_API}/lookup.php?i=${id}`);
    if (!response.ok) throw new Error("Failed to fetch meal details");
    const data = await response.json();
    return data.meals?.[0] || null;
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
}

/**
 * Get all meal categories
 * @returns {Promise<Array>} Array of category names
 */
export async function getCategories() {
  try {
    const response = await fetch(`${THEMEALDB_API}/categories.php`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    const data = await response.json();
    return data.categories.map((cat) => cat.strCategory) || [];
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

/**
 * Transform TheMealDB meal to RestaurantOS menu format
 * @param {Object} meal - Raw meal from API
 * @param {string} categoryFilter - The category filter used (for backup)
 * @returns {Object} Formatted menu item
 */
export function transformMealToMenuItem(meal, categoryFilter = "", index = 0) {
  // Map category names to emojis
  const emojiMap = {
    Seafood: "🦞",
    Vegetarian: "🥗",
    Pasta: "🍝",
    Dessert: "🍰",
    Breakfast: "🥞",
    Chicken: "🍗",
    Beef: "🥩",
    Vegan: "🌱",
  };

  // Use provided category filter if meal category is missing
  const mealCategory = meal.strCategory || categoryFilter || "Other";
  const emoji = emojiMap[mealCategory] || emojiMap[categoryFilter] || "🍽️";

  // Generate price (random between €8-€20)
  const price = parseFloat((Math.random() * 12 + 8).toFixed(2));

  // Assign badges based on index
  const badges = ["Popular", "Chef", "New"];
  const badge = index < 3 ? badges[index] : null;

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    desc: meal.strCategory || "Delicious dish",
    price: price,
    emoji: emoji,
    category: mealCategory,
    badge: badge,
    imageUrl: meal.strMealThumb,
    instructions: meal.strInstructions || "Chef's special",
  };
}

/**
 * Load all menu items from API
 * Categories: Seafood, Vegetarian, Pasta, Dessert, Breakfast, Chicken, Beef, Vegan
 * @returns {Promise<Array>} Complete menu
 */
export async function loadCompleteMenu() {
  const categories = [
    "Beef",
    "Breakfast",
    "Chicken",
    "Dessert",
    "Pasta",
    "Seafood",
    "Vegan",
    "Vegetarian",
  ];
  const menus = [];

  for (const category of categories) {
    try {
      const meals = await getMealsByCategory(category);
      const transformed = meals
        .slice(0, 6) // Load 6 items per category = 48 total items
        .map((meal, index) => transformMealToMenuItem(meal, category, index));
      menus.push(...transformed);
    } catch (error) {
      console.error(`Failed to load ${category}:`, error);
    }
  }

  return menus;
}

/**
 * Search meals by name
 * @param {string} query - Search term
 * @returns {Promise<Array>} Matching meals
 */
export async function searchMeals(query) {
  try {
    const response = await fetch(`${THEMEALDB_API}/search.php?s=${query}`);
    if (!response.ok) throw new Error("Failed to search meals");
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}
