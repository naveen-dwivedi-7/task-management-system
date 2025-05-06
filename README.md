
Live Project Link:- https://task-tracker-naveen-dwivedi.replit.app/

Task Management System - Local Setup Instructions & Approach Explanation
Local Setup Instructions
Prerequisites
Node.js (v18 or higher)
PostgreSQL database
Step 1: Clone the Repository
git clone [repository-url]
cd task-management-system
Step 2: Install Dependencies
npm install
Step 3: Set Up the Database
The application uses a PostgreSQL database. The connection string is expected to be in the environment variable DATABASE_URL.

# Set up your database connection
export DATABASE_URL=postgresql://username:password@localhost:5432/taskmanagement
Step 4: Create Database Schema
npm run db:push
Step 5: Seed the Database (Optional)
npm run db:seed
Step 6: Start the Application
npm run dev
The application will be available at http://localhost:5000

Default Credentials
Username: dwivedinaveen
Password: password123

Approach Explanation
Architecture
This task management system follows a modern full-stack architecture:

Frontend:

React with TypeScript
TanStack React Query for state management
Shadcn UI components library
Tailwind CSS for styling
WebSocket client for real-time updates
Backend:

Node.js with Express
TypeScript for type safety
PostgreSQL database
Drizzle ORM for database operations
WebSocket server for real-time notifications
Authentication:

Express session-based authentication
Passport.js for authentication middleware
Password hashing with scrypt
Key Features Implementation
1. Real-time Updates via WebSockets
The real-time functionality is implemented using the WebSocket protocol:

Server-side:

WebSocket server runs alongside the HTTP server
Connected clients are stored in memory with their user IDs
Task updates trigger notifications to relevant users
The server broadcasts task updates to all connected clients
Client-side:

A React context provides WebSocket connection to all components
Authentication is performed over the WebSocket connection
Incoming messages trigger React Query cache invalidations
Toast notifications display real-time updates
2. Task Management
CRUD Operations:

Create, read, update, and delete operations for tasks
Real-time notifications for task assignments and updates
Filtering by status, priority, and due date
Access Control:

Task creators can edit, delete, and reassign tasks
Task assignees can update task status and details
Users can only see tasks they created or are assigned to
3. Data Synchronization
The application uses a dual approach for data synchronization:

WebSockets for immediate push notifications
React Query for optimistic updates and cache management
This approach ensures that:

Users see immediate feedback for their actions
The UI stays in sync with the database state
Network disruptions are handled gracefully
4. Responsive Design
The application features a responsive design that works well on:

Desktop browsers
Tablets
Mobile devices
A mobile-specific navigation component appears on smaller screens, while a sidebar is used on larger displays.

Future Enhancements
Role-Based Access Control: Implementing Admin, Manager, and Regular User roles
Recurring Tasks: Adding support for daily, weekly, or monthly recurring tasks
Audit Logging: Tracking all user actions for compliance and debugging
Analytics Dashboard: Providing insights into task completion rates and team performance
Offline Support: Using Service Workers for offline functionality
This architecture provides a solid foundation for expanding the system with these features in the future.
