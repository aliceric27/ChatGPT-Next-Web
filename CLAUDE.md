# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NextChat is a modern, multi-platform AI chat application built with Next.js 14 and TypeScript. It provides a unified interface for interacting with multiple AI providers (OpenAI, Anthropic Claude, Google Gemini, DeepSeek, etc.) and can be deployed as a web app, desktop application (via Tauri), or PWA.

## Development Commands

### Essential Commands
```bash
# Development (with mask watching)
yarn dev

# Desktop app development
yarn app:dev

# Build for production
yarn build

# Build desktop application
yarn app:build

# Testing
yarn test              # Watch mode
yarn test:ci           # CI mode

# Linting
yarn lint

# Build masks (prompt templates)
yarn mask
```

### Single Test Execution
```bash
# Run specific test file
yarn test --testNamePattern="YourTestName" --testPathPattern="path/to/test"

# Run tests in specific directory
yarn test test/components/
```

## Architecture Overview

### Core Structure
- **App Router**: Uses Next.js 14 app directory structure
- **State Management**: Zustand stores in `app/store/` (chat, config, access, plugin, etc.)
- **API Layer**: Multi-provider API abstraction in `app/api/` and `app/client/`
- **Components**: React components in `app/components/` with SCSS modules
- **Internationalization**: 18+ languages in `app/locales/`

### Key Architectural Patterns

#### Multi-Provider API Support
- **Unified API Interface**: `app/client/api.ts` provides consistent interface
- **Provider Abstraction**: Individual platform implementations in `app/client/platforms/`
- **Proxy Configuration**: `next.config.mjs` handles API proxying for CORS and security

#### State Management (Zustand)
- **Chat Store**: Manages conversations, messages, and chat history
- **Config Store**: User settings, model configurations, API keys
- **Access Store**: Authentication and authorization state
- **Plugin Store**: Plugin management and MCP integration

#### Component Architecture
- **Modular Design**: Each component has accompanying `.module.scss` file
- **UI Library**: Reusable components in `app/components/ui-lib.tsx`
- **Feature Components**: Specialized components (realtime-chat, sd, artifacts)

### Key Features Integration

#### Model Context Protocol (MCP)
- **Location**: `app/mcp/` directory
- **Activation**: Set `ENABLE_MCP=true` in environment
- **Configuration**: `mcp_config.default.json` for server configurations

#### Tauri Desktop Integration
- **Config**: `src-tauri/` directory contains Rust configuration
- **Security**: Controlled API access through Tauri's allowlist system
- **Build**: Uses `yarn app:build` for cross-platform compilation

#### Prompt Templates (Masks)
- **Build Process**: `yarn mask` compiles templates from `app/masks/`
- **Watch Mode**: `yarn mask:watch` for development
- **Multilingual**: Templates support multiple languages

## Environment Configuration

### Required Variables
```bash
OPENAI_API_KEY=sk-...          # Primary API key
CODE=your-password             # Access password (comma-separated)
```

### Optional Features
```bash
ENABLE_MCP=true                # Enable Model Context Protocol
ANTHROPIC_API_KEY=             # Claude API access
GOOGLE_API_KEY=                # Gemini Pro access
DEEPSEEK_API_KEY=              # DeepSeek access
HIDE_USER_API_KEY=1            # Prevent user API key input
DISABLE_GPT4=1                 # Disable GPT-4 models
CUSTOM_MODELS=+llama,-gpt-3.5  # Control model availability
```

## Testing Strategy

### Test Configuration
- **Framework**: Jest with React Testing Library
- **Environment**: jsdom for browser simulation
- **Setup**: `jest.setup.ts` for global test configuration
- **Patterns**: `**/*.test.{js,ts,jsx,tsx}`

### Test Organization
- Tests alongside source files or in `/test` directory
- Component tests focus on user interactions and rendering
- API tests verify provider integrations
- Store tests validate state management logic

## Development Guidelines

### Code Organization
- **TypeScript**: Strict typing throughout codebase
- **SCSS Modules**: Component-scoped styling with `.module.scss`
- **Path Mapping**: Use `@/` prefix for imports (configured in `tsconfig.json`)

### API Development
- **Provider Pattern**: New AI providers follow pattern in `app/client/platforms/`
- **Route Structure**: API routes in `app/api/[provider]/` follow Next.js conventions
- **Common Utilities**: Shared API logic in `app/api/common.ts`

### Component Development
- **React 18**: Uses modern React patterns and hooks
- **Responsive Design**: Mobile-first approach with dark/light themes
- **Accessibility**: ARIA labels and keyboard navigation support

### Internationalization
- **Locale Files**: Add new translations to `app/locales/`
- **Dynamic Loading**: Translations loaded based on user preference
- **Type Safety**: Locale keys are typed for compile-time validation

## Build Modes

### Web Deployment
```bash
yarn build                     # Standalone server
yarn export                    # Static export for CDN
```

### Desktop Application
```bash
yarn app:build                 # Cross-platform desktop builds
```

### Environment-Specific Builds
- **BUILD_MODE=standalone**: Server-side rendering
- **BUILD_MODE=export**: Static site generation
- **BUILD_APP=1**: Desktop application build

## Security Considerations

- **API Key Management**: Server-side vs client-side API key options
- **Access Control**: Password protection and user authentication
- **Proxy Support**: Built-in proxy for restricted environments
- **CORS Handling**: Proper cross-origin configuration in Next.js

## Common Development Patterns

### Adding New AI Provider
1. Create client implementation in `app/client/platforms/[provider].ts`
2. Add API route in `app/api/[provider].ts`
3. Update model configurations in `app/utils/model.ts`
4. Add provider-specific environment variables

### Adding New Features
1. Create Zustand store if state management needed
2. Implement React components with SCSS modules
3. Add internationalization keys to locale files
4. Write tests for new functionality
5. Update TypeScript types in `app/typing.ts`