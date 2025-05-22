import {
  Divider,
  Typography,
  Stack,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Grid,
} from "@mui/material";
import { ReactNode, useEffect, useState } from "react";
import { CurrencyBalance } from "../../../cli/bindings/CurrencyBalance";
import { getAllBalance, getBudgetExpenses, listBudgets } from "../api";
import { useDispatchSnackbar } from "../contexts/Snackbar";
import { ExpensesBudget } from "../../../cli/bindings/ExpensesBudget";
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
import { PortfolioTile } from "../../../cli/bindings/PortfolioTile";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSwappingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import ClearIcon from "@mui/icons-material/Clear";

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

  let data: {
    key: string;
    cardProps: object;
    cardHeaderProps: object;
    cardHeaderAction: ReactNode;
    cardContent: ReactNode;
  } = {
    key: "",
    cardProps: {},
    cardHeaderProps: {},
    cardHeaderAction: <></>,
    cardContent: <></>,
  };

  switch (tile.type) {
    case "Account": {
      data = {
        key: tile.data.data.currency,
        cardProps: {},
        cardHeaderProps: {
          title: tile.data.data.currency,
          subheader: "accounts",
        },
        cardHeaderAction: (
          <Typography variant="subtitle1">
            {tile.data.data.total_balance.toFixed(2)} {tile.data.data.currency}
          </Typography>
        ),
        cardContent: <RenderAccountTile tile={tile.data} />,
      };
    }
  }

  return (
    <Card
      key={data.key}
      ref={setNodeRef}
      style={style}
      variant="outlined"
      sx={{ maxWidth: 345 }}
      {...listeners}
      {...attributes}
      {...data.cardProps}
    >
      <CardHeader
        {...data.cardHeaderProps}
        action={
          <Stack direction="row" alignItems="center">
            {data.cardHeaderAction}
            <IconButton onClick={() => onRemove()}>
              <ClearIcon />
            </IconButton>
          </Stack>
        }
      />
      <CardContent>{data.cardContent}</CardContent>
    </Card>
  );
}

export default function () {
  const dispatchSnackbar = useDispatchSnackbar()!;
  // FIXME: Find a better name than "currencies".
  const [currencies, setCurrencies] = useState<CurrencyBalance[] | null>(null);
  const [budgets, setBudgets] = useState<ExpensesBudget[] | null>(null);
  const [addAccountTile, setAddAccountTile] = useState(false);
  const [tiles, setTiles] = useState<PortfolioTile[]>([]);
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

    if (over && active.id !== over.id) {
      setTiles((tiles) =>
        arrayMove(tiles, active.id as number, over.id as number)
      );
    }
  }

  useEffect(() => {
    getAllBalance()
      .then(setCurrencies)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );

    async function getBudgets() {
      try {
        const results = [];
        const budgets = await listBudgets();
        for (const budget of budgets) {
          results.push(
            (
              await getBudgetExpenses(budget.id, {
                period: "Monthly",
                period_index: 0,
              })
            ).budget
          );
        }
        setBudgets(results);
      } catch (error) {
        dispatchSnackbar({
          type: "open",
          severity: "error",
          message: error as string,
        });
      }
    }

    getBudgets();
  }, [dispatchSnackbar]);

  return (
    <Stack sx={{ width: "100%", height: "100%" }}>
      <Typography variant="h2" sx={{ m: 2 }}>
        Portfolio
      </Typography>

      <Divider />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tiles.map((_tile, index) => index)}
          strategy={rectSwappingStrategy}
        >
          <Grid container spacing={2} sx={{ m: 2 }}>
            {tiles.map((tile, index) => (
              <Tile
                key={`${tile.type}.${index}`}
                id={index}
                tile={tile}
                onRemove={() =>
                  setTiles((tiles) => {
                    tiles.splice(index, 1);
                    return [...tiles];
                  })
                }
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
        />
      </SpeedDial>

      {addAccountTile && (
        <AddAccountTile
          close={() => setAddAccountTile(false)}
          onCreate={(tile) =>
            setTiles((old) => {
              old.push({
                type: "Account",
                data: tile,
              });
              return old;
            })
          }
        />
      )}

      {/* <Grid container spacing={2} sx={{ m: 2 }}>
        {currencies ? (
          currencies.map(({ total_balance, currency, accounts }) => (
            <Card key={currency} variant="outlined">
              <CardHeader
                title={currency}
                subheader="accounts"
                action={
                  <Typography variant="subtitle1">
                    {total_balance.toFixed(2)} {currency}
                  </Typography>
                }
              />
              <CardContent>
                <PieChart
                  width={400}
                  height={300}
                  hideLegend={true}
                  series={[
                    {
                      data: accounts.map(({ account, balance }) => ({
                        value: balance,
                        label: account.name,
                      })),
                      innerRadius: 30,
                      outerRadius: 100,
                      paddingAngle: 5,
                      cornerRadius: 5,
                      arcLabelMinAngle: 35,
                      arcLabel: (item) => item.label ?? "",
                      valueFormatter: (item) =>
                        `${item.value.toFixed(2)} ${currency}`,
                    },
                  ]}
                  onItemClick={(_event, account) => {
                    const currentAccount = accounts[account.dataIndex].account;
                    navigate(currentAccount);
                  }}
                />
              </CardContent>
            </Card>
          ))
        ) : (
          <Skeleton animation="wave" variant="circular" />
        )}

        {budgets ? (
          budgets.map(({ inner, total }) => (
            <Card key={inner.id.id.String} variant="outlined">
              <CardHeader
                title={inner.name}
                subheader="budget"
                action={
                  <Typography variant="subtitle1">
                    {total.toFixed(2)} {inner.currency}
                  </Typography>
                }
              />
              <CardContent>
                <BudgetPie key={inner.name} budget={inner.id} width={500} />
              </CardContent>
            </Card>
          ))
        ) : (
          <Skeleton animation="wave" variant="circular" />
        )}
      </Grid> */}
    </Stack>
  );
}
