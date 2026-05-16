import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { GAME_LIBRARY } from "@rig/shared";

export const useGameStore = defineStore("game", () => {
    const availableGames = ref(GAME_LIBRARY);
    const selectedGameId = ref<string | null>(null);
    const selectedGameDetails = computed(() => {
        if (!selectedGameId.value) return null;
        return availableGames.value[selectedGameId.value] || null;
    });

    const totalAvailableGames = computed(() => {
        return Object.keys(availableGames.value).length;
    });

    function selectGame(gameId: string | null) {
        if (gameId && !availableGames.value[gameId]) {
            console.warn(`Game with ID ${gameId} does not exist in the library.`);
            selectedGameId.value = null;
        } else {
            selectedGameId.value = gameId;
        }
    }

    function clearSelectedGame() {
        selectedGameId.value = null;
    }

    return {
        availableGames,
        selectedGameId,
        selectedGameDetails,
        totalAvailableGames,
        selectGame,
        clearSelectedGame,
    };

});