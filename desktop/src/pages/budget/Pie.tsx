import { PieChart, PieSeriesType, PieValueType } from "@mui/x-charts";
import { Partition } from "../../../../cli/bindings/Partition";
import { useEffect, useState } from "react";
import { getBudgetExpenses, RecordId, updateBudget } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { ReadExpensesResult } from "../../../../cli/bindings/ReadExpensesResult";
import { ExpensesBudget } from "../../../../cli/bindings/ExpensesBudget";
import {
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

const PIE_OPTION_OFFSET = 10;

function computeBudgetPieSeries(expenses: ExpensesBudget): PieSeriesType[] {
  const options = expenses.inner.view;
  let total_allocated = 0;
  const basePartitions = expenses.partitions.map((partition) => {
    const value = partition.allocations
      .map((allocation) => allocation.inner.amount)
      .reduce((acc, curr) => acc + curr, 0);

    total_allocated += value;

    return {
      label: partition.inner.name,
      value,
      color: partition.inner.color,
      partitionId: partition.inner.id,
    };
  });

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
              value: allocation.inner.amount,
              color: allocation.inner.category.color,
              label: allocation.inner.name,
            }))
          )
          .flat(),
        {
          value:
            expenses.inner.income -
            basePartitions.reduce((acc, curr) => acc + curr.value, 0),
          color: "none",
        },
      ],
    } as PieSeriesType);

    innerRadiusStart += PIE_OPTION_OFFSET + 20;
  }

  if (options?.expenses) {
    series.push({
      type: "pie",
      innerRadius: innerRadiusStart,
      outerRadius: innerRadiusStart + 10,
      paddingAngle: 1,
      cornerRadius: 5,
      valueFormatter: (item: PieValueType & { exceeded?: number }) => {
        // FIXME: must be returned by the backend.
        return item.exceeded
          ? `WARNING: budget exceeded (${item.exceeded.toFixed(2)} ${
              expenses.inner.currency
            })`
          : `${item.value.toFixed(2)} ${expenses.inner.currency}`;
      },
      data: [
        ...expenses.partitions
          .map((partition) => {
            const total = partition.total * -1;
            const max = basePartitions.find(
              (p) => p.partitionId.id.String === partition.inner.id.id.String
            )!.value;

            return [
              {
                value: total > max ? max : total,
                color: partition.inner.color,
                exceeded: total > max ? total : undefined,
                label: `'${partition.inner.name}' Monthly expenses`,
              },
              {
                value: max + partition.total,
                color: "none",
              },
            ];
          })
          .flat(),
        {
          value:
            expenses.inner.income -
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
        value: expenses.inner.income - total_allocated,
        color: "white",
      },
    ],
    highlightScope: { fade: "global", highlight: "item" },
    paddingAngle: 1,
    cornerRadius: 5,
    innerRadius: 50,
    outerRadius: 100,
    arcLabel: (item: { value: number }) =>
      `${((item.value / expenses.inner.income) * 100).toFixed(0)}%`,
  } as PieSeriesType);

  return series;
}

// FIXME: budget data should be fed into the component and updated with an onChange hook.
export default function ({
  budget,
  onClick,
  width,
  height,
}: {
  budget: RecordId;
  onClick?: (partition: Partition) => void;
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
  const dispatchSnackbar = useDispatchSnackbar()!;

  useEffect(() => {
    getBudgetExpenses(budget, {
      period: "Monthly",
      period_index: 0,
    })
      .then((expenses) => setExpenses(expenses))
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [budget, dispatchSnackbar]);

  return expenses ? (
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
        <Menu
          id="long-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
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
                    })
                  );

                  return newValue;
                });
              }}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={value}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText primary={key} />
            </MenuItem>
          ))}
        </Menu>
      </Stack>

      <PieChart
        series={computeBudgetPieSeries(expenses.budget)}
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
    </Stack>
  ) : (
    <Skeleton variant="circular" width={200} height={200} />
  );
}
