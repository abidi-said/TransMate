
# Translation Management System

A full-featured translation management system built with Express.js, React, and PostgreSQL. The application supports real-time collaborative translation, AI-powered translations, and project management features.

## Features

- 🌐 Multi-language support
- 🤖 AI-powered translations using OpenAI
- 👥 Team collaboration and role management
- 📊 Translation progress tracking
- 🔄 Real-time updates via WebSocket
- 🔑 API key management
- 📁 File import/export
- 💳 Payment integration (Stripe)

## Test Accounts

Use these credentials to test the application:

**Admin Account:**
- Email: admin@transmate.dev
- Password: admin123

**Client Account:**
- Email: client@transmate.dev
- Password: client123

## Prerequisites and Setup Instructions

### Node.js Setup
- Node.js v18 or higher required
- Install Node.js dependencies:
```bash
npm install
```

### PostgreSQL Database Setup
1. Setup PostgreSQL on Replit:
   - Go to "Tools" > "Database" in your Replit workspace
   - Click "Create Database" to provision a new PostgreSQL database
   - Copy the connection string provided by Replit

2. Database Configuration:
   - Update your `.env` file with the PostgreSQL connection string
   - The connection string format should be:
     ```
     DATABASE_URL="postgresql://username:password@hostname:port/database"
     ```

3. Initialize Database Schema:
   ```bash
   npm run db:push
   ```

### OpenAI Integration
1. Get an OpenAI API key:
   - Visit OpenAI's website and create an account
   - Generate an API key from your dashboard
   - Add the key to your `.env` file:
     ```
     OPENAI_API_KEY="your-api-key"
     ```

### Stripe Payment Setup
1. Stripe Integration:
   - Create a Stripe account
   - Get your test API keys from Stripe Dashboard
   - Add to `.env`:
     ```
     STRIPE_SECRET_KEY="your-stripe-secret-key"
     STRIPE_WEBHOOK_SECRET="your-webhook-secret"
     ```

2. Webhook Configuration:
   - Use Replit's URL as your webhook endpoint
   - Configure webhook events in Stripe Dashboard:
     - payment_intent.succeeded
     - payment_intent.failed
     - customer.subscription.updated
     - customer.subscription.deleted

### Session Management
1. Configure Session Secret:
   ```
   SESSION_SECRET="your-secure-random-string"
   ```

### WebSocket Configuration
- WebSocket is automatically configured on `/ws` endpoint
- No additional setup required for development
- Ensures real-time collaboration features work correctly

### Development Tools

1. TypeScript Configuration:
   - TypeScript configuration is pre-configured in `tsconfig.json`
   - Compile TypeScript:
     ```bash
     npm run check
     ```

2. Tailwind CSS:
   - Tailwind is configured with custom theme in `tailwind.config.ts`
   - Styling utilities available in `src/index.css`

3. Drizzle ORM:
   - Database schema defined in `shared/schema.ts`
   - Generate migrations:
     ```bash
     npm run db:push
     ```

4. Vite Development Server:
   - Development server runs on port 5000
   - Hot module replacement enabled
   - Configuration in `vite.config.ts`

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and configure the environment variables:
```bash
cp .env.example .env
```

4. Set up the database:
```bash
npm run db:push
```

## Environment Configuration

Configure the following variables in your `.env` file:

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session management
- `OPENAI_API_KEY`: OpenAI API key for AI translations
- `STRIPE_SECRET_KEY`: Stripe secret key for payments
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `NODE_ENV`: Environment (development/production)

## Running the Application

1. Development mode:
```bash
npm run dev
```

2. Production mode:
```bash
npm run build
npm start
```

The application will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/register` - Create new user account
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/settings` - Update project settings

### Translations
- `GET /api/keys/:id/translations` - Get translations for a key
- `POST /api/keys/:id/translations` - Add/update translation
- `POST /api/translate` - Get AI translation suggestion
- `POST /api/projects/:id/bulk-translate` - Bulk translate missing keys

### API Keys
- `GET /api/api-keys` - List API keys
- `POST /api/api-keys` - Create new API key
- `DELETE /api/api-keys/:id` - Delete API key

### Team Management
- `GET /api/projects/:id/members` - List project members
- `POST /api/projects/:id/members` - Add project member

### Activity Logs
- `GET /api/projects/:id/activity` - Get project activity logs

## WebSocket Events

The application uses WebSocket for real-time updates:

- `translation:update` - Translation updated
- `user:typing` - User is typing
- `project:update` - Project settings updated

## Features Usage

1. **AI Translation:**
   - Enable AI translation in project settings
   - Use the "Suggest Translation" button or bulk translate

2. **Team Collaboration:**
   - Add team members with different roles
   - See real-time updates when others are translating

3. **File Management:**
   - Import translations from CSV/JSON
   - Export translations to multiple formats

4. **Progress Tracking:**
   - View translation progress by language
   - Track team member activity

## Security Considerations

- API keys are required for programmatic access
- Session-based authentication
- Role-based access control
- Secure password hashing
- CSRF protection

## Support

For support or questions, please open an issue in the repository.
