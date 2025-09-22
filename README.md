# 🏕️ ZCamp

**Discover, share, and review the best camping spots across North America.**

ZCamp is a comprehensive full-stack web application that helps outdoor enthusiasts find and share amazing campgrounds. Built with modern technologies, it features interactive maps, secure authentication, cloud-based image storage, and a beautiful, responsive user interface.

![ZCamp Hero](./frontend/public/image/star_camping.avif)

## ✨ Features

- 🗺️ **Interactive Map Explorer** - Explore thousands of campgrounds on a high-performance, clustered map powered by Mapbox
- 🔐 **Secure Authentication** - Email/password and social logins (Google, Facebook, GitHub) with session management
- ➕ **Add Campgrounds** - Users can contribute new campgrounds with an interactive location picker
- ⭐ **Reviews & Ratings** - Write, edit, and delete reviews with a 5-star rating system
- 📸 **Image Gallery** - Upload, view, and delete campground photos with AWS S3 cloud storage
- 👑 **Admin Controls** - Role-based access control for administrators to manage all content
- 📱 **Responsive Design** - Beautiful UI with modern animations and mobile-first design
- 🌍 **Geographic Data** - PostGIS integration for advanced geospatial queries

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, Framer Motion
- **Maps**: Mapbox GL JS, React Map GL
- **Forms**: React Hook Form with Zod validation
- **TypeScript**: Full type safety

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with PostGIS extension
- **Session Store**: Redis
- **Authentication**: Passport.js (Local, Google, Facebook, GitHub)
- **File Storage**: AWS S3
- **Email**: SendGrid
- **Security**: Helmet.js, CORS, bcrypt

### Infrastructure
- **Containerization**: Docker Compose
- **Database**: PostGIS (PostgreSQL + Geographic extensions)
- **Cache/Sessions**: Redis 7
- **Cloud Storage**: AWS S3

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- AWS S3 bucket (for image storage)
- SendGrid account (for emails)
- OAuth app credentials (Google, Facebook, GitHub)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ZeLiu369/zcamp.git
   cd zcamp
   ```

2. **Start the databases**
   ```bash
   docker-compose up -d
   ```

3. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Create and configure your environment variables
   npm run build
   npm run import:data   # Import initial campground data from OpenStreetMap
   npm run dev
   ```

4. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local  # Configure your environment variables
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3002

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nationparkyelp

# Session & Redis
SESSION_SECRET=your-super-secret-session-key
REDIS_URL=redis://localhost:6380

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-s3-bucket-name

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourapp.com

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3002
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

## 📊 Database Schema

The application uses PostgreSQL with PostGIS extension for geographic data:

- **users** - User accounts and profiles
- **locations** - Campground locations with geographic coordinates
- **reviews** - User reviews and ratings for campgrounds
- **campground_images** - Image metadata and S3 URLs
- **sessions** - User session data (stored in Redis)

## 🗺️ Data Sources

Campground data is imported from OpenStreetMap using the Overpass API, focusing on:
- Tourism tagged camp sites across Canada
- Verified campgrounds with names and locations
- Filtered to exclude backcountry/primitive sites

## 📁 Project Structure

```
zcamp/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   └── hooks/           # Custom React hooks
│   └── public/              # Static assets
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic services
│   │   ├── middlewares/     # Custom middleware
│   │   └── lib/             # Database and utility modules
│   └── dist/                # Compiled JavaScript
└── docker-compose.yml       # Database services
```

## 🚢 Deployment

### Production Environment Variables

Ensure all environment variables are properly configured for production:

- Set `NODE_ENV=production`
- Use production database URLs
- Configure proper CORS origins
- Enable SSL/HTTPS settings
- Set secure cookie configurations

### Docker Deployment

The application can be containerized and deployed using Docker:

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up --build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/facebook` - Facebook OAuth
- `GET /api/auth/github` - GitHub OAuth

### Location Endpoints
- `GET /api/locations` - Get all campgrounds
- `GET /api/locations/:id` - Get specific campground with reviews
- `POST /api/locations` - Add new campground (authenticated)

### Review Endpoints
- `POST /api/reviews` - Create review (authenticated)
- `PUT /api/reviews/:id` - Update review (authenticated)
- `DELETE /api/reviews/:id` - Delete review (authenticated)

### Image Endpoints
- `POST /api/upload-image/:locationId` - Upload campground image (authenticated)
- `DELETE /api/images/:id` - Delete image (authenticated)

## 🐛 Known Issues

- Map clustering performance can be slow with very large datasets
- Image uploads are limited to 5MB per file
- Session timeout is set to 10 minutes for security

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ze Liu** - [GitHub](https://github.com/ZeLiu369) | [Website](https://zeliu369.com/)

## 🙏 Acknowledgments

- OpenStreetMap contributors for campground data
- Mapbox for mapping services
- The open-source community for amazing tools and libraries

---

⭐ **Star this repository if you found it helpful!**

🐛 **Found a bug?** [Open an issue](https://github.com/ZeLiu369/zcamp/issues)

💡 **Have a feature request?** [Start a discussion](https://github.com/ZeLiu369/zcamp/discussions)