##https://gmt-458-web-gis.github.io/geogame-senbonzakura9/
This is the first readme file of the game it is based on the first thoughts about the game for further infomations and innovations please check read me 2.

Time Traveler GeoGame
1. Game Concept
Time Traveler GeoGame is an interactive, time-limited geography game where the player is shown a historical event, and must click the correct geographic location on the map. The aim is to score as many points as possible within one minute.
2. Requirements
Functional Requirements:
Display a world map that allows the player to click any location.
Show a random historical event each round (e.g., “Chernobyl Disaster”, “Fall of Constantinople”, “Battle of Gallipoli”).
After the user clicks, calculate the distance between the clicked location and the true event location.
Award points based on accuracy.
Deduct a life if the guess is too far (over 2000 km).
Automatically load the next event.
Show score, remaining lives, and remaining time on the interface.
Non-Functional Requirements:
Web application must be responsive and run smoothly on desktop/mobile.
The interface should be simple and easy to understand.
Code should be modular and well-structured.
3. Game Progression
Time Mechanic:
Total game time: 60 seconds
Player tries to answer as many questions as possible before time runs out.
Questions:
Unlimited, depends on player speed (typically 10–20 per minute).
Lives:
Player starts with 3 lives.
Losing a life occurs when the guess is extremely inaccurate (> 2000 km).
When lives reach 0, the game ends early.
Difficulty Levels:
Level 1: Well-known events (World Wars, major disasters)
Level 2: Medium-known events (regional battles, independence declarations)
Level 3: Hard events (ancient history, obscure locations)
Difficulty increases automatically every few correct answers.
6. Data Source
Historical events will be stored in a small JSON file including:
Event name
Coordinates (lat, lon) or the name of country or city
7. JavaScript Libraries
Leaflet.js → for map interaction
Turf.js → for distance calculation
Optional: D3.js for animated markers or transitions
Frontend layout of the game :![Timetraveler](https://github.com/user-attachments/assets/5de73856-29b1-4484-976b-b8a840628ec3)
