# Contributing to TrustLoops

We love your input! We want to make contributing to TrustLoops as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Request Process

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Local Development Setup

1. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/trustloops.git
   cd trustloops
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment**
   ```bash
   # Copy example configs
   cp apps/web/.env.example apps/web/.env.local
   cp src/WebApp/appsettings.json src/WebApp/appsettings.Development.json
   
   # Update with your Supabase credentials
   ```

4. **Start development servers**
   ```bash
   # Backend
   cd src/WebApp && dotnet run
   
   # Frontend  
   cd apps/web && pnpm dev
   ```

## Code Style

### Frontend (TypeScript/React)
- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Use functional components with hooks
- Prefer `const` over `let`
- Use Tailwind CSS for styling

### Backend (C#)
- Follow Microsoft C# coding conventions
- Use meaningful variable and method names
- Add XML documentation for public APIs
- Use async/await for asynchronous operations

## Commit Message Guidelines

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools

Examples:
```
feat(dashboard): add project creation modal
fix(api): handle video upload errors correctly
docs(readme): update installation instructions
```

## Issue Guidelines

### Bug Reports
Include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, browser, etc.)

### Feature Requests
Include:
- Clear description of the feature
- Use cases and motivation
- Proposed implementation approach
- Alternative solutions considered

## Code Review Process

All submissions require review. We use GitHub pull requests for this purpose.

1. **Automated Checks**: All PRs must pass automated tests and linting
2. **Manual Review**: A maintainer will review your code for:
   - Code quality and style
   - Test coverage
   - Documentation updates
   - Breaking changes
3. **Approval**: At least one maintainer approval required before merge

## Testing

### Frontend Tests
```bash
cd apps/web
pnpm test
```

### Backend Tests
```bash
cd src/WebApp
dotnet test
```

### End-to-End Tests
```bash
pnpm test:e2e
```

## Release Process

1. Version bump following semantic versioning
2. Update CHANGELOG.md
3. Create release tag
4. Deploy to staging for testing
5. Deploy to production

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)

## Questions?

Feel free to:
- Open an issue for discussion
- Join our [Discord community](https://discord.gg/trustloops)
- Email us at dev@trustloops.com

Thank you for contributing! 🎉
