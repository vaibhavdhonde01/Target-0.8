# "One number away from victory—or elimination."

Beauty Contest Game - Alice in Borderland

A real-time multiplayer browser game replicating the "Beauty Contest" survival game from Alice in Borderland Season 2, Episode 6.

📁 Project Structure
beauty-contest-game/
├── server.js              # Main server file with Socket.IO logic
├── package.json           # Node.js dependencies and scripts
├── public/                # Static files served to browsers
│   └── index.html         # Game client (HTML, CSS, JS)
└── README.md             # This file

🎮 Game Rules

4 players connect to the same game room
Each round, every player chooses a number between 0 and 100
The system calculates the average of all chosen numbers
Multiplies this average by 0.8 to get the target number
The player closest to the target wins the round
All losing players lose 1 point from their score
A player reaching -10 points is eliminated
When a player is eliminated, a new strategic rule is introduced
Game continues until only one player remains

🚀 Quick Start
Local Development

Install Node.js (version 14 or higher)
bash# Check if Node.js is installed
node --version

Create project directory and files
bashmkdir beauty-contest-game
cd beauty-contest-game

Save the provided files:

Save the server code as server.js
Save the package.json content as package.json
Create a public folder and save the HTML game as public/index.html


Install dependencies
bashnpm install

Start the server
bashnpm start

Open the game

Open your browser to http://localhost:3000
Share this URL with 3 other players
Once 4 players join, anyone can start the game



Development Mode (Auto-restart)
For development with automatic server restart on file changes:
bashnpm run dev
🌐 Online Deployment
Option 1: Heroku

Install Heroku CLI
Create a Heroku app
bashheroku create your-beauty-contest-game

Deploy
bashgit add .
git commit -m "Initial commit"
git push heroku main


Option 2: Railway

Connect your GitHub repository to Railway
Deploy automatically from the main branch
Railway will detect the Node.js app and deploy it

Option 3: Render

Create a new web service on Render
Connect your GitHub repository
Use these settings:

Build Command: npm install
Start Command: npm start



Option 4: DigitalOcean App Platform

Create a new app on DigitalOcean
Connect your GitHub repository
The platform will auto-detect the Node.js configuration

🎯 Game Features
Core Gameplay

Real-time multiplayer with Socket.IO
30-second timer per round with countdown
Automatic random selection if time expires
Live score tracking with elimination warnings
Round history showing all player choices

Special Rules (Introduced after eliminations)

Double Multiplier: Target = Average × 1.6
Reverse Mode: Furthest from target wins
Lucky Number: Choosing 42 automatically wins
High Stakes: Winner gets +1 point, losers get -2
Prediction Mode: Target based on previous winner's choice

UI/UX Features

Dark, tense atmosphere matching the show's aesthetic
Responsive design for desktop and mobile
Real-time connection status
Player avatars with elimination animations
Dramatic result reveals

🔧 Customization
Modifying Game Rules
Edit server.js to customize:
javascript// Change elimination threshold
if (players[playerId].score <= -10) { // Change -10 to desired value

// Modify timer duration
gameState.timeLeft = 30; // Change 30 to desired seconds

// Add new special rules
const SPECIAL_RULES = [
    "Your custom rule here",
    // Add more rules...
];
Styling Changes
Edit the <style> section in public/index.html to customize:

Colors and themes
Animations and effects
Layout and typography
Mobile responsiveness

🐛 Troubleshooting
Common Issues

"Cannot find module" errors
bashnpm install

Port already in use
bash# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

Connection issues

Check firewall settings
Ensure port 3000 is open
Try different browsers


Players can't join

Verify all players use the exact same URL
Check if game already started (max 4 players)
Refresh the page and try again



Browser Compatibility

Chrome (recommended)
Firefox
Safari
Edge
Mobile browsers (iOS Safari, Chrome Mobile)

📝 Technical Details
Technologies Used

Frontend: HTML5, CSS3, JavaScript (ES6+)
Backend: Node.js, Express.js
Real-time Communication: Socket.IO
Deployment: Compatible with most cloud platforms

Performance

Optimized for 4 concurrent players
Low latency real-time updates
Minimal server resources required
Mobile-friendly with touch controls

Security Features

Input validation for all user data
Protected against common web vulnerabilities
Rate limiting for API calls
Secure random number generation

📄 License
MIT License - Feel free to modify and distribute
🎬 About Alice in Borderland
This game is inspired by the "Beauty Contest" episode from Alice in Borderland Season 2, Episode 6. The rules are implemented exactly as shown in the series, including the -10 point elimination rule and the introduction of new rules after eliminations.

Enjoy the psychological battle of minds! May the best strategist survive! 🎲
