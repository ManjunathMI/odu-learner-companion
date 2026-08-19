# ODU Learner Companion

## Project Overview

This project is a modern web application built using Next.js with TypeScript and React. It provides a comprehensive platform for managing learning progress, tracking feedback, and facilitating administrative tasks. The application follows a modular architecture with components, pages, and API routes organized in separate directories.

## Business Goals

- Provide a user-friendly interface for learners to track their progress.
- Enable administrators to manage learning rooms and user access.
- Facilitate feedback collection and analysis for continuous improvement.
- Ensure secure and efficient data management using Supabase.

## Tech Stack

### Frontend
- **Next.js**: React-based framework for server-side rendering and static site generation.
- **React**: JavaScript library for building user interfaces.
- **TypeScript**: Typed superset of JavaScript for better type safety and developer experience.
- **Tailwind CSS**: Utility-first CSS framework for styling.

### Backend
- **Node.js**: JavaScript runtime for server-side operations.
- **Express**: Lightweight HTTP server framework.
- **Supabase**: PostgreSQL-compatible database with built-in authentication and real-time features.

### Database
- **Supabase**: Used for secure and scalable data storage, with Row Level Security (RLS) policies implemented.

### Project Structure

```
src/
  components/
    # Reusable React components
  pages/
    # Main application pages
  api/
    # API routes using Next.js App Router
    users/
      # User-related API endpoints
    rooms/
      # Room-related API endpoints
    progress/
      # Progress tracking API endpoints
    feedback/
      # Feedback collection and management
    admin/
      # Administrative tasks and approvals
  styles/
    # Custom CSS or theme files
public/
  # Static assets and public files
    globals.css
    favicon.ico
```

## Key Features

- **User Authentication**: Secure login and registration system.
- **Progress Tracking**: Track learner progress through phases and completed lessons.
- **Feedback System**: Collect and manage feedback from users.
- **Admin Panel**: Manage users, rooms, and feedback approvals.
- **Secure Database**: Using Supabase with RLS policies for secure data access.

## Getting Started

### Prerequisites
- Node.js (>=14.0.0)
- npm or yarn (>=1.0.0)
- Supabase account with database setup

### Installation
1. Clone the repository
2. Run `npm install` or `yarn install`

### Usage
1. Set up your `.env.local` file with Supabase keys:
   ```env
   SUPABASE_CLIENT=your_client_key
   SUPABASE_SERVER=your_server_key
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Navigate to `http://localhost:3000` to access the application

### Database Setup
1. Create a Supabase database and run the `supabase.sql` script provided in the repository.
2. Follow the RLS setup guide in `supabase.md` for secure access policies.

## Development Workflow

### Coding Standards
- Use TypeScript for type safety.
- Follow [Standard Commit Messages](https://github.com/npm/npm-style-guide) for commit messages.
- Adhere to the project's coding conventions.

### Testing
- Run tests with `npm test`.
- Write unit tests for new features.
- Ensure 100% test coverage where applicable.

### Build and Deployment
- Use `npm run build` to create production builds.
- Configure deployment in `next.config.ts` if needed.
- Follow semantic versioning for releases.

## Contributing
1. Fork the repository.
2. Create a feature branch.
3. Commit changes with clear messages.
4. Push to the branch and create a Pull Request.

## Contact
For questions or feedback, reach out to:
- **Email**: contact@example.com
- **GitHub**: [Your GitHub Profile](https://github.com/yourusername)

## License
[MIT License](LICENSE)

---

### Note
This README.md provides a comprehensive overview of the project. For detailed database setup and RLS policies, refer to the `supabase.md` file and the `supabase.sql` script in the repository.