# Feedback Collection Platform

A comprehensive feedback collection platform built with the MERN stack (MongoDB, Express.js, React, Node.js) that allows businesses to create custom feedback forms and collect responses from customers.

## Features

### For Admins/Businesses
- **User Authentication**: Secure JWT-based authentication for admin users
- **Form Creation**: Create custom feedback forms with multiple question types
  - Text questions
  - Multiple-choice questions with customizable options
  - Required/optional question settings
- **Form Management**: Edit, delete, and manage existing forms
- **Response Dashboard**: View all responses in both tabular and summary views
- **Data Visualization**: Charts and graphs for response analysis
- **CSV Export**: Export responses as CSV files for further analysis
- **Form Settings**: Configure form behavior (multiple responses, email requirements, themes)

### For Customers/Users
- **Public Form Access**: Submit feedback via public URLs without registration
- **Responsive Design**: Mobile-friendly interface for easy form submission
- **Form Validation**: Real-time validation for required fields
- **Success Confirmation**: Clear feedback after successful submission

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **csv-writer** - CSV export functionality

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Feedback-Collection-Form
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/feedback-platform
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

4. **Database Setup**
   
   Make sure MongoDB is running on your system or update the `MONGODB_URI` to point to your MongoDB instance.

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

3. **Or run both simultaneously**
   ```bash
   # From the root directory
   npm run dev
   ```

### Production Mode

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the production server**
   ```bash
   cd backend
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin user
- `POST /api/auth/login` - Login admin user
- `GET /api/auth/me` - Get current user profile

### Forms
- `POST /api/forms` - Create new form
- `GET /api/forms` - Get all forms for authenticated user
- `GET /api/forms/:id` - Get specific form
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `GET /api/forms/public/:publicUrl` - Get public form (no auth required)

### Responses
- `POST /api/responses` - Submit response to form (public)
- `GET /api/responses/form/:formId` - Get responses for form
- `GET /api/responses/form/:formId/summary` - Get response summary
- `GET /api/responses/form/:formId/export` - Export responses as CSV
- `GET /api/responses/:id` - Get specific response

## Usage Guide

### For Admins

1. **Registration/Login**
   - Visit `/register` to create a new admin account
   - Use `/login` to access your account

2. **Creating Forms**
   - Navigate to "Create Form" from the dashboard
   - Add form title and description
   - Add questions (text or multiple-choice)
   - Configure form settings
   - Save the form

3. **Managing Forms**
   - View all forms on the dashboard
   - Edit forms to modify questions or settings
   - Share form links with customers
   - View responses and analytics

4. **Analyzing Responses**
   - Use the summary view for charts and statistics
   - Switch to table view for detailed responses
   - Export data as CSV for external analysis

### For Customers

1. **Accessing Forms**
   - Use the public URL provided by the business
   - No registration required

2. **Submitting Feedback**
   - Fill out the form questions
   - Provide contact information if required
   - Submit the form
   - Receive confirmation

## Project Structure

```
Feedback-Collection-Form/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   ├── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript types
│   │   └── index.tsx    # App entry point
│   └── package.json
├── package.json         # Root package.json
└── README.md
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers
- Rate limiting (can be added)

## Mobile Responsiveness

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones

## Future Enhancements

- Real-time notifications
- Advanced analytics and reporting
- Form templates
- Email notifications
- File upload support
- Multi-language support
- Advanced form logic (conditional questions)
- Integration with third-party services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository or contact the development team. 