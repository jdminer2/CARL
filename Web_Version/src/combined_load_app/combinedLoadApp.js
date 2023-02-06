import '../App.css'
import 'react-vis/dist/style.css'
import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogContent, Table, TableBody, TableCell, TableRow } from '@mui/material'
import AddEditForm from '../components/AddEditForm'
import LoadSelector from '../components/LoadSelector'
import MainPlot from '../components/MainPlot'
import PropertiesForm from '../components/PropertiesForm'
import SidePlot from '../components/SidePlot'
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
        Gravity: 9.81
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
    +"], 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 2, 'timelimit' : 10, 'q': 0, 'mt': 0}"])

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
        load.X1 = formatVal(load.X1 + disp)
        load.X2 = formatVal(load.X2 + disp)
        
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
            return mass
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
                        <MainPlot dynamic={dynamic}
                            loads={loads}
                            beamProperties={beamProperties} 
                            selectedLoadID={selectedLoadID}
                            setSelectedLoadID={setSelectedLoadID}
                            deflectionScale={deflectionScale}
                            mData={mData}
                        />
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
                            <Button variant="contained" sx={{ margin: 0.5 }} id={"multi_left_btn"} onClick={() => { moveSelectedLoad(-1 * beamProperties["Length of Beam"] / 100, 1, 10) }}>&#8592;</Button>
                            <Button variant="contained" sx={{ margin: 0.5 }} onClick={handleClickHelp}>Help</Button>
                            <Button variant="contained" sx={{ margin: 0.5 }} id={"multi_right_btn"} onClick={() => { moveSelectedLoad(beamProperties["Length of Beam"] / 100, 1, 10) }}>&#8594;</Button>

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

// This function rounds off floating point error.
// Values are rounded to 6 significant digits, and values smaller than 10^-10 are rounded to 0
function formatVal(val) {
    val = Number(val.toPrecision(6))
    if (Math.abs(val) <= 10 ** -10)
        return 0
    return val
}

export default CombinedLoadApp