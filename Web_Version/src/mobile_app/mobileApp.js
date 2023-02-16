import '../App.css'
import 'react-vis/dist/style.css'
import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogContent, Table, TableBody, TableCell, TableRow } from '@mui/material'
import AddEditForm from '../components/AddEditForm'
import LoadSelector from '../components/LoadSelector'
import MainPlot from '../components/MainPlot'
import SidePlot from '../components/SidePlot'
import {Nav} from '../components/Navbar/NavbarElements'
import io from "socket.io-client"
import {useInterval} from "../useInterval"

let endpoint = "wss://sail-ncsu.herokuapp.com/" // this is when run on server ***** change it
// let endpoint = "http://127.0.0.1:5000/"
let socket = io.connect(endpoint)

function MobileApp() {
    // Data
    const [loads, setLoads] = useState([])
    const [selectedLoadID, setSelectedLoadID] = useState(-1)
    const beamProperties = {
        ["Support Type"]: "Simply Supported",
        ["Length of Beam"]: 10,
        ["Pinned Support Position"]: 0,
        ["Roller Support Position"]: 10,
        Elasticity: 29000.0,
        Inertia: 2000.0
    }
    const dynamicProperties = {
        Density: 0.283,
        Area: 1.0,
        ["Damping Ratio"]: 0.02,
        rA: 85000.0,
        Gravity: 9.81
    }
    // Scale for dynamic displacement
    const [deflectionScale, setDeflectionScale] = useState(1)

    // Whether forms should be shown
    const openPropertiesForm = false
    const [openHelpMenu, setOpenHelpMenu] = useState(false)
    const [openAddEditForm, setOpenAddEditForm] = useState(false)
    // Communication with the forms
    const [addEditFormAction, setAddEditFormAction] = useState("")

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

    // Communication with backend
    socket.on('message',message => {
        setItems(message)
        setI(0)
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

    // When Help button is clicked
    function handleClickHelp() {
        setOpenHelpMenu(true)
    }
    // When using the load selector dropdown or properties form radio buttons to change selected load
    function handleSelectedChange(event) {
        setSelectedLoadID(event.target.value)
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
        
        makeUrl(mag,tl)
        reRender()
    }

    function updateGraph(){
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

                dynamic={true}
                onAddEdit={refreshDynamic}
            />
        )
    }

    // If not ready, display messages
    if (items.message === undefined)
        return "Waiting for response..."
    else if(mData === undefined)
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
                <div className={(innerWidth > 500) ? "rowC" : ""}>
                    {/* Left Column */}
                    <div style={{
                        height: (innerWidth > 500) ? (window.innerHeight - 100) : "", width: (innerWidth > 500) ? "40%" : "",
                        overflowX: "clip", overflowY: "auto", borderRight: "1px solid"
                    }}>
                        {/* Main Plot */}
                        <h1>Load Locations</h1>
                        <MainPlot dynamic={true}
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
                                    <span>Tips</span>
                                    <Table sx={{ minWidth: 500 }}><TableBody>
                                        <TableRow><TableCell>
                                            Trapezoidal loads can be simulated by stacking uniform and triangular loads that have the same endpoints.
                                        </TableCell></TableRow>
                                        <TableRow><TableCell>
                                            Positive shear force represents clockwise twist. Positive bending moment represents concave-up bending.
                                        </TableCell></TableRow>
                                        <TableRow><TableCell>
                                            Some features are unavailable in Mobile Version, including uniform and triangular loads, cantilever beam, and moved supports.
                                        </TableCell></TableRow>
                                    </TableBody></Table>
                                </DialogContent>
                            </Dialog>
                        </div>
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

export default MobileApp