import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  ListItemButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Allocation } from "../../../../cli/bindings/Allocation";
import { Budget } from "../../../../cli/bindings/Budget";
import { useEffect, useState } from "react";
import {
  getBudgetExpenses,
  getCategories,
  getTransactionsByCategory,
  RecordId,
} from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { ReadExpensesResult } from "../../../../cli/bindings/ReadExpensesResult";
import { ExpensesBudget } from "../../../../cli/bindings/ExpensesBudget";
import { categoryIconToMuiIcon } from "../../utils/icons";
import { ReadExpensesOptions } from "../../../../cli/bindings/ReadExpensesOptions";
import { TransactionWithId } from "../../../../cli/bindings/TransactionWithId";
import ListTransactions from "../../components/ListTransactions";
import { CategoryWithId } from "../../../../cli/bindings/CategoryWithId";
import { useAccountStore } from "../../stores/account";

export function Inner({
  budget,
  parameters,
}: {
  budget: ExpensesBudget;
  parameters: ReadExpensesOptions;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const accounts = useAccountStore((state) => state.accounts);

  // FIXME: Not using the frontend store here. Is this really a good idea ?
  const [transactionsByCategory, setTransactionsByCategory] = useState<{
    transactions: TransactionWithId[];
    category: RecordId;
  } | null>(null);

  const allocations = budget.partitions.flatMap(
    (partition) => partition.allocations,
  );

  const [categories, setCategories] = useState<Map<
    string,
    CategoryWithId
  > | null>(null);

  const goToTransactionsForAllocation = async (category: RecordId) => {
    const result = await getTransactionsByCategory(budget.inner.id, {
      ...parameters,
      category,
    });

    setTransactionsByCategory({ transactions: result.transactions, category });
  };

  useEffect(() => {
    getCategories()
      .then((categories) =>
        setCategories(
          new Map(
            categories.map((category) => [category.id.id.String, category]),
          ),
        ),
      )
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error }),
      );
  }, [dispatchSnackbar]);

  return (
    <Stack spacing={2}>
      {categories && transactionsByCategory && (
        <Dialog
          open={true}
          onClose={() => setTransactionsByCategory(null)}
          fullWidth={true}
        >
          <DialogTitle>
            Transactions for the '
            {categories.get(transactionsByCategory.category.id.String)!.name}'
            category
          </DialogTitle>
          <DialogContent>
            <Stack direction="column" sx={{ width: "100%" }}>
              <ListTransactions
                transactions={transactionsByCategory.transactions}
                categories={categories}
                accounts={accounts}
                onClickTransaction={() => {}}
              />
            </Stack>
          </DialogContent>
        </Dialog>
      )}
      {Array.from(allocations.values()).map((allocation) => {
        let textColor = "textPrimary";
        let percentage =
          ((allocation.transactions_total * -1) /
            allocation.allocations_total) *
          100;
        const label = `${(allocation.transactions_total * -1).toFixed(
          2,
        )} / ${allocation.allocations_total.toFixed(2)}`;

        if (percentage > 100) {
          percentage = 100;
          textColor = "error";
        }

        return (
          <ListItemButton
            sx={{
              justifyContent: "center",
              alignItems: "center",
            }}
            key={allocation.category.id.id.String}
            onClick={() =>
              goToTransactionsForAllocation(allocation.category.id)
            }
          >
            <Stack direction="row" spacing={2}>
              <Tooltip title={allocation.category.name}>
                {categoryIconToMuiIcon(allocation.category)}
              </Tooltip>

              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ width: "100%", mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    color="primary"
                    sx={{
                      width: 200,
                      backgroundColor: "grey",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: allocation.category.color,
                      },
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 100 }}>
                  <Typography variant="body2" color={textColor}>
                    {label}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </ListItemButton>
        );
      })}
    </Stack>
  );
}

export default function ({
  budget,
  parameters,
}: {
  budget: Budget;
  parameters: ReadExpensesOptions;
  onClick?: (partition: Allocation) => void;
  onChange?: (budget: Budget) => void;
}) {
  const [expenses, setExpenses] = useState<ReadExpensesResult | null>(null);
  const dispatchSnackbar = useDispatchSnackbar()!;

  useEffect(() => {
    getBudgetExpenses(budget.id, parameters)
      .then((expenses) => setExpenses(expenses))
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error }),
      );
  }, [budget, parameters, dispatchSnackbar]);

  if (!expenses) return;

  return <Inner budget={expenses.budget} parameters={parameters} />;
}
