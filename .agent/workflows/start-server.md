---
description: How to start the SmartHire development server
---

# Starting SmartHire Development Server

Follow these simple steps to run the SmartHire application locally:

## Prerequisites

Make sure you have Node.js installed on your system.

## Steps

1. **Navigate to the SmartHire project directory**
   ```bash
   cd /path/to/your/SmartHire
   ```

2. **Install dependencies (first time only)**
   ```bash
   npm install
   ```

3. **Start the development server**
   // turbo
   ```bash
   npm run dev
   ```

4. **Access the application**
   
   Once the server starts, you'll see output like:
   ```
   VITE v7.2.4  ready in 121 ms
   
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```
   
   Open your browser and navigate to: **http://localhost:5173/**

## Stopping the Server

To stop the development server, press `Ctrl + C` in the terminal where the server is running.

## Troubleshooting

- **Port already in use**: If port 5173 is already in use, Vite will automatically try the next available port (5174, 5175, etc.)
- **Dependencies issues**: If you encounter errors, try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- **Environment variables**: Make sure your `.env` file is properly configured with your API keys (Gemini API, Supabase credentials)
