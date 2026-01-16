# SmartHire

SmartHire is an AI-powered interview coaching application. It simulates live interviews using advanced audio transcription and generative AI to provide real-time feedback and questions tailored to your resume and job description.

## Features

- **Personalized Interview Simulation**: Generates questions based on uploaded optional job descriptions/resumes.
- **Real-time Transcription**: Converts your voice to text instantly.
- **AI Feedback**: Receive constructive feedback on your answers.

## Prerequisites

- **Node.js**: Version 18 or higher.
- **npm**: Comes with Node.js.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/smarthire.git
    cd smarthire
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - Open `.env` and fill in your API keys:
      - `VITE_GEMINI_API_KEY`: Your Google Gemini API Key.
      - `VITE_SUPABASE_URL`: Your Supabase Project URL.
      - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

## Usage

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

## Docker Usage

To run the application using Docker:

1.  Ensure Docker and Docker Compose are installed.
2.  Make sure your `.env` file is configured.
3.  Run:
    ```bash
    docker-compose up --build
    ```
4.  Open `http://localhost:8080`.

## License

Distributed under the MIT License. See `LICENSE` for more information.
