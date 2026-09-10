Nutrify 🥗
Custom Health Plan & Personalized Nutrition Generator
Nutrify is a web application built to generate customized diet, calorie, and workout plans based on individual fitness goals, dietary preferences, and biometric metrics.
🚀 Features
Personalized Health Plans: Calculates daily energy intake (TDEE), target macronutrients, and custom meal allocations.
Goal-Oriented Schedules: Supports options for weight loss, muscle gain, or maintenance.
Dietary Preference Filtering: Accommodates specific eating styles (e.g., Vegetarian, High-Protein, Keto).
Database Tracking: Logs users, custom recipes, meal logs, and daily progress metrics via Supabase.
🛠 Tech Stack
Frontend: Vite
Backend & Database: Supabase (PostgreSQL)
💾 Supabase Database Setup
Nutrify relies on a custom database managed through Supabase. The required table definitions and relationships are provided in the attached schema.sql file in this repository.
Create a Supabase Project:
Sign in to supabase.com and create a new project.
Run the SQL Schema:
Go to the SQL Editor in your Supabase dashboard.
Open the schema.sql file from this repository, paste its contents into the editor, and click Run.
🔑 Environment Setup
Create a .env file in the project root:
