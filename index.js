const express = require("express");
const NutritionEstimator = require("./utils/NutritionEstimator");
const fs = require("fs");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./swagger");

const app = express();
app.use(express.json());

// Initialize the nutrition estimator
const estimator = new NutritionEstimator();

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: Swagger API documentation
 *     description: Interactive API documentation for the Nutrition Estimator
 *     tags: [Documentation]
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

/**
 * @swagger
 * /estimate:
 *   post:
 *     summary: Estimate nutrition for a dish
 *     description: Calculate nutrition information for an Indian home-cooked dish
 *     tags: [Nutrition]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dishName
 *             properties:
 *               dishName:
 *                 type: string
 *                 description: Name of the dish
 *                 example: "Jeera Aloo (mild fried)"
 *     responses:
 *       200:
 *         description: Successful nutrition estimation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NutritionEstimate'
 *       400:
 *         description: Bad request - missing dish name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post("/estimate", async (req, res) => {
  try {
    const { dishName } = req.body;
    if (!dishName) {
      return res.status(400).json({ error: "Dish name is required" });
    }

    const result = await estimator.estimateNutrition(dishName);
    res.json(result);
  } catch (error) {
    console.error("Error estimating nutrition:", error);
    res.status(500).json({ error: "Failed to estimate nutrition" });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Nutrition Estimator is running!"
 */
app.get("/", (req, res) => {
  res.send("Nutrition Estimator is running!");
});

// Process test dishes
async function processTestDishes() {
  const testDishes = JSON.parse(
    fs.readFileSync(path.join(__dirname, "test-dishes.json"), "utf-8")
  );
  const results = [];
  const debugLog = [];

  for (const testCase of testDishes) {
    console.log(`\nProcessing: ${testCase.dish}`);
    debugLog.push(`\n=== Processing: ${testCase.dish} ===`);
    debugLog.push(`Known issues: ${testCase.issues.join(", ")}`);

    try {
      const result = await estimator.estimateNutrition(testCase.dish);
      results.push(result);

      debugLog.push("\nAssumptions made:");
      result.assumptions.forEach((assumption) => {
        debugLog.push(`- ${assumption}`);
      });

      debugLog.push("\nIngredients identified:");
      result.ingredients.forEach((ing) => {
        debugLog.push(
          `- ${ing.ingredient}: ${ing.quantity || "N/A"} ${ing.unit || "N/A"}`
        );
      });

      debugLog.push("\nNutrition per katori:");
      Object.entries(result.nutrition.nutritionPerKatori).forEach(
        ([nutrient, value]) => {
          debugLog.push(`- ${nutrient}: ${value.toFixed(2)}`);
        }
      );
    } catch (error) {
      console.error(`Error processing ${testCase.dish}:`, error);
      debugLog.push(`\nError: ${error.message}`);
    }
  }

  // Write results to files
  fs.writeFileSync(
    path.join(__dirname, "results.json"),
    JSON.stringify(results, null, 2)
  );

  fs.writeFileSync(path.join(__dirname, "debug-log.txt"), debugLog.join("\n"));

  console.log(
    "Processing complete! Check results.json and debug-log.txt for details."
  );

  // Close the application after processing
  process.exit(0);
}

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(
    `API Documentation available at http://localhost:${port}/api-docs`
  );
  // Process test dishes after server starts
  processTestDishes().catch(console.error);
});
