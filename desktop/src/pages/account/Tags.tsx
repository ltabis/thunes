import {
  Autocomplete,
  Chip,
  MenuItem,
  createFilterOptions,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Tag } from "../../../../cli/bindings/Tag";
import { getTags } from "../../api";

const filter = createFilterOptions<Tag>();

interface EditTagsProps {
  value?: Tag[];
  handleChange: (newTags: Tag[]) => void;
}

export function EditTags({ value, handleChange }: EditTagsProps) {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    getTags().then(setTags);
  }, []);

  return (
    <Autocomplete
      multiple
      selectOnFocus
      handleHomeEndKeys
      clearOnBlur
      disablePortal
      disableCloseOnSelect
      value={value}
      options={tags}
      renderInput={(params) => <TextField {...params} label="Tags" />}
      renderOption={(props, option) => {
        const { key, id, ...optionProps } = props;
        return (
          <MenuItem key={`${key}-${id}`} value={option.label} {...optionProps}>
            <Chip label={option.label} sx={{ backgroundColor: option.color }} />
          </MenuItem>
        );
      }}
      onChange={(_event, newTags) => handleChange(newTags)}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        const { inputValue } = params;

        // Suggest the creation of a new value
        const isExisting = options.some(
          (option) => inputValue === option.label
        );
        if (inputValue !== "" && !isExisting) {
          filtered.push({ label: inputValue, color: null });
        }

        return filtered;
      }}
      sx={{
        maxWidth: 300,
      }}
    />
  );
}
