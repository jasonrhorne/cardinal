# Cardinal Development Workflow

This document outlines the development workflow, best practices, and quality gates to prevent deployment failures and maintain code quality.

## Pre-Development Checklist

Before starting any new feature or major changes:

### 1. Environment Setup Validation

```bash
# Verify your development environment
npm run env:validate
npm run env:check

# Ensure all dependencies are up to date
npm install
npm audit --audit-level high
```

### 2. Branch Strategy

```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# For database changes, use db/ prefix
git checkout -b db/f011-supabase-setup
```

## Development Process

### 1. Environment Variables Management

**When adding new environment variables:**

1. **Update schema first** in `lib/config/env.ts`:

   ```typescript
   // Add to appropriate schema (client/server)
   const clientEnvSchema = z.object({
     // Add new client-side variables
     NEXT_PUBLIC_NEW_SERVICE_URL: z.string().url().optional(),
   })

   const serverEnvSchema = z.object({
     // Add new server-side variables
     NEW_SERVICE_API_KEY: z.string().optional(),
   })
   ```

2. **Update all environment files**:

   ```bash
   # Update all environment templates
   vim .env.example
   vim .env.local.example
   vim .env.staging.example
   vim .env.production.example
   ```

3. **Create validation function**:

   ```typescript
   export function validateNewServiceEnv(): void {
     validateFeatureEnv('NewService', [
       'NEXT_PUBLIC_NEW_SERVICE_URL',
       'NEW_SERVICE_API_KEY',
     ])
   }
   ```

4. **Test environment validation**:
   ```bash
   npm run env:validate
   ```

### 2. Code Quality Gates

**Before every commit, run the complete validation suite:**

```bash
# The "commit readiness" command
npm run validate

# This runs:
# - TypeScript type checking
# - ESLint with auto-fix
# - Prettier formatting
# - Test suite
# - Build verification
```

**Manual checks if `npm run validate` doesn't exist yet:**

```bash
# Type checking
npm run typecheck

# Linting and formatting
npm run lint:fix
npm run format

# Test suite
npm run test:ci

# Build verification
npm run build
```

### 3. Database Changes Workflow

**For database-related changes (like F011):**

1. **Update schema types first**:

   ```bash
   # If adding new tables/columns, update types
   vim types/database.ts
   ```

2. **Update database client code**:

   ```bash
   # Update Supabase client or database utilities
   vim lib/database/supabase.ts
   ```

3. **Test database connectivity**:

   ```bash
   # Validate database setup works
   npm run db:test
   ```

4. **Run full build with database code**:
   ```bash
   npm run build
   ```

## Pre-Commit Workflow

### Automated Checks (Recommended)

Install pre-commit hooks to catch issues early:

```bash
# Install pre-commit hooks (if implemented)
npm run setup:hooks

# Manual pre-commit checks
npm run pre-commit
```

### Manual Pre-Commit Checklist

Before every commit:

- [ ] **Environment Variables**: If added new env vars, updated schema and all templates
- [ ] **Type Safety**: `npm run typecheck` passes
- [ ] **Code Quality**: `npm run lint` passes
- [ ] **Formatting**: `npm run format:check` passes
- [ ] **Tests**: `npm run test:ci` passes
- [ ] **Build**: `npm run build` succeeds
- [ ] **Database**: If database changes, `npm run db:test` passes

## Common Failure Patterns & Prevention

### 1. Environment Schema Drift

**Problem**: Adding environment variables without updating validation schema

**Prevention**:

```bash
# Always update schema when adding env vars
# 1. Add to lib/config/env.ts schemas
# 2. Test with npm run env:validate
# 3. Update all .env.* files
# 4. Create validation function
```

**Detection**:

```bash
# This should catch env schema issues
npm run build
```

### 2. Import/Export Issues

**Problem**: TypeScript compilation fails due to missing imports or exports

**Prevention**:

```bash
# Always run typecheck before committing
npm run typecheck

# Use absolute imports consistently
import { something } from '@/lib/something'  # Good
import { something } from '../../../lib/something'  # Avoid
```

### 3. Formatting/Linting Violations

**Problem**: CI fails on formatting rules that could be auto-fixed

**Prevention**:

```bash
# Auto-fix before committing
npm run lint:fix
npm run format

# Check formatting status
npm run format:check
```

### 4. Build-Only Issues

**Problem**: Code works in development but fails in production build

**Prevention**:

```bash
# Always test production build locally
npm run build

# Test production mode locally
npm run start
```

## CI/CD Pipeline Expectations

### What CI/CD Will Check

1. **Code Quality**:
   - ESLint compliance
   - Prettier formatting
   - TypeScript compilation

2. **Functionality**:
   - Test suite execution
   - Build verification
   - Environment validation

3. **Security**:
   - Dependency audit
   - Security linting

### Making CI/CD More Robust

**Enhanced Error Messages**: Our CI should provide clear guidance:

```yaml
# Example improved CI output
❌ ESLint Failure:
  File: lib/database/supabase.ts:27
  Issue: Missing environment variable in schema
  Fix: Add NEXT_PUBLIC_SUPABASE_URL to lib/config/env.ts clientEnvSchema
```

## Emergency Deployment Fix Process

When deployment fails in production:

### 1. Immediate Response

```bash
# Create hotfix branch
git checkout main
git checkout -b hotfix/deployment-fix

# Reproduce issue locally
npm run build  # Should fail with same error

# Fix issue
# ... make minimal changes ...

# Verify fix
npm run validate
npm run build
```

### 2. Rapid Testing

```bash
# Test key functionality still works
npm run test:ci
npm run db:test  # If database-related

# Quick smoke test
npm run dev
# Verify core functionality works
```

### 3. Deploy Fix

```bash
# Commit with clear message
git add .
git commit -m "hotfix: Fix deployment issue - brief description"

# Push and verify deployment
git push origin hotfix/deployment-fix
# Monitor CI/CD pipeline
```

### 4. Post-Incident Review

- Document what went wrong
- Update this workflow to prevent similar issues
- Consider additional automation

## Development Environment Setup

### Initial Setup

```bash
# Clone and setup
git clone https://github.com/your-org/cardinal.git
cd cardinal
npm install

# Copy and configure environment
cp .env.example .env.local
# Edit .env.local with your values

# Validate setup
npm run env:validate
npm run build
npm run test:ci

# Setup database (if working on database features)
npm run db:setup
```

### Daily Development

```bash
# Start of day
git checkout main
git pull origin main
npm install  # In case dependencies changed

# Before starting work
npm run env:validate
npm run typecheck
```

## Code Review Guidelines

### For Reviewers

Check for these common deployment risk factors:

1. **Environment Variables**:
   - [ ] New env vars have schema definitions
   - [ ] All environment templates updated
   - [ ] Validation functions created

2. **Type Safety**:
   - [ ] No TypeScript `any` types without justification
   - [ ] Proper error handling for external APIs
   - [ ] Database queries have proper typing

3. **Build Compatibility**:
   - [ ] No Node.js-only code in client components
   - [ ] Proper async/await usage
   - [ ] No missing dependencies

### For Authors

Before requesting review:

```bash
# Self-review checklist
npm run validate
npm run build
npm run test:ci

# If database changes
npm run db:test

# Manual verification
npm run dev
# Test the new functionality works
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Build Success Rate**: Should be >95%
2. **Deployment Time**: Track if builds are getting slower
3. **Test Coverage**: Maintain >80% coverage
4. **Type Safety**: Zero TypeScript errors in production

### Alert Thresholds

- **Immediate**: Build failures in main branch
- **Daily**: Test coverage drops below threshold
- **Weekly**: Technical debt accumulation

## Tools and Automation

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright",
    "bradlc.vscode-tailwindcss"
  ]
}
```

### Package.json Scripts Reference

```json
{
  "scripts": {
    "validate": "npm run typecheck && npm run lint && npm run format:check && npm run test:ci && npm run build",
    "pre-commit": "npm run lint:fix && npm run format && npm run typecheck",
    "deployment-ready": "npm run validate && npm run db:test"
  }
}
```

## Conclusion

Following this workflow will prevent most deployment failures by:

1. **Catching issues early** through local validation
2. **Maintaining consistency** through automated formatting
3. **Ensuring type safety** through comprehensive TypeScript checking
4. **Validating integrations** through build and database testing

Remember: **It's much faster to fix issues locally than to debug them in CI/CD or production.**
