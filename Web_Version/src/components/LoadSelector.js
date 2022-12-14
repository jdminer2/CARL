import React from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

/**
 * This component receives a list of loads from a multi-load page through props.loadList,
 * then it creates a dropdown list for the user to select a load to control. 
 * The variable for currently selected load must be entered through props.value, 
 * and a function must be entered through props.onChange to allow the dropdown to alter the variable.
 * 
 * Usage could look like:
 * <LoadSelector loads={loads} value={selectedLoadID} onChange={handleDropdownChange} />
 */
const LoadSelector = (props) => {
    let menuItemList = props.loads.map((load, loadID) =>
        <MenuItem key={loadID} value={loadID}>{load.Name}</MenuItem>
    )

    // Avoids console warning for out of bounds selection
    let currentValue = props.value
    if (currentValue < 0)
        currentValue = ""

    return (
        <FormControl>
            <InputLabel id={"load_selection_dropdown_label"}>Selected Load</InputLabel>
            <Select
                labelId={"load_selection_dropdown_label"}
                id={"load_selection_dropdown"}
                sx={{ margin: 0.5, minWidth: 140 }}
                label={"Selected Load"}
                onChange={props.onChange}
                value={currentValue}
            >
                {menuItemList}
            </Select>
        </FormControl>
    )
}
export default LoadSelector