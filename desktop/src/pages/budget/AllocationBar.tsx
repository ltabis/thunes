import { Box, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import { Allocation } from "../../../../cli/bindings/Allocation";
import { Budget } from "../../../../cli/bindings/Budget";
import { useEffect, useState } from "react";
import { getBudgetExpenses } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { ReadExpensesResult } from "../../../../cli/bindings/ReadExpensesResult";
import { ExpensesBudget } from "../../../../cli/bindings/ExpensesBudget";
import { categoryIconToMuiIcon } from "../../utils/icons";
import dayjs from "dayjs";

export function Inner({ budget }: { budget: ExpensesBudget }) {
  const allocations = budget.partitions.flatMap(
    (partition) => partition.allocations
  );

  return (
    <Stack spacing={2}>
      {Array.from(allocations.values()).map((allocation) => {
        let textColor = "textPrimary";
        let barColor: "info" | "error" = "info";
        let percentage =
          ((allocation.transactions_total * -1) /
            allocation.allocations_total) *
          100;
        const label = `${(allocation.transactions_total * -1).toFixed(
          2
        )} / ${allocation.allocations_total.toFixed(2)}`;

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
            key={allocation.category.id.id.String}
          >
            <Tooltip title={allocation.category.name}>
              {categoryIconToMuiIcon(allocation.category)}
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
      start_date: dayjs().date(1).toISOString(),
    })
      .then((expenses) => setExpenses(expenses))
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [budget, dispatchSnackbar]);

  if (!expenses) return;

  return <Inner budget={expenses.budget} />;
}
