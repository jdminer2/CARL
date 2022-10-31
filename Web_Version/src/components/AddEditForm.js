import React from 'react'
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField} from '@mui/material'

/**
 * This component displays a menu where users can add or edit a load.
 * They may set the load's name, type, location, mass, length, and for triangular loads, they may set which side is taller.
 * 
 * Props
 * open: the Dialog open prop; whether the form is open
 * mode: whether the menu is for adding or editing a load. Should be "Add" or "Edit"
 * handleClose: function that receives "cancel", "confirm", or something invalid, plus the menu mode. Will process the newLoadData accordingly
 * newLoadData: an object with name, type, location, mass, length, and tallerEnd. This stores the properties of the load being added or edited
 * validate: checks whether newLoadData is accurate. Should receive the menu mode as a parameter
 * warningText: the text that will display at the bottom of the menu to indicate what is wrong with newLoadData
 */
const AddEditForm = (props) => {
    return (
        <Dialog open={props.open} onClose={props.handleClose}>
            <DialogTitle>{props.mode} Load</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please enter load properties
                </DialogContentText>
                {/* name textbox */}
                <TextField
                    autoFocus
                    margin="dense"
                    label="Name"
                    defaultValue={props.newLoadData.name}
                    type="text"
                    onChange={val=>{
                        props.newLoadData.name = val.target.value
                        props.validate(props.mode)
                    }}
                    fullWidth
                    variant="standard"
                />
                {/* type radio buttons */}
                <FormControl>
                    <FormLabel id="newLoadTypeRadios" sx={{mt:1}}>Type</FormLabel>
                    <RadioGroup
                        row
                        aria-labelledby="newLoadTypeRadios"
                        value={props.newLoadData.type}
                        onChange={val=>{
                            props.newLoadData.type = val.target.value
                            props.validate(props.mode)
                        }}
                    >
                        <FormControlLabel value="Point" control={<Radio />} label="Point Load" />
                        <FormControlLabel value="Distributed" control={<Radio />} label="Distributed Load" />
                        <FormControlLabel value="Triangular" control={<Radio />} label="Triangular Load" />
                    </RadioGroup>
                </FormControl>
                {/* location textbox */}
                <TextField
                    autoFocus
                    margin="dense"
                    label="Location"
                    type="text"
                    defaultValue={props.newLoadData.location}
                    onChange={val=>{
                        props.newLoadData.location = val.target.value
                        props.validate(props.mode)
                    }}
                    fullWidth
                    variant="standard"
                />
                {/* mass textbox
                    Point Load -> mass, Distributed Load -> mass per meter, Triangular Load -> mass per meter at the taller end */}
                <TextField
                    autoFocus
                    margin="dense"
                    label={props.newLoadData.type==="Point"?"Mass":props.newLoadData.type==="Distributed"?"Mass Per Meter":"Mass Per Meter at Taller End"}
                    defaultValue={props.newLoadData.mass}
                    type="text"
                    onChange={val=>{
                        props.newLoadData.mass = val.target.value
                        props.validate(props.mode)
                    }}
                    fullWidth
                    variant="standard"
                />
                {/* length textbox, disabled for point loads */}
                <TextField
                    autoFocus
                    margin="dense"
                    label="Length (Non-Point Loads Only)"
                    type="text"
                    defaultValue={props.newLoadData.length}
                    onChange={val=>{
                        props.newLoadData.length = val.target.value
                        props.validate(props.mode)
                    }}
                    fullWidth
                    variant="standard"
                    disabled={props.newLoadData.type==="Point"}
                />
                {/* radio buttons for triangular loads to decide which end is taller */}
                <FormControl>
                    <FormLabel id="tallerEndRadios" sx={{mt:1}}>Taller End of the Load (Triangular Loads Only)</FormLabel>
                    <RadioGroup
                        row
                        aria-labelledby="tallerEndRadios"
                        value={props.newLoadData.tallerEnd}
                        onChange={val=>{
                            props.newLoadData.tallerEnd = val.target.value
                            props.validate(props.mode)
                        }}
                    >
                        <FormControlLabel value="Left" control={<Radio />} label="Left" disabled={props.newLoadData.type!=="Triangular"}/>
                        <FormControlLabel value="Right" control={<Radio />} label="Right" disabled={props.newLoadData.type!=="Triangular"}/>
                    </RadioGroup>
                </FormControl>
            </DialogContent>
            {/* warning label for invalid inputs */}
            <DialogContentText align="center" sx={{fontWeight: "bold", height:30}}>{props.warning}</DialogContentText>
            {/* buttons to confirm or cancel */}
            <DialogActions>
                <Button onClick={()=>{props.handleClose("cancel", props.mode)}}>Cancel</Button>
                <Button onClick={()=>{props.handleClose("confirm", props.mode)}}>Confirm</Button>
            </DialogActions>
        </Dialog>
    )
}
export default AddEditForm