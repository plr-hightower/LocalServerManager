import { ref, computed, watch, toValue, type MaybeRefOrGetter } from 'vue';
import * as z from 'zod';
import { GameSettingsSchema, type GameE } from '@hightower/shared';

// derived from the discriminated union — adding a game to GameSettingsSchema is enough
const SCHEMAS: Record<string, z.ZodType> = Object.fromEntries(
    GameSettingsSchema.options.map(schema => [schema.shape.game.value, schema])
);

export interface FormField {
    key: string;
    type: 'text' | 'number' | 'select' | 'fixed';
    default: unknown;
    options?: string[]; // for selects
    min?: number;
    max?: number;
    maxLength?: number;
}

export function useServerForm(
    game: MaybeRefOrGetter<GameE>,
    opts: { initial?: MaybeRefOrGetter<Record<string, unknown> | undefined>; readonly?: boolean; hide?: string[] } = {},
) {
    const hidden = new Set(['game', ...(opts.hide ?? [])]); // <-- game + caller's hidden keys

    const fields = computed<FormField[]>(() => {
        const schema = SCHEMAS[toValue(game)];
        if (!schema) return [];
        const json = z.toJSONSchema(schema) as any;
        return Object.entries(json.properties)
            .filter(([key]) => !hidden.has(key))
            .map(([key, p]: [string, any]) => {
                let type: FormField['type'] = 'text';

                if (p.const !== undefined)
                    type = 'fixed'; // ex. EULA = "TRUE"
                else if
                    (p.enum) type = 'select';
                else if
                    (p.type === 'integer' || p.type === 'number') type = 'number';

                return {
                    key, type,
                    default: p.default ?? p.const,
                    options: p.enum,
                    min: p.minimum,
                    max: p.maximum,
                    maxLength: p.maxLength,
                };
            });
    });

    // initialised to defaults, rebuilt whenever the game changes
    const model = ref<Record<string, unknown>>({});
    watch([fields, () => toValue(opts.initial)], ([f, initial]) => {
        const next: Record<string, unknown> = {};
        for (const field of f) next[field.key] = initial?.[field.key] ?? field.default;
        next.game = toValue(game);
        model.value = next;
    }, { immediate: true });

    return { fields, model, readonly: !!opts.readonly };
}