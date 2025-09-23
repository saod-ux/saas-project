#!/usr/bin/env ts-node

/**
 * i18n Translation Key Checker
 * This script ensures all translation keys used in code exist in message files
 */

import * as fs from 'fs';
import * as path from 'path';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

interface TranslationFile {
  [key: string]: any;
}

interface ValidationResult {
  missingKeys: string[];
  extraKeys: string[];
  hasErrors: boolean;
}

class I18nValidator {
  private baseLocale: string = 'en';
  private localesDir: string = 'messages';
  private translationFiles: Map<string, TranslationFile> = new Map();

  constructor() {
    this.loadTranslationFiles();
  }

  private loadTranslationFiles(): void {
    const localeFiles = fs.readdirSync(this.localesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.basename(file, '.json'));

    for (const locale of localeFiles) {
      const filePath = path.join(this.localesDir, `${locale}.json`);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const translations = JSON.parse(content);
        this.translationFiles.set(locale, translations);
        console.log(`✅ Loaded ${locale}.json (${Object.keys(translations).length} keys)`);
      } catch (error) {
        console.error(`${colors.red}❌ Failed to load ${filePath}: ${error}${colors.reset}`);
        process.exit(1);
      }
    }

    if (!this.translationFiles.has(this.baseLocale)) {
      console.error(`${colors.red}❌ Base locale '${this.baseLocale}' not found!${colors.reset}`);
      process.exit(1);
    }
  }

  private getAllKeys(obj: any, prefix: string = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  private hasKey(obj: any, keyPath: string): boolean {
    const keys = keyPath.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }
    
    return true;
  }

  private extractTranslationKeysFromCode(): string[] {
    console.log('📖 Extracting translation keys from UI components...');
    
    const usedKeys = new Set<string>();

    // Define directories to search
    const searchDirs = ['app', 'components', 'contexts', 'lib'];
    const excludeDirs = ['node_modules', '.next', 'build', 'dist', 'scripts', 'messages', 'api'];

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;
      
      this.searchDirectory(dir, usedKeys, excludeDirs);
    }

    const sortedKeys = Array.from(usedKeys).sort();
    console.log(`Found ${sortedKeys.length} translation keys in code`);
    
    if (sortedKeys.length > 0) {
      console.log('Keys found:');
      sortedKeys.forEach(key => console.log(`  - ${key}`));
    }
    
    return sortedKeys;
  }

  private searchDirectory(dirPath: string, usedKeys: Set<string>, excludeDirs: string[]): void {
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          if (!excludeDirs.includes(item.name)) {
            this.searchDirectory(fullPath, usedKeys, excludeDirs);
          }
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
          this.extractKeysFromFile(fullPath, usedKeys);
        }
      }
    } catch (error) {
      // Ignore errors when reading directories
    }
  }

  private extractKeysFromFile(filePath: string, usedKeys: Set<string>): void {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Match t('key') or t("key") patterns
      const tFunctionMatches = content.match(/t\(['"`]([^'"`]+)['"`]\)/g);
      if (tFunctionMatches) {
        for (const match of tFunctionMatches) {
          const keyMatch = match.match(/t\(['"`]([^'"`]+)['"`]\)/);
          if (keyMatch && keyMatch[1]) {
            const key = keyMatch[1].trim();
            // Filter out common false positives
            if (key && 
                key.length > 1 && 
                /^[a-zA-Z]/.test(key) &&
                !['content-type', 'x-knet-signature', 'x-myfatoorah-signature', 'x-tenant-slug'].includes(key)) {
              usedKeys.add(key);
            }
          }
        }
      }
    } catch (error) {
      // Ignore errors when reading files
    }
  }

  private validateLocale(locale: string, baseKeys: string[], usedKeys: string[]): ValidationResult {
    const translations = this.translationFiles.get(locale);
    if (!translations) {
      return { missingKeys: [], extraKeys: [], hasErrors: true };
    }

    const localeKeys = this.getAllKeys(translations);
    const missingKeys: string[] = [];
    const extraKeys: string[] = [];

    // Check for missing keys (keys in base locale but not in this locale)
    for (const key of baseKeys) {
      if (!this.hasKey(translations, key)) {
        missingKeys.push(key);
      }
    }

    // Check for extra keys (keys in this locale but not in base locale)
    for (const key of localeKeys) {
      if (!baseKeys.includes(key)) {
        extraKeys.push(key);
      }
    }

    return { missingKeys, extraKeys, hasErrors: false };
  }

  public validate(): void {
    console.log('🔍 Checking i18n translation keys...\n');

    // Check if required files exist
    if (!fs.existsSync(path.join(this.localesDir, 'en.json')) || 
        !fs.existsSync(path.join(this.localesDir, 'ar.json'))) {
      console.error(`${colors.red}❌ Missing message files! Please ensure messages/en.json and messages/ar.json exist${colors.reset}`);
      process.exit(1);
    }

    // Get base locale keys
    const baseTranslations = this.translationFiles.get(this.baseLocale)!;
    const baseKeys = this.getAllKeys(baseTranslations);
    console.log(`📋 Base locale (${this.baseLocale}) has ${baseKeys.length} keys\n`);

    // Extract keys used in code
    const usedKeys = this.extractTranslationKeysFromCode();
    console.log('');

    // Validate each locale
    let hasErrors = false;
    const locales = Array.from(this.translationFiles.keys()).filter(locale => locale !== this.baseLocale);

    for (const locale of locales) {
      console.log(`🔍 Validating ${locale}...`);
      const result = this.validateLocale(locale, baseKeys, usedKeys);

      if (result.missingKeys.length > 0) {
        console.log(`${colors.yellow}⚠️  Missing keys in ${locale}:${colors.reset}`);
        result.missingKeys.forEach(key => console.log(`  - ${key}`));
        hasErrors = true;
      }

      if (result.extraKeys.length > 0) {
        console.log(`${colors.yellow}⚠️  Extra keys in ${locale} (not in base):${colors.reset}`);
        result.extraKeys.forEach(key => console.log(`  - ${key}`));
        // Extra keys are warnings, not errors
      }

      if (result.missingKeys.length === 0 && result.extraKeys.length === 0) {
        console.log(`${colors.green}✅ ${locale} is valid${colors.reset}`);
      }
      console.log('');
    }

    // Check for hard-coded strings (simplified version)
    this.checkHardcodedStrings();

    // Final result
    if (hasErrors) {
      console.log(`${colors.red}❌ Validation failed due to missing translation keys!${colors.reset}`);
      console.log(`${colors.red}💥 Build failed due to missing translation keys!${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`${colors.green}✅ All translation keys are present in all message files!${colors.reset}`);
      process.exit(0);
    }
  }

  private checkHardcodedStrings(): void {
    console.log('🔍 Checking for potential hard-coded strings...');
    
    const hardcodedStrings = new Set<string>();
    const searchDirs = ['app', 'components'];
    const excludeDirs = ['node_modules', '.next', 'build', 'dist', 'scripts', 'messages', 'api'];

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;
      this.searchHardcodedStrings(dir, hardcodedStrings, excludeDirs);
    }

    const hardcodedArray = Array.from(hardcodedStrings).slice(0, 10); // Limit to 10 examples
    if (hardcodedArray.length > 0) {
      console.log(`${colors.yellow}⚠️  Found potential hard-coded strings that should use t():${colors.reset}`);
      hardcodedArray.forEach(str => console.log(`  - "${str}"`));
      console.log('');
    }
  }

  private searchHardcodedStrings(dirPath: string, hardcodedStrings: Set<string>, excludeDirs: string[]): void {
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          if (!excludeDirs.includes(item.name)) {
            this.searchHardcodedStrings(fullPath, hardcodedStrings, excludeDirs);
          }
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
          this.extractHardcodedStringsFromFile(fullPath, hardcodedStrings);
        }
      }
    } catch (error) {
      // Ignore errors when reading directories
    }
  }

  private extractHardcodedStringsFromFile(filePath: string, hardcodedStrings: Set<string>): void {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Match hard-coded strings (simplified pattern)
      const stringMatches = content.match(/"([A-Z][^"{<]{4,})"/g);
      if (stringMatches) {
        for (const match of stringMatches) {
          const stringMatch = match.match(/"([^"]+)"/);
          if (stringMatch && stringMatch[1]) {
            const str = stringMatch[1];
            // Skip if it's already using t() function
            if (!content.includes(`t('${str}')`) && 
                !content.includes(`t("${str}")`) &&
                !content.includes('console.log') &&
                !content.includes('console.error')) {
              hardcodedStrings.add(str);
            }
          }
        }
      }
    } catch (error) {
      // Ignore errors when reading files
    }
  }
}

// Main execution
if (require.main === module) {
  const validator = new I18nValidator();
  validator.validate();
}

export default I18nValidator;
