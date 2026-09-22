import { PROPERTY_TYPES } from "@/constants/propertyTypes";
import { Checkbox, FormControl, ListItemText, MenuItem, OutlinedInput, Select } from "@mui/material";
import _ from "lodash";
import { useMemo } from "react";
import useRentalFilters from "@/hooks/useRentalFilters";

const ITEM_HEIGHT = 42;
const ITEM_PADDING_TOP = 40;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const PropertyTypeSelect = () => {
  const [search, update] = useRentalFilters();
  const propertyTypesQuery = search.getAll("propertyType").join(",").split(",");
  const propertyTypes = useMemo(
    () => (propertyTypesQuery ? _.intersection(Object.keys(PROPERTY_TYPES), propertyTypesQuery) : []),
    [propertyTypesQuery],
  );

  const handleChange = (e) => {
    const propertyTypes = e.target.value;

    update({ propertyType: propertyTypes });
  };

  return (
    <FormControl sx={{ width: 200 }}>
      <Select
        multiple
        displayEmpty
        size="small"
        renderValue={(selected) => {
          return selected.length === 0
            ? "Any Property Type"
            : selected.length === 1
              ? PROPERTY_TYPES[selected[0]]?.viLabel
              : `Property Types (${selected.length})`;
        }}
        value={propertyTypes}
        onChange={handleChange}
        input={<OutlinedInput />}
        inputProps={{ "aria-label": "Property type" }}
        MenuProps={MenuProps}
        sx={{
          color: propertyTypes.length > 0 ? "var(--rt-ink)" : "var(--rt-muted)",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--rt-border-strong)" },
        }}
      >
        <MenuItem disabled value="">
          Property Type
        </MenuItem>
        {Object.values(PROPERTY_TYPES)
          .filter(({ value }) => ["apartment", "house", "room", "villa", "land", "office", "other"].includes(value))
          .map(({ value, label }) => (
            <MenuItem sx={{ py: 0, pl: 1 }} key={value} value={value}>
              <Checkbox checked={propertyTypes.indexOf(value) > -1} />
              <ListItemText primary={label} />
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
};

export default PropertyTypeSelect;
