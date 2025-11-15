# Kulkomat

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

**Kulkomat** is a web application designed to digitize and enhance the loyalty program for an ice cream shop. It replaces traditional, physical stamp cards with a virtual system for collecting stamps and discount coupons. The primary goal is to solve the common problem of customers forgetting or losing their physical cards, which leads to frustration and loss of accumulated benefits.

## Tech Stack

- **Frontend**: Angular, TypeScript, Tailwind CSS v4
- **Backend & Database**: Supabase
- **Testing**: 
  - Jasmine + Karma (unit & component tests)
  - Playwright (E2E tests)
- **CI/CD & Hosting**: GitHub Actions, DigitalOcean (via Docker image)

## Getting Started Locally

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js and npm installed.
- Angular CLI installed globally: `npm install -g @angular/cli`

### Installation

1. Clone the repo:
   ```sh
   git clone https://github.com/your_username/kulkomat.git
   ```
2. Navigate to the project directory:
   ```sh
   cd kulkomat
   ```
3. Install NPM packages:
   ```sh
   npm install
   ```

### Running the Application

Run the development server:

```sh
npm start
```

The application will be available at `http://localhost:4200/`.

## Available Scripts

In the project directory, you can run the following scripts:

### Development

- `npm start`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run watch`: Builds the app in watch mode for development.

### Testing

- `npm test`: Runs unit tests with Jasmine/Karma.
- `npx playwright test`: Runs all E2E tests.
- `npx playwright test --ui`: Opens Playwright UI mode for interactive testing.
- `npx playwright test --project=chromium`: Runs tests only on Chrome.
- `npx playwright test --debug`: Runs tests in debug mode.
- `npx playwright codegen`: Generates tests by recording browser interactions.

### Code Quality

- `npm run lint`: Lints the project files.
- `npm run format`: Formats code with Prettier.
- `npm run format:check`: Checks code formatting without making changes.

## Project Scope

The MVP (Minimum Viable Product) of this project includes:

- A web application for customers and an admin panel for the owner/staff.
- User registration and login system.
- A digital stamp collection system (10 stamps = 1 free scoop).
- Management of discount coupons (percentage and fixed amount).
- A simple admin panel to add stamps/coupons to a user's account via their unique `user_id`.
- An informational page displaying current ice cream flavors.

Features **out of scope** for the MVP include native mobile apps, online ordering, payment systems, and QR code scanning.

## Project Status

This project is currently **in development**.

## License

Distributed under the MIT License. See `LICENSE` for more information.
