import '../App.css'
import React, { useEffect, useState} from 'react'
import {Button, Dialog, DialogContent, FormControlLabel, Radio, RadioGroup, Table, TableBody, TableCell, TableHead, TableRow} from '@mui/material'
import AddEditForm from '../components/AddEditForm'
import LoadSelector from '../components/LoadSelector'
import SidePlot from '../components/SidePlot'
import {HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis} from "react-vis"


function CombinedLoadApp(){
    // Data
    const [loads,setLoads] = useState([])
    const [beamProperties,setBeamProperties] = useState({["Length of Beam"]: 100, 
                                                         Elasticity: 1.0, 
                                                         Inertia: 1.0, 
                                                         Density: 1.0, 
                                                         Area: 1.0, 
                                                         ["Damping Ratio"]:0.02, 
                                                         rA: 85000.0, 
                                                         EI: 210000000000.0, 
                                                         Gravity:9.8,
                                                         ["Support Type"]: "Simply Supported",
                                                         ["Pinned Support Position"]: 0,
                                                         ["Roller Support Position"]: 100})
    // The current load to move/modify/delete
    const [selectedLoadID, setSelectedLoadID] = useState(-1)
    // Whether forms should be shown
    const [openHelpMenu, setOpenHelpMenu] = useState(false)
    const [openPropertiesForm, setOpenPropertiesForm] = useState(true)
    const [openAddEditForm, setOpenAddEditForm] = useState(false)
    // Warning and validation for properties form
    const [propertiesFormWarning, setPropertiesFormWarning] = useState("")
    const [invalidPropertiesFields, setInvalidPropertiesFields] = useState([])
    // Communication with add/edit form
    const [addEditFormAction, setAddEditFormAction] = useState("")

    // Automatically re-renders the screen when called
    const [render, setRender] = useState(false)
    function reRender() {
        // Wrapping setRender inside setTimeout causes the screen to rerender more smoothly when the user holds down a movement key.
        setTimeout(()=>setRender(!render),0)
    }

    // Automatically resizes the plots when the user resizes the window
    const [dims, setDims] = useState([])
    useEffect(() => {
        window.addEventListener("resize", ()=>setDims([window.innerHeight,window.innerWidth]))
        return () => window.removeEventListener("resize", ()=>setDims([window.innerHeight,window.innerWidth]))
    },[])

    // Automatically sets the focus on the page so the user can use keyboard controls
    const propertiesFormRef = React.useRef(null)
    const plotScreenRef = React.useRef(null)
    useEffect(()=>{
        if(propertiesFormRef.current)
            propertiesFormRef.current.focus()
    },[openPropertiesForm])
    useEffect(()=>{
        if(plotScreenRef.current)
            plotScreenRef.current.focus()
    },[openPropertiesForm])

    
    // When Add Load button is clicked
    const handleClickAdd = () => {
        if(addEditFormAction === "")
            setAddEditFormAction("Add")
    }
    // When Edit Load button is clicked
    const handleClickEdit = () => {
        if(addEditFormAction === "")
            setAddEditFormAction("Edit")
    }
    // When Delete Load button is clicked
    function handleClickDelete(){
        if(selectedLoadID < 0)
            return
        loads.splice(selectedLoadID,1)
        setSelectedLoadID(loads.length - 1)
        reRender()
    }
    // When Edit Properties button is clicked
    function handleClickProperties() {
        setOpenPropertiesForm(true)
    }
    // When Help button is clicked
    function handleClickHelp() {
        setOpenHelpMenu(true)
    }
    // When using the load selector dropdown or properties form radio buttons to change selected load
    function handleSelectedChange(event){
        setSelectedLoadID(event.target.value)
    }
    // When clicking an arrow, line, or label corresponding to a load to change selected load
    function handleClickLoad(element){
        setSelectedLoadID(element.loadID)
    }
    
    // Function to submit the properties form
    function handleClosePropertiesForm(e){
        validateInputsPropertiesForm(["Length of Beam","Elasticity","Inertia","Density","Area","Damping Ratio","rA","EI","Gravity","Pinned Support Position", "Roller Support Position"])
        if(propertiesFormWarning === "") {
            setOpenPropertiesForm(false)
            reRender()
        } 
        else if(e != null)
            e.preventDefault()
    }
    /**
     * This function checks the properties form inputs to ensure that they are valid. 
     * All inputs must be nonnegative numbers. Beam length and EI must be nonzero. 
     * Support positions must be in-bounds (between 0 and beam length inclusive), and beam length must not be decreased to make any load out-of-bounds.
     * This function also converts the string inputs into number inputs.
     * Fields include "Length of Beam","Elasticity","Inertia","Density","Area","Damping Ratio","rA","EI","Gravity","Support Type","Pinned Support Position","Roller Support Position"
     */
     function validateInputsPropertiesForm(fields){
        // Clear the errors
        setPropertiesFormWarning("")
        let newInvalidPropertiesFields = []

        // Add entered fields to the list of fields to check
        if(Array.isArray(fields))
            fields.forEach(field => {
                if(!invalidPropertiesFields.includes(field))
                    invalidPropertiesFields.push(field)
            })
        else
            if(!invalidPropertiesFields.includes(fields))
                invalidPropertiesFields.push(fields)

        invalidPropertiesFields.forEach(field=> {
            // Skip validating supports if not simply supported.
            if(["Pinned Support Position", "Roller Support Position"].includes(field) && beamProperties["Support Type"] !== "Simply Supported")
                return

            // Check that field is a number.
            if(parseFloat(beamProperties[field]) != beamProperties[field]){
                setPropertiesFormWarning(field + " must be a number.")
                newInvalidPropertiesFields.push(field)
                return
            }
            beamProperties[field] = Number(beamProperties[field])
            // Check that field >= 0
            if(beamProperties[field] < 0) {
                setPropertiesFormWarning(field + " must be at least 0.")
                newInvalidPropertiesFields.push(field)
                return
            }

            // Length of Beam and EI cannot be 0
            if(["Length of Beam", "EI"].includes(field))
                if(beamProperties[field] == 0) {
                    setPropertiesFormWarning(field + " cannot be 0.")
                    newInvalidPropertiesFields.push(field)
                    return
                }

            // Pinned and Roller Support Positions must be <= Length of Beam, but it doesn't matter for cantilever beam.
            if(["Length of Beam", "Pinned Support Position", "Roller Support Position"].includes(field) && beamProperties["Support Type"] === "Simply Supported") {
                if(beamProperties["Pinned Support Position"] > beamProperties["Length of Beam"]) {
                    setPropertiesFormWarning("Pinned Support Position must be less than or equal to Length of Beam.")
                    newInvalidPropertiesFields.push(field)
                    return
                }
                if(beamProperties["Roller Support Position"] > beamProperties["Length of Beam"]) {
                    setPropertiesFormWarning("Roller Support Position must be less than or equal to Length of Beam.")
                    newInvalidPropertiesFields.push(field)
                    return
                }
            }

            // If Length of Beam is decreased, preexisting loads might become out of bounds.
            if(field === "Length of Beam")
                // Check that existing loads are not invalidated by length of beam change.
                loads.forEach(load =>{
                    if(load.Type === "Point" && load.Location > beamProperties["Length of Beam"]) {
                        setPropertiesFormWarning(load.Name + " location must be less than or equal to Length of Beam.")
                        if(!newInvalidPropertiesFields.includes(field))
                            newInvalidPropertiesFields.push(field)
                    }
                    else if(load.Type !== "Point" && load.Location + load.Length > beamProperties["Length of Beam"]) {
                        setPropertiesFormWarning("Right end of " + load.Name + " is out of bounds (Location is " + (load.Location + load.Length) + ", must be less than or equal to Length of Beam).")
                        if(!newInvalidPropertiesFields.includes(field))
                            newInvalidPropertiesFields.push(field)
                    }
                })
        })
        setInvalidPropertiesFields(newInvalidPropertiesFields)
    }
    
    /**
     * Function that manages keyboard controls.
     * User may submit forms by pressing Enter, 
     * use the arrow keys to jump or move the load left or right,
     * or press the delete key to delete a load.
     */
     function handleKeyDown(event){
        // On the add/edit form
        if(openAddEditForm){
            // Enter
            if(event.keyCode == 13) {
                if(addEditFormAction === "")
                    setAddEditFormAction("Confirm")
                event.preventDefault()
            }
            // Escape already works, no code here needed. It closes the form without making the add/edit.
        }
        // On the properties form
        else if(openPropertiesForm) {
            // Insert outside of textboxes
            if(event.keyCode == 45 && document.activeElement.type !== "text") {
                handleClickAdd()
                event.preventDefault()
            }
            // Shift + Enter outside of textboxes
            else if(event.shiftKey && event.keyCode == 13 && document.activeElement.type !== "text") {
                handleClickEdit()
                event.preventDefault()
            }
            // Delete outside of textboxes
            else if(event.keyCode == 46 && document.activeElement.type !== "text") {
                handleClickDelete()
                event.preventDefault()
            }
            // Enter
            else if(event.keyCode == 13) {
                handleClosePropertiesForm(null)
                event.preventDefault()
            }
            // Escape is not intended to do anything here.
        }
        // On the main plots screen
        else {
            // Insert outside of textboxes
            if(event.keyCode == 45 && document.activeElement.type !== "text") {
                handleClickAdd()
                event.preventDefault()
            }
            // Shift + Enter outside of textboxes
            else if(event.shiftKey && event.keyCode == 13 && document.activeElement.type !== "text") {
                handleClickEdit()
                event.preventDefault()
            }
            // Delete outside of textboxes
            else if(event.keyCode == 46 && document.activeElement.type !== "text") {
                handleClickDelete()
                event.preventDefault()
            }
            // Escape
            else if(event.keyCode == 27) {
                handleClickProperties()
                event.preventDefault()
            }
            // Left arrow outside of textboxes
            else if(event.keyCode == 37 && document.activeElement.type !== "text") {
                moveSelectedLoad(-beamProperties["Length of Beam"]/100,1,10)
                event.preventDefault()
            }
            // Up arrow (Jump) outside of textboxes
            else if(event.keyCode == 38 && document.activeElement.type !== "text") {
                moveSelectedLoad(0,5,10)
                event.preventDefault()
            }
            // Right arrow outside of textboxes
            else if(event.keyCode == 39 && document.activeElement.type !== "text") {
                moveSelectedLoad(beamProperties["Length of Beam"]/100,1,10)
                event.preventDefault()
            }
            // Down arrow outside of textboxes (just preventing scroll-down)
            else if(event.keyCode == 40 && document.activeElement.type !== "text"){
                event.preventDefault()
            }
        }
    }

    // Move the selected load
    function moveSelectedLoad(disp,mag,tl){
        if(selectedLoadID < 0)
            return
        let load = loads[selectedLoadID]

        let newLoc = load.Location + disp
        // Round off floating point
        newLoc = formatVal(newLoc)(newLoc)
        // Constrain newLoc to be in-bounds
        newLoc = Math.max(newLoc, 0)
        newLoc = Math.min(newLoc, beamProperties["Length of Beam"] - load.Length)
        load.Location = newLoc

        reRender()
    }

    // Display the properties form
    if(openPropertiesForm){
        return(
            <form onKeyDown={handleKeyDown} onSubmit={handleClosePropertiesForm} ref={propertiesFormRef} tabIndex="0">
                <h1>CARL</h1>
                {/* Enter beam properties */}
                <div>
                    <h3 style={{marginBottom: 0}}>Beam Properties</h3>
                    {["Length of Beam","Elasticity","Inertia","Density","Area","Damping Ratio","rA","EI","Gravity"].map(field=>{
                        return(
                        <div key={field}>{field}:
                            <input type="text"
                                defaultValue={beamProperties[field]}
                                onChange={(e) => {
                                    beamProperties[field] = e.target.value
                                    validateInputsPropertiesForm(field)
                                }}
                            />
                        </div>)
                    })}
                </div>
                {/* Enter support properties */}
                <div>
                    <h3 style={{marginBottom: 0}}>Support Properties</h3>
                    {/* Support type radio button selection */}
                    <RadioGroup
                        value={beamProperties["Support Type"]}
                        onChange={(val)=>{
                            beamProperties["Support Type"] = val.target.value
                            validateInputsPropertiesForm(["Length of Beam", "Pinned Support Position", "Roller Support Position"])
                            reRender()
                        }}
                        sx={{display:'inline-flex'}}
                        row
                    >
                        <FormControlLabel control={<Radio />} value="Simply Supported" label="Simply Supported" />
                        <FormControlLabel control={<Radio />} value="Cantilever" label="Cantilever" />
                    </RadioGroup>
                    {["Pinned Support Position","Roller Support Position"].map(field=>{
                        return(
                        <div key={field}>{field}:
                            <input type="text"
                                defaultValue={beamProperties[field]}
                                onChange={(e) => {
                                    beamProperties[field] = e.target.value
                                    validateInputsPropertiesForm(field)
                                }}
                                disabled={beamProperties["Support Type"] !== "Simply Supported"}
                            />
                        </div>)
                    })}
                </div>
                {/* Enter loads */}
                <div>
                    {/* Load list with radio button selection */}
                    <h3 style={{marginBottom: 0}}>List of Loads</h3>
                    <RadioGroup
                        value={selectedLoadID}
                        onChange={handleSelectedChange}
                        sx={{display:'inline-flex'}}
                    >
                        {loadRadioButtonsCreator(loads)}
                    </RadioGroup>
                    <div>
                        {/* Add, Edit, Delete Load buttons */}
                        <Button variant="outlined" sx={{width:135}} onClick={handleClickAdd}>Add Load</Button>
                        <Button variant="outlined" sx={{width:135}} onClick={handleClickEdit} disabled={loads.length === 0}>Edit Load</Button>
                        <Button variant="outlined" sx={{width:135}} onClick={handleClickDelete} disabled={loads.length === 0}>Delete Load</Button>
                        {/* Add/Edit Load form */}
                        <AddEditForm
                            loads={loads}
                            beamProperties={beamProperties}
                            selectedLoadID={selectedLoadID}
                            setSelectedLoadID={setSelectedLoadID}

                            action={addEditFormAction}
                            setAction={setAddEditFormAction}
                            open={openAddEditForm}
                            setOpen={setOpenAddEditForm}
                        />
                    </div>
                </div>
                {/* Text display for invalid inputs. */}
                <p style={{fontWeight: 'bold'}}>{propertiesFormWarning}</p>
                {/* Submit button. */}
                <input type="submit" value="Analyze"/>
            </form>
        )
    }
    else {
        // Display the main plots screen
        return(
            <div className={"rowC"} onKeyDown={handleKeyDown} ref={plotScreenRef} tabIndex="0">
                <div style={{height:window.innerHeight - 100, width:"40%", overflowX:"clip", overflowY:"auto", borderRight:"1px solid"}}>
                    <h1>CARL</h1>
                    {/* Main Plot */}
                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth * 0.4} xDomain={[0,beamProperties["Length of Beam"]]} yDomain={[-100, 100]} margin = {{left : 60, right:60}}>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis tickFormat={formatVal(beamProperties["Length of Beam"])} title = {"Load Locations"}/>
                        <YAxis hideTicks/>
                        {/* Display the beam line. */}
                        <LineSeries data = {[{x: 0, y: 0}, {x: beamProperties["Length of Beam"], y: 0}]} />
                        {/* Display the supports. */}
                        {
                            (beamProperties["Support Type"] === "Simply Supported")
                            ?
                                // Simply Supported supports
                                <LabelSeries data={[{x: beamProperties["Pinned Support Position"], y: -11, label: "\u25b2", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}},
                                                    {x: beamProperties["Roller Support Position"], y: -11, label: "\u2b24", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}}]} />
                            :
                                // Cantilever support
                                getCantileverSupportDisplay(beamProperties["Length of Beam"])
                        }
                        {/* Display the labels and arrows for loads. */}
                        <LabelSeries data={labelMakerForLoads(loads,selectedLoadID,beamProperties)} onValueClick={handleClickLoad} />
                        {/* Display the line parts of distributed and triangular loads. */}
                        {loads.map((load, loadID) => {
                            if(load.Type === "Point")
                                return
                            let data
                            if(load.Type === "Distributed")
                                data = [{x: load.Location, y: 8}, {x: (load.Location+load.Length), y: 8}]
                            else if(load.Type === "Triangular"){
                                if(load["Taller End"]==="Left")
                                    data = [{x: load.Location, y: 8}, {x: load.Location, y: 20}, {x: (load.Location+load.Length), y: 8}, {x: load.Location, y: 8}]
                                else
                                    data = [{x: load.Location, y: 8}, {x: (load.Location+load.Length), y: 20}, {x: (load.Location+load.Length), y: 8}, {x: load.Location, y: 8}]
                            }
                            return (
                                <LineSeries
                                    data={data}
                                    onSeriesClick={() => {setSelectedLoadID(loadID)}}
                                    key={loadID}
                                    color={load.Color}
                                    strokeWidth={3}
                                />
                            )
                        })}
                    </XYPlot>
                    {/* Load Selection dropdown */}
                    <LoadSelector loads={loads} value={selectedLoadID} onChange={handleSelectedChange} />
                    <div>
                        {/* Add, Edit, Delete Load buttons */}
                        <Button variant="outlined" sx={{width:135}} onClick={handleClickAdd}>Add Load</Button>
                        <Button variant="outlined" sx={{width:135}} onClick={handleClickEdit} disabled={loads.length === 0}>Edit Load</Button>
                        <Button variant="outlined" sx={{width:135}} onClick={handleClickDelete} disabled={loads.length === 0}>Delete Load</Button>
                        {/* Add/Edit Load form */}
                        <AddEditForm
                            loads={loads}
                            beamProperties={beamProperties}
                            selectedLoadID={selectedLoadID}
                            setSelectedLoadID={setSelectedLoadID}

                            action={addEditFormAction}
                            setAction={setAddEditFormAction}
                            open={openAddEditForm}
                            setOpen={setOpenAddEditForm}
                        />
                    </div>
                    <div>
                        {/* Control buttons */}
                        <Button variant="contained" sx={{margin: 0.5}} onClick={()=>{moveSelectedLoad(-beamProperties["Length of Beam"]/100,1,10)}}>&#8592;</Button>
                        <Button variant="contained" sx={{margin: 0.5}} onClick={()=>{moveSelectedLoad(0,5,10)}}>JUMP</Button>
                        <Button variant="contained" sx={{margin: 0.5}} onClick={()=>{moveSelectedLoad(beamProperties["Length of Beam"]/100,1,10)}}>&#8594;</Button>
                    </div>
                    <Button variant="contained" sx={{margin:0.5}} onClick={handleClickProperties}>Edit Properties</Button>
                    <div></div>
                    <Button variant="contained" sx={{margin:0.5}} onClick={handleClickHelp}>Help</Button>
                    <Dialog open={openHelpMenu} onClose={()=>setOpenHelpMenu(false)}>
                        <DialogContent>
                            <Table sx={{minWidth: 500}}>
                                <TableHead>Keyboard Shortcuts</TableHead>
                                <TableBody>{[["Left/Right Arrows:", "Move Selected Load"],
                                             ["Up Arrow:", "Jump"],
                                             ["Insert:", "Add Load"],
                                             ["Shift + Enter:", "Edit Selected Load"],
                                             ["Delete:", "Delete Selected Load"],
                                             ["Esc:", "Edit Properties"]]
                                    .map(row=>
                                        <TableRow key={row[0]}>
                                            {row.map(col=>
                                                <TableCell>{col}</TableCell>
                                            )}
                                        </TableRow>
                                )}</TableBody>
                            </Table>
                        </DialogContent>
                    </Dialog>
                </div>
                {/* Right Columns */}
                <div style={{height:window.innerHeight - 100, width:"60%", overflowX:"clip", overflowY:"auto"}}>
                    <h1>Plots</h1>
                    {/* Deflection Diagram */}
                    <SidePlot loads={loads} beamProperties={beamProperties} singleLoadFunction={deflectionSingleLoad} title="Deflection Diagram" showReactions showGlobalExtreme />
                    
                    {/* Bending Moment Diagram */}
                    <SidePlot loads={loads} beamProperties={beamProperties} singleLoadFunction={bendingMomentSingleLoad} title="Bending Moment Diagram" color="black" showGlobalExtreme />
                    
                    {/* Shear Force Diagram */}
                    <SidePlot loads={loads} beamProperties={beamProperties} singleLoadFunction={shearForceSingleLoad} title="Shear Force Diagram" color="red" />
                </div>
            </div>
        )
    }
}

// Radio buttons displaying list of loads in the properties form
function loadRadioButtonsCreator(loads){
    let labels = []
    loads.forEach((load,loadID)=>
        labels.push(<FormControlLabel control={<Radio/>}
            value={loadID}
            key={loadID}
            label={"Name = " + load.Name + 
                ", Type = " + load.Type + 
                ": Location = " + (load.Location + load.Length / 2) +  // Convert to display format, where location = the middle of the load
                ", Mass = " + load.Mass + 
                (load.Type!=="Point" ? ", Length = " + load.Length : "") + 
                (load.Type==="Triangular" ? ", Taller End = " + load["Taller End"] : "")}
        />)
    )
        
    return labels
}

/**
 * Function for load labels for the Load Location plot.
 * For point loads it puts load name, position, and mass.
 * For distributed loads it puts load name, position, mass, and length. 
 * Point load labels are higher than the rest to reduce the amount of overlapping text.
 * 
 * This function also creates arrow text characters to indicate the positions of loads.
 * This function is not responsible for displaying the line part of the distributed loads, but it does give the arrows.
 */
function labelMakerForLoads(loads, selectedLoadID, beamProperties){
    var data = []
    loads.forEach((load,loadID)=>{
        // Check if the load is a point load, and if it is the selected load.
        let isPoint = load.Type === "Point"
        let isSelected = loadID == selectedLoadID

        // xLoc is the center of the load. It serves as the location for labels, and the x coordinate users see for loads.
        let xLoc = load.Location + load.Length/2 // Convert to display format, where position = the middle of the load

        // For selected load, the stats will be labelled with letters. For non-point loads, length will be included.
        let statsLabel = (isSelected?"x=":"") + xLoc + ", " + (isSelected?"m=":"") + load.Mass
        if(load.Type !== "Point")
            statsLabel += ", " + (isSelected?"L=":"") + load.Length

        // Load name and stats labels. For point loads it will be 10 units higher.
        data.push({x: xLoc, y: isPoint?35:25, label: load.Name, loadID: loadID, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        data.push({x: xLoc, y: isPoint?30:20, label: statsLabel, loadID: loadID, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})

        // Point Loads have a big arrow, distributed loads have mini arrows
        if(load.Type === "Point")
            data.push({x: xLoc, y: -5, label: "\u2193", loadID: loadID, style: {fontSize: 45, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        else
            getDistributedLoadMiniArrows(data, load, loadID, beamProperties["Length of Beam"])
    })
    return data
}

/**
 * Function for adding mini arrows under the distributed loads.
 * Loads will have at least one arrow per 5% of the beam, and always have an arrow on each end. 
 * The arrows match the color and loadID of the load.
 * 
 * array is the data array for a LabelSeries that will display these arrows.
 * pos and len are the position and length of the load.
 * color is the color of the load line, so that the arrows can match that color.
 * loadID is the index of the load that these arrows belong to. It is part of allowing users to click on these arrows to select the load to move/delete it.
 */
function getDistributedLoadMiniArrows(data, load, loadID, beamLength){
    let numArrows = Math.floor(load.Length / beamLength * 20) + 1
    // Evenly spaced
    for(let i = 0; i <= numArrows; i++) {
        let x = load.Location + (i/numArrows) * load.Length
        data.push({x: x, y: -3, label: "\u2193", loadID: loadID, style: {fontSize: 25, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle", fill: load.Color}})
    }
}

// Function for adding the cantilever support visual display.
function getCantileverSupportDisplay(beamLength) {
    let support = []
    support.push(<LineSeries data = {[{x : 0, y : -10}, {x : 0, y : 10}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : 10}, {x : -2/100 * beamLength, y : 6}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : 6}, {x : -2/100 * beamLength, y : 2}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : 2}, {x : -2/100 * beamLength, y : -2}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : -2}, {x : -2/100 * beamLength, y : -6}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : -6}, {x : -2/100 * beamLength, y : -10}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : 10}, {x : -2/100 * beamLength, y : 10}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : -10}, {x : -2/100 * beamLength, y : -10}]} color = "#12939A"/>)
    return support
}

// Integral of integral of bending moment. 
// For cantilever, deflection and d/dx deflection are 0 at x=0.
// For simply supported beam, deflection is 0 at x=0 and x=beam length.
function deflectionSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length
    let Lb = beamProperties["Length of Beam"]
    let EI = beamProperties.EI

    let y = 0
    if(load.Type === "Point") {
        if(x < X)
            y = (x**3-3*x**2*X) / 6
        else
            y = (X**3-3*X**2*x) / 6

        if(beamProperties["Support Type"] === "Simply Supported")
            y += (-2*Lb**2*X*x + 3*Lb*X*x**2 + 3*Lb*x*X**2 - X*x**3 - x*X**3) / 6 / Lb
    }
    else if(load.Type === "Distributed") {
        if(x < X)
            y = (-3*L**2*x**2 - 6*L*X*x**2 + 2*L*x**3) / 12
        else if(x < X + L)
            y = (-1*(X-x)**4 - 6*L**2*x**2 - 12*L*X*x**2 + 4*L*x**3) / 24
        else
            y = ((L+X)**4 - X**4 - 4*L**3*x - 12*L**2*X*x - 12*L*X**2*x) / 24

        if(beamProperties["Support Type"] === "Simply Supported")
            y += (x*X**4 - x*(L+X)**4 -2*L**2*x**3 - 4*L*x**3*X - 4*L**2*Lb**2*x + 4*L**3*Lb*x + 6*L**2*Lb*x**2 - 8*L*Lb**2*x*X + 12*L**2*Lb*x*X + 12*L*Lb*x*X**2 + 12*L*Lb*X*x**2) / 24 / Lb
    }
    else if(load.Type === "Triangular") {
        if(x < X)
            y = (-3*L**2*x**2 - 6*L*X*x**2 + 2*L*x**3) / 12
        else if(x < X + L)
            y = (-1*(X-x)**4 - 6*L**2*x**2 - 12*L*X*x**2 + 4*L*x**3) / 24
        else
            y = ((L+X)**4 - X**4 - 4*L**3*x - 12*L**2*X*x - 12*L*X**2*x) / 24

        if(beamProperties["Support Type"] === "Simply Supported")
            y += (x*X**4 - x*(L+X)**4 -2*L**2*x**3 - 4*L*x**3*X - 4*L**2*Lb**2*x + 4*L**3*Lb*x + 6*L**2*Lb*x**2 - 8*L*Lb**2*x*X + 12*L**2*Lb*x*X + 12*L*Lb*x*X**2 + 12*L*Lb*X*x**2) / 24 / Lb
    }

    y *= F / EI

    // Prevent floating point errors when there is only 1 point mass and it's on top of a supported end of the beam. It should be 0 but sometimes floating point errors happen here.
    if(Math.abs(y) < 10**-18)
        y = 0

    return y
}

// Integral of shear force. Bending moment is 0 at x=beam length, for both support types.
function bendingMomentSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length
    let Lb = beamProperties["Length of Beam"]

    let y = 0
    if(load.Type === "Point") {
        if(x < X)
            y = F * (x - X)
        else
            y = 0

        if(beamProperties["Support Type"] === "Simply Supported")
            y -= F * X / Lb * (x-Lb)
    }
    else if(load.Type === "Distributed") {
        if(x < X)
            y = F * L * (x-X-L/2)
        else if(x < X + L)
            y = F * (L*x - X*L + X*x - (L**2+X**2+x**2)/2)
        else
            y = 0
        
        if(beamProperties["Support Type"] === "Simply Supported")
            y -= F * L * (2*X+L) / 2 / Lb * (x-Lb)
    }
    else if(load.Type === "Triangular") {
        if(x < X)
            y = F * L * (x-X-L/2)
        else if(x < X + L)
            y = F * (L*x - X*L + X*x - (L**2+X**2+x**2)/2)
        else
            y = 0
        
        if(beamProperties["Support Type"] === "Simply Supported")
            y -= F * L * (2*X+L) / 2 / Lb * (x-Lb)
    }
    return y
}

function shearForceSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let X = load.Location
    let F = load.Mass * beamProperties.Gravity
    let L = load.Length
    let Lb = beamProperties["Length of Beam"]

    let y = 0
    if(load.Type === "Point") {
        if(x < X)
            y = F
        else if(x == X)
            // Array represents instantaneous change in y
            y = [F,0]
        else
            y = 0

        // For Cantilever, shear force at x=0 is F. For Simply Supported, it is something else, and the whole graph is translated down.
        if(beamProperties["Support Type"] === "Simply Supported") {
            if(Array.isArray(y)) {
                y[0] -= F * X / Lb
                y[1] -= F * X / Lb
            }
            else
                y -= F * X / Lb
        }
    }
    else if(load.Type === "Distributed") {
        if(x < X)
            y = F * L
        else if(x < X + L)
            y = F * (L - (x-X))
        else
            y = 0
        
        // For Cantilever, shear force at x=0 is F*L. For Simply Supported, it is something else, and the whole graph is translated down.
        if(beamProperties["Support Type"] === "Simply Supported")
            y -= F * L * (2*X+L) / 2 / Lb
    }
    else if(load.Type === "Triangular") {
        if(x < X)
            y = F * L
        else if(x < X + L)
            y = F * (L - (x-X))
        else
            y = 0
        
        // For Cantilever, shear force at x=0 is F*L. For Simply Supported, it is something else, and the whole graph is translated down.
        if(beamProperties["Support Type"] === "Simply Supported")
            y -= F * L * (2*X+L) / 2 / Lb
    }
    return y
}

// This function returns a formatting function for numbers, using the given scale.
function formatVal(scale) {
    // If the scale is very large or tiny, return a function that converts vals to scientific notation.
    if(scale >= 10**5 || (scale <= 10**-4 && scale != 0))
        return val => {
            val = Number(val.toPrecision(6))
            return "" + (val == 0 ? val : val.toExponential())
        }
    // If scale is normal or scale is exactly 0, return a function that just returns val.
    else
        return val => {
            val = Number(val.toPrecision(6))
            return "" + val
        }
    // Both functions round the vals to a precision of 6 to avoid floating point trails.
    // They must also be concatenated with a string or some labels will not display 0 (they view it as false and put no label)
}


export default CombinedLoadApp