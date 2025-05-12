# Smart Nutrition Estimator

A resilient system that estimates nutrition information for Indian home-cooked dishes, even when dealing with partial, ambiguous, or broken data.

## Features

- Ingredient extraction from dish names using AI
- Smart ingredient mapping with synonyms and variations
- Unit conversion with density adjustments
- Nutrition calculation per 100g and per katori
- Dish type classification
- Comprehensive logging and assumption tracking
- Edge case handling

## API Documentation

The API documentation is available at: [API Documentation](https://vyb-food.onrender.com/api-doc)

## Project Structure

```
nutrition-estimator/
├── data/
│   ├── nutrition-db.json              # Processed nutrition database
│   ├── ingredient-mapping.json        # Ingredient synonyms and variations
│   ├── unit-mapping.json             # Unit conversion mappings
│   └── common-indian-ingredients.json # Common Indian ingredients list
├── utils/
│   ├── NutritionEstimator.js         # Core nutrition estimation logic
│   └── processNutritionData.js       # CSV to JSON processor
├── public/                           # Static files for web interface
├── test/                            # Test cases and test data
├── index.js                         # Main application entry point
├── swagger.js                       # API documentation
├── test-dishes.json                 # Sample dishes for testing
├── results.json                     # Generated results
├── debug-log.txt                    # Processing logs
├── package.json                     # Project dependencies
└── README.md                        # Project documentation
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Process the nutrition database:

```bash
node utils/processNutritionData.js
```

3. Run the nutrition estimator:

```bash
node index.js
```

## How It Works

1. **Input Processing**

   - Takes a dish name as input
   - Uses AI to extract ingredients and quantities
   - Handles variations in ingredient names and units

2. **Data Mapping**

   - Maps ingredients to nutrition database entries
   - Converts units to grams using density adjustments
   - Handles missing or ambiguous data

3. **Nutrition Calculation**

   - Calculates total nutrition per 100g
   - Scales to standard katori size (180g)
   - Identifies dish type

4. **Edge Case Handling**
   - Missing ingredients
   - Unknown units
   - Ambiguous quantities
   - Spelling variations
   - Multiple dish types

## Assumptions

1. Standard katori size is 180g
2. Missing quantities use default values based on typical recipes
3. Unknown ingredients are mapped to closest matches
4. Unit conversions use density adjustments for common ingredients

## Output

The system generates two files:

1. `results.json`: Complete nutrition analysis for each dish
2. `debug-log.txt`: Detailed processing logs and assumptions

## Testing

The system includes test cases for various edge cases:

- Ingredient synonyms
- Missing quantities
- Ambiguous dish types
- Unknown ingredients
- Non-standard units
- Variable recipes

## Future Improvements

1. Add more ingredient mappings
2. Improve dish type classification
3. Add support for more regional variations
4. Implement machine learning for better ingredient extraction
5. Add API endpoints for web integration
