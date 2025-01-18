import { Autocomplete, Chip, MenuItem, createFilterOptions, TextField } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Tag } from "../../../../cli/bindings/Tag";

const filter = createFilterOptions<Tag>();


interface EditTagsProps {
    value?: Tag[],
    handleChange: (newTags: Tag[]) => void
}

export function EditTags({ value, handleChange }: EditTagsProps) {
    const [tags, setTags] = useState<Tag[]>([]);

    const getTags = () => invoke("get_tags").then((tags) => setTags(tags as Tag[]));

    useEffect(() => {
        getTags();
    }, []);

    return (
        <div>
            <Autocomplete
                multiple
                selectOnFocus
                handleHomeEndKeys
                clearOnBlur
                disablePortal
                disableCloseOnSelect
                value={value}
                options={tags}
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} label="Tags" />}
                renderOption={(props, option) => {
                    const { key, id, ...optionProps } = props;
                    return (
                        <MenuItem
                            key={`${key}-${id}`}
                            value={option.label}
                            {...optionProps}
                        >
                            <Chip label={option.label} sx={{ backgroundColor: option.color }} />
                        </MenuItem>
                    )
                }}
                onChange={(_event, newTags) => handleChange(newTags)}
                filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    const { inputValue } = params;

                    // Suggest the creation of a new value
                    const isExisting = options.some((option) => inputValue === option.label);
                    if (inputValue !== '' && !isExisting) {
                        filtered.push({ label: inputValue, color: null });
                    }

                    return filtered;
                }}
            />
        </div>
    );
}
