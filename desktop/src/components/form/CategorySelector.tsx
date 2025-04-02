import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
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
  category: RecordId | undefined;
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
        value={category?.id.String}
        label="Category"
        onChange={(event) => onChange(categories.get(event.target.value)!.id)}
        renderValue={(selected) => {
          const category = categories.get(selected);
          return (
            category && (
              <MenuItem>
                <ListItemAvatar>
                  {categoryIconToMuiIcon(category)}
                </ListItemAvatar>
                <ListItemText primary={category.name} />
              </MenuItem>
            )
          );
        }}
      >
        {Array.from(categories.values())
          .filter((category) => !category.parent)
          .map((parent) => ({
            parent,
            subcategories: Array.from(categories.values()).filter(
              (category) => category.parent?.id.String === parent.id.id.String
            ),
          }))
          .map(({ parent, subcategories }) => [
            <ListSubheader key={`subheader-${parent.id.id.String}`}>
              {parent.name}
            </ListSubheader>,
            ...subcategories.concat([parent]).map((category) => (
              <MenuItem
                key={category.id.id.String}
                value={category.id.id.String}
              >
                <ListItemAvatar>
                  {categoryIconToMuiIcon(category)}
                </ListItemAvatar>
                <ListItemText primary={category.name} />
              </MenuItem>
            )),
          ])
          .flat()}
      </Select>
    </FormControl>
  );
}
