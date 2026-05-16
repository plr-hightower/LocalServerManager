Services are responsible for async communication with backend or the server rig OS, no ui logic lives here.

# Files

1. 'apiClient.ts' : The base fetch instance with interceptors for headers and errors

2. 'serverService.ts' : Methods for CRUD operations (ex. create(), fetchInstance(), etc.)

3. 'powerService.ts' : Logic for power states (ex. start(id), stop(id), etc.)

4. 'socketService.ts' : Handles websocket connections for real-time console logs and stats.

If you need to change your backend URL or switch from REST to GraphQL, this is the *only* folder you should have to touch.