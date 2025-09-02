MERN Screen Recorder App

Assignment #3: Take-Home Assignment

A web application that records the active browser tab’s screen with microphone audio, allows users to preview, download, and upload recordings to a MERN backend.

## 📹 Video Demo

Click the image below to watch the app in action:

https://drive.google.com/file/d/19OQw0oEdbrn1fm3M-8DvZQv1aF06fqDl/view?usp=drive_link

✨ Features

Frontend (React)
	•	🖥 Record the current tab (Chrome required) with microphone audio
	•	⏱ Live timer during recording (max 3 minutes)
	•	▶️ Preview recordings after stopping
	•	💾 Download recordings locally
	•	☁️ Upload recordings to backend
	•	📄 View list of uploaded recordings with title, size, created date, and inline playback

Backend (Node + Express + MongoDB)
	•	📡 API Endpoints:
	•	POST /api/recordings → Upload recording + metadata
	•	GET /api/recordings → List recordings with URLs
	•	GET /api/recordings/:id → Fetch/play a recording
	•	🗄 MongoDB Atlas for storing metadata
	•	🗂 File storage via GridFS (or preferred method)

Deployment
	•	Frontend: Vercel / Netlify
	•	Backend: Render / Railway / Heroku
	•	Database: MongoDB Atlas

    Setup Instructions (Local)
  	1.	Clone the repository  
    git clone https://github.com/your-username/mern-screen-recorder.git cd mern-screen-recorder

    2.	Backend setup
    cd backend
    npm install 

    •	Create a .env file:
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string

    Run backend:
    npm run dev

    3.	Frontend setup
    cd ../frontend
    npm install

    Create a .env file (if needed):
    REACT_APP_API_URL=http://localhost:5000/api

    Run frontend:
    npm start

    4.	Access the app

    Open your browser: http://localhost:3000

⚠️ Known Limitations
	•	Chrome is required for tab recording; Safari support is partial.
	•	Maximum recording duration: 3 minutes.
	•	Large files may fail to upload depending on server limits.
	•	No authentication implemented (optional stretch goal).

📦 Notes
	•	node_modules/ is excluded from the repository. Run npm install to install dependencies locally.
	•	Check .env.example for required environment variables.
	•	GridFS is used for storing recordings; files can be retrieved via API endpoints.