# Project Overview

This project is a modern web application using Next.js with TypeScript and React. It follows a modular architecture with components, pages, and API routes organized in separate directories.

## Getting Started

### Prerequisites
- Node.js (>=14.0.0)
- npm or yarn (>=1.0.0)

### Installation
1. Clone the repository
2. Run `npm install` or `yarn`

### Usage
Start the development server with `npm run dev` or `yarn dev`

## Project Structure

### Main Directories
- `src/`: Core application logic and components
  - `components/`: Reusable React components
  - `pages/`: Main application pages
  - `api/`: API routes using Next.js App Router

- `public/`: Static assets and public files
  - `favicon.ico`: Site favicon
  - `globals.css`: Global CSS styles
  - Other static assets

- `package.json`: Project dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `.gitignore`: Gitignore file

## Development Workflow

### Coding Standards
- Use TypeScript for type safety
- Follow [standard](https://github.com/npm/npm-style-guide) for commit messages
- Adhere to project-specific coding conventions

### Testing
- Run tests with `npm test`
- Write unit tests for new features
- Ensure 100% test coverage where applicable

### Build and Deployment
- Use `npm run build` to create production builds
- Configure deployment in `next.config.ts` if needed
- Follow semantic versioning for releases

### Contribution Guidelines
- Fork the repository
- Create a feature branch
- Commit changes with clear messages
- Push to the branch and create a Pull Request

## Key Concepts

### Architecture
- **Components**: Reusable UI elements in `src/components/`
- **Pages**: Main application pages in `src/page.tsx`
- **API Routes**: Defined in `src/api/` using Next.js conventions

### Technology Stack
- **Frontend**: React, TypeScript, Next.js
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (referenced in `lib/supabase.ts`)
- **CSS Frameworks**: Tailwind CSS or custom styles in `styles/`

### Design Patterns
- Component-based architecture
- RESTful API design
- Modular state management

## Common Tasks

### Adding New Pages
1. Create a new file in `src/page.tsx`
2. Define the page component with `export default function PageName() { ... }`
3. Use routing conventions in Next.js

### Updating Components
1. Modify existing components in `src/components/`
2. Follow component props conventions
3. Update usage in relevant pages

### Creating API Routes
1. Add new routes in `src/api/`
2. Implement handlers using Express-style syntax
3. Use Supabase for database interactions

## Troubleshooting

### Common Issues
- **Build Errors**: Check `tsconfig.json` and ensure all types are defined
- **Runtime Errors**: Verify environment variables are set
- **CSS Issues**: Check global styles in `globals.css`

### Debugging Tips
- Use browser developer tools
- Log statements with `console.error` or `console.log`
- Check API response statuses

## References

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [React Docs](https://react.dev/docs)

### Tools
- [Git](https://git-scm.com/docs)
- [Node.js](https://nodejs.org/en/docs)
- [Yarn](https://yarnpkg.com/en/docs)

### Additional Resources
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Standard Commit Messages](https://github.com/npm/npm-style-guide)