import React from 'react'
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField} from '@mui/material'

/**
 * This component displays a menu where users can add or edit a load.
 * They may set the load's name, type, location, mass, length, and for triangular loads, they may set which side is taller.
 * 
 * Props
 * open: the Dialog open prop; whether the form is open
 * mode: whether the menu is for adding or editing a load. Should be "Add" or "Edit"
 * handleClose: function that receives "cancel", "confirm", or something invalid, plus the menu mode. Will process the newLoad accordingly
 * newLoad: an object with name, type, location, mass, length, and tallerEnd. This stores the properties of the load being added or edited
 * validate: checks whether newLoad is accurate. Should receive the menu mode as a parameter
 * warningText: the text that will display at the bottom of the menu to indicate what is wrong with newLoad
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
                    defaultValue={props.newLoad.Name}
                    type="text"
                    onChange={val=>{
                        props.newLoad.Name = val.target.value
                        props.validate("Name")
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
                        value={props.newLoad.Type}
                        onChange={val=>{
                            props.newLoad.Type = val.target.value
                            props.validate("Length")
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
                    defaultValue={props.newLoad.Location}
                    onChange={val=>{
                        props.newLoad.Location = val.target.value
                        props.validate("Location")
                    }}
                    fullWidth
                    variant="standard"
                />
                {/* mass textbox
                    Point Load -> mass, Distributed Load -> mass per meter, Triangular Load -> mass per meter at the taller end */}
                <TextField
                    autoFocus
                    margin="dense"
                    label={props.newLoad.Type==="Point"?"Mass":props.newLoad.Type==="Distributed"?"Mass Per Meter":"Mass Per Meter at Taller End"}
                    defaultValue={props.newLoad.Mass}
                    type="text"
                    onChange={val=>{
                        props.newLoad.Mass = val.target.value
                        props.validate("Mass")
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
                    defaultValue={props.newLoad.Length}
                    onChange={val=>{
                        props.newLoad.Length = val.target.value
                        props.validate("Length")
                    }}
                    fullWidth
                    variant="standard"
                    disabled={props.newLoad.Type==="Point"}
                />
                {/* radio buttons for triangular loads to decide which end is taller */}
                <FormControl>
                    <FormLabel id="tallerEndRadios" sx={{mt:1}}>Taller End of the Load (Triangular Loads Only)</FormLabel>
                    <RadioGroup
                        row
                        aria-labelledby="tallerEndRadios"
                        value={props.newLoad["Taller End"]}
                        onChange={val=>{
                            props.newLoad["Taller End"] = val.target.value
                            props.validate("Length")
                        }}
                    >
                        <FormControlLabel value="Left" control={<Radio />} label="Left" disabled={props.newLoad.Type!=="Triangular"}/>
                        <FormControlLabel value="Right" control={<Radio />} label="Right" disabled={props.newLoad.Type!=="Triangular"}/>
                    </RadioGroup>
                </FormControl>
            </DialogContent>
            {/* warning label for invalid inputs */}
            <DialogContentText align="center" sx={{fontWeight: "bold", height:30}}>{props.warning}</DialogContentText>
            {/* buttons to confirm or cancel */}
            <DialogActions>
                <Button onClick={()=>{props.handleClose("cancel")}}>Cancel</Button>
                <Button onClick={()=>{props.handleClose("confirm")}}>Confirm</Button>
            </DialogActions>
        </Dialog>
    )
}
export default AddEditForm