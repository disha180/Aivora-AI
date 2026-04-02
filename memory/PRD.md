# Social Media Trend Analysis App - Product Requirements Document

## Overview
A mobile Android app (web-based using Expo) that helps users discover and analyze current social media trends across multiple platforms using AI.

## Core Features

### 1. Platform Support
- Initial platforms: Instagram, Facebook, SpaceX, WhatsApp, Discord
- Editors/creators can add more platforms via admin panel
- Regular users cannot see "add section" option

### 2. User Authentication
- Dual authentication system:
  - Google OAuth (Emergent Auth)
  - Custom email/password with JWT
- Signup fields: email, phone, preference, age, gender (optional)

### 3. User Roles
- **Regular Users**: Can view and analyze trends
- **Editors/Creators**: Gmail IDs containing "disha" or "jayanthi"
  - Can access admin panel
  - Can add/edit/delete platform sections

### 4. Trend Analysis
- User inputs:
  - Platform selection
  - Topic/keyword
  - Time period
  - Additional requirements
  
- Output includes:
  - Graphs and charts
  - Statistics
  - Example posts
  - Table of contents
  - Paragraph of instructions
  - Detailed trend summary

### 5. AI Integration
- AI-powered trend analysis using Emergent LLM key
- AI chatbot assistant available throughout app
- Mock/simulated data for MVP visualization

### 6. Content Safety
- No unethical content
- No 18+ material
- No illegal information
- No personal information violations
- Content filtering on all AI outputs

### 7. UI/UX Requirements
- Extremely attractive landing page
- Tab-based navigation for platforms
- Interactive tooltips/modals
- Responsive design
- Mobile-first approach
- One-handed friendly navigation

## Technical Stack
- Frontend: Expo (React Native)
- Backend: FastAPI
- Database: MongoDB
- AI: Emergent LLM Key (GPT-5.2)
- Charts: react-native-gifted-charts
- State: Zustand
- Navigation: expo-router
