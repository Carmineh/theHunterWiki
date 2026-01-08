# Contributing to theHunterWiki

Thank you for your interest in contributing to theHunterWiki! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Data Contribution](#data-contribution)

## Code of Conduct

- Be respectful and constructive in all interactions
- Focus on what is best for the community and the project
- Show empathy towards other community members
- Accept constructive criticism gracefully

## Getting Started

Before you begin:

- Make sure you have [Node.js](https://nodejs.org/) installed (v14 or higher)
- Familiarize yourself with [Overwolf Development](https://overwolf.github.io/)
- Read the [README.md](README.md) to understand the project

## Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/Carmineh/theHunterWiki.git
   cd theHunterWiki
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build the Project**

   ```bash
   npm run build
   ```

4. **Test in Overwolf**
   - You need to be a [whitelisted Overwolf developer](https://overwolf.github.io/start/getting-started)
   - Load the unpacked extension from the `dist` folder
   - Test all functionality in theHunter: Call of the Wild

## Project Structure

```
app-folder/
├── public/
│   ├── css/           # Stylesheets
│   ├── data/          # Animal/map JSON data files
│   ├── icons/         # App icons
│   └── img/           # Images (animals, maps, classes, etc.)
├── src/
│   ├── background/    # Background window scripts
│   └── in_game/       # In-game window scripts
├── manifest.json      # Overwolf app manifest
└── package.json       # Node dependencies
```

## How to Contribute

### Types of Contributions

1. **Bug Fixes**

   - Check existing issues or create a new one
   - Reference the issue in your PR

2. **New Features**

   - Open an issue to discuss the feature first
   - Wait for maintainer approval before implementing

3. **Data Updates**

   - Add new animals when DLC releases
   - Update existing animal data (need zones, trophies, etc.)
   - Add new maps

4. **UI/UX Improvements**

   - Visual enhancements
   - Performance optimizations
   - Accessibility improvements

5. **Documentation**
   - Improve README or CONTRIBUTING
   - Add code comments
   - Create tutorials or guides

## Submitting Changes

1. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make Your Changes**

   - Write clean, readable code
   - Follow existing code style
   - Test thoroughly in Overwolf

3. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # or
   git commit -m "fix: resolve bug description"
   ```

   **Commit Message Format:**

   - `feat:` for new features
   - `fix:` for bug fixes
   - `data:` for data updates
   - `style:` for UI/CSS changes
   - `docs:` for documentation
   - `refactor:` for code refactoring

4. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots/videos if applicable

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing naming conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Avoid `any` types when possible

### CSS

- Follow the existing dark theme color scheme
- Use CSS classes, avoid inline styles
- Keep selectors specific but not overly complex
- Test responsiveness

### File Naming

- Use lowercase with underscores for directories: `need_zones/`
- Use camelCase for TypeScript files: `inGame.ts`
- Use kebab-case for data files: `medved-taiga_national_park.json`

## Testing

Before submitting a PR:

1. **Build Test**

   ```bash
   npm run build
   ```

   Ensure no TypeScript errors

2. **Overwolf Test**

   - Load app in Overwolf
   - Test in theHunter: Call of the Wild
   - Verify all modified features work
   - Check for console errors

3. **Visual Test**
   - Test on different window sizes
   - Verify dark theme consistency
   - Check ad placement (if applicable)

## Data Contribution

### Adding/Updating Animals

Animal data is stored in `public/data/*.json`. Each map has its own file.

**Animal Data Structure:**

```json
{
  "Name": "Animal Name",
  "id": "animal_id",
  "Class": "1-8",
  "Difficulty": "1: Trivial — 9: Legendary",
  "Trophy Type": "Antlers/Horns/Skull/etc",
  "Weight": "min — max kg/lbs",
  "Fur": "Variants list",
  "Trophies": {
    "Silver": "XX.XX",
    "Gold": "XX.XX",
    "Diamond": "XX.XX"
  },
  "Need_Zones": [
    {
      "reserve_id": [
        {
          "Time": "00:00 - 04:00",
          "Activity": "Resting/Feeding/Drinking"
        }
      ]
    }
  ],
  "Variants": [
    {
      "Sex": "Male/Female",
      "Details": {
        "Common": ["variant1"],
        "Rare": ["variant2"],
        "Very Rare": ["variant3"]
      }
    }
  ],
  "img_ext": "png"
}
```

### Adding Images

- **Animals:** `public/img/animals/{animal_id}.png`
- **Maps:** `public/img/maps/{map_id}.png`
- **Classes:** `public/img/classes/class_{1-8}.png`
- Use PNG format with transparent backgrounds when appropriate
- Keep file sizes reasonable (<500KB)

## Questions?

- Open an issue for questions about contributing
- Check existing issues and PRs first
- Be patient - maintainers may take time to respond

## Recognition

All contributors will be recognized in the project. Thank you for helping make theHunterWiki better!

---

_Happy Hunting! 🦌_
