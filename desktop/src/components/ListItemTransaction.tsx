import {
  Chip,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { type RowComponentProps } from "react-window";
import { TransactionWithId } from "../../../cli/bindings/TransactionWithId";
import { Account } from "../../../cli/bindings/Account";
import { CategoryWithId } from "../../../cli/bindings/CategoryWithId";
import { categoryIconToMuiIcon } from "../utils/icons";

export default function ({
  transactions,
  accounts,
  categories,
  onClick,
  index,
  style,
}: RowComponentProps<{
  transactions: TransactionWithId[];
  accounts: Map<string, Account>;
  categories: Map<string, CategoryWithId>;
  onClick: (transaction: TransactionWithId) => void;
}>) {
  const transaction = transactions[index];
  const account = accounts.get(transaction.account.id.String)!;

  return (
    <ListItemButton
      style={style}
      onClick={() => onClick(transaction)}
      key={transaction.id.id.String}
    >
      <ListItem
        secondaryAction={
          transaction.amount > 0 ? (
            <Typography variant="body1" color="success">
              {`+ ${transaction.amount} ${account.currency}`}
            </Typography>
          ) : (
            <Typography variant="body1">
              {`- ${transaction.amount * -1} ${account.currency}`}
            </Typography>
          )
        }
      >
        <ListItemAvatar>
          {categories &&
            categoryIconToMuiIcon(
              categories.get(transaction.category.id.String)!,
            )}
        </ListItemAvatar>
        <ListItemText
          primary={transaction.description}
          secondary={dayjs(transaction.date).format("DD MMMM YYYY")}
        />
        <ListItemText
          primary={
            <Stack direction="row" spacing={1}>
              {transaction.tags.map((tag) => (
                <Chip
                  key={tag.label}
                  label={tag.label}
                  sx={{ backgroundColor: tag.color }}
                />
              ))}
            </Stack>
          }
        />
      </ListItem>
    </ListItemButton>
  );
}
