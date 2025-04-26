import { PieChart, PieSeriesType, PieValueType } from "@mui/x-charts";
import { MakeOptional } from "@mui/x-charts/internals";
import { Partition } from "../../../../cli/bindings/Partition";
import { useEffect, useState } from "react";
import { getBudgetExpenses, RecordId } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { ReadExpensesResult } from "../../../../cli/bindings/ReadExpensesResult";
import { ExpensesBudget } from "../../../../cli/bindings/ExpensesBudget";

type Series = MakeOptional<
  PieSeriesType<MakeOptional<PieValueType, "id">>,
  "type"
>[];

export enum DisplayMode {
  Expenses,
  Budget,
}

function computeBudgetPieSeries(
  expenses: ExpensesBudget,
  options?: { currentMonth?: boolean }
): Series {
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

  const series: Series = [];

  if (options?.currentMonth) {
    series.push({
      innerRadius: 105,
      outerRadius: 115,
      paddingAngle: 1,
      cornerRadius: 5,

      data: expenses.partitions
        .map((partition) => [
          {
            value: partition.total * -1,
            color: partition.inner.color,
          },
          {
            value:
              (basePartitions.find(
                (p) => p.partitionId.id.String === partition.inner.id.id.String
              )?.value ?? 0) + partition.total,
            color: "none",
          },
        ])
        .flat(),
    });
  }

  series.push({
    valueFormatter: (item) =>
      `${item.label} (${item.value.toFixed(2)} ${expenses.inner.currency})`,
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
    cornerRadius: 5,
    paddingAngle: 1,
    innerRadius: 50,
    outerRadius: 100,
    arcLabel: (item) =>
      `${((item.value / expenses.inner.income) * 100).toFixed(0)}%`,
  });

  return series;
}

export default function ({
  budget,
  onClick,
  displayMode,
  width,
  height,
}: {
  budget: RecordId;
  onClick?: (partition: Partition) => void;
  displayMode: DisplayMode;
  width?: number;
  height?: number;
}) {
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
  }, [budget, displayMode, dispatchSnackbar]);

  if (!expenses) return;

  let series: Series = [];
  switch (displayMode) {
    case DisplayMode.Budget:
      series = computeBudgetPieSeries(expenses.budget);
      break;
    case DisplayMode.Expenses:
      series = computeBudgetPieSeries(expenses.budget, { currentMonth: true });
      break;
  }

  return (
    <PieChart
      series={series}
      onItemClick={(_event, partition) =>
        onClick?.(expenses.budget.partitions[partition.dataIndex].inner)
      }
      width={width ?? 400}
      height={height ?? 300}
    />
  );
}
