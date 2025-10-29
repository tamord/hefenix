
Folders
-------

Main Folder - the Dot Net Core Stuff
/hefenix Folder - The Angular Stuff

Main Controller - Mody
Main Angular App - hefenix folder

------------------------

Local Host:

Client: running from http://localhost:4200
Server: running from:
Https: listening on: https://localhost:7136
Http: listening on: http://localhost:7135
This can be changed of course
in my environment.ts: (angular project) and Dot net properties

// export const environment = {
//  apiBaseUrl: 'https://localhost:7136'
// };

Server:
Main Controller: Mody
CORS allowed for localhost : 4200

Origins("http://localhost:4200", "https://localhost:4200")

endpoint: Search is allowed without Authorization (anonymous)
endpoint: bookmarks must be authorized with login & jwt

Client:
must be localhost: 4200 othersise CORS error will 

when search is pressed the app will contact the server with query string passed

then the json is recieved and the gallery created

when bookmark pressed the right github is added

when view bookmarks is clicked the page scroll down to the bookmarks section

you can also remove bookmarks from bookmarks section



