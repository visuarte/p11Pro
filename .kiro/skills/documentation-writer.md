# Documentation Writer Skill

## Description

Enables the agent to create comprehensive, clear, and maintainable documentation for code, APIs, architecture, and user guides.

## Capabilities

- Write clear README files
- Document API endpoints (OpenAPI/Swagger)
- Create architecture documentation
- Write inline code comments
- Generate user guides
- Document deployment procedures
- Create troubleshooting guides
- Write changelog entries
- Document configuration options
- Create diagrams and flowcharts

## When to Activate

- Creating new features (document as you build)
- Updating existing features
- After code reviews
- Before releases
- When onboarding new developers
- After architectural changes
- When fixing bugs (document the fix)

## Documentation Patterns

### README.md Structure
```markdown
# Project Name

Brief description of what the project does.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`typescript
import { Something } from 'package';

const result = Something.doThing();
\`\`\`

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |

## API Documentation

See [API.md](docs/API.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT
```

### API Documentation
```markdown
## POST /api/v1/projects

Create a new project.

### Request

\`\`\`json
{
  "name": "Project Name",
  "description": "Optional description"
}
\`\`\`

### Response (201 Created)

\`\`\`json
{
  "id": "uuid",
  "name": "Project Name",
  "description": "Optional description",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
\`\`\`

### Errors

- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error
```

### Code Comments
```typescript
/**
 * Encrypts sensitive data using AES-256-GCM.
 * 
 * @param data - The plaintext data to encrypt
 * @param key - 32-byte encryption key
 * @returns Encrypted data with IV and auth tag
 * @throws {Error} If encryption fails
 * 
 * @example
 * ```typescript
 * const encrypted = encrypt('secret data', key);
 * console.log(encrypted.encrypted); // hex string
 * ```
 */
function encrypt(data: string, key: Buffer): EncryptedData {
  // Implementation
}
```

### Architecture Documentation
```markdown
# Architecture Overview

## System Components

\`\`\`
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │
│  (Node.js)  │
└──────┬──────┘
       │
       ├──────────┬──────────┐
       ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│Thunder   │ │Universal │ │ Python   │
│Koli      │ │Engine    │ │ Workers  │
└──────────┘ └──────────┘ └──────────┘
\`\`\`

## Data Flow

1. User submits request through frontend
2. API Gateway authenticates request
3. Request routed to appropriate service
4. Service processes and returns response
5. Response sent back to frontend
```

### Changelog
```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- New API endpoint for project export
- Support for CMYK color space

### Changed
- Improved performance of vector rendering
- Updated dependencies

### Fixed
- Bug in pose detection for edge cases
- Memory leak in canvas editor

### Security
- Updated authentication library
- Fixed XSS vulnerability in user input
```

## Best Practices

1. **Write for Your Audience**: Adjust technical level appropriately
2. **Be Concise**: Clear and brief is better than verbose
3. **Use Examples**: Show, don't just tell
4. **Keep Updated**: Update docs when code changes
5. **Use Diagrams**: Visual aids help understanding
6. **Link Related Docs**: Create a documentation web
7. **Version Documentation**: Match docs to code versions
8. **Test Examples**: Ensure code examples actually work
9. **Use Templates**: Consistent structure helps readers
10. **Get Feedback**: Have others review documentation

## Documentation Types

### Technical Documentation
- API references
- Architecture diagrams
- Database schemas
- Configuration guides

### User Documentation
- Getting started guides
- Tutorials
- FAQ
- Troubleshooting

### Developer Documentation
- Setup instructions
- Contributing guidelines
- Code style guides
- Testing procedures

## Tools

- **Markdown**: For README and docs
- **JSDoc/TSDoc**: For inline code documentation
- **OpenAPI/Swagger**: For API documentation
- **Mermaid**: For diagrams in markdown
- **Docusaurus**: For documentation websites

## References

- Markdown Guide: https://www.markdownguide.org/
- OpenAPI: https://swagger.io/specification/
- JSDoc: https://jsdoc.app/
- Mermaid: https://mermaid.js.org/
