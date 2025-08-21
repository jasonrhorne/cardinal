#!/usr/bin/env node

/**
 * Environment Setup Script
 *
 * This script helps developers set up their local environment
 * by copying example files and validating configuration.
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve)
  })
}

async function setupEnvironment() {
  console.log('🚀 Cardinal Environment Setup')
  console.log('==============================\n')

  // Check if .env.local already exists
  const envLocalPath = path.join(process.cwd(), '.env.local')
  const envLocalExists = fs.existsSync(envLocalPath)

  if (envLocalExists) {
    const overwrite = await ask(
      '❓ .env.local already exists. Overwrite? (y/N): '
    )
    if (overwrite.toLowerCase() !== 'y') {
      console.log('✅ Keeping existing .env.local file')
      rl.close()
      return
    }
  }

  // Copy the example file
  const examplePath = path.join(process.cwd(), '.env.local.example')

  if (!fs.existsSync(examplePath)) {
    console.error('❌ .env.local.example not found!')
    rl.close()
    return
  }

  try {
    fs.copyFileSync(examplePath, envLocalPath)
    console.log('✅ Created .env.local from template')
  } catch (error) {
    console.error('❌ Failed to create .env.local:', error.message)
    rl.close()
    return
  }

  console.log('\n📝 Next Steps:')
  console.log('==============')
  console.log('1. Edit .env.local and add your API keys')
  console.log('2. Check the .env.example file for all available variables')
  console.log('3. Run `npm run validate` to test your configuration')
  console.log('4. Start development with `npm run dev`')

  console.log('\n🔐 Security Reminders:')
  console.log('======================')
  console.log("• Never commit .env.local to git (it's already in .gitignore)")
  console.log("• Keep your API keys secure and don't share them")
  console.log('• Use different keys for development vs production')
  console.log('• Rotate keys regularly for security')

  console.log('\n🚀 Happy coding!')

  rl.close()
}

// Run the setup
setupEnvironment().catch(error => {
  console.error('❌ Setup failed:', error.message)
  process.exit(1)
})
