import '../App.css'
import 'react-vis/dist/style.css'
import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogContent, Table, TableBody, TableCell, TableRow } from '@mui/material'
import AddEditForm from '../components/AddEditForm'
import LoadSelector from '../components/LoadSelector'
import PropertiesForm from '../components/PropertiesForm'
import SidePlot from '../components/SidePlot'
import { HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis } from "react-vis"
import {Nav} from '../components/Navbar/NavbarElements'
import io from "socket.io-client"
import {useInterval} from "../useInterval"

let endpoint = "wss://sail-ncsu.herokuapp.com/" // this is when run on server ***** change it
// let endpoint = "http://127.0.0.1:5000/"
let socket = io.connect(endpoint)

function CombinedLoadApp() {
    // Data
    const [loads, setLoads] = useState([])
    const [selectedLoadID, setSelectedLoadID] = useState(-1)
    const [beamProperties, setBeamProperties] = useState({
        ["Support Type"]: "Simply Supported",
        ["Length of Beam"]: 10,
        ["Pinned Support Position"]: 0,
        ["Roller Support Position"]: 10,
        Elasticity: 29000.0,
        Inertia: 2000.0
    })
    const [dynamicProperties, setDynamicProperties] = useState({
        Density: 0.283,
        Area: 1.0,
        ["Damping Ratio"]: 0.02,
        rA: 85000.0,
        Gravity: 9.8
    })
    // Scale for dynamic displacement
    const [deflectionScale, setDeflectionScale] = useState(1)
    // Whether dynamic mode is enabled
    const [dynamic, setDynamic] = useState(false)

    // Whether forms should be shown
    const [openHelpMenu, setOpenHelpMenu] = useState(false)
    const [openPropertiesForm, setOpenPropertiesForm] = useState(true)
    const [openAddEditForm, setOpenAddEditForm] = useState(false)
    // Communication with the forms
    const [addEditFormAction, setAddEditFormAction] = useState("")
    const [propertiesFormAction, setPropertiesFormAction] = useState("")

    const [items, setItems] = useState([])
    const [mi, setI] = useState(0)
    const [mData, setData] = useState([
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 3, y: 0},
        {x: 4, y: 0},
        {x: 5, y: 0},
        {x: 6, y: 0},
        {x: 7, y: 0},
        {x: 8, y: 0},
        {x: 9, y: 0}
    ])
    const [testUrl, setTestUrl] = useState(["{'length': "+ beamProperties["Length of Beam"] 
    +", 'elasticity': "+ beamProperties.Elasticity
    +", 'inertia': "+ beamProperties.Inertia
    +", 'density': "+ dynamicProperties.Density
    +", 'area': "+ dynamicProperties.Area
    +", 'dampingRatio':"+ dynamicProperties["Damping Ratio"]
    +", 'rA': "+ dynamicProperties.rA
    +", 'EI': "+ beamProperties.Elasticity * beamProperties.Inertia
    +", 'mass': ["+ []
    +"], 'gravity': "+ dynamicProperties.Gravity
    +", 'force': ["+ []
    +"], 'locationOfLoad': ["+ []
    +"], 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 2, 'timelimit' : 100, 'q': 0, 'mt': 0}"])

    // Shortcut to re-render the screen
    const [render, setRender] = useState(false)
    function reRender() {
        // Wrapping setRender inside setTimeout causes the screen to rerender more smoothly when the user holds down a movement key.
        setTimeout(() => setRender(!render), 0)
    }

    // Plots resize whenever the window is resized
    const [dims, setDims] = useState([])
    useEffect(() => {
        window.addEventListener("resize", () => setDims([window.innerHeight, window.innerWidth]))
        return () => window.removeEventListener("resize", () => setDims([window.innerHeight, window.innerWidth]))
    }, [])

    // Sets the focus on the page so the user can use keyboard controls
    const plotScreenRef = React.useRef(null)
    useEffect(() => {
        if (plotScreenRef.current)
            plotScreenRef.current.focus()
    }, [openPropertiesForm])

    // Communication with backend
    socket.on('message',message => {
        if(dynamic) {
            setItems(message)
            setI(0)
        }
    })
    useEffect(() =>
        socket.emit("message",testUrl[0])
    ,[testUrl[0]])

    // When Add Load button is clicked
    function handleClickAdd () {
        if (addEditFormAction === "")
            setAddEditFormAction("Add")
    }
    // When Edit Load button is clicked
    function handleClickEdit () {
        if (addEditFormAction === "")
            setAddEditFormAction("Edit")
    }
    // When Delete Load button is clicked
    function handleClickDelete() {
        if (selectedLoadID < 0)
            return
        loads.splice(selectedLoadID, 1)
        setSelectedLoadID(loads.length - 1)
        refreshDynamic()
        reRender()
    }
    function refreshDynamic() { 
        makeUrl(1,10)
    }

    // When Dynamic button is clicked
    function handleClickDynamic() {
        setDynamic(!dynamic)
        setOpenPropertiesForm(true)

        setLoads([])
        setSelectedLoadID(-1)
        beamProperties["Support Type"] = "Simply Supported"
        
        setData([
            {x: 0, y: 0},
            {x: 1, y: 0},
            {x: 2, y: 0},
            {x: 3, y: 0},
            {x: 4, y: 0},
            {x: 5, y: 0},
            {x: 6, y: 0},
            {x: 7, y: 0},
            {x: 8, y: 0},
            {x: 9, y: 0}
        ])

        socket.emit("message",testUrl[0])
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
    function handleSelectedChange(event) {
        setSelectedLoadID(event.target.value)
    }

    // Keyboard controls
    function handleKeyDown(event) {
        // On the add/edit form
        if (openAddEditForm) {
            // Escape already works, no code here needed. It closes the form without making the add/edit.
            // Enter
            if (event.keyCode == 13) {
                if (addEditFormAction === "")
                    setAddEditFormAction("Confirm")
            }
            else
                return
        }
        // On the properties form
        else if (openPropertiesForm) {
            // Escape is not intended to do anything here.
            // Insert outside of textboxes
            if (event.keyCode == 45 && document.activeElement.type !== "text")
                handleClickAdd()
            // End outside of textboxes
            else if (event.keyCode == 35 && document.activeElement.type !== "text")
                handleClickEdit()
            // Delete outside of textboxes
            else if (event.keyCode == 46 && document.activeElement.type !== "text")
                handleClickDelete()
            // Enter
            else if (event.keyCode == 13)
                setPropertiesFormAction("Close")
            else
                return
        }
        // On the main plots screen
        else {
            // Escape
            if (event.keyCode == 27)
                handleClickProperties()
            // Insert outside of textboxes
            else if (event.keyCode == 45 && document.activeElement.type !== "text")
                handleClickAdd()
            // End outside of textboxes
            else if (event.keyCode == 35 && document.activeElement.type !== "text")
                handleClickEdit()
            // Delete outside of textboxes
            else if (event.keyCode == 46 && document.activeElement.type !== "text")
                handleClickDelete()
            // Left arrow outside of textboxes
            else if (event.keyCode == 37 && document.activeElement.type !== "text")
                moveSelectedLoad(-1 * beamProperties["Length of Beam"] / 100, 1, 10)
            // Right arrow outside of textboxes
            else if (event.keyCode == 39 && document.activeElement.type !== "text")
                moveSelectedLoad(beamProperties["Length of Beam"] / 100, 1, 10)
            else
                return
        }
        // If any of the above were triggered, preventDefault prevents scrolling and other unwanted effects from the keys.
        event.preventDefault()
    }

    /**
     * Move the selected load by adding disp to its position.
     * If move would place load out of bounds, only move the load to the edge.
     */
    function moveSelectedLoad(disp,mag,tl) {
        // Ensure selected load exists
        if (selectedLoadID < 0)
            return
        let load = loads[selectedLoadID]

        // Constrain movement to be in-bounds
        disp = Math.min(disp, beamProperties["Length of Beam"] - load.X2)
        disp = Math.max(disp, -1 * load.X1)

        // Move the selected load
        let newX1 = load.X1 + disp
        let newX2 = load.X2 + disp
        newX1 = Number(formatVal(newX1)(newX1))
        newX2 = Number(formatVal(newX2)(newX2))
        load.X1 = newX1
        load.X2 = newX2
        
        if(dynamic)
            makeUrl(mag,tl)
        reRender()
    }

    function updateGraph(){
        if(dynamic) {
            if(openPropertiesForm)
                return
            if(items.message === undefined)
                return        

            if(mi < items.message.length) {
                setData(items.message[mi].map((e,i) => {return {x: i, y: e * 10**-10}}))
                setI(mi + 1)
                if(mi === items.message.length - 20)
                    // locations
                    moveSelectedLoad(0,1,10)
            }
        }
    }
    useInterval(updateGraph, 20)

    function makeUrl(mag,tl){
        let ival = Math.min(mi+15,items.message.length -1)
        let locs = loads.map(load => load.X1)
        let forces = loads.map(load => load["Load Force"])
        let masses = forces.map((force, loadID) => {
            let mass = force
            if(dynamicProperties.Gravity != 0)
                mass /= dynamicProperties.Gravity
            if (loadID === selectedLoadID)
                mass *= mag
            return force
        })

        testUrl[0] =
            "{'length': "+ beamProperties["Length of Beam"] 
            +", 'elasticity': "+ beamProperties.Elasticity
            +", 'inertia': "+ beamProperties.Inertia
            +", 'density': "+ dynamicProperties.Density
            +", 'area': "+ dynamicProperties.Area
            +", 'dampingRatio':"+ dynamicProperties["Damping Ratio"]
            +", 'rA': "+ dynamicProperties.rA
            +", 'EI': "+ beamProperties.Elasticity * beamProperties.Inertia
            +", 'mass': ["+ masses 
            +"], 'gravity': "+  dynamicProperties.Gravity
            +", 'force': ["+ forces 
            +"], 'locationOfLoad': ["+ locs  
            +"], 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': " + mag + ", 'timelimit' : "+tl+", 'q' : '[" +items.q[ival]+"]', 'mt' : "+ival+"}"
    }

    /**
     * Autofills AddEditForm with props. 
     * This function is also passed into the properties form, to decrease the number of props the properties form needs.
     */
    function addEditForm() {
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

                dynamic={dynamic}
                onAddEdit={refreshDynamic}
            />
        )
    }


    // Display the properties form
    if (openPropertiesForm)
        return (
            <PropertiesForm
                loads={loads}
                beamProperties={beamProperties}
                dynamicProperties={dynamicProperties}
                selectedLoadID={selectedLoadID}
                handleSelectedChange={handleSelectedChange}
                handleKeyDown={handleKeyDown}
                buttonHandlers={{add:handleClickAdd, edit:handleClickEdit, delete:handleClickDelete, dynamic:handleClickDynamic}}

                action={propertiesFormAction}
                setAction={setPropertiesFormAction}
                open={openPropertiesForm}
                setOpen={setOpenPropertiesForm}

                addEditForm={addEditForm}
                openAddEditForm={openAddEditForm}

                dynamic={dynamic}
            />
        )
    
    // If dynamic and not ready, display messages
    else if (dynamic && items.message === undefined)
        return "Waiting for response..."
    else if(dynamic && mData === undefined)
        return "undefined"
    
    else
        // Display the main plots screen
        return (
            <div>
                <Nav>
                    <img src={require("../resources/images/SAIL_logo_header_v3.png")}
                            alt="Logo for SAIL: Structural Analysis Integrated Learning"
                            style={{ height: "100%", width: "100%", objectFit: "contain" }} />
                </Nav>
                <div className={(innerWidth > 500) ? "rowC" : ""} onKeyDown={handleKeyDown} ref={plotScreenRef} tabIndex="0">
                    {/* Left Column */}
                    <div style={{
                        height: (innerWidth > 500) ? (window.innerHeight - 100) : "", width: (innerWidth > 500) ? "40%" : "",
                        overflowX: "clip", overflowY: "auto", borderRight: "1px solid"
                    }}>
                        {/* Main Plot */}
                        <h1>Load Locations</h1>
                        {dynamic?
                            <XYPlot 
                                height={window.innerHeight * 0.5} width={(innerWidth > 500) ? (window.innerWidth * 0.4) : window.innerWidth}
                                xDomain={[0, beamProperties["Length of Beam"]]} yDomain ={[deflectionScale * 3,deflectionScale * 3]} margin={{ left: 60, right: 60 }}
                            >
                                <VerticalGridLines/>
                                <HorizontalGridLines/>
                                <XAxis tickFormat={formatVal(beamProperties["Length of Beam"])} title={"Load Locations"} />
                                <YAxis tickFormat={formatVal(beamProperties["Length of Beam"])}/>
                                {/* Display the beam */}
                                <LineSeries data={updateMdata(mData, beamProperties["Length of Beam"])} curve={'curveMonotoneX'}/>
                                {/* Display the supports. */}
                                <LabelSeries data={[{
                                    x: 0, y: 0, yOffset: 24, label: "\u25b2",
                                    style: { fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle" }
                                },
                                {
                                    x: beamProperties["Length of Beam"], y: 0, yOffset: 24, label: "\u2b24",
                                    style: { fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle" }
                                }]} />
                                {/* Display the loads */}
                                <LabelSeries data={labelMakerForLoads(loads, beamProperties, selectedLoadID, true, mData)} onValueClick={element => setSelectedLoadID(element.loadID)} />
                            </XYPlot>
                        :
                            <XYPlot
                                height={window.innerHeight * 0.5} width={(innerWidth > 500) ? (window.innerWidth * 0.4) : window.innerWidth}
                                xDomain={[0, beamProperties["Length of Beam"]]} yDomain={[-100, 100]} margin={{ left: 60, right: 60 }}
                            >
                                <VerticalGridLines />
                                <HorizontalGridLines />
                                <XAxis tickFormat={formatVal(beamProperties["Length of Beam"])} title={"Load Locations"} />
                                <YAxis hideTicks />
                                {/* Display the beam line. */}
                                <LineSeries data={[{ x: 0, y: 0 }, { x: beamProperties["Length of Beam"], y: 0 }]} />
                                {/* Display the supports. */}
                                {(beamProperties["Support Type"] === "Simply Supported")
                                    ?
                                    // Simply Supported supports
                                    <LabelSeries data={[{
                                        x: beamProperties["Pinned Support Position"], y: 0, yOffset: 24, label: "\u25b2",
                                        style: { fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle" }
                                    },
                                    {
                                        x: beamProperties["Roller Support Position"], y: 0, yOffset: 24, label: "\u2b24",
                                        style: { fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle" }
                                    }]} />
                                    :
                                    // Cantilever support
                                    getCantileverSupportDisplay(beamProperties["Length of Beam"])
                                }
                                {/* Display the labels and arrows for loads. */}
                                <LabelSeries data={labelMakerForLoads(loads, beamProperties, selectedLoadID, false)} onValueClick={element => setSelectedLoadID(element.loadID)} />
                                {/* Display the line parts of uniform and triangular loads. */}
                                {loads.map((load, loadID) => {
                                    if (load.Type === "Point")
                                        return
                                    let data = [{ x: load.X1, y: 8 * (930 / (window.innerHeight - 100)) },
                                    { x: load.X2, y: 8 * (930 / (window.innerHeight - 100)) }]
                                    if (load.Type === "Triangular")
                                        data.push({ x: (load["Taller End"] === "Left") ? load.X1 : load.X2, y: 20 * (930 / (window.innerHeight - 100)) },
                                            { x: load.X1, y: 8 * (930 / (window.innerHeight - 100)) })

                                    return (
                                        <LineSeries
                                            data={data}
                                            onSeriesClick={() => { setSelectedLoadID(loadID) }}
                                            key={loadID}
                                            color={load.Color}
                                            strokeWidth={3}
                                        />
                                    )
                                })}
                            </XYPlot>
                        }
                        {/* Load Selection dropdown */}
                        <LoadSelector loads={loads} value={selectedLoadID} onChange={handleSelectedChange} />
                        <div>
                            {/* Add, Edit, Delete Load buttons */}
                            <div>
                                <Button variant="outlined" sx={{ width: 135 }} onClick={handleClickAdd}>Add Load</Button>
                                <Button variant="outlined" sx={{ width: 135 }} onClick={handleClickEdit} disabled={loads.length === 0}>Edit Load</Button>
                                <Button variant="outlined" sx={{ width: 135 }} onClick={handleClickDelete} disabled={loads.length === 0}>Delete Load</Button>
                            </div>
                            <Button variant="outlined" onClick={handleClickDynamic}>Switch to {dynamic?"Static":"Dynamic"} Load Simulator</Button>

                            {/* Add/Edit Load form */}
                            {addEditForm()}
                        </div>
                        <div>
                            {/* Movement and Help buttons */}
                            <Button variant="contained" sx={{ margin: 0.5 }} onClick={() => { moveSelectedLoad(-1 * beamProperties["Length of Beam"] / 100, 1, 10) }}>&#8592;</Button>
                            <Button variant="contained" sx={{ margin: 0.5 }} onClick={handleClickHelp}>Help</Button>
                            <Button variant="contained" sx={{ margin: 0.5 }} onClick={() => { moveSelectedLoad(beamProperties["Length of Beam"] / 100, 1, 10) }}>&#8594;</Button>

                            {/* Help menu */}
                            <Dialog open={openHelpMenu} onClose={() => setOpenHelpMenu(false)}>
                                <DialogContent>
                                    <span>Keyboard Shortcuts</span>
                                    <Table sx={{ minWidth: 500, marginBottom: 2 }}>
                                        <TableBody>{[["Left/Right Arrows:", "Move Selected Load"],
                                        ["Insert:", "Add Load"],
                                        ["End:", "Edit Selected Load"],
                                        ["Delete:", "Delete Selected Load"],
                                        ["Esc:", "Edit Properties"]]
                                            .map(row =>
                                                <TableRow key={row}>
                                                    {row.map(col =>
                                                        <TableCell key={col}>{col}</TableCell>
                                                    )}
                                                </TableRow>
                                            )}</TableBody>
                                    </Table>
                                    <span>Tips</span>
                                    <Table sx={{ minWidth: 500 }}><TableBody>
                                        <TableRow><TableCell>
                                            Trapezoidal loads can be simulated by stacking uniform and triangular loads that have the same endpoints.
                                        </TableCell></TableRow>
                                        <TableRow><TableCell>
                                            Positive shear force represents clockwise twist. Positive bending moment represents concave-up bending.
                                        </TableCell></TableRow>
                                    </TableBody></Table>
                                </DialogContent>
                            </Dialog>
                        </div>
                        {/* Properties button */}
                        <Button variant="contained" sx={{ margin: 0.5 }} onClick={handleClickProperties}>Edit Properties</Button>
                    </div>
                    {/* Right Columns */}
                    <div style={{
                        height: (innerWidth > 500) ? window.innerHeight - 100 : "", width: (innerWidth > 500) ? "60%" : "",
                        overflowX: "clip", overflowY: "auto"
                    }}>
                        <h1>Diagrams</h1>
                        {/* Shear Force Diagram */}
                        <SidePlot title="Shear Force Diagram"
                            loads={loads}
                            beamProperties={beamProperties}
                            steps={100}
                            color="red"
                        />

                        {/* Bending Moment Diagram */}
                        <SidePlot title="Bending Moment Diagram"
                            loads={loads}
                            beamProperties={beamProperties}
                            steps={100}
                            color="black"
                        />

                        {/* Rotation Diagram */}
                        <SidePlot title="Rotation Diagram"
                            loads={loads}
                            beamProperties={beamProperties}
                            steps={100}
                            color="grey"
                        />

                        {/* Deflection Diagram */}
                        <SidePlot title="Deflection Diagram"
                            loads={loads}
                            beamProperties={beamProperties}
                            steps={100}
                            setDeflectionScale={setDeflectionScale}
                        />
                    </div>
                </div>
            </div>
        )
}

/**
 * Function to create load labels and arrows for the Load Location plot.
 * For point loads it puts load name, position, and load force, with an arrow.
 * For non-point loads it also includes length, and puts many mini-arrows.
 * This function is not responsible for the line/triangle parts of non-point loads.
 * Point load labels are higher than the rest to reduce the amount of overlapping text.
 */
function labelMakerForLoads(loads, beamProperties, selectedLoadID, dynamic, mData) {
    if(dynamic && mData===undefined)
        return null
    var data = []
    loads.forEach((load, loadID) => {
        // xLoc is the center of the load. It serves as the location for labels, and the x coordinate users see for loads.
        let xLoc = (load.X1 + load.X2) / 2 // Convert to display format, where position = the middle of the load
        let yLoc = dynamic ? calcPlayerLoc(xLoc, mData, beamProperties) : 0

        // Check if the load is a point load, and if it is the selected load.
        let isPoint = load.Type === "Point"
        let isSelected = loadID == selectedLoadID

        // For selected load, the stats will be labelled with letters.
        let statsLabel = ""
        // X or X1 label
        statsLabel += (isSelected ? (isPoint ? "X=" : "X1=") : "") + load.X1 + ", "
        // X2 label if applicable
        if (load.Type !== "Point")
            statsLabel += (isSelected ? "X2=" : "") + load.X2 + ", "
        // P or W label
        statsLabel += (isSelected ? (isPoint ? "P=" : "W=") : "") + load["Load Force"]

        // Load name and stats labels. For point loads it will be 10 units higher.
        data.push({ x: xLoc, y: yLoc, yOffset: (isPoint ? -75 : -55), label: load.Name, loadID: loadID, style: { fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle" } })
        data.push({ x: xLoc, y: yLoc, yOffset: (isPoint ? -65 : -45), label: statsLabel, loadID: loadID, style: { fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle" } })

        // Point Loads have a big arrow, non-point loads have mini arrows
        getLoadArrows(data, load, loadID, beamProperties["Length of Beam"], yLoc)
    })
    return data
}

// Find the y position of a load at x=loc, according to the given data.
function calcPlayerLoc(loc, data, beamProperties){
    if(data === undefined){
        return 0;
    }
    var px  = (9/beamProperties["Length of Beam"])*loc
    if(px === 9.0){
        return 0.0;
    }
    var x1 = parseInt(px, 10)
    var y1 = data[x1].y
    var x2 = x1 + 1
    var y2 = data[x2].y
    var m = (y2-y1)/(x2-x1)
    var c = y1 - (m*x1)
    var py = (m*px) + c
    return py
}

/**
 * Function for adding the arrows representing point loads, or the mini-arrows under non-point loads
 * 
 * For point loads:
 * One big black arrow at the location
 * For non-point loads:
 * At least one arrow per 5% beamlength, plus arrows on each end. 
 * The arrows match the color and loadID of the load.
 * 
 * loadID is the index of the load that these arrows belong to. It helps users click on loads to select them
 */
function getLoadArrows(data, load, loadID, beamLength, yLoc) {
    if (load.Type === "Point")
        data.push({ x: load.X1, y: yLoc, yOffset: 10, label: "\u2193", loadID: loadID, style: { fontSize: 45, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle" } })
    else {
        let numArrows = Math.floor((load.X2 - load.X1) / beamLength * 20) + 1
        // Evenly spaced
        for (let i = 0; i <= numArrows; i++) {
            let x = load.X1 + (i / numArrows) * (load.X2 - load.X1)
            data.push({ x: x, y: yLoc, yOffset: 6, label: "\u2193", loadID: loadID, style: { fontSize: 25, font: "verdana", fill: load.Color, dominantBaseline: "text-after-edge", textAnchor: "middle" } })
        }
    }
}

// Function for adding the cantilever support visual display.
function getCantileverSupportDisplay(beamLength) {
    let support = []
    let leftSide = -2 / 100 * beamLength * (1920 / (window.innerWidth + ((innerWidth > 500) ? -300 : 440)))
    // Outer rectangle parts
    support.push(<LineSeries data={[{ x: leftSide, y: 10 * (930 / (window.innerHeight - 100)) },
    { x: 0, y: 10 * (930 / (window.innerHeight - 100)) },
    { x: 0, y: -10 * (930 / (window.innerHeight - 100)) },
    { x: leftSide, y: -10 * (930 / (window.innerHeight - 100)) }]}
        color="#12939A"
        key="box" />)
    // Diagonal parts
    support = support.concat([-10, -6, -2, 2, 6].map(val =>
        <LineSeries data={[{ x: leftSide, y: val * (930 / (window.innerHeight - 100)) },
        { x: 0, y: (val + 4) * (930 / (window.innerHeight - 100)) }]}
            color="#12939A"
            key={val} />
    ))
    return support
}

// This function returns a formatting function for numbers, using the given scale.
// More documentation is in SidePlot.
function formatVal(scale) {
    // If the scale is very large or tiny, return a function that converts vals to scientific notation.
    if (Math.abs(scale) >= 10 ** 5 || (10 ** -4 >= Math.abs(scale) && Math.abs(scale) >= 10 ** -10))
        return val => {
            val = Number(Number(val.toPrecision(6)))
            if (Math.abs(val) <= 10 ** -10)
                val = 0
            return "" + (val == 0 ? val : val.toExponential())
        }
    // If scale is normal or scale is exactly 0, return a function that just returns val.
    else
        return val => {
            val = Number(Number(val.toPrecision(6)))
            if (Math.abs(val) <= 10 ** -10)
                val = 0
            return "" + val
        }
    // The returned values must be Strings for XYPlot's tickFormat, else 0 will be read as false and will not display
}

function updateMdata(data, lengthOfBeam){
    // Horizontally stretch the given data to cover the length of the beam
    let d = []
    for(let o in data){
        d.push( {x:data[o].x * lengthOfBeam/9 , y:data[o].y})
    }
    return d
}

export default CombinedLoadApp