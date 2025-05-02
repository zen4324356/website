# Admin User Dashboard

Full-stack dark-themed web application with Admin and User roles. Built with React, Express, and Supabase.

## Features

- Dark-themed UI with Tailwind CSS
- Admin and User role-based access
- Authentication system with JWT
- Token-based user access
- Google OAuth integration
- Site Settings management
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, Tailwind CSS, React Router, Axios
- **Backend**: Express.js, JWT
- **Database**: Supabase

## Setup & Installation

### Prerequisites

- Node.js v14 or higher
- npm or yarn
- Supabase account and project

### Local Development

1. Clone the repository:
   ```
   git clone <repository-url>
   cd admin-user-dashboard
   ```

2. Install dependencies:
   ```
   npm run install-all
   ```

3. Configure environment variables:
   - Create a `.env` file in the `backend` directory
   - Add your Supabase credentials:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_KEY=your_supabase_service_key
     JWT_SECRET=your_jwt_secret
     ```

4. Set up the database:
   ```
   npm run setup-db
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Default credentials:
   - **Admin**: admin@example.com / admin123

## Netlify Deployment

This project is configured for easy deployment on Netlify.

### Deploy from Netlify UI

1. Fork/clone this repository to your GitHub account
2. Login to Netlify and click "New site from Git"
3. Select your GitHub repository
4. Configure the build settings:
   - Build command: `npm run build:netlify`
   - Publish directory: `frontend/dist`
5. Add the environment variables in Netlify:
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY
   - JWT_SECRET

### Deploy with Netlify CLI

1. Install Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```
   netlify login
   ```

3. Initialize the project:
   ```
   netlify init
   ```

4. Deploy:
   ```
   netlify deploy --prod
   ```

## Backend Configuration

For a complete application, you will need to:

1. Set up Supabase with the required tables
2. Configure Row Level Security (RLS) policies
3. Set up your own API service or serverless functions for backend operations

## License

ISC 