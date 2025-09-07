import {
  Typography,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Grid,
  Box,
} from "@mui/material";
import { useState } from "react";
import { useDispatchSnackbar } from "../contexts/Snackbar";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PieChartIcon from "@mui/icons-material/PieChart";
import {
  RenderTile as RenderAccountTile,
  AddTile as AddAccountTile,
} from "./portfolio/Accounts";
import {
  RenderTile as RenderBudgetTile,
  AddBudget as AddBudgetTile,
} from "./portfolio/Budgets";
import { PortfolioTile } from "../../../cli/bindings/PortfolioTile";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSwappingStrategy,
} from "@dnd-kit/sortable";
import Page from "./Page";
import { useTileStore } from "../stores/tiles";

function Tile({
  id,
  tile,
  onRemove,
}: {
  id: number;
  tile: PortfolioTile;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  let content = <></>;

  switch (tile.type) {
    case "Currency": {
      content = <RenderAccountTile tile={tile.data} {...{ onRemove }} />;
      break;
    }
    case "Budget": {
      content = <RenderBudgetTile tile={tile.data} {...{ onRemove }} />;
      break;
    }
  }

  return (
    <Box
      key={id}
      ref={setNodeRef}
      style={style}
      sx={{ maxWidth: 345 }}
      {...listeners}
      {...attributes}
    >
      {content}
    </Box>
  );
}

export default function () {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const store = useTileStore()!;
  const [addAccountTile, setAddAccountTile] = useState(false);
  const [addBudgetTile, setAddBudgetTile] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over) store.swap(active.id as number, over.id as number);
  }

  return (
    <Page
      toolbarStart={<Typography variant="h4">Portfolio</Typography>}
      actions={[]}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={store.tiles.map((_tile, index) => index)}
          strategy={rectSwappingStrategy}
        >
          <Grid container spacing={2} sx={{ m: 2 }}>
            {store.tiles.map((tile, index) => (
              <Tile
                key={`${tile.type}.${index}`}
                id={index}
                tile={tile}
                onRemove={() => {
                  store.delete(tile).catch((error) =>
                    dispatchSnackbar({
                      type: "open",
                      severity: "error",
                      message: error,
                    })
                  );
                }}
              />
            ))}
          </Grid>
        </SortableContext>
      </DndContext>

      <SpeedDial
        color="primary"
        sx={{ position: "absolute", bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        ariaLabel={"add"}
      >
        <SpeedDialAction
          key={"add-account-tile"}
          icon={<AccountBalanceWalletIcon />}
          slotProps={{
            tooltip: {
              title: "Add an account tile",
            },
          }}
          onClick={() => setAddAccountTile(true)}
        />
        <SpeedDialAction
          key={"add-budget-tile"}
          icon={<PieChartIcon />}
          slotProps={{
            tooltip: {
              title: "Add a budget tile",
            },
          }}
          onClick={() => setAddBudgetTile(true)}
        />
      </SpeedDial>

      {addAccountTile && (
        <AddAccountTile
          close={() => setAddAccountTile(false)}
          onCreate={(data) => {
            store
              .create({ content: { type: "Currency", data } })
              .catch((error) =>
                dispatchSnackbar({
                  type: "open",
                  severity: "error",
                  message: error,
                })
              );
          }}
        />
      )}

      {addBudgetTile && (
        <AddBudgetTile
          close={() => setAddBudgetTile(false)}
          onCreate={(data) => {
            store.create({ content: { type: "Budget", data } }).catch((error) =>
              dispatchSnackbar({
                type: "open",
                severity: "error",
                message: error,
              })
            );
          }}
        />
      )}
    </Page>
  );
}
