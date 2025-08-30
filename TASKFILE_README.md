# Taskfile for Cardinal Project

This project uses [Taskfile](https://taskfile.dev/) as a modern task runner to automate development workflows, code generation, testing, and deployment processes.

## 🚀 Quick Start

### View All Available Tasks

```bash
task --list-all
```

### Get Help

```bash
task help
```

## 📋 Core Development Tasks

### Development Server

```bash
# Start development server
task dev

# Clean start (removes .next cache)
task dev:clean
```

### Code Quality

```bash
# Run all code quality checks
task code-quality

# Individual checks
task lint          # ESLint
task lint:fix      # Fix ESLint issues
task format        # Prettier formatting
task typecheck     # TypeScript checking
```

### Testing

```bash
# Run all tests
task test

# Watch mode
task test:watch

# With coverage
task test:coverage

# Accessibility tests
task test:accessibility

# CI mode
task test:ci
```

### Building

```bash
# Build application
task build

# Clean build
task build:clean
```

## 🤖 AI Development Tasks

The Cardinal project includes specialized AI development tasks in `.taskfiles/ai-development.yml`:

### AI Agent Development

```bash
# Start AI development environment
task agent:dev

# Test all AI agents
task agent:test

# Generate new AI agent
task agent:generate MyNewAgent

# Test agent orchestration
task agent:orchestrate
```

### LLM Integration

```bash
# Test LLM integrations
task llm:test

# Validate LLM configuration
task llm:validate

# Test LangChain
task langchain:test
```

### AI Workflows

```bash
# Complete AI development workflow
task ai:workflow
```

## 🗄️ Database Tasks

Database operations are handled in `.taskfiles/database.yml`:

### Database Management

```bash
# Check database status
task db:status

# Deploy database schema
task db:deploy

# Environment-specific deployments
task db:deploy:dev
task db:deploy:staging
task db:deploy:prod

# Test database connection
task db:test
```

### Database Development

```bash
# Create new migration
task db:migrate:create "add_user_preferences_table"

# Show database schema
task db:schema:show

# Validate schema
task db:schema:validate

# Complete database workflow
task db:workflow
```

## 🏗️ Code Generation Tasks

### Component Generation

```bash
# Generate React component
task generate:component MyComponent

# Generate Next.js page
task generate:page about

# Generate AI agent
task generate:agent RecommendationAgent

# Generate test file
task generate:test components/ui/MyComponent.tsx
```

## 🔧 Utility Tasks

### Environment & Setup

```bash
# Setup development environment
task setup:dev

# Environment validation
task env:validate

# Setup pre-commit hooks
task setup:hooks
```

### Security & Auditing

```bash
# Security audit
task security:audit

# Fix security issues
task security:fix
```

### Health Checks

```bash
# Project health check
task health:check

# Database health check
task db:health
```

## 🚀 Quick Development Workflows

### Complete Development Workflow

```bash
# Format, lint, test, and build
task dev:workflow
```

### Quick Development Setup

```bash
# Install dependencies and start dev server
task quick:dev
```

### Quick Testing

```bash
# Lint and test
task quick:test
```

### Quick Build

```bash
# Lint and build
task quick:build
```

## 📁 Task File Structure

```
Taskfile.yml              # Main task definitions
.taskfiles/               # Specialized task modules
├── ai-development.yml    # AI development tasks
├── database.yml         # Database operations
└── (future modules)     # Additional specialized tasks
```

## 🎯 Best Practices

### 1. Use Task Dependencies

Tasks can depend on other tasks using the `deps` attribute:

```yaml
build:clean:
  desc: Clean build artifacts and rebuild
  deps: [clean] # Runs 'clean' task first
  cmds:
    - npm run build
```

### 2. Leverage File Watching

Use `sources` and `generates` for smart caching:

```yaml
build:
  sources:
    - app/**/*
    - components/**/*
  generates:
    - .next/**/*
```

### 3. Use CLI Arguments

Pass arguments to tasks:

```bash
task generate:component MyButton
task generate:page user-profile
```

### 4. Combine Tasks

Create workflow tasks that combine multiple operations:

```bash
task code-quality    # Runs typecheck, lint, format:check, test:ci, test:accessibility
task dev:workflow    # Runs format, lint:fix, typecheck, test, build
```

## 🔍 Task Discovery

### List All Tasks

```bash
task --list-all
```

### List Tasks by Category

```bash
# Development tasks
task --list | grep "^dev"

# Database tasks
task --list | grep "^db"

# AI development tasks
task --list | grep "^agent"
```

### Task Descriptions

```bash
# Show task description
task --list-all | grep "generate:component"
```

## 🛠️ Customization

### Adding New Tasks

1. Add to main `Taskfile.yml` for general tasks
2. Add to specialized `.taskfiles/*.yml` for domain-specific tasks
3. Use descriptive names with colons for grouping (e.g., `db:migrate:create`)

### Task Templates

Use the existing generation tasks as templates:

- `generate:component` for React components
- `generate:agent` for AI agents
- `generate:test` for test files

### Environment Variables

Tasks can use environment variables and project variables:

```yaml
vars:
  NODE_ENV: development
  PROJECT_NAME: cardinal
```

## 🚨 Troubleshooting

### Common Issues

1. **Task not found**: Check if the task exists with `task --list-all`
2. **Permission denied**: Ensure the task file is executable
3. **Dependency issues**: Check task dependencies with `task --list-deps <taskname>`

### Debug Mode

Run tasks with verbose output:

```bash
task --verbose <taskname>
```

### Task Dependencies

View task dependencies:

```bash
task --list-deps <taskname>
```

## 📚 Additional Resources

- [Taskfile Documentation](https://taskfile.dev/)
- [Taskfile Examples](https://github.com/go-task/task/tree/main/examples)
- [Cardinal Project Documentation](./Documentation/)

## 🤝 Contributing

When adding new tasks:

1. Follow the existing naming conventions
2. Add descriptive `desc` attributes
3. Use appropriate dependencies
4. Include sources and generates for caching
5. Test the task before committing

---

**Happy coding with Taskfile! 🎉**
