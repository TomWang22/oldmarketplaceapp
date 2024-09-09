# Marketplace Application

## Project Overview
This project is a web-based marketplace application designed to manage and facilitate transactions between merchants, suppliers, and shoppers. It provides distinct dashboards and functionalities for different user roles, ensuring a seamless and user-friendly experience.

## Features
- **Multi-View User Interface**: Separate dashboards for merchants, suppliers, and shoppers.
- **Merchants**: Manage products, view received supplies, and send merchandise.
- **Suppliers**: Add supplies and send supplies to merchants.
- **Shoppers**: Manage shopping cart, add funds, and return merchandise.
- **Local Storage**: Persistent user sessions and data storage.
- **Dynamic DOM and UI Updates**: Real-time updates based on user interactions.
- **Event Handling**: Responsive handling of user actions like clicks and inputs.
- **CSS and Visual Design**: Enhanced visual design and responsiveness using a CSS framework.

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Session Management**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **CSS Framework**: Bootstrap

## Installation
1. Clone the Repository:
    ```sh
    git clone https://github.com/TomWang22/Marketplace-app.git
    cd Marketplace-app
    ```
2. Install Dependencies:
    ```sh
    npm install
    ```
3. Set Up PostgreSQL Database:
    - Create a database named `marketplace`.
    - Run the SQL scripts provided in the `db` directory:
    ```sh
    psql -U postgres -d marketplace -f db/scripts.sql
    ```
4. Set Up Redis:
    - Ensure Redis is installed and running on your machine.
    - Update the Redis connection settings in `server.js` if necessary.
5. Start the Server:
    ```sh
    npm start
    ```

## Usage
1. Start the backend server:
    ```sh
    npm start
    ```
2. Open your browser and navigate to `http://localhost:3000`.

## User Roles and Functionality
Local Storage Usage:

User Authentication Tokens: Store JWT tokens to maintain user sessions.

User Roles and IDs: Persist the role and ID of the logged-in user### README
### Merchant
- **Add New Products**: Add new products with details like name, description, price, stock, and image URL.
- **View and Manage Received Supplies**: View a list of supplies received.
- **Send Merchandise**: Send merchandise to customers.

### Supplier
- **Add New Supplies**: Add new supplies to the inventory.
- **Send Supplies**: Send supplies to merchants.

### Shopper
- **Add Funds**: Add funds to their account.
- **Return Merchandise**: Return merchandise.
- **View and Manage Shopping Cart**: Manage items in their shopping cart.
- **Purchase Products**: Purchase products from the marketplace.

# API Documentation

## Overview
This API is built using Express.js and PostgreSQL, providing functionalities for user registration, login, product management, shopping cart management, order placement, and real-time chat. Redis is used for session management, and Socket.io is used for real-time chat functionalities.

## Table of Contents
- [Setup](#setup)
- [Endpoints](#endpoints)
  - [User Registration](#user-registration)
  - [User Login](#user-login)
  - [Shopping Cart](#shopping-cart)
  - [Order Management](#order-management)
  - [Chat Functionality](#chat-functionality)
  - [Product Management](#product-management)
  - [Supply Management](#supply-management)
  - [Account Information](#account-information)
- [Real-time Chat](#real-time-chat)
- [Error Handling](#error-handling)

## Setup

### Install dependencies:

```bash
npm install express body-parser pg bcryptjs path cors jsonwebtoken cluster os express-session connect-redis ioredis http socket.io
```

### Configure PostgreSQL and Redis connections:

#### PostgreSQL:

```javascript
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "marketplace",
  port: 5432,
});
```

#### Redis:

```javascript
const redisClient = new Redis({
  host: "127.0.0.1",
  port: 6379,
});
```

### Start the server:

```javascript
const port = 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
```

## Endpoints

### User Registration

**Endpoint:** `/api/register`

**Method:** `POST`

**Request Body:**

```json
{
  "username": "string",
  "password": "string",
  "role": "string" // 'shopper', 'merchant', or 'supplier'
}
```

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "user": { /* user details */ }
  }
  ```
- Error: `400 Bad Request` or `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

### User Login

**Endpoint:** `/api/login`

**Method:** `POST`

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "userId": "number",
    "role": "string",
    "token": "string"
  }
  ```
- Error: `401 Unauthorized` or `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Invalid credentials"
  }
  ```

### Shopping Cart

#### Get Cart Items

**Endpoint:** `/api/cart`

**Method:** `GET`

**Query Parameters:**

- `userId`: `number`

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "items": [ /* cart items */ ]
  }
  ```
- Error: `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

#### Add Item to Cart

**Endpoint:** `/api/cart`

**Method:** `POST`

**Request Body:**

```json
{
  "userId": "number",
  "productId": "number",
  "quantity": "number"
}
```

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "item": { /* cart item details */ }
  }
  ```
- Error: `400 Bad Request` or `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

#### Update Cart Item

**Endpoint:** `/api/cart/:id`

**Method:** `PUT`

**Request Body:**

```json
{
  "quantity": "number"
}
```

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true
  }
  ```
- Error: `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

#### Delete Cart Item

**Endpoint:** `/api/cart/:id`

**Method:** `DELETE`

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true
  }
  ```
- Error: `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

### Order Management

#### Place Order

**Endpoint:** `/api/place-order`

**Method:** `POST`

**Request Body:**

```json
{
  "userId": "number",
  "cartItems": [ /* array of cart items */ ]
}
```

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "message": "Order placed successfully"
  }
  ```
- Error: `400 Bad Request` or `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

#### Return Merchandise

**Endpoint:** `/api/return-merchandise`

**Method:** `POST`

**Request Body:**

```json
{
  "userId": "number",
  "productId": "number",
  "quantity": "number"
}
```

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "message": "Merchandise returned and refunded successfully"
  }
  ```
- Error: `400 Bad Request` or `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

### Chat Functionality

**Using Socket.io for real-time communication**

- Connection established:
  ```javascript
  io.on("connection", (socket) => {
    console.log("A user connected");
  });
  ```

- Sending a message:
  ```javascript
  socket.on("sendMessage", async (data) => {
    const { message, userId, role } = data;
    // Logic to handle message sending
  });
  ```

- Receiving previous chats:
  ```javascript
  socket.emit("previousChats", results.rows);
  ```

### Product Management

#### Get Products

**Endpoint:** `/api/products`

**Method:** `GET`

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "products": [ /* array of products */ ]
  }
  ```
- Error: `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

#### Add Product

**Endpoint:** `/api/products`

**Method:** `POST`

**Request Body:**

```json
{
  "name": "string",
  "description": "string",
  "price": "number",
  "stock": "number",
  "image_url": "string"
}
```

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "product": { /* product details */ }
  }
  ```
- Error: `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

### Supply Management

#### Request Supply

**Endpoint:** `/api/request-supply`

**Method:** `POST`

**Request Body:**

```json
{
  "merchantId": "number",
  "productId": "number",
  "quantity": "number"
}
```

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "request": { /* request details */ }
  }
  ```
- Error: `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

#### Get Supply Requests

**Endpoint:** `/api/supply-requests`

**Method:** `GET`

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "requests": [ /* array of supply requests */ ]
  }
  ```
- Error: `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

#### Send Supplies

**Endpoint:** `/api/send-supplies`

**Method:** `POST`

**Request Body:**

```json
{
  "supplierId": "number",
  "merchantId": "number",
  "productId": "number",
  "quantity": "number"
}
```

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "message": "Supplies sent and stock updated successfully"
  }
  ```
- Error: `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

### Account Information

#### Get Account Info

**Endpoint:** `/api/account-info`

**Method:** `GET`

**Query Parameters:**

- `userId`: `number`

**Response

:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "account": { /* account details */ }
  }
  ```
- Error: `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

### Purchase History

**Endpoint:** `/api/purchase-history`

**Method:** `GET`

**Query Parameters:**

- `userId`: `number`

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "history": [ /* array of purchase history */ ]
  }
  ```
- Error: `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

### Add Funds

**Endpoint:** `/api/add-funds`

**Method:** `POST`

**Request Body:**

```json
{
  "userId": "number",
  "amount": "number"
}
```

**Response:**

- Success: `200 OK`
  ```json
  {
    "success": true,
    "message": "Funds added successfully"
  }
  ```
- Error: `400 Bad Request` or `500 Internal Server Error`
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

## Real-time Chat

### Socket.io Events

#### Connection Event

```javascript
io.on("connection", (socket) => {
  console.log("A user connected");
});
```

#### Send Message Event

```javascript
socket.on("sendMessage", async (data) => {
  const { message, userId, role } = data;
  const timestamp = new Date();

  try {
    const userResult = await pool.query("SELECT username FROM users WHERE id = $1", [userId]);
    const username = userResult.rows[0]?.username || "Unknown User";

    const result = await pool.query(
      "INSERT INTO chat (user_id, role, message, timestamp, username) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [userId, role, message, timestamp, username]
    );
    const chatMessage = result.rows[0];

    io.emit("receiveMessage", chatMessage);
  } catch (error) {
    console.error("Error inserting chat message into database:", error);
  }
});
```

#### Disconnect Event

```javascript
socket.on("disconnect", () => {
  console.log("A user disconnected");
});
```

## Error Handling

Errors are handled by sending an appropriate HTTP status code and a JSON response containing the success status and error message.

**Example:**

```json
{
  "success": false,
  "message": "Error message"
}
```

- `400 Bad Request`: Client-side error, such as missing or invalid parameters.
- `500 Internal Server Error`: Server-side error, such as database connection issues.

## File Structure
```plaintext
marketplace/
├── db/
│   └── scripts.sql
├── src/
│   ├── backend/
│   │   ├── server.js
│   ├── frontend/
│   │   ├── createaccount.html
│   │   ├── login.html
│   │   ├── marketplace.html
│   │   ├── merchant.html
│   │   ├── shopper.html
│   │   ├── supplier.html
│   │   ├── styles.css
│   │   ├── createaccount.js
│   │   ├── login.js
│   │   ├── marketplace.js
│   │   ├── merchant.js
│   │   ├── shopper.js
│   │   ├── supplier.js
│   │   ├── shopping-cart.js
│   │   ├── shopping-cart.html
│   │   ├── privacy.js
│   │   ├── privacy.html
│   │   ├── contact.js
│   │   ├── contact.html
│   │   ├── about.js
│   │   ├── about.html
