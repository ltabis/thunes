import {
  MenuItem,
  ListItemAvatar,
  ListItemText,
  Autocomplete,
  TextField,
} from "@mui/material";
import { categoryIconToMuiIcon } from "../../utils/icons";
import { useMemo } from "react";
import { CategoryWithId } from "../../../../cli/bindings/CategoryWithId";
import { RecordId } from "../../api";
import { useCategoryStore } from "../../stores/category";

export default function CategorySelector({
  category,
  onChange,
  props,
}: {
  category?: RecordId;
  onChange: (category: CategoryWithId) => void;
  props?: object;
}) {
  const store = useCategoryStore();

  const value = useMemo(
    () => (category ? store.categories.get(category.id.String) ?? null : null),
    [store.categories, category]
  );

  return (
    <Autocomplete
      handleHomeEndKeys
      clearOnBlur
      disablePortal
      value={value ?? null}
      groupBy={(category) =>
        store.categoryGroups.get(category.parent!.id.String)!.name
      }
      isOptionEqualToValue={(option, value) =>
        option.id.id.String === value.id.id.String
      }
      getOptionLabel={(category) => category.name}
      options={Array.from(store.categories.values())}
      renderInput={(params) => <TextField {...params} label="Category" />}
      renderOption={(menuProps, option) => (
        <MenuItem {...menuProps} key={option.name}>
          <ListItemAvatar>{categoryIconToMuiIcon(option)}</ListItemAvatar>
          <ListItemText primary={option.name} />
        </MenuItem>
      )}
      onChange={(_event, value: CategoryWithId | null) =>
        value ? onChange(value) : {}
      }
      {...props}
    />
  );
}
