import { PieChart, PieSeriesType, PieValueType } from "@mui/x-charts";
import { Partition } from "../../../../cli/bindings/Partition";
import { useEffect, useState } from "react";
import { getBudgetExpenses, RecordId, updateBudget } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { ReadExpensesResult } from "../../../../cli/bindings/ReadExpensesResult";
import { ExpensesBudget } from "../../../../cli/bindings/ExpensesBudget";
import { ExpensesPeriod } from "../../../../cli/bindings/ExpensesPeriod";
import {
  Alert,
  Button,
  ButtonGroup,
  Checkbox,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { ReadExpensesOptions } from "../../../../cli/bindings/ReadExpensesOptions";
import CircleIcon from "@mui/icons-material/Circle";

type PieValueTypeBudget = PieValueType & { exceeded?: number };

export type Parameters = Omit<ReadExpensesOptions, "start_date"> & {
  start_date: dayjs.Dayjs;
};

const PIE_OPTION_OFFSET = 10;

function computeBudgetPieSeries(
  expenses: ExpensesBudget,
): PieSeriesType<PieValueTypeBudget>[] {
  const options = expenses.inner.view;
  const basePartitions = expenses.partitions.map((partition) => ({
    label: partition.inner.name,
    value: partition.allocations_total,
    color: partition.inner.color,
    partitionId: partition.inner.id,
  }));

  const series = [];
  let innerRadiusStart = 100 + PIE_OPTION_OFFSET;

  if (options?.allocations) {
    series.push({
      type: "pie",
      innerRadius: innerRadiusStart,
      outerRadius: innerRadiusStart + 20,
      highlightScope: { fade: "series", highlight: "item" },
      valueFormatter: (item: PieValueType) =>
        `${item.value.toFixed(2)} ${expenses.inner.currency}`,
      data: [
        ...expenses.partitions
          .map((partition) =>
            partition.allocations.map((allocation) => ({
              value: allocation.allocations_total,
              color: allocation.category.color,
              label: allocation.category.name,
            })),
          )
          .flat(),
        {
          value:
            expenses.income_total -
            basePartitions.reduce((acc, curr) => acc + curr.value, 0),
          color: "none",
        },
      ],
    } as PieSeriesType);

    innerRadiusStart += PIE_OPTION_OFFSET + 20;
  }

  if (options?.expenses) {
    series.push({
      id: "expenses",
      type: "pie",
      innerRadius: innerRadiusStart,
      outerRadius: innerRadiusStart + 10,
      paddingAngle: 1,
      cornerRadius: 5,
      valueFormatter: (item: PieValueTypeBudget) => {
        return item.exceeded
          ? `WARNING: exceeded budget of ${item.exceeded.toFixed(2)} (by ${(
              item.exceeded - item.value
            ).toFixed(2)} ${expenses.inner.currency})`
          : `${item.value.toFixed(2)} ${expenses.inner.currency}`;
      },
      data: [
        ...expenses.partitions
          .map((partition) => {
            const total = partition.transactions_total * -1;
            const max = basePartitions.find(
              (p) => p.partitionId.id.String === partition.inner.id.id.String,
            )!.value;

            return [
              {
                value: total > max ? max : total,
                color: partition.inner.color,
                exceeded: total > max ? total : undefined,
                label: `'${partition.inner.name}' Monthly expenses`,
              },
              {
                value: max + partition.transactions_total,
                color: "none",
              },
            ];
          })
          .flat(),
        {
          value:
            expenses.income_total -
            basePartitions.reduce((acc, curr) => acc + curr.value, 0),
          color: "none",
        },
      ],
    } as PieSeriesType);

    innerRadiusStart += PIE_OPTION_OFFSET + 10;
  }

  series.push({
    id: "partitions",
    type: "pie",
    valueFormatter: (item: PieValueType) =>
      `${item.value.toFixed(2)} ${expenses.inner.currency}`,
    arcLabelMinAngle: 35,
    data: [
      ...basePartitions,
      {
        label: "Not allocated",
        value: expenses.inner.income - expenses.allocations_total,
        color: "white",
      },
    ],
    highlightScope: { fade: "global", highlight: "item" },
    paddingAngle: 1,
    cornerRadius: 5,
    innerRadius: 50,
    outerRadius: 100,
    arcLabel: (item: { value: number }) =>
      `${((item.value / expenses.income_total) * 100).toFixed(0)}%`,
  } as PieSeriesType);

  return series;
}

// FIXME: budget data should be fed into the component and updated with an onChange hook.
export default function ({
  budget,
  onClick,
  onSetParameters,
  width,
  height,
}: {
  budget: RecordId;
  onClick?: (partition: Partition) => void;
  // FIXME: a little bit crass to make other components aware of this one parameters.
  //        It should be refactored into something better, like saving the state of this component in database.
  onSetParameters?: (parameters: Parameters) => void;
  width?: number;
  height?: number;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [expenses, setExpenses] = useState<ReadExpensesResult | null>(null);
  const [parameters, setParameters] = useState<Parameters>({
    period: "Monthly",
    start_date: dayjs().date(1),
  });
  const dispatchSnackbar = useDispatchSnackbar()!;

  useEffect(() => {
    getBudgetExpenses(budget, {
      ...parameters,
      start_date: parameters.start_date.toISOString(),
    })
      .then((expenses) => setExpenses(expenses))
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error }),
      );
  }, [budget, parameters, dispatchSnackbar]);

  if (!expenses)
    return <Skeleton variant="circular" width={250} height={250} />;

  const pieSeries = computeBudgetPieSeries(expenses.budget);

  return (
    <Stack>
      <Stack maxWidth={"80%"} justifyContent={"flex-end"} direction={"row"}>
        <IconButton
          aria-label="more"
          id="long-button"
          aria-controls={open ? "long-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-haspopup="true"
          onClick={handleClick}
        >
          <FilterListIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          {Object.entries(expenses.budget.inner.view).map(([key, value]) => (
            <MenuItem
              key={key}
              onClick={() => {
                setExpenses((prev) => {
                  prev!.budget.inner.view = {
                    ...prev!.budget.inner.view,
                    [key]: !value,
                  };
                  const newValue = {
                    ...prev!,
                  };

                  updateBudget(newValue.budget.inner).catch((error) =>
                    dispatchSnackbar({
                      type: "open",
                      severity: "error",
                      message: error,
                    }),
                  );

                  return newValue;
                });
              }}
            >
              <ListItemText primary={key} />
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={value}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
            </MenuItem>
          ))}
          <MenuItem key="budget-date-start-picker">
            <Stack direction="row" spacing={2} alignItems="center">
              <ListItemText primary="Start date" />
              <DatePicker
                value={parameters.start_date}
                onChange={(start_date) => {
                  if (start_date) {
                    setParameters({
                      ...parameters,
                      start_date,
                    });
                    if (onSetParameters) {
                      onSetParameters({
                        ...parameters,
                        start_date,
                      });
                    }
                  }
                }}
              />
            </Stack>
          </MenuItem>
          <MenuItem key="budget-period-picker">
            <Stack direction="row" spacing={2} alignItems="center">
              <ListItemText primary="Period" />
              <ButtonGroup variant="outlined">
                {["Monthly", "Trimestrial", "Yearly"].map((period) => (
                  <Button
                    key={period}
                    color={
                      period === parameters.period ? "primary" : "secondary"
                    }
                    value={period}
                    onClick={() => {
                      setParameters({
                        ...parameters,
                        period: period as ExpensesPeriod,
                      });
                      if (onSetParameters) {
                        onSetParameters({
                          ...parameters,
                          period: period as ExpensesPeriod,
                        });
                      }
                    }}
                  >
                    {period}
                  </Button>
                ))}
              </ButtonGroup>
            </Stack>
          </MenuItem>
        </Menu>
      </Stack>

      <PieChart
        series={pieSeries}
        onItemClick={(_event, partitionData) => {
          const partition = expenses.budget.partitions[partitionData.dataIndex];
          // TODO: Edit partition or allocation on click
          if (partition && partitionData.seriesId === "partitions")
            onClick?.(partition.inner);
        }}
        width={width ?? 400}
        height={height ?? 300}
        hideLegend
      />

      <center>
        {/*         
        TODO: format date using dayjs
          {dayjs(expenses.period_start).format("YYYY-MM-DD")} {"-"}{" "}
          {dayjs(expenses.period_end).format("YYYY-MM-DD")}
        */}
        {expenses.period_start} {"-"} {expenses.period_end}
      </center>

      <Stack alignItems="center">
        {pieSeries
          .find((series) => series.id === "expenses")
          ?.data.filter((item) => item.exceeded !== undefined)
          .map((item) => (
            <Alert
              icon={<CircleIcon sx={{ color: item.color ?? "white" }} />}
              severity="warning"
              key={item.label?.toString()}
            >
              {item.exceeded
                ? `exceeded budget of ${item.exceeded.toFixed(2)} ${
                    expenses.budget.inner.currency
                  } (by ${(item.exceeded - item.value).toFixed(2)} ${
                    expenses.budget.inner.currency
                  }) for the ${item.label?.toString()} partition`
                : `${item.value.toFixed(2)} ${expenses.budget.inner.currency}`}
            </Alert>
          )) ?? <></>}
      </Stack>
    </Stack>
  );
}
