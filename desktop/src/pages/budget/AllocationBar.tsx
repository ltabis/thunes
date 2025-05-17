import { Box, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import { Allocation } from "../../../../cli/bindings/Allocation";
import { Budget } from "../../../../cli/bindings/Budget";
import { useEffect, useState } from "react";
import { getBudgetExpenses } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { ReadExpensesResult } from "../../../../cli/bindings/ReadExpensesResult";
import { ExpensesBudget } from "../../../../cli/bindings/ExpensesBudget";
import { categoryIconToMuiIcon } from "../../utils/icons";
import { ExpensesAllocation } from "../../../../cli/bindings/ExpensesAllocation";

export function Inner({ budget }: { budget: ExpensesBudget }) {
  const allocations = budget.partitions.flatMap(
    (partition) => partition.allocations
  );

  const allocationsByCategory = new Map<string, ExpensesAllocation>();
  allocations.forEach((allocation) => {
    const single = allocationsByCategory.get(
      allocation.inner.category.id.id.String
    );

    if (single) {
      allocationsByCategory.set(single.inner.category.id.id.String, {
        ...single,
        inner: {
          ...single.inner,
          amount: single.inner.amount + allocation.inner.amount,
        },
        total: single.total + allocation.total,
      });
    } else {
      allocationsByCategory.set(
        allocation.inner.category.id.id.String,
        allocation
      );
    }
  });

  return (
    <Stack spacing={2}>
      {Array.from(allocationsByCategory.values()).map((allocation) => {
        let textColor = "textPrimary";
        let barColor: "info" | "error" = "info";
        let percentage =
          ((allocation.total * -1) / allocation.inner.amount) * 100;
        const label = `${(allocation.total * -1).toFixed(
          2
        )} / ${allocation.inner.amount.toFixed(2)}`;

        if (percentage > 100) {
          percentage = 100;
          textColor = "error";
          barColor = "error";
        }

        return (
          <Stack
            direction="row"
            spacing={2}
            sx={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Tooltip title={allocation.inner.category.name}>
              {categoryIconToMuiIcon(allocation.inner.category)}
            </Tooltip>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box sx={{ width: "100%", mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  // FIXME: Use category color.
                  color={barColor}
                  sx={{
                    width: 200,
                  }}
                />
              </Box>
              <Box sx={{ width: 100 }}>
                <Typography variant="body2" color={textColor}>
                  {label}
                </Typography>
              </Box>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

// TODO: remove me.
export default function ({
  budget,
}: {
  budget: Budget;
  onClick?: (partition: Allocation) => void;
  onChange?: (budget: Budget) => void;
}) {
  const [expenses, setExpenses] = useState<ReadExpensesResult | null>(null);
  const dispatchSnackbar = useDispatchSnackbar()!;

  useEffect(() => {
    getBudgetExpenses(budget.id, {
      period: "Monthly",
      period_index: 0,
    })
      .then((expenses) => setExpenses(expenses))
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [budget, dispatchSnackbar]);

  if (!expenses) return;

  return <Inner budget={expenses.budget} />;
}
