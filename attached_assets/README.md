
# Translation Management System

A powerful web application for managing translations across multiple languages with AI assistance and collaboration features.

## Features

- AI-powered translations 
- Multiple payment methods (Stripe, PayPal, D17, QPay, Flouci, E-DINAR)
- Role-based access control
- Git repository integration
- Translation memory & suggestions
- Quality assurance tools
- Advanced analytics dashboard

## Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Environment Variables
Create `.env` file with:
```
STRIPE_SECRET_KEY=your_stripe_key
OPENAI_API_KEY=your_openai_key
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_db_url
```

## Usage Guide

### For Project Owners
1. Sign up and choose a plan (Free/Pro/Team/Enterprise)
2. Create a translation project
3. Configure languages and file paths
4. Invite team members and assign roles
5. Link GitHub/GitLab repositories if needed

### Translation Workflow
1. Extract translation keys
2. Use AI-assisted translation
3. Review and approve translations
4. Export or sync with repositories

### Pricing Plans
- Free: 1 project, basic features
- Pro: Multiple projects, AI translations
- Team: Advanced collaboration
- Enterprise: Custom solutions

### Payment Methods
- International: Stripe, PayPal
- Tunisia: D17, QPay, Flouci, E-DINAR

## API Documentation

### Authentication
```typescript
POST /api/auth/login
POST /api/auth/register
```

### Translations
```typescript
GET /api/translations
POST /api/translations
PUT /api/translations/:id
```

Full API documentation available in /docs.

## Contributing
See CONTRIBUTING.md for guidelines.

## License
MIT
