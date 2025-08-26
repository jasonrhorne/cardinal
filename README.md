# Cardinal

AI-powered travel itinerary app for unique weekend getaways.

[![CI](https://github.com/jasonrhorne/cardinal/workflows/CI/badge.svg)](https://github.com/jasonrhorne/cardinal/actions)

- Product Requirements: Documentation/Cardinal_PRD.md
- System Design: Documentation/Cardinal_SystemDesignDoc.md
- Engineering Tasks: Documentation/Cardinal_Engineering_Tasks.md

## Getting Started

### Quick Setup

```bash
# Clone and install
git clone https://github.com/your-org/cardinal.git
cd cardinal
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Validate setup
npm run validate

# Setup pre-commit hooks (recommended)
npm run setup:hooks

# Start development
npm run dev
```

### Development Workflow

**Before every commit:**

```bash
npm run pre-commit  # Auto-fix formatting and check types
```

**Before deployment:**

```bash
npm run deployment-ready  # Full validation + environment check
```

**For database work:**

```bash
npm run db:setup    # Deploy schema + test connectivity
npm run db:test     # Validate database connection
```

See [Development Workflow](./docs/DEVELOPMENT_WORKFLOW.md) for detailed guidelines.

### Key Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run validate` - Complete quality check
- `npm run pre-commit` - Pre-commit validation
- `npm run deployment-ready` - Pre-deployment check
