const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

class NutritionEstimator {
  constructor() {
    this.nutritionDB = this.loadJSONFile("../data/nutrition-db.json");
    this.unitMapping = this.loadJSONFile("../data/unit-mapping.json");
    this.ingredientMapping = this.loadJSONFile(
      "../data/ingredient-mapping.json"
    );
    this.commonIngredients = this.loadJSONFile(
      "../data/common-indian-ingredients.json"
    );

    // Initialize Gemini with API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    this.gemini = new GoogleGenerativeAI(apiKey);

    this.dishTypes = [
      "Wet Sabzi",
      "Dry Sabzi",
      "Dal",
      "Rice",
      "Roti",
      "Curry",
      "Snack",
      "Dessert",
      "Soup",
      "Mixed Dish",
    ];
  }

  loadJSONFile(filePath) {
    const fullPath = path.join(__dirname, filePath);
    return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  }

  async fetchIngredients(dishName) {
    try {
      const model = this.gemini.getGenerativeModel({
        model: "gemini-2.0-flash",
      });
      const prompt = `For the Indian dish "${dishName}", extract ingredients and their quantities. 
IMPORTANT: You must respond ONLY with a JSON array of objects. Each object must have exactly these fields: 'ingredient', 'quantity', and 'unit'.
Rules:
1. Use decimal numbers for quantities (e.g., 0.5 instead of 1/2)
2. Do not include any markdown formatting or code blocks
3. Do not include any explanations or additional text

Example format:
[
  {"ingredient": "potato", "quantity": 2, "unit": "medium"},
  {"ingredient": "cumin seeds", "quantity": 0.5, "unit": "teaspoon"}
]`;

      const result = await model.generateContent({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      });

      const text = result.response.text();
      // Clean the response text
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();

      // Try to extract JSON from the response
      const jsonStart = cleanedText.indexOf("[");
      const jsonEnd = cleanedText.lastIndexOf("]");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = cleanedText.substring(jsonStart, jsonEnd + 1);
        try {
          return JSON.parse(jsonStr);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          console.error("Received text:", cleanedText);
          return [];
        }
      }
      console.error("No JSON array found in response:", cleanedText);
      return [];
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      return [];
    }
  }

  mapIngredientToDB(ingredient) {
    // First check common ingredients
    const normalizedIngredient = ingredient.toLowerCase();

    // Check in common ingredients
    for (const category of Object.keys(this.commonIngredients)) {
      if (this.commonIngredients[category][normalizedIngredient]) {
        return {
          food_name: normalizedIngredient,
          nutrition: this.commonIngredients[category][normalizedIngredient],
        };
      }
    }

    // If not found in common ingredients, try the mapping
    const flatMapping = {};
    Object.entries(this.ingredientMapping).forEach(([category, items]) => {
      Object.entries(items).forEach(([key, values]) => {
        flatMapping[key] = key;
        values.forEach((value) => {
          flatMapping[value.toLowerCase()] = key;
        });
      });
    });

    const mappedName = flatMapping[normalizedIngredient];
    if (!mappedName) {
      return null;
    }

    // Find in nutrition DB
    return this.nutritionDB.find((item) =>
      item.food_name.toLowerCase().includes(mappedName.toLowerCase())
    );
  }

  convertToGrams(quantity, unit, ingredient) {
    if (!quantity || !unit) return 0;

    const unitType = Object.keys(this.unitMapping).find(
      (type) => this.unitMapping[type][unit]
    );

    if (!unitType) return 0;

    const unitData = this.unitMapping[unitType][unit];

    if (unitType === "volume") {
      const densityAdjustment =
        unitData.density_adjustments[ingredient] || unitData.default;
      return quantity * densityAdjustment;
    } else if (unitType === "weight") {
      return quantity * unitData;
    } else if (unitType === "count") {
      return quantity * unitData.default;
    }

    return 0;
  }

  calculateNutrition(ingredients) {
    let totalWeight = 0;
    let totalNutrition = {
      energy_kcal: 0,
      carb_g: 0,
      protein_g: 0,
      fat_g: 0,
      free_sugar_g: 0,
      fibre_g: 0,
    };

    ingredients.forEach(({ ingredient, quantity, unit }) => {
      const dbEntry = this.mapIngredientToDB(ingredient);
      if (!dbEntry) return;

      const weightInGrams = this.convertToGrams(quantity, unit, ingredient);
      if (weightInGrams <= 0) return;

      totalWeight += weightInGrams;
      Object.keys(totalNutrition).forEach((nutrient) => {
        totalNutrition[nutrient] +=
          (dbEntry.nutrition[nutrient] * weightInGrams) / 100;
      });
    });

    // Normalize to per 100g basis
    if (totalWeight > 0) {
      Object.keys(totalNutrition).forEach((nutrient) => {
        totalNutrition[nutrient] =
          (totalNutrition[nutrient] * 100) / totalWeight;
      });
    }

    return {
      totalWeight,
      nutritionPer100g: totalNutrition,
      nutritionPerKatori: this.scaleToKatori(totalNutrition, totalWeight),
    };
  }

  scaleToKatori(nutritionPer100g, totalWeight) {
    const katoriWeight = 180; // standard katori size
    const scaledNutrition = {};

    Object.entries(nutritionPer100g).forEach(([nutrient, value]) => {
      scaledNutrition[nutrient] = (value * katoriWeight) / 100;
    });

    return scaledNutrition;
  }

  identifyDishType(dishName, ingredients) {
    // Simple rule-based classification
    const dishNameLower = dishName.toLowerCase();

    if (dishNameLower.includes("dal")) return "Dal";
    if (dishNameLower.includes("rice")) return "Rice";
    if (dishNameLower.includes("roti") || dishNameLower.includes("chapati"))
      return "Roti";

    const hasGravy = ingredients.some((ing) =>
      ["tomato", "tamatar", "onion", "pyaaz"].includes(
        ing.ingredient.toLowerCase()
      )
    );

    return hasGravy ? "Wet Sabzi" : "Dry Sabzi";
  }

  async estimateNutrition(dishName) {
    const assumptions = [];
    const ingredients = await this.fetchIngredients(dishName);

    // Log assumptions
    if (ingredients.length === 0) {
      assumptions.push("No ingredients found, using default recipe");
    }

    ingredients.forEach((ing) => {
      if (!this.mapIngredientToDB(ing.ingredient)) {
        assumptions.push(
          `Ingredient "${ing.ingredient}" not found in nutrition DB, using closest match`
        );
      }
      if (!ing.quantity || !ing.unit) {
        assumptions.push(
          `Missing quantity/unit for "${ing.ingredient}", using default values`
        );
      }
    });

    const nutrition = this.calculateNutrition(ingredients);
    const dishType = this.identifyDishType(dishName, ingredients);

    return {
      dishName,
      dishType,
      assumptions,
      ingredients,
      nutrition,
    };
  }
}

module.exports = NutritionEstimator;
