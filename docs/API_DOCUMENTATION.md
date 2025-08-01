# TrustLoops API Documentation

## Authentication

All authenticated endpoints require a JWT Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Health Check
- **GET** `/health`
- **Description**: Check if the API is running
- **Authentication**: None required
- **Response**: `"healthy"`

### Projects

#### Get User Projects
- **GET** `/api/projects`
- **Description**: Get all projects for the authenticated user
- **Authentication**: Required
- **Response**: Array of project objects

#### Create Project
- **POST** `/api/projects`
- **Description**: Create a new project
- **Authentication**: Required
- **Body**:
```json
{
  "name": "Project Name",
  "description": "Optional description"
}
```
- **Response**: Created project object

#### Get Project by Slug (Public)
- **GET** `/api/projects/slug/{slug}`
- **Description**: Get project details by slug
- **Authentication**: None required
- **Response**: Project object

### Testimonials

#### Get Testimonials by Project
- **GET** `/api/testimonials/{projectId}`
- **Description**: Get testimonials for a project
- **Authentication**: Required for pending, none for approved
- **Query Parameters**:
  - `approved=true` - Get approved testimonials (public)
  - `approved=false` - Get pending testimonials (requires auth)
- **Response**: Array of testimonial objects

#### Create Testimonial
- **POST** `/api/testimonials`
- **Description**: Submit a new testimonial
- **Authentication**: None required
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `projectId` - Project UUID
  - `customerName` - Customer name (required)
  - `customerEmail` - Email address
  - `customerTitle` - Job title
  - `customerCompany` - Company name
  - `quote` - Written testimonial
  - `rating` - Rating (1-5)
  - `video` - Video file (optional)
- **Response**: Created testimonial object

#### Approve Testimonial
- **PUT** `/api/testimonials/{id}/approve`
- **Description**: Approve a pending testimonial
- **Authentication**: Required
- **Response**: Updated testimonial object

### Wall (Public Testimonial Display)

#### Get Wall Data
- **GET** `/api/wall/{projectSlug}`
- **Description**: Get project and approved testimonials for public display
- **Authentication**: None required
- **Response**:
```json
{
  "project": { /* project object */ },
  "testimonials": [ /* array of approved testimonials */ ]
}
```

### Widget

#### Get Widget Script
- **GET** `/widget.js`
- **Description**: Get embeddable JavaScript widget
- **Authentication**: None required
- **Response**: JavaScript code

## Data Models

### Project
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string",
  "userId": "uuid",
  "createdUtc": "datetime"
}
```

### Testimonial
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "customerName": "string",
  "customerEmail": "string",
  "customerTitle": "string",
  "customerCompany": "string",
  "quote": "string",
  "videoUrl": "string",
  "rating": 1-5,
  "approved": boolean,
  "createdUtc": "datetime"
}
```

## Error Responses

All endpoints return standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a message:
```json
{
  "error": "Error description"
}
```

---

*API Documentation - Last Updated: August 1, 2025*
