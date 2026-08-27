# LearnSphere

LearnSphere is a comprehensive learning management system designed to facilitate online education. It provides features for course management, video classes, assignments, quizzes, discussions, and more.

## Project Structure

- `frontend/`: React application built with Vite and Tailwind CSS.
- `backend/`: Node.js/Express server with MongoDB database.
- `aDocs/`: Documentation and project specifications.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd learnsphere
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Variables

Create a `.env` file in the `backend` directory based on `.env.example` and configure the necessary variables.

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

The application will be available at `http://localhost:5173` (frontend) and the backend will run on `http://localhost:5000` (or as configured).

## Features

- User authentication and authorization (JWT, Passport)
- Role-based access (Student, Instructor, Admin)
- Course creation and management
- Video class integration with live streaming and recording
- Assignment submission and grading
- Quiz and assessment tools
- Discussion forums
- Payment processing (Stripe)
- Certificate generation
- Real-time notifications (Socket.IO)
- File uploads and storage
- Responsive design

## Documentation

Detailed documentation can be found in the `aDocs/` directory.

## Contributing

Please read the contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.