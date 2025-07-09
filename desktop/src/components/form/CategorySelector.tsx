import {
  MenuItem,
  ListItemAvatar,
  ListItemText,
  Autocomplete,
  TextField,
} from "@mui/material";
import { categoryIconToMuiIcon } from "../../utils/icons";
import { useEffect, useMemo, useState } from "react";
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
  const [categoryGroups, setCategoryGroups] = useState<Map<
    string,
    CategoryWithId
  > | null>(null);
  const [categories, setCategories] = useState<Map<
    string,
    CategoryWithId
  > | null>(null);

  const value = useMemo(
    () => categories?.get(category.id.String) ?? null,
    [categories, category.id.String]
  );

  useEffect(() => {
    getCategories()
      .then((categories) => {
        const groups = Array.from(categories.values()).filter(
          (category) => !category.parent
        );
        setCategoryGroups(
          new Map(groups.map((category) => [category.id.id.String, category]))
        );
        const allCategories = Array.from(categories.values()).map(
          (category) => {
            if (!category.parent) category.parent = category.id;
            return category;
          }
        );
        setCategories(
          new Map(
            allCategories.map((category) => [category.id.id.String, category])
          )
        );
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [dispatchSnackbar]);

  if (!categories || !categoryGroups) return;

  return (
    <Autocomplete
      handleHomeEndKeys
      clearOnBlur
      disablePortal
      value={value}
      groupBy={(category) =>
        categoryGroups.get(category.parent!.id.String)!.name
      }
      isOptionEqualToValue={(option, value) =>
        option.id.id.String === value.id.id.String
      }
      getOptionLabel={(category) => category.name}
      options={Array.from(categories.values())}
      renderInput={(params) => <TextField {...params} label="Category" />}
      renderOption={(props, option) => (
        <MenuItem {...props} key={option.name}>
          <ListItemAvatar>{categoryIconToMuiIcon(option)}</ListItemAvatar>
          <ListItemText primary={option.name} />
        </MenuItem>
      )}
      onChange={(_event, value: CategoryWithId | null) =>
        value ? onChange(value.id) : {}
      }
    />
  );
}
