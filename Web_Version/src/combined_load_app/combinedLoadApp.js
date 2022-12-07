import '../App.css'
import React, { useEffect, useState} from 'react'
import {Button, Dialog, DialogContent, Table, TableBody, TableCell, TableHead, TableRow} from '@mui/material'
import AddEditForm from '../components/AddEditForm'
import LoadSelector from '../components/LoadSelector'
import PropertiesForm from '../components/PropertiesForm'
import SidePlot from '../components/SidePlot'
import {HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis} from "react-vis"


function CombinedLoadApp(){
    // Data
    const [loads,setLoads] = useState([])
    // Elasticity, Inertia, Density, Area, Damping Ratio, and rA are used in dynamic beam swaying, which is not implemented currently
    const [beamProperties,setBeamProperties] = useState({["Length of Beam"]: 100, 
                                                         Elasticity: 1.0, 
                                                         Inertia: 1.0, 
                                                         Density: 1.0, 
                                                         Area: 1.0, 
                                                         ["Damping Ratio"]:0.02, 
                                                         rA: 85000.0, 
                                                         EI: 210000000000.0, 
                                                         Gravity:1,
                                                         ["Support Type"]: "Simply Supported",
                                                         ["Pinned Support Position"]: 0,
                                                         ["Roller Support Position"]: 100})
    // The index of the load to move/modify/delete
    const [selectedLoadID, setSelectedLoadID] = useState(-1)
    // Whether forms should be shown
    const [openHelpMenu, setOpenHelpMenu] = useState(false)
    const [openPropertiesForm, setOpenPropertiesForm] = useState(true)
    const [openAddEditForm, setOpenAddEditForm] = useState(false)
    // Communication with the forms
    const [addEditFormAction, setAddEditFormAction] = useState("")
    const [propertiesFormAction, setPropertiesFormAction] = useState("")

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
    const plotScreenRef = React.useRef(null)
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
    
    /**
     * Function that manages keyboard controls.
     * User may submit forms by pressing Enter, 
     * use the arrow keys to jump or move the load left or right,
     * or press the delete key to delete a load.
     */
     function handleKeyDown(event){
        // On the add/edit form
        if(openAddEditForm){
            // Escape already works, no code here needed. It closes the form without making the add/edit.
            // Enter
            if(event.keyCode == 13) {
                if(addEditFormAction === "")
                    setAddEditFormAction("Confirm")
            }
            else
                return
        }
        // On the properties form
        else if(openPropertiesForm) {
            // Escape is not intended to do anything here.
            // Insert outside of textboxes
            if(event.keyCode == 45 && document.activeElement.type !== "text")
                handleClickAdd()
            // Shift + End outside of textboxes
            else if(event.keyCode == 35 && document.activeElement.type !== "text")
                handleClickEdit()
            // Delete outside of textboxes
            else if(event.keyCode == 46 && document.activeElement.type !== "text")
                handleClickDelete()
            // Enter
            else if(event.keyCode == 13)
                setPropertiesFormAction("Close")
            else
                return
        }
        // On the main plots screen
        else {
            // Escape
            if(event.keyCode == 27)
                handleClickProperties()
            // Insert outside of textboxes
            else if(event.keyCode == 45 && document.activeElement.type !== "text")
                handleClickAdd()
            // End outside of textboxes
            else if(event.keyCode == 35 && document.activeElement.type !== "text")
                handleClickEdit()
            // Delete outside of textboxes
            else if(event.keyCode == 46 && document.activeElement.type !== "text")
                handleClickDelete()
            // Left arrow outside of textboxes
            else if(event.keyCode == 37 && document.activeElement.type !== "text")
                moveSelectedLoad(-beamProperties["Length of Beam"]/100,1,10)
            // Up arrow (Jump) outside of textboxes
            else if(event.keyCode == 38 && document.activeElement.type !== "text")
                moveSelectedLoad(0,5,10)
            // Right arrow outside of textboxes
            else if(event.keyCode == 39 && document.activeElement.type !== "text")
                moveSelectedLoad(beamProperties["Length of Beam"]/100,1,10)
            // Down arrow outside of textboxes
            else if(event.keyCode == 40 && document.activeElement.type !== "text")
                ; // Do nothing. Just prevent scroll-down
            else
                return
        }
        // If any of the above were triggered, preventDefault prevents scrolling and other unwanted effects from the keys.
        event.preventDefault()
    }

    // Move the selected load
    // mag and tl are used in dynamic beam swaying, not implemented currently
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
    function addEditForm(){
        return (
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
        )
    }


    // Display the properties form
    if(openPropertiesForm){
        return(
            <PropertiesForm
                loads={loads}
                beamProperties={beamProperties}
                selectedLoadID={selectedLoadID}
                handleSelectedChange={handleSelectedChange}

                action={propertiesFormAction}
                setAction={setPropertiesFormAction}
                open={openPropertiesForm}
                setOpen={setOpenPropertiesForm}

                handleKeyDown={handleKeyDown}
                handleClickAdd={handleClickAdd}
                handleClickEdit={handleClickEdit}
                handleClickDelete={handleClickDelete}

                addEditForm={addEditForm}
                openAddEditForm={openAddEditForm}
            />
        )
    }
    else {
        // Display the main plots screen
        return(
            <div className={(innerWidth > 500) ? "rowC" : ""} onKeyDown={handleKeyDown} ref={plotScreenRef} tabIndex="0">
                <div style={{height:(innerWidth > 500) ? (window.innerHeight - 100): "", width:(innerWidth > 500) ? "40%" : "", overflowX:"clip", overflowY:"auto", borderRight:"1px solid"}}>
                    <h1>CARL</h1>
                    {/* Main Plot */}
                    <XYPlot height={window.innerHeight * 0.5} width={(innerWidth > 500) ? (window.innerWidth * 0.4) : window.innerWidth} xDomain={[0,beamProperties["Length of Beam"]]} yDomain={[-100, 100]} margin = {{left : 60, right:60}}>
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
                                <LabelSeries data={[{x: beamProperties["Pinned Support Position"], y: 0, yOffset: 24, label: "\u25b2", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}},
                                                    {x: beamProperties["Roller Support Position"], y: 0, yOffset: 24, label: "\u2b24", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}}]} />
                            :
                                // Cantilever support
                                getCantileverSupportDisplay(beamProperties["Length of Beam"])
                        }
                        {/* Display the labels and arrows for loads. */}
                        <LabelSeries data={labelMakerForLoads(loads,beamProperties,selectedLoadID)} onValueClick={handleClickLoad} />
                        {/* Display the line parts of distributed and triangular loads. */}
                        {loads.map((load, loadID) => {
                            if(load.Type === "Point")
                                return

                            let data = [{x: load.Location, y: 8 * (930 / (window.innerHeight - 100))}, 
                                        {x: (load.Location+load.Length), y: 8 * (930 / (window.innerHeight - 100))}]
                            if(load.Type === "Triangular") {
                                data.push({x: load.Location + ((load["Taller End"]==="Right")?load.Length:0), y: 20 * (930 / (window.innerHeight - 100))},
                                          {x: load.Location, y: 8 * (930 / (window.innerHeight - 100))})
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
                        {addEditForm()}
                    </div>
                    <div>
                        {/* Control buttons */}
                        <Button variant="contained" sx={{margin: 0.5}} onClick={()=>{moveSelectedLoad(-beamProperties["Length of Beam"]/100,1,10)}}>&#8592;</Button>
                        {/* Jump is used in dynamic swaying, which is not implemented yet */}
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
                                             ["End:", "Edit Selected Load"],
                                             ["Delete:", "Delete Selected Load"],
                                             ["Esc:", "Edit Properties"]]
                                    .map(row=>
                                        <TableRow key={row}>
                                            {row.map(col=>
                                                <TableCell key={col}>{col}</TableCell>
                                            )}
                                        </TableRow>
                                )}</TableBody>
                            </Table>
                        </DialogContent>
                    </Dialog>
                </div>
                {/* Right Columns */}
                <div style={{height:(innerWidth > 500) ? window.innerHeight - 100: "", width:(innerWidth > 500) ? "60%" : "", overflowX:"clip", overflowY:"auto"}}>
                    <h1>Plots</h1>
                    {/* Deflection Diagram */}
                    <SidePlot title="Deflection Diagram"
                              loads={loads}
                              beamProperties={beamProperties}
                              showReactions
                              showGlobalExtreme
                    />
                    
                    {/* Bending Moment Diagram */}
                    <SidePlot title="Bending Moment Diagram"
                              loads={loads}
                              beamProperties={beamProperties}
                              color="black"
                              showGlobalExtreme
                    />
                    
                    {/* Shear Force Diagram */}
                    <SidePlot title="Shear Force Diagram"
                              loads={loads}
                              beamProperties={beamProperties}
                              color="red"
                    />
                </div>
            </div>
        )
    }
}

/**
 * Function to create load labels and arrows for the Load Location plot.
 * For point loads it puts load name, position, and mass, with an arrow.
 * For long loads it also includes length, and puts many mini-arrows.
 * This function is not responsible for the line/triangle parts of long loads.
 * Point load labels are higher than the rest to reduce the amount of overlapping text.
 */
function labelMakerForLoads(loads, beamProperties, selectedLoadID){
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
        data.push({x: xLoc, y: 0, yOffset: (isPoint?-75:-55), label: load.Name, loadID: loadID, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        data.push({x: xLoc, y: 0, yOffset: (isPoint?-65:-45), label: statsLabel, loadID: loadID, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})

        // Point Loads have a big arrow, distributed loads have mini arrows
        getLoadArrows(data, load, loadID, beamProperties["Length of Beam"])
    })
    return data
}

/**
 * Function for adding the arrows representing point loads, or the mini-arrows under loads with length
 * 
 * For point loads:
 * One big black arrow at the location
 * For loads with length:
 * At least one arrow per 5% beamlength, plus arrows on each end. 
 * The arrows match the color and loadID of the load.
 * 
 * loadID is the index of the load that these arrows belong to. It helps users click on loads to select them
 */
function getLoadArrows(data, load, loadID, beamLength){
    if(load.Type === "Point")
        data.push({x: load.Location, y: 0, yOffset: 10, label: "\u2193", loadID: loadID, style: {fontSize: 45, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
    else {
        let numArrows = Math.floor(load.Length / beamLength * 20) + 1
        // Evenly spaced
        for(let i = 0; i <= numArrows; i++) {
            let x = load.Location + (i/numArrows) * load.Length
            data.push({x: x, y: 0, yOffset: 6, label: "\u2193", loadID: loadID, style: {fontSize: 25, font: "verdana", fill: load.Color, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        }
    }
}

// Function for adding the cantilever support visual display.
function getCantileverSupportDisplay(beamLength) {
    let support = []
    let leftSide = -2/100 * beamLength * (1920 / (window.innerWidth + ((innerWidth > 500) ? -300 : 440)))
    // Outer rectangle parts
    support.push(<LineSeries data = {[{x : leftSide, y : 10 * (930 / (window.innerHeight - 100))},
                                      {x : 0, y : 10 * (930 / (window.innerHeight - 100))},
                                      {x : 0, y : -10 * (930 / (window.innerHeight - 100))},
                                      {x : leftSide, y : -10 * (930 / (window.innerHeight - 100))}]}
                             color = "#12939A"/>)
    // Diagonal parts
    support = support.concat([-10,-6,-2,2,6].map(val=>
        <LineSeries data = {[{x: leftSide, y: val * (930 / (window.innerHeight - 100))},
                             {x: 0, y: (val+4) * (930 / (window.innerHeight - 100))}]}
                    color = "#12939A"
                    key = {val}/>
    ))
    return support
}

// This function returns a formatting function for numbers, using the given scale.
// More documentation is in SidePlot.
function formatVal(scale) {
    // If the scale is very large or tiny, return a function that converts vals to scientific notation.
    if(Math.abs(scale) >= 10**5 || (10**-4 >= Math.abs(scale) && Math.abs(scale) >= 10**-10))
        return val => {
            val = Number(Number(val.toPrecision(6)))
            if(Math.abs(val) <= 10**-10)
                val = 0
            return "" + (val == 0 ? val : val.toExponential())
        }
    // If scale is normal or scale is exactly 0, return a function that just returns val.
    else
        return val => {
            val = Number(Number(val.toPrecision(6)))
            if(Math.abs(val) <= 10**-10)
                val = 0
            return "" + val
        }
    // The returned values must be Strings for XYPlot's tickFormat, else 0 will be read as false and will not display
}


export default CombinedLoadApp