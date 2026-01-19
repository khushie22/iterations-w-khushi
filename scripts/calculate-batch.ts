#!/usr/bin/env node

/**
 * Script to calculate combinations for a single scenario
 * Called from Python batch processor
 * Usage: tsx scripts/calculate-batch.ts <json_input>
 */

import { calculateCombinations, BudgetInput } from '../lib/calculator';

// Read input from command line arguments or file
let inputJson = process.argv[2];

// Check if argument is a file path (exists as file)
if (inputJson) {
  const fs = require('fs');
  const path = require('path');
  try {
    // Check if it's a valid file path
    if (fs.existsSync(inputJson) && fs.statSync(inputJson).isFile()) {
      inputJson = fs.readFileSync(inputJson, 'utf-8');
    }
    // Otherwise treat as JSON string
  } catch (e) {
    // If file doesn't exist, treat as JSON string
  }
}

if (!inputJson) {
  console.error('Error: No input provided');
  process.exit(1);
}

try {
  const input: BudgetInput = JSON.parse(inputJson);
  const combinations = calculateCombinations(input);
  
  // Output results as JSON to stdout
  console.log(JSON.stringify(combinations, null, 0));
} catch (error: any) {
  console.error('Error:', error.message);
  process.exit(1);
}
