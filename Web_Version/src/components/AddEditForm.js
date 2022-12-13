import React, {useEffect, useState} from 'react'
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField} from '@mui/material'

/**
 * This component displays a menu where users can add or edit a load.
 * They may set the load's name, type, location of endpoints, load force, and for triangular loads, they may set which side is taller.
 * 
 * Props:
 * loads
 * beamProperties
 * selectedLoadID
 * setSelectedLoadID
 * 
 * action - for passing messages from the outside
 * setAction - for clearing the message passed in
 * open - the Dialog open prop; whether the form is open
 * setOpen - used to let the form open and close itself
 */
const AddEditForm = (props) => {

    // Whether the user is currently adding or editing in the add/edit form
    const [addOrEditMode, setAddOrEditMode] = useState("Add")

    // The data being entered in the add/edit form
    const [newLoad, setNewLoad] = useState({Name:getFreeName(props.loads),
                                            Type:"Point", 
                                            L1:getSafePosition(props.beamProperties),
                                            L2:getSafePosition(props.beamProperties),
                                            ["Load Force"]:10.0,
                                            ["Taller End"]:"Left", 
                                            Color:getRandomColor()})

    // The warning text in the form
    const [warning, setWarning] = useState("")
    // The fields that need to be validated before submitting
    const [invalidFields, setInvalidFields] = useState([])

    // Receive messages from the outside via the action prop to close the menu and confirm, open menu for adding, or open menu for editing
    useEffect(() => {
        if(props.action === "Confirm") {
            handleClose("confirm")
            props.setAction("")
        }
        else if(props.action === "Add") {
            setNewLoad({Name:getFreeName(props.loads),
                Type:"Point",
                L1:getSafePosition(props.beamProperties),
                L2:Math.min(props.beamProperties["Length of Beam"], 
                            getSafePosition(props.beamProperties) + props.beamProperties["Length of Beam"]/4),
                ["Load Force"]:10.0,
                ["Taller End"]:"Left",
                Color:getRandomColor()})
            // Display add/edit form in add mode.
            props.setOpen(true)
            setAddOrEditMode("Add")
            props.setAction("")
        }
        else if(props.action === "Edit") {
            if(props.selectedLoadID < 0)
                return
            // Put preexisting load properties.
            let load = props.loads[props.selectedLoadID]
            setNewLoad({Name:load.Name, 
                        Type:load.Type,
                        L1:load.L1,
                        L2:load.L2!=load.L1?load.L2:Math.min(props.beamProperties["Length of Beam"],
                                                             load.L1 + props.beamProperties["Length of Beam"]/4),
                        ["Load Force"]:load["Load Force"],
                        ["Taller End"]:load["Taller End"],
                        Color:load.Color})
            // Display add/edit form in edit mode.
            props.setOpen(true)
            setAddOrEditMode("Edit")
            props.setAction("")
        }
    },[props.action])

    // When closing the Add/Edit Load form by clicking out, canceling, or confirming.
    function handleClose(event) {
        // If user clicked out or cancelled, do nothing and close the form.
        if(event !== "confirm"){
            props.setOpen(false)
            setWarning("")
            return
        }
        // If errors are present and user attempted to submit, do nothing and leave the form open.
        validateInputs(["Name","L1","L2","Load Force"])
        if(warning !== "")
            return

        props.setOpen(false)

        // Simplifies calculations if we can read point loads' length as 0
        if(newLoad.Type === "Point")
            newLoad.L2 = newLoad.L1
        if(newLoad.Type !== "Triangular")
            newLoad["Taller End"] = "Left"

        if(addOrEditMode === "Add") {
            props.loads.push(newLoad)
            props.setSelectedLoadID(props.loads.length - 1)
        }
        else
            props.loads[props.selectedLoadID] = newLoad
    }
    
    /**
     * This function checks the add/edit form inputs to ensure that they are valid. 
     * All inputs must be nonnegative numbers. 
     * Duplicate names are not allowed.
     * Loads must not extend out of bounds.
     * This function also converts the string inputs into number inputs.
     */
     function validateInputs(fields){
        // Clear the errors
        setWarning("")
        let newInvalidAddEditFields = []

        // Add entered fields to the list of fields to check
        if(Array.isArray(fields))
            fields.forEach(field => {
                if(!invalidFields.includes(field))
                    invalidFields.push(field)
            })
        else
            if(!invalidFields.includes(fields))
                invalidFields.push(fields)

        invalidFields.forEach(field=> {
            if(field === "Name") {
                // Check that Name is not in use (ignoring the load currently being edited).
                let nameInUse = false
                props.loads.forEach((load,loadID)=>{
                    if(load.Name === newLoad.Name && !(addOrEditMode === "Edit" && loadID == props.selectedLoadID))
                        nameInUse = true
                })
                if(nameInUse) {
                    setWarning("Name is already in use.")
                    newInvalidAddEditFields.push(field)
                    return
                }
            }

            if(["L1", "L2", "Load Force"].includes(field)) {
                // Check that field is a number.
                if(parseFloat(newLoad[field]) != newLoad[field]){
                    setWarning(field + " must be a number.")
                    newInvalidAddEditFields.push(field)
                    return
                }
                newLoad[field] = Number(newLoad[field])
            }

            if((["L1", "L2"].includes(field))) {
                // Check that load location is in-bounds, for point load.
                if(newLoad.Type === "Point") {
                    if(newLoad.L1 < 0) {
                        setWarning("L1 must be at least 0.")
                        newInvalidAddEditFields.push(field)
                        return
                    }
                    if(newLoad.L1 > props.beamProperties["Length of Beam"]) {
                        setWarning("L1 must be less than or equal to Length of Beam.")
                        newInvalidAddEditFields.push(field)
                        return
                    }
                }
                // Check that left and right ends of the load are in-bounds, and left end is to the left of right end, for long loads.
                else {
                    if(newLoad.L1 < 0) {
                        setWarning("L1 must be at least 0.")
                        newInvalidAddEditFields.push(field)
                        return
                    }
                    if(newLoad.L2 <= newLoad.L1) {
                        setWarning("L2 must be greater than L1.")
                        newInvalidAddEditFields.push(field)
                        return
                    }
                    if(newLoad.L2 > props.beamProperties["Length of Beam"]) {
                        setWarning("L2 must be less than or equal to Length of Beam.")
                        newInvalidAddEditFields.push(field)
                        return
                    }
                }
            }
        })
        setInvalidFields(newInvalidAddEditFields)
    }

    return (
        <Dialog open={props.open} onClose={handleClose}>
            <DialogTitle>{addOrEditMode} Load</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please enter load properties
                </DialogContentText>
                {/* name textbox */}
                <TextField
                    autoFocus
                    margin="dense"
                    label="Name"
                    defaultValue={newLoad.Name}
                    type="text"
                    onChange={val=>{
                        newLoad.Name = val.target.value
                        validateInputs("Name")
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
                        value={newLoad.Type}
                        onChange={val=>{
                            newLoad.Type = val.target.value
                            validateInputs("L2")
                        }}
                    >
                        <FormControlLabel value="Point" control={<Radio />} label="Point Load" />
                        <FormControlLabel value="Distributed" control={<Radio />} label="Distributed Load" />
                        <FormControlLabel value="Triangular" control={<Radio />} label="Triangular Load" />
                    </RadioGroup>
                </FormControl>
                {/* L1 textbox */}
                <TextField
                    margin="dense"
                    label={newLoad.Type==="Point"?"Location of Load":"Left Endpoint Location"}
                    type="text"
                    defaultValue={newLoad.L1}
                    onChange={val=>{
                        newLoad.L1 = val.target.value
                        validateInputs("L1")
                    }}
                    fullWidth
                    variant="standard"
                />
                {/* L2 textbox, hidden for point loads */}
                {newLoad.Type==="Point"?[]:
                    <TextField
                        margin="dense"
                        label="Right Endpoint Location"
                        type="text"
                        defaultValue={newLoad.L2}
                        onChange={val=>{
                            newLoad.L2 = val.target.value
                            validateInputs("L2")
                        }}
                        fullWidth
                        variant="standard"
                    />
                }
                {/* load force textbox
                    Point Load -> Load Force, Distributed Load -> Load Force Per Unit Length, Triangular Load -> Max Load Force Per Unit Length */}
                <TextField
                    margin="dense"
                    label={newLoad.Type==="Point"?"Load Force":newLoad.Type==="Distributed"?"Load Force Per Unit Length":"Max Load Force Per Unit Length"}
                    defaultValue={newLoad["Load Force"]}
                    type="text"
                    onChange={val=>{
                        newLoad["Load Force"] = val.target.value
                        validateInputs("Load Force")
                    }}
                    fullWidth
                    variant="standard"
                />
                {/* radio buttons for triangular loads to decide which end is taller */}
                {newLoad.Type!=="Triangular"?[]:
                    <FormControl>
                        <FormLabel id="tallerEndRadios" sx={{mt:1}}>Taller End of the Load (Triangular Loads Only)</FormLabel>
                        <RadioGroup
                            row
                            aria-labelledby="tallerEndRadios"
                            value={newLoad["Taller End"]}
                            onChange={val=>{
                                newLoad["Taller End"] = val.target.value
                                // Necessary to make the radiobuttons re-render when clicked and show a change
                                validateInputs("L2")
                            }}
                        >
                            <FormControlLabel value="Left" control={<Radio />} label="Left"/>
                            <FormControlLabel value="Right" control={<Radio />} label="Right"/>
                        </RadioGroup>
                    </FormControl>
                }
            </DialogContent>
            {/* warning label for invalid inputs */}
            <DialogContentText align="center" sx={{fontWeight: "bold", height:30}}>{warning}</DialogContentText>
            {/* buttons to confirm or cancel */}
            <DialogActions>
                <Button onClick={()=>{handleClose("cancel")}}>Cancel</Button>
                <Button onClick={()=>{handleClose("confirm")}}>Confirm</Button>
            </DialogActions>
        </Dialog>
    )
}

// Function to pick name for a load, returning the first unoccupied load name like load1, load2, load3...
function getFreeName(loads){
    let loadNames = loads.map(load=>load.Name)
    let i = 1
    let name = "Load 1"
    while(loadNames.includes(name))
        name = "Load " + ++i
    return name
}

// Function to pick position for a load, returning the middle of the beam if beam length is valid, or 0 if it's invalid.
function getSafePosition(beamProperties){
    let length = beamProperties["Length of Beam"]
    // Check if length is not a number
    if(parseFloat(length) != length)
        return 0
    // Check if length <= 0
    length = Number(length)
    if(length <= 0) {
        return 0
    }
    return length / 2
}

// Function to pick a color for a load, returning a random color code with RGB components in the range 0-159, and opacity 50%.
function getRandomColor() {
    // R
    let R = Math.floor(Math.random() * 160).toString(16)
    if(R.length < 2)
        R = "0"+R
    // G
    let G = Math.floor(Math.random() * 160).toString(16)
    if(G.length < 2)
        G = "0"+G
    // B
    let B = Math.floor(Math.random() * 160).toString(16)
    if(B.length < 2)
        B = "0"+B
    return "#" + R + G + B + "80"
}

export default AddEditForm