export type FieldType = 'string' | 'number' | 'boolean' | 'select';

export interface ConfigField {
    key: string;          // name of the field, e.g. 'maxPlayers'
    label: string;        // what the user sees, e.g. 'Max Players'
    type: FieldType;      // input type of the field
    defaultValue: any;    // starting value for the field
    options?: string[];   // for 'select' type, the available options
    placeholder?: string; // placeholder text for the input
    helpText?: string;    // additional info about the field
}

export interface Schematic {
    gameId: string;
    gameName: string;
    icon: string;          // path to the game's icon
    fields: ConfigField[]; // configuration fields for this game
}