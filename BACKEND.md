# Backend API

This directory contains a minimal Express server for the Snack Track Insight application.

## Setup

From the project root directory:

```sh
npm install
npm start
```

The server will start on the port specified by the `PORT` environment variable (defaults to `4000`).

## Transcription and Analysis

The backend uses **Azure Speech Services** to convert uploaded audio into text and **Azure AI Text Analytics** to evaluate the
transcription for sentiment and key phrases. Create these resources in the Azure Portal and provide their credentials via
environment variables as shown below.

The server exposes two routes for this workflow:

- `POST /api/transcribe` – accepts an audio file and returns the transcript using Azure Speech Services. Requires `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`.
- `POST /api/analyze` – accepts raw text and returns sentiment and key phrases from Azure AI Text Analytics. Requires `AZURE_LANGUAGE_KEY` and `AZURE_LANGUAGE_ENDPOINT`.

Hugging Face Whisper and the local `natural` package are no longer used, so no `HF_TOKEN` is needed. Without valid Azure credentials calls to these endpoints will fail, preventing local testing unless the Azure resources exist.

## Environment Variables

For local development, create a `.env` file in the project root. In a production environment (like Azure App Service), set these as environment variables.

### Required Variables

-   `DB_HOST`: The hostname of your PostgreSQL database.
-   `DB_PORT`: The port of your PostgreSQL database.
-   `DB_USER`: The username for your PostgreSQL database.
-   `DB_PASSWORD`: The password for your PostgreSQL database.
-   `DB_NAME`: The name of your PostgreSQL database.
-   `AZURE_SPEECH_KEY`: Key for your Azure Speech resource.
-   `AZURE_SPEECH_REGION`: Region for your Azure Speech resource.
-   `AZURE_LANGUAGE_KEY`: Key for your Azure AI Language resource.
-   `AZURE_LANGUAGE_ENDPOINT`: Endpoint URL for your Azure AI Language resource.

### Optional Variables

-   `PORT`: The port for the backend server to listen on (defaults to `4000`).
-   `AZURE_STORAGE_CONNECTION_STRING`: If you want to store uploaded files in Azure Blob Storage, provide the connection string here.
-   `AZURE_AUDIO_CONTAINER`: The name of the Azure Blob Storage container for audio files.
-   `AZURE_MEDIA_CONTAINER`: The name of the Azure Blob Storage container for media files.
-   `CORS_ORIGIN`: A comma-separated list of allowed origins for CORS requests.

Example `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=snackuser
DB_PASSWORD=snackpass
DB_NAME=snacktrack
PORT=4000
AZURE_SPEECH_KEY=your_speech_key
AZURE_SPEECH_REGION=your_speech_region
AZURE_LANGUAGE_KEY=your_language_key
AZURE_LANGUAGE_ENDPOINT=https://your-language-resource.cognitiveservices.azure.com/
```

The server automatically loads variables from the `.env` file during local development. When deployed to Azure, it will use the environment variables configured in the App Settings.
