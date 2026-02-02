import { List } from "react-window";
import { TransactionWithId } from "../../../cli/bindings/TransactionWithId";
import { CategoryWithId } from "../../../cli/bindings/CategoryWithId";
import { Account } from "../../../cli/bindings/Account";
import ListItemTransaction from "./ListItemTransaction";

export default function ({
  transactions,
  categories,
  accounts,
  onClickTransaction,
}: {
  transactions: TransactionWithId[];
  categories: Map<string, CategoryWithId>;
  accounts: Map<string, Account>;
  onClickTransaction: (transaction: TransactionWithId) => void;
}) {
  return (
    <List
      rowComponent={ListItemTransaction}
      rowCount={transactions.length}
      rowHeight={75}
      rowProps={{
        transactions,
        categories,
        accounts,
        onClick: (transaction) => onClickTransaction(transaction),
      }}
      style={{
        flexGrow: 1,
      }}
    />
  );
}
