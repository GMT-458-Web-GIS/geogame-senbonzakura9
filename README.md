**https://gmt-458-web-gis.github.io/geogame-senbonzakura9/**
This is the first readme file of the game. It is an answer for "how should my game be" question, for further informations and innovations please check read me 2.
I think a game should have a music because it puts you in the mood to play so please play the game with music on and enjoy.

Time Traveler GeoGame
1. Game Concept
It is a geogame that asks the player about some events and wants the player to click on the place where that event happened.
2. Requirements
Functional Requirements:
We need a world map with countries and their borders.
We ask the player where did that event happen such as (e.g., “Chernobyl Disaster”, “Fall of Constantinople”, “Battle of Gallipoli”).
After the user clicks on the map we calculate the distance between the clicked location and the true event location.
The player earns points based on accuracy and if player is 2000 kms away from the correct answer the player will lose a life(players have 3 lives).
In the interface the score, remaining lives and earned points are shown.
Non-Functional Requirements:
Web application must be responsive and run smoothly on desktop.
The interface should be simple and easy to understand.
3. Game Progression
Time Mechanic:
Total game time: 60 seconds
Player tries to answer as many questions as possible before time runs out.
Questions:
Depends on players speed (typically 10–20 per minute).
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
Leaflet.js for map interaction
Turf.js for distance calculation
I wanted the desing to look like this
Frontend layout of the game :![Timetraveler](https://github.com/user-attachments/assets/5de73856-29b1-4484-976b-b8a840628ec3)
