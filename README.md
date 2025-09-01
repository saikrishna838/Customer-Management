# Customer Management System

A full-stack web application for managing customer information and their addresses, built with Node.js, Express, SQLite, and React.

## Features

### Backend Features
- RESTful API with Express.js
- SQLite database for data persistence
- CRUD operations for customers and addresses
- Search functionality (by name, email, city)
- Pagination support
- Data validation and error handling
- CORS enabled for cross-origin requests

### Frontend Features
- React application with React Router for navigation
- Customer list with search and pagination
- Customer detail view with address management
- Forms for creating and editing customers
- Address management (add, edit, delete)
- Responsive design
- Form validation (client-side and server-side)
- Error handling and loading states

## Project Structure

```
qwipo-assignment/
├── server/                 # Backend Node.js application
│   ├── index.js           # Main server file with API routes
│   ├── package.json       # Backend dependencies
│   └── database.sqlite    # SQLite database (created automatically)
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   ├── App.js         # Main app component with routing
│   │   └── App.css        # Styling
│   └── package.json       # Frontend dependencies
└── README.md              # This file
```

## Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Installation and Setup

### 1. Clone or Download the Project

If you haven't already, make sure you have the project files in a directory on your local machine.

### 2. Install Backend Dependencies

Open a terminal and navigate to the server directory:

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

Open another terminal and navigate to the client directory:

```bash
cd client
npm install
```

## Running the Application

You need to run both the backend server and the frontend application simultaneously.

### 1. Start the Backend Server

In the server directory terminal:

```bash
npm start
```

The server will start on `http://localhost:5000`

You should see the message: "Server is running on port 5000"

### 2. Start the Frontend Application

In the client directory terminal:

```bash
npm start
```

The React application will start on `http://localhost:3000` and should automatically open in your default browser.

### 3. Access the Application

Open your web browser and go to `http://localhost:3000` to use the application.

## API Endpoints

The backend provides the following REST API endpoints:

### Customer Endpoints
- `GET /api/customers` - Get all customers (supports search and pagination)
  - Query parameters: `search`, `city`, `page`, `limit`
- `GET /api/customers/:id` - Get a specific customer
- `POST /api/customers` - Create a new customer
- `PUT /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer

### Address Endpoints
- `GET /api/customers/:id/addresses` - Get all addresses for a customer
- `POST /api/customers/:id/addresses` - Add a new address for a customer
- `PUT /api/addresses/:id` - Update an address
- `DELETE /api/addresses/:id` - Delete an address

### Health Check
- `GET /api/health` - Server health check

## Database Schema

### Customers Table
```sql
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Addresses Table
```sql
CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'USA',
    address_type TEXT DEFAULT 'home',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
);
```

## Usage Guide

### 1. Adding a Customer
1. Click "Add New Customer" on the main page
2. Fill in the required fields (name and email)
3. Optionally add a phone number
4. Click "Create Customer"

### 2. Viewing Customer Details
1. Click on a customer's name in the customer list
2. View customer information and addresses
3. Add, edit, or delete addresses as needed

### 3. Editing a Customer
1. Go to the customer detail page
2. Click "Edit Customer"
3. Update the information
4. Click "Update Customer"

### 4. Managing Addresses
1. On the customer detail page, click "Add Address"
2. Fill in the address details
3. Select the address type (home, work, billing, etc.)
4. Click "Add Address"

### 5. Searching Customers
1. Use the search box on the main page
2. Search by name or email
3. Filter by city if needed
4. Results are paginated for better performance

## Features Implemented

✅ **Customer Management**
- Create, read, update, delete customers
- Search by name or email
- Unique email validation

✅ **Address Management**
- Multiple addresses per customer
- Different address types (home, work, billing, shipping, other)
- Full CRUD operations for addresses

✅ **Search and Filtering**
- Search customers by name or email
- Filter customers by city (searches through their addresses)
- Real-time search as you type

✅ **Pagination**
- Configurable page size
- Navigation between pages
- Display of current page and total results

✅ **Data Validation**
- Frontend form validation
- Backend data validation
- Error handling and user feedback

✅ **Responsive Design**
- Mobile-friendly interface
- Flexible grid layouts
- Accessible navigation

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Make sure no other applications are running on ports 3000 or 5000
   - You can change the server port by setting the PORT environment variable

2. **Database issues**
   - The SQLite database is created automatically
   - If you encounter database errors, try deleting `server/database.sqlite` and restarting the server

3. **CORS errors**
   - Make sure both frontend and backend are running
   - The backend is configured to allow requests from the frontend

4. **Module not found errors**
   - Make sure you've run `npm install` in both server and client directories

### Development Tips

- Use browser developer tools to inspect network requests
- Check the server terminal for API request logs
- The database file `server/database.sqlite` can be inspected with SQLite tools

## Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **SQLite3** - Lightweight database
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API requests

## Future Enhancements

Potential improvements that could be added:

- User authentication and authorization
- Data export functionality (CSV, PDF)
- Advanced search filters
- Address validation with external services
- Customer activity history
- Bulk operations
- Email/SMS integration
- Data backup and restore

## License

This project is for educational purposes as part of the Qwipo assignment.

---

For any issues or questions, please refer to the troubleshooting section above or contact the development team.
