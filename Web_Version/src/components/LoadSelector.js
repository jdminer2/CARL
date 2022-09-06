import React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

/**
 * This component receives a list of loads from a multi-load page through props.loadList,
 * then it creates a dropdown list for the user to select a load to control. 
 * The variable for currently selected load must be entered through props.value, 
 * and a function must be entered through props.onChange to allow the dropdown to alter the variable.
 * 
 * Usage could look like:
 * <LoadSelector loadList={loads} value={selectedLoad} onChange={handleDropdownChange} />
 */
const LoadSelectionOptions = (props) => {
    const menuItemList = [];
    for(let load in props.loadList)
        menuItemList.push(<MenuItem value={load}>{load}</MenuItem>);

    return (
        <FormControl>
            <InputLabel id={"load_selection_dropdown_label"}>Selected Load</InputLabel>
            <Select
                labelId={"load_selection_dropdown_label"}
                id={"load_selection_dropdown"}
                sx={{margin:0.5, minWidth:100}}
                label={"Selected Load"}
                onChange={props.onChange}
                value={props.value}
            >
                {menuItemList}
            </Select>
        </FormControl>
    );
}
export default LoadSelectionOptions;