# Azure Deployment Guide

This guide provides step-by-step instructions for deploying the Snack Track Insight application to Microsoft Azure.

The application consists of three main components:
1.  A **PostgreSQL database** to store data.
2.  A **Node.js/Express backend** for the API.
3.  A **React frontend** for the user interface.

We will use the following Azure services:
-   **Azure Database for PostgreSQL** for the database.
-   **Azure App Service** for the backend.
-   **Azure Static Web Apps** for the frontend.

## Part 1: Deploying the PostgreSQL Database

First, we'll set up the database.

1.  **Create an Azure Database for PostgreSQL flexible server**.
    -   In the Azure portal, search for "Azure Database for PostgreSQL flexible servers" and click "Create".
    -   Choose a subscription and resource group.
    -   Provide a unique server name, and choose a region.
    -   For "Workload type", select "Development".
    -   For "Compute + storage", you can start with the "Burstable" tier (e.g., `Standard_B1ms`).
    -   Set an admin username and password. **Remember these credentials**.
    -   Under "Networking", select "Public access" and add a firewall rule to allow connections from your local IP address for now. We will add a rule for the App Service later.
    -   Click "Review + create" and then "Create".

2.  **Get the connection details**.
    -   Once the database is deployed, go to the resource.
    -   In the "Overview" tab, you will find the **Server name** and **Admin username**.
    -   You will use these details for the `DB_HOST`, `DB_USER`, and `DB_PASSWORD` environment variables in the backend.
    -   Create a database named `snacktrack` using your favorite PostgreSQL client (e.g., `psql` or DBeaver).

## Part 2: Deploying the Backend to Azure App Service

Next, we'll deploy the Node.js backend.

1.  **Create an Azure App Service**.
    -   In the Azure portal, search for "App Services" and click "Create".
    -   Choose a subscription and resource group.
    -   Provide a unique name for your app. This will be part of the URL (e.g., `your-app-name.azurewebsites.net`).
    -   For "Publish", select "Code".
    -   For "Runtime stack", select "Node 20 LTS" (or the latest LTS version).
    -   For "Operating System", select "Linux".
    -   Choose a region.
    -   Choose an App Service Plan. A "Free F1" plan is available for development and testing.
    -   Click "Review + create" and then "Create".

2.  **Configure Environment Variables**.
    -   Go to your App Service resource.
    -   Under "Settings", click "Configuration".
    -   In the "Application settings" tab, add the following key-value pairs:
        -   `DB_HOST`: Your PostgreSQL server name.
        -   `DB_PORT`: `5432`.
        -   `DB_USER`: Your PostgreSQL admin username.
        -   `DB_PASSWORD`: Your PostgreSQL admin password.
        -   `DB_NAME`: `snacktrack`.
        -   `AZURE_SPEECH_KEY`: Your Azure Speech resource key.
        -   `AZURE_SPEECH_REGION`: Region of your Azure Speech resource.
        -   `AZURE_LANGUAGE_KEY`: Your Azure AI Language resource key.
        -   `AZURE_LANGUAGE_ENDPOINT`: Endpoint of your Azure AI Language resource.
        -   `AZURE_STORAGE_CONNECTION_STRING` (Optional): Your Azure Storage connection string.
        -   `AZURE_AUDIO_CONTAINER` (Optional): `audio-logs`.
        -   `AZURE_MEDIA_CONTAINER` (Optional): `media-logs`.
        -   `CORS_ORIGIN`: The URL of your deployed frontend (we'll get this in the next part).
    -   Click "Save".

3.  **Allow App Service to connect to the database**.
    -   Go to your PostgreSQL server resource in the Azure portal.
    -   Under "Networking", check the box for "Allow public access from any Azure service within Azure to this server".
    -   Click "Save".

4.  **Deploy the code**.
    -   There are multiple ways to deploy your code. One of the easiest is using the "Azure App Service" extension in VS Code.
    -   Alternatively, you can set up a CI/CD pipeline using GitHub Actions. The App Service "Deployment Center" can help you with this.
    -   Make sure you are deploying the code from the project root, not the `backend` subdirectory. The `start` script in `package.json` is already configured to run `node server.js`.

## Part 3: Deploying the Frontend to Azure Static Web Apps

Finally, we'll deploy the React frontend.

1.  **Create an Azure Static Web App**.
    -   In the Azure portal, search for "Static Web Apps" and click "Create".
    -   Choose a subscription and resource group.
    -   Provide a name for your app.
    -   Choose a region.
    -   For "Deployment details", select "GitHub" (or your preferred Git provider).
    -   Sign in to your GitHub account and select your repository and branch.
    -   For "Build Presets", select "React".
    -   Set the "App location" to `/frontend`.
    -   Set the "Api location" to empty (we are using an App Service for the API).
    -   Set the "Output location" to `dist`.
    -   Click "Review + create" and then "Create".

2.  **Configure the backend link**.
    -   When you create the Static Web App, it will create a GitHub Actions workflow file in your repository (`.github/workflows`).
    -   The Static Web App needs to know the URL of your backend API. You can link it in the Azure portal.
    -   Go to your Static Web App resource.
    -   Under "Settings", click "Configuration".
    -   Add an application setting named `VITE_API_BASE_URL` with the value of your backend App Service URL (e.g., `https://your-app-name.azurewebsites.net`).
    -   This will make the frontend send API requests to your backend.

3.  **Update CORS settings in the backend**.
    -   Now that you have the URL for your Static Web App, go back to your App Service configuration.
    -   Update the `CORS_ORIGIN` setting with your Static Web App's URL.

After completing these steps, your application should be fully deployed and running on Azure.
