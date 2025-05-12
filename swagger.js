const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Nutrition Estimator API",
      version: "1.0.0",
      description:
        "A smart API for estimating nutrition information of Indian home-cooked dishes",
      contact: {
        name: "VYB AI",
        url: "https://vyb.ai",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        NutritionEstimate: {
          type: "object",
          properties: {
            dishName: {
              type: "string",
              description: "Name of the dish",
              example: "Jeera Aloo (mild fried)",
            },
            dishType: {
              type: "string",
              description: "Type of the dish",
              example: "Dry Sabzi",
              enum: [
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
              ],
            },
            assumptions: {
              type: "array",
              items: {
                type: "string",
              },
              description: "List of assumptions made during estimation",
              example: [
                "Using default recipe for Jeera Aloo",
                'Ingredient "cumin" mapped to closest match',
              ],
            },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ingredient: {
                    type: "string",
                    example: "potato",
                  },
                  quantity: {
                    type: "number",
                    example: 2,
                  },
                  unit: {
                    type: "string",
                    example: "medium",
                  },
                },
              },
              description: "List of ingredients with quantities",
            },
            nutrition: {
              type: "object",
              properties: {
                totalWeight: {
                  type: "number",
                  description: "Total weight in grams",
                  example: 500,
                },
                nutritionPer100g: {
                  type: "object",
                  properties: {
                    energy_kcal: { type: "number", example: 191.27 },
                    carb_g: { type: "number", example: 26.37 },
                    protein_g: { type: "number", example: 4.37 },
                    fat_g: { type: "number", example: 7.27 },
                    free_sugar_g: { type: "number", example: 2.71 },
                    fibre_g: { type: "number", example: 5.16 },
                  },
                },
                nutritionPerKatori: {
                  type: "object",
                  properties: {
                    energy_kcal: { type: "number", example: 344.286 },
                    carb_g: { type: "number", example: 47.466 },
                    protein_g: { type: "number", example: 7.866 },
                    fat_g: { type: "number", example: 13.086 },
                    free_sugar_g: { type: "number", example: 4.878 },
                    fibre_g: { type: "number", example: 9.288 },
                  },
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
              example: "Dish name is required",
            },
          },
        },
      },
    },
  },
  apis: ["./index.js"], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
