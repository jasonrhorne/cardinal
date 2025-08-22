#!/usr/bin/env node

/**
 * Pre-commit Hook Setup Script
 *
 * This script sets up Git pre-commit hooks to catch common issues
 * before they reach CI/CD pipeline.
 */

const fs = require('fs')
const path = require('path')

const gitHooksDir = path.join(process.cwd(), '.git', 'hooks')
const preCommitPath = path.join(gitHooksDir, 'pre-commit')

const preCommitScript = `#!/bin/sh
#
# Cardinal Pre-commit Hook
# Automatically runs code quality checks before each commit
#

echo "🔍 Running pre-commit checks..."

# Run code quality checks
npm run pre-commit

if [ $? -ne 0 ]; then
  echo "❌ Pre-commit checks failed. Please fix the issues above before committing."
  echo ""
  echo "💡 Quick fixes:"
  echo "   - Format code: npm run format"  
  echo "   - Fix linting: npm run lint:fix"
  echo "   - Check types: npm run typecheck"
  echo ""
  exit 1
fi

echo "✅ Pre-commit checks passed!"
`

function setupPreCommitHook() {
  try {
    // Check if .git directory exists
    if (!fs.existsSync(gitHooksDir)) {
      console.log('❌ Not a git repository or .git/hooks directory not found')
      process.exit(1)
    }

    // Write pre-commit hook
    fs.writeFileSync(preCommitPath, preCommitScript)

    // Make it executable
    fs.chmodSync(preCommitPath, '755')

    console.log('✅ Pre-commit hook installed successfully!')
    console.log('')
    console.log('🎯 The hook will now run these checks before each commit:')
    console.log('   - ESLint with auto-fix')
    console.log('   - Prettier formatting')
    console.log('   - TypeScript type checking')
    console.log('')
    console.log(
      '💡 To bypass the hook in emergencies, use: git commit --no-verify'
    )
  } catch (error) {
    console.error('❌ Failed to setup pre-commit hook:', error.message)
    process.exit(1)
  }
}

function removePreCommitHook() {
  try {
    if (fs.existsSync(preCommitPath)) {
      fs.unlinkSync(preCommitPath)
      console.log('✅ Pre-commit hook removed')
    } else {
      console.log('ℹ️  No pre-commit hook found')
    }
  } catch (error) {
    console.error('❌ Failed to remove pre-commit hook:', error.message)
    process.exit(1)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const command = args[0]

switch (command) {
  case 'install':
  case undefined:
    setupPreCommitHook()
    break
  case 'remove':
  case 'uninstall':
    removePreCommitHook()
    break
  case 'status':
    if (fs.existsSync(preCommitPath)) {
      console.log('✅ Pre-commit hook is installed')
    } else {
      console.log('❌ Pre-commit hook is not installed')
    }
    break
  default:
    console.log(
      'Usage: node scripts/setup-pre-commit-hooks.js [install|remove|status]'
    )
    process.exit(1)
}
