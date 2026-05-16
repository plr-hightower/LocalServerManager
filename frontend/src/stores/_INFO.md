Stores hold the current state of the app. If a user naviguates away from a page and comes back, the data here will ensure that they don't lose their place.

# Files 

1. 'useServerStore.ts' : Tracks all active server instances, their status and their loaded configs

2. 'useGameStore.ts' : Manages the available games in the game library and the currently selected game.

3. 'useAppStore.ts' : Global UI state, dark mode toggle, notifs and sidebar collapse state

Components should never modify the store state directly. Using Actions inside the store will ensure the state changes are predictable.