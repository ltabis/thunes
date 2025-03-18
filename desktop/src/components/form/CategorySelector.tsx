import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import { categoryIconToMuiIcon } from "../../utils/icons";
import { useEffect, useState } from "react";
import { CategoryWithId } from "../../../../cli/bindings/CategoryWithId";
import { getCategories, RecordId } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";

export default function CategorySelector({
  category,
  onChange,
}: {
  category: RecordId;
  onChange: (category: RecordId) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [categories, setCategories] = useState<Map<
    string,
    CategoryWithId
  > | null>(null);

  useEffect(() => {
    getCategories()
      .then((categories) =>
        setCategories(
          new Map(
            categories.map((category) => [category.id.id.String, category])
          )
        )
      )
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [dispatchSnackbar]);

  if (!categories) return;

  return (
    <FormControl fullWidth>
      <InputLabel>Category</InputLabel>
      <Select
        value={category}
        label="Category"
        onChange={(event) => onChange(event.target.value as RecordId)}
        renderValue={(selected) => {
          const category = categories.get(selected.id.String)!;
          return (
            <MenuItem>
              <ListItemAvatar>{categoryIconToMuiIcon(category)}</ListItemAvatar>
              <ListItemText primary={category.name} />
            </MenuItem>
          );
        }}
      >
        {Array.from(categories.values()).map((category) => (
          <MenuItem key={category.id.id.String} value={category.id.id.String}>
            <ListItemAvatar>{categoryIconToMuiIcon(category)}</ListItemAvatar>
            <ListItemText primary={category.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
