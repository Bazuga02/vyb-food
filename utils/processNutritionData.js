const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

function processNutritionData() {
  try {
    // Read the CSV file
    const csvFilePath = path.join(
      __dirname,
      "../data/Assignment Inputs - Nutrition source.csv"
    );
    const fileContent = fs.readFileSync(csvFilePath, "utf-8");

    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Transform the data
    const nutritionData = records.map((record) => ({
      food_code: record.food_code,
      food_name: record.food_name,
      food_group: record["Primary food group"],
      nutrition: {
        energy_kj: parseFloat(record.energy_kj) || 0,
        energy_kcal: parseFloat(record.energy_kcal) || 0,
        carb_g: parseFloat(record.carb_g) || 0,
        protein_g: parseFloat(record.protein_g) || 0,
        fat_g: parseFloat(record.fat_g) || 0,
        free_sugar_g: parseFloat(record.freesugar_g) || 0,
        fibre_g: parseFloat(record.fibre_g) || 0,
      },
    }));

    // Write to JSON file
    const outputPath = path.join(__dirname, "../data/nutrition-db.json");
    fs.writeFileSync(outputPath, JSON.stringify(nutritionData, null, 2));

    console.log("Successfully processed nutrition data!");
    return nutritionData;
  } catch (error) {
    console.error("Error processing nutrition data:", error);
    throw error;
  }
}

// Run the processor
processNutritionData();

module.exports = processNutritionData;
