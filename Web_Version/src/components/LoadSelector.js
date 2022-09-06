import React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

const LoadSelectionOptions = (props) => {
    const menuItemList = [];
    for(let load in props.loadList)
    menuItemList.push(<MenuItem value={load}>{load}</MenuItem>);
    console.log(Object.keys(props.loadList)[0]);

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