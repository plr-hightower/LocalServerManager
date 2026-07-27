import { ref, computed, watch, toValue, type MaybeRefOrGetter } from 'vue';
import * as z from 'zod';
import { GameSettingsSchema, type GameE } from '@hightower/shared';

// derived from the discriminated union — adding a game to GameSettingsSchema is enough
const SCHEMAS: Record<string, z.ZodType> = Object.fromEntries(
    // zod v4 types the discriminator as a merged ZodEnum, but at runtime it's the branch's
    // ZodLiteral — cast to the real type to read its value
    GameSettingsSchema.options.map(schema => [
        (schema.shape.game as unknown as z.ZodLiteral<GameE>).value,
        schema,
    ]),
);
export interface FormField {
    key: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'fixed';
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
                else if
                    (p.type === 'boolean') type = 'boolean';

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

    // reverts model[key] back to its schema default if the current value doesn't validate
    function validateField(key: string) {
        const schema = SCHEMAS[toValue(game)] as z.ZodObject<z.ZodRawShape> | undefined;
        const fieldSchema = schema?.shape[key] as unknown as z.ZodType | undefined;
        if (!fieldSchema) return;
        if (!fieldSchema.safeParse(model.value[key]).success) {
            model.value[key] = fields.value.find(f => f.key === key)?.default;
        }
    }

    return { fields, model, readonly: !!opts.readonly, validateField };
}