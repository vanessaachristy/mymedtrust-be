# MongoDB Atlas Setup Guide

This guide will walk you through the process of setting up a MongoDB Atlas account, creating a cluster, and setting up a MongoDB user password.

## Step 1: Create MongoDB Atlas Account

1. Visit the MongoDB Atlas website: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click on the "Start Free" button to sign up for an account.
3. Follow the prompts to create your account, including providing your email address, name, and creating a password.

## Step 2: Log in to MongoDB Atlas

1. Once you've created your account, log in to MongoDB Atlas using your credentials.

## Step 3: Create a Cluster

1. After logging in, navigate to the dashboard.
2. Click on the "Build a Cluster" button or the "Create a Cluster" button.
3. Follow the prompts to configure your cluster, including selecting your cloud provider, region, and cluster tier.
4. Click on the "Create Cluster" button to create your cluster.

## Step 4: Set Up Database Access

1. In the MongoDB Atlas dashboard, navigate to the "Database Access" tab.
2. Click on the "Add New Database User" button.
3. Enter a username and password for the new database user.
4. Assign the appropriate roles for the user (e.g., readWrite).
5. Click on the "Add User" button to create the user.

## Step 5: Note Down the Password

1. Once you've created the database user, note down the password you've set for the user.
2. It's important to keep this password secure and store it in a safe place.

## Step 6: Use the Password in Your Application

1. Copy the .env.example in the same directory and rename it to .env
2. Replace the MONGO_DB_USERNAME and MONGO_DB_PASSWORD to the respective username and password you've created to connect to your MongoDB Atlas cluster

That's it! You've now successfully set up a MongoDB Atlas account, created a cluster, and set up a MongoDB user password.

For more information and detailed documentation, refer to the [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/).

# JWT SECRET Setup

 In the `.env` file in the root directory created previously in the MongoDB setup,

   Replace JWT_SECRET with 32 alphanumeric characters for encoding JWT tokens in the authentication process.

# Running the Project: Option 1: Using Node

This guide explains how to set up and run the Express.js project using Node.js in the terminal.

## Prerequisites

Before running the project, ensure you have the following prerequisites installed:

- **Node.js**: Ensure you have a recent version of Node.js installed. You can check your version with the following command:

    ```bash
    node --version
    ```

- **npm**: Node.js comes with npm (Node Package Manager) by default. You can check your npm version with the following command:

    ```bash
    npm --version
    ```

## Getting Started

To run the application locally, follow these steps:

1. Clone this repository to your local machine:

```bash
git clone https://github.com/vanessaachristy/mymedtrust-be.git
```

2. Navigate to the project directory:

```bash
cd mymedtrust-be
```

3. Ensure the `.env` file in the root directory is created and filled in properly

4. Installation:

To install the necessary dependencies for the project, run the following command in the project directory:

```bash
npm install
```

5. Start the project:

```bash
npm run dev
```

# Running the Project: Option 2: Using Docker

This repository contains the source code for a backend application built with Express.js. The application is containerized using Docker for easy setup and deployment.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Docker: [Install Docker](https://docs.docker.com/get-docker/)
- Docker Compose: [Install Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

To run the application locally, follow these steps:

1. Clone this repository to your local machine:

```bash
git clone https://github.com/vanessaachristy/mymedtrust-be.git
```

2. Navigate to the project directory:

```bash
cd mymedtrust-be
```

3. Ensure the `.env` file in the root directory is created and filled in properly

4. Build the Docker image:

```bash
docker-compose build
```

5. Start the Docker containers:

```bash
docker-compose up
```

6. If it's successfully configured, the terminal will show

```bash
Server is Fire at http://localhost:3000
connected to database!
```

7. Access the server at `http://localhost:3000`.

## Available Scripts

In the project directory, you can run the following Docker commands:

- `docker-compose up`: Starts the Docker containers and runs the application.
- `docker-compose down`: Stops and removes the Docker containers.
- `docker-compose build`: Builds the Docker image.
- `docker-compose logs`: Displays the logs of the Docker containers.

## Contributing

If you'd like to contribute to this project, please fork the repository, make your changes, and submit a pull request. We welcome contributions of any kind!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
