#!/usr/bin/env node
/**
 * Style Validation Script
 * 
 * Validates that components follow the design system:
 * - Buttons use btnBase/btnPrimary/etc (not custom rounded classes)
 * - No rounded-full, rounded-md, rounded-lg on buttons
 * - CSS import exists in layout.tsx
 * - PostCSS config is correct
 * 
 * Run: node scripts/validate-styles.js
 * Exit code: 0 = all checks pass, 1 = issues found
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const errors = [];
const warnings = [];

// Design system constants
const BUTTON_STYLE_CONSTANTS = ['btnBase', 'btnPrimary', 'btnGhost', 'btnDanger', 'btnIcon', 'btnToolbar', 'btnToolbarSm'];
const FORBIDDEN_ROUNDED_CLASSES = ['rounded-full', 'rounded-md', 'rounded-lg'];
const REQUIRED_ROUNDED_CLASS = 'rounded-xl';

/**
 * Recursively find all .tsx files in a directory
 */
function findTsxFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, dist, etc.
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== '.next') {
        findTsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') && !file.endsWith('.test.tsx')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Check if a file uses button style constants
 */
function usesButtonConstants(content) {
  return BUTTON_STYLE_CONSTANTS.some(constant => content.includes(constant));
}

/**
 * Validate button styles in a component file
 */
function validateButtonStyles(filePath, content) {
  const lines = content.split('\n');
  const relativePath = filePath.replace(projectRoot + '/', '');
  const fileName = filePath.split('/').pop() || '';
  const isTagFile = fileName.includes('Tag') || relativePath.includes('Tag');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Get context around the line for better detection
    const nearbyLines = lines.slice(Math.max(0, index - 3), Math.min(lines.length, index + 4));
    const nearbyContent = nearbyLines.join('\n');
    
    // Check for forbidden rounded classes
    FORBIDDEN_ROUNDED_CLASSES.forEach(forbidden => {
      if (line.includes(forbidden)) {
        // Skip false positives: progress bars, images/avatars, badges, animation effects, tag buttons
        const isProgressBar = line.includes('h-2') || line.includes('h-1.5') || line.includes('h-1') && (line.includes('bg-gray') || line.includes('bg-surface'));
        const isImageOrAvatar = line.includes('object-cover') || (line.includes('w-16 h-16') || line.includes('w-14 h-14')) && line.includes('rounded-full');
        const isBadge = (line.includes('px-2 py-0.5') || line.includes('py-1 px-3')) && line.includes('text-xs') && line.includes('rounded-full');
        const isTag = isTagFile || nearbyContent.includes('onTagToggle') || nearbyContent.includes('tag.name') || nearbyContent.includes('tag.id');
        const isAnimationEffect = line.includes('animate-ping') || (line.includes('animate-pulse') && line.includes('rounded-full')) || (nearbyContent.includes('animate-ping') && line.includes('rounded-full'));
        
        if (isProgressBar || isImageOrAvatar || isBadge || isTag || isAnimationEffect) {
          // These are intentional - skip
          return;
        }
        
        // Check if this is in a button context
        const isButtonContext = 
          line.includes('<button') || 
          line.includes('type="button"') ||
          line.includes('Button') ||
          (line.includes('btn') && !line.includes('btnBase') && !line.includes('btnPrimary') && !line.includes('btnGhost')) ||
          (line.includes('className') && (line.includes('btnBase') || line.includes('btnPrimary') || line.includes('btnGhost')));
        
        // Check if it's a form input
        const isFormInput = 
          line.includes('<input') || 
          line.includes('<textarea') || 
          line.includes('<select');
        
        if (isButtonContext || isFormInput || usesButtonConstants(content)) {
          errors.push({
            file: relativePath,
            line: lineNum,
            issue: `${isFormInput ? 'Form input' : 'Button'} uses forbidden rounded class: ${forbidden}. Use ${REQUIRED_ROUNDED_CLASS} from button constants instead.`,
            code: line.trim()
          });
        } else {
          // Not a button/input, but still check if it should be rounded-xl
          warnings.push({
            file: relativePath,
            line: lineNum,
            issue: `Component uses ${forbidden}. Consider using ${REQUIRED_ROUNDED_CLASS} for consistency.`,
            code: line.trim()
          });
        }
      }
    });
    
    // Check for button style constants with additional rounded classes
    if (usesButtonConstants(content)) {
      BUTTON_STYLE_CONSTANTS.forEach(constant => {
        if (line.includes(constant)) {
          FORBIDDEN_ROUNDED_CLASSES.forEach(forbidden => {
            // Check if rounded class appears on same line or nearby
            const nearbyLines = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3));
            const nearbyContent = nearbyLines.join('\n');
            
            if (nearbyContent.includes(constant) && nearbyContent.includes(forbidden)) {
              errors.push({
                file: relativePath,
                line: lineNum,
                issue: `Button using ${constant} also has ${forbidden}. Button constants already include ${REQUIRED_ROUNDED_CLASS} - remove override.`,
                code: line.trim()
              });
            }
          });
        }
      });
    }
  });
}

/**
 * Validate CSS import in layout.tsx
 */
function validateCssImport() {
  const layoutPath = join(projectRoot, 'src/app/layout.tsx');
  try {
    const content = readFileSync(layoutPath, 'utf-8');
    if (!content.includes("import './globals.css'")) {
      errors.push({
        file: 'src/app/layout.tsx',
        line: 0,
        issue: "Missing CSS import: 'import ./globals.css' not found in layout.tsx",
        code: ''
      });
    }
  } catch (err) {
    errors.push({
      file: 'src/app/layout.tsx',
      line: 0,
      issue: `Cannot read layout.tsx: ${err.message}`,
      code: ''
    });
  }
}

/**
 * Validate PostCSS config
 */
function validatePostCssConfig() {
  const postcssPath = join(projectRoot, 'postcss.config.mjs');
  try {
    const content = readFileSync(postcssPath, 'utf-8');
    if (!content.includes('@tailwindcss/postcss')) {
      errors.push({
        file: 'postcss.config.mjs',
        line: 0,
        issue: "PostCSS config missing '@tailwindcss/postcss' plugin",
        code: ''
      });
    }
  } catch (err) {
    errors.push({
      file: 'postcss.config.mjs',
      line: 0,
      issue: `Cannot read postcss.config.mjs: ${err.message}`,
      code: ''
    });
  }
}

/**
 * Main validation function
 */
function main() {
  console.log('🔍 Validating styles...\n');
  
  // Validate CSS import and PostCSS config
  validateCssImport();
  validatePostCssConfig();
  
  // Find all component files
  const componentsDir = join(projectRoot, 'src/components');
  const files = findTsxFiles(componentsDir);
  
  console.log(`📁 Found ${files.length} component files\n`);
  
  // Validate each file
  files.forEach(file => {
    try {
      const content = readFileSync(file, 'utf-8');
      validateButtonStyles(file, content);
    } catch (err) {
      warnings.push({
        file: file.replace(projectRoot + '/', ''),
        line: 0,
        issue: `Cannot read file: ${err.message}`,
        code: ''
      });
    }
  });
  
  // Report results
  if (errors.length > 0) {
    console.log('❌ ERRORS FOUND:\n');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.file}:${error.line}`);
      console.log(`   ${error.issue}`);
      if (error.code) {
        console.log(`   Code: ${error.code}`);
      }
      console.log('');
    });
  }
  
  if (warnings.length > 0 && errors.length === 0) {
    console.log('⚠️  WARNINGS:\n');
    warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning.file}:${warning.line}`);
      console.log(`   ${warning.issue}`);
      if (warning.code) {
        console.log(`   Code: ${warning.code}`);
      }
      console.log('');
    });
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All style checks passed!\n');
    process.exit(0);
  } else if (errors.length > 0) {
    console.log(`\n❌ Found ${errors.length} error(s) and ${warnings.length} warning(s)`);
    console.log('Fix these issues before committing.\n');
    process.exit(1);
  } else {
    console.log(`\n⚠️  Found ${warnings.length} warning(s) (non-blocking)\n`);
    process.exit(0);
  }
}

main();
