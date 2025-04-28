import { PROPERTY_TYPES } from "@/constants/propertyTypes";
import { Checkbox, FormControl, ListItemText, MenuItem, OutlinedInput, Select } from "@mui/material";
import _ from "lodash";
import { useMemo } from "react";
import { ArrayParam, useQueryParam, withDefault } from "use-query-params";

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
  const [propertyTypesQuery, setPropertyTypesQuery] = useQueryParam("propertyType", withDefault(ArrayParam, []));
  const propertyTypes = useMemo(() =>
    propertyTypesQuery ? _.intersection(Object.keys(PROPERTY_TYPES), propertyTypesQuery) : []
  );

  const handleChange = (e) => {
    const propertyTypes = e.target.value;

    setPropertyTypesQuery(typeof propertyTypes == "string" ? propertyTypes : propertyTypes);
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
        inputProps={{ "aria-label": "Without label" }}
        MenuProps={MenuProps}
      >
        <MenuItem disabled value="">
          Property Type
        </MenuItem>
        {Object.values(PROPERTY_TYPES).map(({ value, viLabel }) => (
          <MenuItem sx={{ py: 0, pl: 1 }} key={value} value={value}>
            <Checkbox checked={propertyTypes.indexOf(value) > -1} />
            <ListItemText primary={viLabel} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default PropertyTypeSelect;
