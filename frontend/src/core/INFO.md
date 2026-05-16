The core section is the foundation of the logic of the application. It separates types, schematics and libraries.

# Logic Separation

1. **Types** (/types) : Defines what the data of the objects looks like. If the data does not match the types, errors will appear. 

2. **Constants** (/constants) : These are basically static values. They don't change during runtime.

3. **Utils** (/utils) : Useful functions that can transform data, format things or calculate things.

## Data Flow
Constants define the **GameLibrary** 
Types enforce the **Schematic**
Utils process the **User Input**