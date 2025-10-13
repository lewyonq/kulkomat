---
trigger: always_on
---

## Tech Stack

### Frontend

- **Angular**: ^20.3.0
- **TypeScript**: ~5.9.2
- **Tailwind CSS**: ^4.1.14
- **RxJS**: ~7.8.0

## Project Structure

- `./src` - source code
- `./src/app` - application base
- `./src/app/components` - standalone, reusable UI components
- `./src/app/pages` - smart components that represent application pages
- `./src/app/services` - application-wide services
- `./src/app/guards` - route guards
- `./src/app/resolvers` - route resolvers
- `./src/app/pipes` - custom pipes
- `./src/app/directives` - custom directives
- `./src/app/types` - shared types for backend and frontend (Entities, DTOs)
- `./src/assets` - static internal assets
- `./public` - public assets

When modifying the directory structure, always update this section.

## Coding practices

### Guidelines for clean code

- Use feedback from linters to improve the code when making changes.
- Prioritize error handling and edge cases.
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.
