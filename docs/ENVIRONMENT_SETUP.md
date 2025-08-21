# Environment Configuration Guide

This guide explains how to set up and manage environment variables for the Cardinal project.

## 🚀 Quick Start

1. **Copy the local environment template:**

   ```bash
   npm run setup-env
   ```

2. **Add your API keys to `.env.local`:**

   ```bash
   # Edit the file and add your actual API keys
   code .env.local
   ```

3. **Validate your configuration:**

   ```bash
   npm run env:validate
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

## 📁 Environment Files

### `.env.example`

- **Purpose**: Complete reference of all available environment variables
- **Usage**: Documentation and onboarding new developers
- **Location**: Committed to git, safe to share

### `.env.local.example`

- **Purpose**: Local development template
- **Usage**: Copy to `.env.local` for local development
- **Location**: Committed to git, contains no secrets

### `.env.local`

- **Purpose**: Your personal local development environment
- **Usage**: Add your actual API keys and secrets here
- **Location**: ⚠️ **NEVER commit to git** (in .gitignore)

### `.env.staging.example` & `.env.production.example`

- **Purpose**: Templates for deployment environments
- **Usage**: Reference for setting up staging/production
- **Location**: Committed to git, contains no secrets

## 🔧 Available Scripts

| Script                 | Purpose                            |
| ---------------------- | ---------------------------------- |
| `npm run setup-env`    | Interactive environment setup      |
| `npm run env:validate` | Validate environment configuration |
| `npm run env:check`    | Show current environment mode      |

## 🛠️ Configuration Management

### Type-Safe Environment Variables

The project uses Zod for runtime validation and TypeScript for compile-time safety:

```typescript
import { getClientEnv, getServerEnv } from '@/lib/config/env'

// Client-side (browser-safe variables only)
const clientEnv = getClientEnv()
console.log(clientEnv.NEXT_PUBLIC_APP_URL)

// Server-side (includes secrets)
const serverEnv = getServerEnv()
console.log(serverEnv.DATABASE_URL)
```

### Environment Detection

```typescript
import { isDevelopment, isProduction, isStaging } from '@/lib/config/env'

if (isDevelopment) {
  // Development-only code
}
```

### Feature Validation

Validate specific features before using them:

```typescript
import { validateOpenAIEnv, validateDatabaseEnv } from '@/lib/config/env'

// Throws error if required variables are missing
validateOpenAIEnv()
validateDatabaseEnv()
```

## 🚦 Environment Modes

### Development (`NODE_ENV=development`)

- **Purpose**: Local development and debugging
- **Features**: Debug mode enabled, verbose logging, hot reload
- **Database**: Local or development database
- **APIs**: Development/sandbox API keys

### Staging (`NEXT_PUBLIC_APP_ENV=staging`)

- **Purpose**: Production-like testing environment
- **Features**: Beta features enabled, analytics active, limited debugging
- **Database**: Staging database (separate from production)
- **APIs**: Staging API keys

### Production (`NODE_ENV=production`)

- **Purpose**: Live application serving real users
- **Features**: All debugging disabled, full analytics, error monitoring
- **Database**: Production database with backups
- **APIs**: Production API keys with full quotas

## 🔐 Security Best Practices

### ✅ DO

- Use the `NEXT_PUBLIC_` prefix ONLY for variables that are safe to expose to browsers
- Keep different API keys for development, staging, and production
- Rotate API keys regularly
- Use environment-specific database URLs
- Enable monitoring in production
- Validate environment variables on startup

### ❌ DON'T

- Never commit `.env.local` to version control
- Don't use production API keys in development
- Don't put secrets in `NEXT_PUBLIC_` variables
- Don't hardcode API keys in your code
- Don't share your `.env.local` file with others

## 🎯 Variable Categories

### Core Application

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database (F011)

```bash
DATABASE_URL=postgresql://...
DATABASE_POOL_MAX=10
```

### Authentication (F012)

```bash
AUTH0_SECRET=...
AUTH0_CLIENT_ID=...
CLERK_SECRET_KEY=...
```

### AI/LLM APIs (F014)

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
```

### Google Services (F013)

```bash
GOOGLE_MAPS_API_KEY=...
GOOGLE_PLACES_API_KEY=...
```

### Monitoring & Analytics

```bash
SENTRY_DSN=https://...
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## 🚨 Troubleshooting

### "Missing required environment variable" error

1. Check that your `.env.local` file exists
2. Verify the variable name is spelled correctly
3. Make sure there are no extra spaces around the `=`
4. Restart your development server after adding variables

### Environment validation fails

1. Run `npm run env:validate` to see specific errors
2. Check the console for detailed validation messages
3. Verify variable types (strings, numbers, booleans, URLs)
4. Ensure required variables for active features are present

### Variables not updating

1. Restart your development server (`npm run dev`)
2. Clear Next.js cache: `rm -rf .next`
3. Check for typos in variable names
4. Verify the variable is in the correct environment file

## 🔄 CI/CD Integration

The CI/CD pipeline automatically:

- ✅ Validates environment configuration on every build
- ✅ Prevents deployment if required variables are missing
- ✅ Runs security audits on dependencies
- ✅ Tests environment loading before running tests

## 📚 Further Reading

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Zod Schema Validation](https://zod.dev/)
- [Environment Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Need help?** Check the [troubleshooting section](#-troubleshooting) or create an issue in the repository.
