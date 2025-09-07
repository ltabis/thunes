import { create } from "zustand";
import { PortfolioTile } from "../../../cli/bindings/PortfolioTile";
import { addTile, listTiles, removeTile, updateTile } from "../api";
import { arrayMove } from "@dnd-kit/sortable";
import { WriteTileOptions } from "../../../cli/bindings/WriteTileOptions";

interface TilesState {
  tiles: PortfolioTile[];
  create: (options: WriteTileOptions) => Promise<PortfolioTile>;
  delete: (tile: PortfolioTile) => Promise<void>;
  swap: (left: number, right: number) => Promise<void>;
}

// TODO: generalize errors with snack bars.

export const useTileStore = create<TilesState>((set, get) => ({
  tiles: [],
  create: async (options: WriteTileOptions) => {
    const tile = await addTile(options);

    set({
      tiles: await listTiles(),
    });

    return tile;
  },
  delete: async (tile: PortfolioTile) => {
    await removeTile(tile.id);

    set({
      tiles: await listTiles(),
    });
  },
  swap: async (left, right) => {
    if (left === right) return;

    const tiles = get().tiles;
    await updateTile({
      ...tiles[left],
      order: right,
    });
    await updateTile({
      ...tiles[right],
      order: left,
    });

    set((state) => {
      const moved = arrayMove(state.tiles, left, right);
      return {
        tiles: moved,
      };
    });
  },
}));
