# TrustLoops

A comprehensive SaaS platform for collecting and showcasing customer testimonials, featuring video recording, approval workflows, and embeddable testimonial walls.

## 🚀 Quick Start

### Prerequisites

- .NET 8 SDK
- Node.js 18+ 
- PNPM 8+
- Docker & Docker Compose (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/trustloops.git
   cd trustloops
   ```

2. **Install frontend dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Copy `src/WebApp/appsettings.json` and update with your Supabase credentials:
   ```json
   {
     "Supabase": {
       "Url": "https://your-project.supabase.co",
       "AnonKey": "your-anon-key",
       "JwtSecret": "your-jwt-secret"
     }
   }
   ```

4. **Run the development servers**
   
   Backend (API):
   ```bash
   cd src/WebApp
   dotnet run
   ```
   
   Frontend (React):
   ```bash
   cd apps/web
   pnpm dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Swagger UI: http://localhost:5000/swagger

## 🏗️ Architecture

### Tech Stack

**Backend:**
- ASP.NET Core 8 Minimal API
- Supabase (Auth, Database, Storage)
- Serilog for logging
- FluentResults for error handling
- xUnit for testing

**Frontend:**
- Vite + React 18 + TypeScript
- Tailwind CSS for styling
- React Router for navigation
- React Query for state management
- React Hook Form for forms

**Infrastructure:**
- Docker for containerization
- Fly.io for deployment
- GitHub Actions for CI/CD
- PNPM workspaces for monorepo

### Project Structure

```
trustloops/
├── apps/
│   └── web/                 # React frontend application
├── src/
│   ├── WebApp/             # ASP.NET Core API
│   ├── Shared/             # Shared models and utilities
│   └── Infrastructure/     # Data access and external services
├── tests/
│   └── WebApp.Tests/       # Backend unit tests
├── build/
│   └── pack.ps1           # Build and deployment scripts
└── .github/workflows/      # CI/CD pipelines
```

## 🎯 Features

### TestimonialHub (MVP)

- **Video Recording**: Browser-based video testimonial recording
- **Text Testimonials**: Simple form-based text testimonials
- **Approval Workflow**: Review and approve testimonials before publishing
- **Embeddable Wall**: Responsive testimonial showcase for websites
- **Magic Link Auth**: Passwordless authentication via Supabase
- **Project Management**: Organize testimonials by project/product

### Planned Features

- **StatusLoops**: Internal status page management
- **ShotLoops**: Batch screenshot beautification API
- **Analytics**: Testimonial performance tracking
- **Integrations**: Webhooks, Zapier, API access
- **Themes**: Customizable testimonial wall designs

## 🛠️ Development

### Build Scripts

**Frontend development:**
```bash
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm test                   # Run tests
pnpm lint                   # Lint code
```

**Backend development:**
```bash
dotnet run                  # Start API server
dotnet test                 # Run tests
dotnet build               # Build solution
```

**Docker development:**
```bash
docker-compose up          # Start all services
docker-compose down        # Stop all services
```

### PowerShell Build Script

```powershell
# Build everything
./build/pack.ps1 -BuildFrontend -BuildBackend

# Build and create Docker image
./build/pack.ps1 -BuildDocker

# Deploy to production
./build/pack.ps1 -Deploy -Environment Production
```

## 🚢 Deployment

### Environment Variables

Create a `.env` file in the frontend:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-api.fly.dev
```

### Fly.io Deployment

1. **Install Fly.io CLI**
   ```bash
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login and deploy**
   ```bash
   fly auth login
   fly deploy
   ```

### Database Setup

The application uses Supabase for managed PostgreSQL. Set up these tables:

- `users` - User accounts and subscription info
- `projects` - Testimonial collection projects  
- `testimonials` - Individual testimonials with approval status

## 🧪 Testing

**Backend tests:**
```bash
dotnet test --verbosity normal
```

**Frontend tests:**
```bash
cd apps/web
pnpm test
```

**Integration tests:**
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📝 API Documentation

The API is documented with Swagger/OpenAPI. When running locally:

- Swagger UI: http://localhost:5000/swagger
- OpenAPI spec: http://localhost:5000/swagger/v1/swagger.json

### Key Endpoints

- `GET /health` - Health check
- `POST /api/testimonials` - Upload testimonial (multipart)
- `GET /api/testimonials/{projectId}` - Get project testimonials
- `PUT /api/testimonials/{id}/approve` - Approve testimonial
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://trustloops.com)
- [Documentation](https://docs.trustloops.com)
- [Support](mailto:support@trustloops.com)

---

Built with ❤️ for the developer community
