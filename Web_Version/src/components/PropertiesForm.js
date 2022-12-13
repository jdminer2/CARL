import React, {useEffect, useState} from 'react'
import {Button, FormControlLabel, Radio, RadioGroup} from '@mui/material'

/**
 * This component displays a menu where users can change beam, support, and load properties.
 * 
 * Props:
 * 
 * loads - list of loads
 * beamProperties - object containing beam and support properties
 * selectedLoadID - which load is selected
 * handleSelectedChange - function to take an event from the radio buttons and change the selected load accordingly
 * 
 * action - for passing messages from the outside
 * setAction - for clearing the message passed in
 * open - whether the form is open
 * setOpen - used to let the form open and close itself
 * 
 * handleKeyDown - What to do when a key is pressed
 * handleClickAdd - What to do when the add button is clicked
 * handleClickEdit - What to do when the edit button is clicked
 * handleClickDelete - What to do when the delete button is clicked
 * 
 * addEditForm - Add/Edit Form component with all props pre-added
 * openAddEditForm - Whether the Add/Edit Form is open
 */
const PropertiesForm = (props) => {
    const [warning, setWarning] = useState("")
    const [invalidFields, setInvalidFields] = useState([])

    // Automatically sets the focus on the page so the user can use keyboard controls
    const formRef = React.useRef(null)
    useEffect(()=>{
        if(formRef.current)
            formRef.current.focus()
    },[props.open])

    // Receive messages from the outside via the action prop to close the menu (it does not exist when it is being opened)
    useEffect(() => {
        if(props.action === "Close") {
            handleClose("close")
            props.setAction("")
        }
    },[props.action])

    // If Length of Beam is changed such that an existing load becomes out of bounds, warning text appears.
    // This checks if the problematic load has been edited or deleted, and updates the warning text accordingly.
    useEffect(() => {
        validateInputs("Length of Beam")
    },[props.loads.length,props.openAddEditForm])

    // Function to submit the properties form
    function handleClose(e) {
        validateInputs(["Length of Beam","Elasticity","Inertia","Pinned Support Position", "Roller Support Position"])
        if(warning === "") {
            props.setOpen(false)
        }
        // This is necessary, else when user attempts to submit invalid values, url will be modified, causing problems.
        e.preventDefault()
    }

    /**
     * This function checks the properties form inputs to ensure that they are valid. 
     * All inputs must be nonnegative numbers. Beam length, elasticity, and inertia must be nonzero. 
     * Support positions must be in-bounds (between 0 and beam length inclusive), and beam length must not be decreased to make any load out-of-bounds.
     * This function also converts the string inputs into number inputs.
     * Fields include "Length of Beam","Elasticity","Inertia","Support Type","Pinned Support Position","Roller Support Position"
     */
     function validateInputs(fields){
        // Clear the errors
        setWarning("")
        let newInvalidFields = []

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
            // Skip validating supports if not simply supported.
            if(["Pinned Support Position", "Roller Support Position"].includes(field) && props.beamProperties["Support Type"] !== "Simply Supported")
                return

            // Check that field is a number.
            if(parseFloat(props.beamProperties[field]) != props.beamProperties[field]){
                setWarning(field + " must be a number.")
                newInvalidFields.push(field)
                return
            }
            props.beamProperties[field] = Number(props.beamProperties[field])

            // Check that field >= 0
            if(props.beamProperties[field] < 0) {
                setWarning(field + " must be at least 0.")
                newInvalidFields.push(field)
                return
            }

            // Length of Beam, Elasticity, and Inertia cannot be 0
            if(["Length of Beam", "Elasticity", "Inertia"].includes(field))
                if(props.beamProperties[field] < 10**-7) {
                    setWarning(field + " cannot be 0.")
                    newInvalidFields.push(field)
                    return
                }

            // Pinned and Roller Support Positions must be <= Length of Beam, but it doesn't matter for cantilever beam.
            if(["Length of Beam", "Pinned Support Position", "Roller Support Position"].includes(field) && props.beamProperties["Support Type"] === "Simply Supported") {
                if(props.beamProperties["Pinned Support Position"] > props.beamProperties["Length of Beam"]) {
                    setWarning("Pinned Support Position must be less than or equal to Length of Beam.")
                    newInvalidFields.push(field)
                    return
                }
                if(props.beamProperties["Roller Support Position"] > props.beamProperties["Length of Beam"]) {
                    setWarning("Roller Support Position must be less than or equal to Length of Beam.")
                    newInvalidFields.push(field)
                    return
                }
                if(Math.abs(props.beamProperties["Pinned Support Position"] - props.beamProperties["Roller Support Position"]) < 10**-10) {
                    setWarning("Pinned Support Position and Roller Support Position must not be equal.")
                    newInvalidFields.push(field)
                    return
                }
            }

            // If Length of Beam is decreased, preexisting loads might become out of bounds.
            if(field === "Length of Beam")
                // Check that existing loads are not invalidated by length of beam change.
                props.loads.forEach(load =>{
                    if(load.Type === "Point" && load.L1 > props.beamProperties["Length of Beam"]) {
                        setWarning(load.Name + " is out of bounds (Located at " + load.L1 + ", must be less than or equal to Length of Beam).")
                        if(!newInvalidFields.includes(field))
                            newInvalidFields.push(field)
                    }
                    else if(load.Type !== "Point" && load.L2 > props.beamProperties["Length of Beam"]) {
                        setWarning("Right endpoint of " + load.Name + " is out of bounds (Located at " + load.L2 + ", must be less than or equal to Length of Beam).")
                        if(!newInvalidFields.includes(field))
                            newInvalidFields.push(field)
                    }
                })
        })
        setInvalidFields(newInvalidFields)
    }

    return (
        <form onKeyDown={props.handleKeyDown} onSubmit={handleClose} ref={formRef} tabIndex="0">
            <h1>CARL</h1>
            {/* Enter beam properties */}
            <div>
                <h3 style={{marginBottom: 0}}>Beam Properties</h3>
                {/* Support type radio button selection */}
                <RadioGroup
                    value={props.beamProperties["Support Type"]}
                    onChange={(val)=>{
                        props.beamProperties["Support Type"] = val.target.value
                        validateInputs(["Length of Beam", "Pinned Support Position", "Roller Support Position"])
                    }}
                    sx={{display:'inline-flex'}}
                    row
                >
                    <FormControlLabel control={<Radio />} value="Simply Supported" label="Simply Supported" />
                    <FormControlLabel control={<Radio />} value="Cantilever" label="Cantilever" />
                </RadioGroup>
                {/* Textfields. Support Positions disabled for cantilever */}
                {["Length of Beam","Pinned Support Position","Roller Support Position","Elasticity","Inertia"].map(field=>{
                    return(
                    <div key={field}>{field}:
                        <input type="text"
                            defaultValue={props.beamProperties[field]}
                            onChange={(e) => {
                                props.beamProperties[field] = e.target.value
                                validateInputs(field)
                            }}
                            style={{width:100}}
                            disabled={field.includes("Support") && props.beamProperties["Support Type"] === "Cantilever"}
                        />
                    </div>)
                })}
            </div>
            {/* Enter loads */}
            <div>
                {/* Load list with radio button selection */}
                <h3 style={{marginBottom: 0}}>List of Loads</h3>
                <RadioGroup
                    value={props.selectedLoadID}
                    onChange={props.handleSelectedChange}
                    sx={{display:'inline-flex'}}
                >
                    {loadRadioButtonsCreator(props.loads)}
                </RadioGroup>
                <div>
                    {/* Add, Edit, Delete Load buttons */}
                    <Button variant="outlined" sx={{width:135}} onClick={props.handleClickAdd}>Add Load</Button>
                    <Button variant="outlined" sx={{width:135}} onClick={props.handleClickEdit} disabled={props.loads.length === 0}>Edit Load</Button>
                    <Button variant="outlined" sx={{width:135}} onClick={props.handleClickDelete} disabled={props.loads.length === 0}>Delete Load</Button>
                    {/* Add/Edit Load form */}
                    {props.addEditForm()}
                </div>
            </div>
            {/* Text display for invalid inputs. */}
            <p style={{fontWeight: 'bold'}}>{warning}</p>
            {/* Submit button. */}
            <input type="submit" value="Analyze"/>
        </form>
    )
}

// Radio buttons displaying list of loads in the properties form
function loadRadioButtonsCreator(loads){
    let labels = []
    loads.forEach((load,loadID)=>
        labels.push(<FormControlLabel control={<Radio/>}
            value={loadID}
            key={loadID}
            label={"Name: " + load.Name + ", " +
                "Type: " + load.Type + ", " + 
                (load.Type==="Point" ? 
                    "Location: " + load.L1 + ", " + 
                    "Load Force: " + load["Load Force"] + ", "
                :(load.Type==="Distributed" ? 
                    "Left Location: " + load.L1 + ", " +
                    "Right Location: " + load.L2 + ", " + 
                    "Load per Length: " + load["Load Force"] + ", "
                :
                    "Left Location: " + load.L1 + ", " +
                    "Right Location: " + load.L2 + ", " + 
                    "Max Load per Length: " + load["Load Force"] + ", " +
                    "Taller End: " + load["Taller End"]
            ))}
        />)
    )
        
    return labels
}

export default PropertiesForm