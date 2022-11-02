import '../App.css'
import React, { useEffect, useState} from 'react'
import {Button, Dialog, DialogContent, FormControlLabel, Radio, RadioGroup, Table, TableBody, TableCell, TableHead, TableRow} from '@mui/material'
import LoadSelector from '../components/LoadSelector'
import AddEditForm from '../components/AddEditForm'
import {HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis} from "react-vis"


function CombinedLoadApp(){
    // Data
    const [beamProperties,setBeamProperties] = useState({length: 100, elasticity: 1.0, inertia: 1.0, density: 1.0, area: 1.0, dampingRatio:0.02, rA: 85000.0, EI: 210000000000.0, gravity:9.8})
    const [supportProperties,setSupportProperties] = useState({type: "Simply Supported", pinnedSupportPosition: 0, rollerSupportPosition: 100})
    const [loads,setLoads] = useState({})
    // The scales of plots
    const [deflectionScale, setDeflectionScale] = useState(1)
    const [bendingMomentScale, setBendingMomentScale] = useState(1)
    const [shearForceScale, setShearForceScale] = useState(1)
    // The current load to move/modify/delete
    const [selectedLoad, setSelectedLoad] = useState('load1')
    // Whether forms should be shown
    const [openHelpMenu, setOpenHelpMenu] = useState(false)
    const [openPropertiesForm, setOpenPropertiesForm] = useState(true)
    const [openAddEditForm, setOpenAddEditForm] = useState(false)
    // The warning text that should be shown at the bottom of the forms
    const [propertiesFormWarning, setPropertiesFormWarning] = useState("")
    const [addEditFormWarning, setAddEditFormWarning] = useState("")
    // Whether the user is currently adding or editing in the add/edit form
    const [addEditMode, setAddEditMode] = useState("Add")
    // The data being entered in the add/edit form
    const [newLoadData, setNewLoadData] = useState({name:loadNamer(loads), type:"Point", location:beamProperties.length / 2, mass:10.0, length:0, tallerEnd: "Left", color:"#00000080"})


    // Automatically re-renders the screen when called
    const [render, setRender] = useState(false)
    function reRender() {
        // Wrapping setRender inside setTimeout causes the screen to rerender more smoothly when the user holds down a movement key.
        setTimeout(()=>setRender(!render),0)
    }
    // Automatically resizes the plots when the user resizes the window
    const [dims, setDims] = useState([])
    useEffect(() => {
        window.addEventListener("resize", ()=>setDims([window,innerHeight,window.innerWidth]))
        return () => window.removeEventListener("resize", ()=>setDims([window,innerHeight,window.innerWidth]))
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
                handleCloseAddEditForm("confirm")
                event.preventDefault()
            }
            // Escape already works, no code here needed. It closes the form without making the add/edit.
        }
        // On the properties form
        else if(openPropertiesForm) {
            if(event.shiftKey) {
                // Shift + Insert
                if(event.keyCode == 45)
                    handleClickAdd()
                // Shift + Enter
                else if(event.keyCode == 13)
                    handleClickEdit()
                // Shift + Backspace and Shift + Delete
                if(event.keyCode == 8 || event.keyCode == 46)
                    handleDelete()
            }
            else
                // Enter
            if(event.keyCode == 13) {
                    handleSubmitPropertiesForm(null)
                event.preventDefault()
            }
                // Escape is not intended to do anything here.
        }
        // On the main plots screen
        else {
            if(event.shiftKey) {
                // Shift + Insert
                if(event.keyCode == 45)
                    handleClickAdd()
                // Shift + Enter
                else if(event.keyCode == 13)
                    handleClickEdit()
                // Shift + Backspace and Shift + Delete
                else if(event.keyCode == 8 || event.keyCode == 46)
                    handleDelete()
            }
            // Escape
            else if(event.keyCode == 27)
                handleClickProperties()
            // Left arrow key
            if(event.keyCode == 37)
                moveSelectedLoad(-beamProperties.length/100,1,10)
            // Up arrow key (Jump)
            else if(event.keyCode == 38)
                moveSelectedLoad(0,5,10)
            // Right arrow key
            else if(event.keyCode == 39)
                moveSelectedLoad(beamProperties.length/100,1,10)
            
            // Disable the screen scroll from arrow keys
            if([37,38,39,40].includes(event.keyCode))
                event.preventDefault()
        }
    }


    // When Edit Properties button is clicked
    function handleClickProperties() {
        setOpenPropertiesForm(true)
    }
    // When Add Load button is clicked
    const handleClickAdd = () => {
        setNewLoadData({name:loadNamer(loads), type:"Point", location:beamProperties.length / 2, mass:10.0, length:0, tallerEnd: "Left"})
        // Display add/edit form in add mode.
        setOpenAddEditForm(true)
        setAddEditMode("Add")
    }
    // When Edit Load button is clicked
    const handleClickEdit = () => {
        // Put preexisting load properties.
        setNewLoadData({name:selectedLoad, type:loads[selectedLoad].type, location:loads[selectedLoad].location + loads[selectedLoad].length / 2, mass:loads[selectedLoad].mass, length:loads[selectedLoad].length, tallerEnd:loads[selectedLoad].tallerEnd, color:loads[selectedLoad].color})
        // Display add/edit form in edit mode.
        setOpenAddEditForm(true)
        setAddEditMode("Edit")
    }
    // When Help button is clicked
    function handleClickHelp() {
        setOpenHelpMenu(true)
    }


    // Function to submit the properties form
    function handleSubmitPropertiesForm(e){
        validateInputsPropertiesForm()
        if(propertiesFormWarning === "") {
            setOpenPropertiesForm(false)
            reRender()
        } 
        else if(e != null)
            e.preventDefault()
    }
    // When closing the Add/Edit Load form by clicking out, canceling, or confirming.
    function handleCloseAddEditForm (event) {
        // If user clicked out or cancelled, do nothing and close the form.
        if(event !== "confirm"){
            setOpenAddEditForm(false)
            setAddEditFormWarning("")
            return
        }
        // If errors are present and user attempted to submit, do nothing and leave the form open.
        validateInputsAddEditForm(addEditMode)
        if(addEditFormWarning !== "")
            return


        let newLoad = {type:newLoadData.type, 
                       // Entered location is converted from middle of load to left-end of load, because it is easier to do calculations using the left end
                       location:(newLoadData.location - newLoadData.length / 2), 
                       mass:newLoadData.mass, 
                       // Length is discarded for point loads
                       length:(newLoadData.type === "Point")?0:newLoadData.length, 
                       // TallerEnd is discarded for nontriangular loads
                       tallerEnd:(newLoadData.type === "Triangular")?newLoadData.tallerEnd:0, 
                       // For newly added loads, a random color is picked. Else the old color is preserved
                       color:(addEditMode === "Add")?randomColor():newLoadData.color}

        if(addEditMode === "Add")
            loads[newLoadData.name] = newLoad
        else
            // This for-loop is used to preserve the order of the loads in the list, so the edited load doesn't move to the end.
            for(let load in loads) {
                if(load !== selectedLoad) {
                    let oldLoad = loads[load]
                    delete loads[load]
                    loads[load] = oldLoad
                }
                else {
                    delete loads[load]
                    loads[newLoadData.name] = newLoad
                }
            }

        setOpenAddEditForm(false)
        setSelectedLoad(newLoadData.name)
    }


    /**
     * This function checks the properties form inputs to ensure that they are valid. 
     * All inputs must be nonnegative numbers. Beam length and EI must be nonzero. 
     * Support positions must be in-bounds (between 0 and beam length inclusive), and beam length must not be decreased to make any load out-of-bounds.
     * This function also converts the string inputs into number inputs.
     */
     function validateInputsPropertiesForm(){
        // Check that length is a number > 0.
        if(parseFloat(beamProperties.length) != beamProperties.length){
            setPropertiesFormWarning("Length of Beam must be a number.")
            return
        }
        beamProperties.length = Number(beamProperties.length)
        if(beamProperties.length <= 0) {
            setPropertiesFormWarning("Length of Beam must be greater than 0.")
            return
        }

        // Check that elasticity is a number >= 0
        if(parseFloat(beamProperties.elasticity) != beamProperties.elasticity){
            setPropertiesFormWarning("Elasticity must be a number.")
            return
        }
        beamProperties.elasticity = Number(beamProperties.elasticity)
        if(beamProperties.elasticity < 0) {
            setPropertiesFormWarning("Elasticity must be at least 0.")
            return
        }

        // Check that inertia is a number >= 0.
        if(parseFloat(beamProperties.inertia) != beamProperties.inertia){
            setPropertiesFormWarning("Inertia must be a number.")
            return
        }
        beamProperties.inertia = Number(beamProperties.inertia)
        if(beamProperties.inertia < 0) {
            setPropertiesFormWarning("Inertia must be at least 0.")
            return
        }

        // Check that density is a number >= 0.
        if(parseFloat(beamProperties.density) != beamProperties.density){
            setPropertiesFormWarning("Density must be a number.")
            return
        }
        beamProperties.density = Number(beamProperties.density)
        if(beamProperties.density < 0) {
            setPropertiesFormWarning("Density must be at least 0.")
            return
        }

        // Check that area is a number >= 0.
        if(parseFloat(beamProperties.area) != beamProperties.area){
            setPropertiesFormWarning("Area must be a number.")
            return
        }
        beamProperties.area = Number(beamProperties.area)
        if(beamProperties.area < 0) {
            setPropertiesFormWarning("Area must be at least 0.")
            return
        }


        // Check that damping ratio is a number >= 0.
        if(parseFloat(beamProperties.dampingRatio) != beamProperties.dampingRatio){
            setPropertiesFormWarning("Damping Ratio must be a number.")
            return
        }
        beamProperties.dampingRatio = Number(beamProperties.dampingRatio)
        if(beamProperties.dampingRatio < 0) {
            setPropertiesFormWarning("Damping Ratio must be at least 0.")
            return
        }


        // Check that rA is a number >= 0.
        if(parseFloat(beamProperties.rA) != beamProperties.rA){
            setPropertiesFormWarning("rA must be a number.")
            return
        }
        beamProperties.rA = Number(beamProperties.rA)
        if(beamProperties.rA < 0) {
            setPropertiesFormWarning("rA must be at least 0.")
            return
        }

        // Check that EI is a number > 0.
        if(parseFloat(beamProperties.EI) != beamProperties.EI){
            setPropertiesFormWarning("EI must be a number.")
            return
        }
        beamProperties.EI = Number(beamProperties.EI)
        if(beamProperties.EI <= 0) {
            setPropertiesFormWarning("EI must be greater than 0.")
            return
        }

        // Check that gravity is a number >= 0.
        if(parseFloat(beamProperties.gravity) != beamProperties.gravity){
            setPropertiesFormWarning("Gravity must be a number.")
            return
        }
        beamProperties.gravity = Number(beamProperties.gravity)
        if(beamProperties.gravity < 0) {
            setPropertiesFormWarning("Gravity must be at least 0.")
            return
        }

        // If support type is not simply supported, do not block the user from adjusting length regardless of the values in the support textboxes.
        if(supportProperties.type === "Simply Supported") {
            // Check that pinned support position is a number >= 0 and <= beam length.
            if(parseFloat(supportProperties.pinnedSupportPosition) != supportProperties.pinnedSupportPosition){
                setPropertiesFormWarning("Pinned Support Position must be a number.")
                return
            }
            supportProperties.pinnedSupportPosition = Number(supportProperties.pinnedSupportPosition)
            if(supportProperties.pinnedSupportPosition < 0) {
                setPropertiesFormWarning("Pinned Support Position must be at least 0.")
                return
            }
            if(supportProperties.pinnedSupportPosition > beamProperties.length) {
                setPropertiesFormWarning("Pinned Support Position must be less than or equal to Length of Beam.")
                return
            }

            // Check that roller support position is a number >= 0 and <= beam length.
            if(parseFloat(supportProperties.rollerSupportPosition) != supportProperties.rollerSupportPosition){
                setPropertiesFormWarning("Roller Support Position must be a number.")
                return
            }
            supportProperties.rollerSupportPosition = Number(supportProperties.rollerSupportPosition)
            if(supportProperties.rollerSupportPosition < 0) {
                setPropertiesFormWarning("Roller Support Position must be at least 0.")
                return
            }
            if(supportProperties.rollerSupportPosition > beamProperties.length) {
                setPropertiesFormWarning("Roller Support Position must be less than or equal to Length of Beam.")
                return
            }
        }

        // Check that existing loads are not invalidated by length of beam change.
        for(let load in loads)
            if(loads[load].type === "Point" && loads[load].location > beamProperties.length) {
                setPropertiesFormWarning(load + " location must be less than or equal to Length of Beam.")
                return
            }
            else if(loads[load].type !== "Point" && loads[load].location + loads[load].length > beamProperties.length) {
                setPropertiesFormWarning("Right end of " + load + " is out of bounds (Location is " + (loads[load].location + loads[load].length) + ", must be less than or equal to Length of Beam).")
                return
            }
        
        // No errors.
        setPropertiesFormWarning("")
    }
    /**
     * This function checks the add/edit form inputs to ensure that they are valid. 
     * All inputs must be nonnegative numbers. 
     * Duplicate names are not allowed.
     * Loads must not extend out of bounds.
     * This function also converts the string inputs into number inputs.
     */
     function validateInputsAddEditForm(mode){
        reRender()
        // Check that name is not in use, unless when editing if the name is the same as the original name.
        if((newLoadData.name in loads) && (mode === "Add" || newLoadData.name !== selectedLoad)) {
            setAddEditFormWarning("Name is already in use.")
            return
        }

        // Check that location is a number.
        if(parseFloat(newLoadData.location) != newLoadData.location){
            setAddEditFormWarning("Location must be a number.")
            return
        }
        newLoadData.location = Number(newLoadData.location)

        // Check that mass is a number >= 0.
        if(parseFloat(newLoadData.mass) != newLoadData.mass){
            setAddEditFormWarning("Mass must be a number.")
            return
        }
        newLoadData.mass = Number(newLoadData.mass)
        if(newLoadData.mass < 0) {
            setAddEditFormWarning("Mass must be at least 0.")
            return
        }

        // Check that length is a number >= 0.
        if(parseFloat(newLoadData.length) != newLoadData.length){
            setAddEditFormWarning("Length must be a number.")
            return
        }
        newLoadData.length = Number(newLoadData.length)
        if(newLoadData.length < 0) {
            setAddEditFormWarning("Length must be at least 0.")
            return
        }

        // Check that load location is in-bounds, for point load.
        if(newLoadData.type === "Point") {
            if(newLoadData.location < 0) {
                setAddEditFormWarning("Location must be at least 0.")
                return
            }
            if(newLoadData.location > beamProperties.length) {
                setAddEditFormWarning("Location must be less than or equal to Length of Beam.")
                return
            }
        }
        // Check that left and right ends of the load are in-bounds, for long loads.
        else {
            // While the form is open, newLoadData.location refers to the middle of the load instead of the left end.
            let leftEnd = newLoadData.location - newLoadData.length / 2
            if(leftEnd < 0) {
                setAddEditFormWarning("Left end of load is out of bounds (Location is " + leftEnd + ", must be at least 0).")
                return
            }
            let rightEnd = newLoadData.location + newLoadData.length / 2
            if(rightEnd > beamProperties.length){
                setAddEditFormWarning("Right end of load is out of bounds (Location is " + rightEnd + ", must be less than or equal to Length of Beam).")
                return
            }
        }

        // No errors.
        setAddEditFormWarning("")
    }


    // When Delete Load button is clicked
    function handleDelete(){
        delete loads[selectedLoad]

        // Switch selectedLoad to the first available load
        for(let load in loads){
            setSelectedLoad(load)
            break
        }

        reRender()
    }
    // When using the load selector dropdown or properties form radio buttons to change selected load
    function handleSelectedChange(event){
        setSelectedLoad(event.target.value)
    }
    // When clicking an arrow, line, or label corresponding to a load to change selected load
    function handleLoadClick(element){
        setSelectedLoad(element.loadID)
    }
    // Move the selected load
    function moveSelectedLoad(disp,mag,tl){
        if(!(selectedLoad in loads))
            return
        let newLoc = loads[selectedLoad].location + disp
        // Round off floating point
        newLoc = formatVal(newLoc)(newLoc)
        // Constrain newLoc to be in-bounds
        newLoc = Math.max(newLoc, 0)
        newLoc = Math.min(newLoc, beamProperties.length - loads[selectedLoad].length)
        loads[selectedLoad].location = newLoc

        reRender()
    }


    // Returns LineSeries plot points for deflection diagram. Also updates the scale for the plot.
    function deflectionDiagram() {
        // Get data points for deflection plot
        let plotData = plotSum(deflectionSingleLoad, loads, beamProperties, supportProperties)

        // Update plot scale if needed
        let newScale = getScale(plotData)
        if(newScale != deflectionScale)
            setDeflectionScale(newScale)

        return plotData
    }
    // Returns LineSeries plot points for bending moment diagram. Also updates the scale for the plot.
    function bendingMomentDiagram() {
        // Get data points for bending moment plot
        let plotData = plotSum(bendingMomentSingleLoad, loads, beamProperties, supportProperties)

        // Update plot scale if needed
        let newScale = getScale(plotData)
        if(newScale != bendingMomentScale)
            setBendingMomentScale(newScale)

        return plotData
    }
    // Returns LineSeries plot points for shear force diagram. Also updates the scale for the plot.
    function shearForceDiagram() {
        // Get data points for shear force plot
        let plotData = plotSum(shearForceSingleLoad, loads, beamProperties, supportProperties)

        // Update plot scale if needed
        let newScale = getScale(plotData)
        if(newScale != shearForceScale)
            setShearForceScale(newScale)

        return plotData
    }
    
    // Display the properties form
    if(openPropertiesForm){
        return(
            <form onKeyDown={handleKeyDown} onSubmit={handleSubmitPropertiesForm} ref={propertiesFormRef} tabIndex="0">
                <h1>CARL</h1>
                {/* Enter beam properties */}
                <div>
                    <h3 style={{marginBottom: 0}}>Beam Properties</h3>
                    <label>Length of Beam:
                        <input type="text"
                            defaultValue={beamProperties.length}
                            onChange={(e) => {
                                beamProperties.length = e.target.value
                                validateInputsPropertiesForm()
                            }}
                        />
                    </label>
                    <div></div>
                    <label>Elasticity:
                        <input type="text"
                            defaultValue={beamProperties.elasticity}
                            onChange={(e) => {
                                beamProperties.elasticity = e.target.value
                                validateInputsPropertiesForm()
                            }}
                        />
                    </label>
                    <div></div>
                    <label>Inertia:
                        <input type="text"
                            defaultValue={beamProperties.inertia}
                            onChange={(e) => {
                                beamProperties.inertia = e.target.value
                                validateInputsPropertiesForm()
                            }}
                        />
                    </label>
                    <div></div>
                    <label>Density:
                        <input type="text"
                            defaultValue={beamProperties.density}
                            onChange={(e) => {
                                beamProperties.density = e.target.value
                                validateInputsPropertiesForm()
                            }}
                        />
                    </label>
                    <div></div>
                    <label>Area:
                        <input type="text"
                            defaultValue={beamProperties.area}
                            onChange={(e) => {
                                beamProperties.area = e.target.value
                                validateInputsPropertiesForm()
                            }}
                        />
                    </label>
                    <div></div>
                    <label>Damping Ratio:
                        <input type="text"
                            defaultValue={beamProperties.dampingRatio}
                            onChange={(e) => {
                                beamProperties.dampingRatio = e.target.value
                                validateInputsPropertiesForm()
                            }}
                        />
                    </label>
                    <div></div>
                    <label>rA:
                        <input type="text"
                            defaultValue={beamProperties.rA}
                            onChange={(e) => {
                                beamProperties.rA = e.target.value
                                validateInputsPropertiesForm()
                            }}
                        />
                    </label>
                    <div></div>
                    <label>EI:
                        <input type="text"                            
                            defaultValue={beamProperties.EI}
                            onChange={(e) => {
                                beamProperties.EI = e.target.value
                                validateInputsPropertiesForm()
                            }}
                        />
                    </label>
                    <div></div>
                    <label>Gravity:
                        <input type="text"
                            defaultValue={beamProperties.gravity}
                            onChange={(e) => {
                                beamProperties.gravity = e.target.value
                                validateInputsPropertiesForm()
                            }}
                        />
                    </label>
                </div>
                {/* Enter support properties */}
                <div>
                    <h3 style={{marginBottom: 0}}>Support Properties</h3>
                    {/* Support type radio button selection */}
                    <RadioGroup
                        value={supportProperties.type}
                        onChange={(val)=>{
                            supportProperties.type = val.target.value
                            validateInputsPropertiesForm()
                            reRender()
                        }}
                        sx={{display:'inline-flex'}}
                        row
                    >
                        <FormControlLabel control={<Radio />} value="Simply Supported" label="Simply Supported" />
                        <FormControlLabel control={<Radio />} value="Cantilever" label="Cantilever" />
                    </RadioGroup>
                    <div></div>
                    <label>Pinned Support Position:
                        <input type="text"
                            defaultValue={supportProperties.pinnedSupportPosition}
                            onChange={(e)=>{
                                supportProperties.pinnedSupportPosition=e.target.value
                                validateInputsPropertiesForm()
                            }}
                            disabled={supportProperties.type !== "Simply Supported"}
                        />
                    </label>
                    <div></div>
                    <label>Roller Support Position:
                        <input type="text"
                            defaultValue={supportProperties.rollerSupportPosition}
                            onChange={(e)=>{
                                supportProperties.rollerSupportPosition=e.target.value
                                validateInputsPropertiesForm()
                            }}
                            disabled={supportProperties.type !== "Simply Supported"}
                        />
                    </label>
                </div>
                {/* Enter loads */}
                <div>
                    {/* Load list with radio button selection */}
                    <h3 style={{marginBottom: 0}}>List of Loads</h3>
                    <RadioGroup
                        value={selectedLoad}
                        onChange={handleSelectedChange}
                        sx={{display:'inline-flex'}}
                    >
                        {loadRadioButtonsCreator(loads)}
                    </RadioGroup>
                    <div>
                        {/* Add, Edit, Delete Load buttons */}
                        <Button variant="outlined" sx={{width:135}} onClick={handleClickAdd}>Add Load</Button>
                        <Button variant="outlined" sx={{width:135}} onClick={handleClickEdit} disabled={Object.keys(loads).length === 0}>Edit Load</Button>
                        <Button variant="outlined" sx={{width:135}} onClick={handleDelete} disabled={Object.keys(loads).length === 0}>Delete Load</Button>
                        {/* Add/Edit Load form */}
                        <AddEditForm
                            open={openAddEditForm} 
                            mode={addEditMode}
                            handleClose={handleCloseAddEditForm}
                            newLoadData={newLoadData}
                            validate={validateInputsAddEditForm}
                            warning={addEditFormWarning}
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
                <div style={{height:window.innerHeight - 100, overflowX:"clip", overflowY:"auto"}}>
                    <h1>CARL</h1>
                    {/* Main Plot */}
                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} xDomain={[0,beamProperties.length]} yDomain={[-100, 100]} margin = {{left : 60, right:60}}>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis tickFormat={formatVal(beamProperties.length)} title = {"Load Locations"}/>
                        <YAxis hideTicks/>
                        {/* Display the beam line. */}
                        <LineSeries data = {[{x: 0, y: 0}, {x: beamProperties.length, y: 0}]} />
                        {/* Display the supports. */}
                        {
                            (supportProperties.type === "Simply Supported")
                            ?
                                // Simply Supported supports
                                <LabelSeries data={[{x: supportProperties.pinnedSupportPosition, y: -11, label: "\u25b2", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}},
                                                    {x: supportProperties.rollerSupportPosition, y: -11, label: "\u2b24", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}}]} />
                            :
                                // Cantilever support
                                getCantileverSupportDisplay()
                        }
                        {/* Display the loads. */}
                        <LabelSeries data={labelMakerForLoads(loads,selectedLoad,beamProperties)} onValueClick={handleLoadClick} />
                        {/* Display the line parts of distributed and triangular loads. */}
                        {Object.entries(loads).map(([loadName, load]) => {
                            // Distributed load line
                            if(load.type==="Distributed")
                                return (
                                    <LineSeries 
                                        data={[{x: load.location, y: 8}, {x: (load.location+load.length), y: 8}]}
                                        onSeriesClick={() => {setSelectedLoad(loadName)}}
                                        key={[loadName,load]}
                                        color={load.color}
                                        strokeWidth={3}
                                    />
                                )
                            // Triangular load lines
                            else if(load.type==="Triangular") {
                                // Left-taller triangle
                                if(load.tallerEnd==="Left")
                                    return (
                                        <LineSeries
                                            data={[{x: load.location, y: 8}, {x: load.location, y: 20}, {x: (load.location+load.length), y: 8}, {x: load.location, y: 8}]}
                                            onSeriesClick={() => {setSelectedLoad(loadName)}}
                                            key={[loadName,load]}
                                            color={load.color}
                                            strokeWidth={3}
                                        />
                                    )
                                // Right-taller triangle
                                else
                                    return (
                                        <LineSeries
                                            data={[{x: load.location, y: 8}, {x: (load.location+load.length), y: 20}, {x: (load.location+load.length), y: 8}, {x: load.location, y: 8}]}
                                            onSeriesClick={() => {setSelectedLoad(loadName)}}
                                            key={[loadName,load]}
                                            color={load.color}
                                            strokeWidth={3}
                                        />
                                    )
                            }
                        })}
                    </XYPlot>
                    {/* Load Selection dropdown */}
                    <LoadSelector loadList={loads} value={selectedLoad} onChange={handleSelectedChange} />
                    <div>
                        {/* Add, Edit, Delete Load buttons */}
                        <Button variant="outlined" sx={{width:135}} onClick={handleClickAdd}>Add Load</Button>
                        <Button variant="outlined" sx={{width:135}} onClick={handleClickEdit} disabled={Object.keys(loads).length === 0}>Edit Load</Button>
                        <Button variant="outlined" sx={{width:135}} onClick={handleDelete} disabled={Object.keys(loads).length === 0}>Delete Load</Button>
                        {/* Add/Edit Load form */}
                        <AddEditForm
                            open={openAddEditForm} 
                            mode={addEditMode}
                            handleClose={handleCloseAddEditForm}
                            newLoadData={newLoadData}
                            validate={validateInputsAddEditForm}
                            warning={addEditFormWarning}
                        />
                    </div>
                    <div>
                        {/* Control buttons */}
                        <Button variant="contained" sx={{margin: 0.5}} onClick={()=>{moveSelectedLoad(-beamProperties.length/100,1,10)}}>&#8592;</Button>
                        <Button variant="contained" sx={{margin: 0.5}} onClick={()=>{moveSelectedLoad(0,5,10)}}>JUMP</Button>
                        <Button variant="contained" sx={{margin: 0.5}} onClick={()=>{moveSelectedLoad(beamProperties.length/100,1,10)}}>&#8594;</Button>
                    </div>
                    <Button variant="contained" sx={{margin:0.5}} onClick={handleClickProperties}>Edit Properties</Button>
                    <div></div>
                    <Button variant="contained" sx={{margin:0.5}} onClick={handleClickHelp}>Help</Button>
                    <Dialog open={openHelpMenu} onClose={()=>setOpenHelpMenu(false)}>
                        <DialogContent>
                            
                            <Table sx={{minWidth: 500}}>
                                <TableHead>Keyboard Shortcuts</TableHead>
                                <TableBody>{[
                                    ["Left/Right Arrows:", "Move Selected Load"],
                                    ["Up Arrow:", "Jump"],
                                    ["Shift + Insert:", "Add Load"],
                                    ["Shift + Enter:", "Edit Selected Load"],
                                    ["Shift + Delete:", "Delete Selected Load"],
                                    ["Esc:", "Edit Properties"]].map(row=>
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
                {/* Right Column */}
                <div style={{height:window.innerHeight - 100, overflowX:"clip", overflowY:"auto"}}>
                    <h1>Plots</h1>
                    {/* Deflection Diagram */}
                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[deflectionScale, deflectionScale]} margin = {{left:60, right:60}}>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis tickFormat = {formatVal(beamProperties.length)} title = {"Deflection Diagram and Support Reactions"}/>
                        <YAxis tickFormat = {formatVal(deflectionScale)}/>
                        <LineSeries data = {[{x : 0, y : 0},{x : beamProperties.length,y : 0}]} />
                        <LineSeries data={deflectionDiagram()}/>
                        {/* Include reactions in deflection plot */}
                        <LabelSeries data={plotReactions(loads, beamProperties, supportProperties, deflectionScale)} />
                    </XYPlot>
                    {/* Bending Moment Diagram */}
                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[bendingMomentScale, bendingMomentScale]} margin = {{left:60, right:60}}>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis tickFormat = {formatVal(beamProperties.length)} title = {"Bending Moment Diagram"}/>
                        <YAxis tickFormat = {formatVal(bendingMomentScale)}/>
                        <LineSeries data = {[{x : 0, y : 0},{x : beamProperties.length,y : 0}]} />
                        <LineSeries data={bendingMomentDiagram()} color="black"/>
                    </XYPlot>
                    {/* Shear Force Diagram */}
                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[shearForceScale, shearForceScale]} margin = {{left:60, right:60}}>
                        {/*<h1>Shear Force Diagram</h1>*/}
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis tickFormat = {formatVal(beamProperties.length)} title = {"Shear Force Diagram"}/>
                        <YAxis tickFormat = {formatVal(shearForceScale)}/>
                        <LineSeries data = {[{x : 0, y : 0},{x : beamProperties.length,y : 0}]} />
                        <LineSeries data={shearForceDiagram()} color="red"/>
                    </XYPlot>
                </div>
            </div>
        )
    }
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
function labelMakerForLoads(loads, selectedLoad, beamProperties){
    var data = []
    for(let [loadName,load] of Object.entries(loads)){
        // Check if the load is a point load, and if it is the selected load.
        let isPoint = load.type === "Point"
        let isSelected = loadName === selectedLoad

        // xLoc is the center of the load. It serves as the location for labels, and the x coordinate users see for loads.
        let xLoc = load.location + load.length/2

        // For selected load, the stats will be labelled with letters. For non-point loads, length will be included.
        let statsLabel = (isSelected?"x=":"") + xLoc + ", " + (isSelected?"m=":"") + load.mass
        if(load.type !== "Point")
            statsLabel += ", " + (isSelected?"L=":"") + load.length

        // Load name and stats labels. For point loads it will be 10 units higher.
        data.push({x: xLoc, y: isPoint?35:25, label: loadName, loadID: loadName, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        data.push({x: xLoc, y: isPoint?30:20, label: statsLabel, loadID: loadName, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})

        // Point Loads have a big arrow, distributed loads have mini arrows
        if(load.type === "Point")
            data.push({x: xLoc, y: -5, label: "\u2193", loadID: loadName, style: {fontSize: 45, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        else
            getDistributedLoadMiniArrows(data, loadName, load, beamProperties.length)
    }
    return data
}

/**
 * Function for adding mini arrows under the distributed loads.
 * Loads will have at least one arrow per 5 units, and always have an arrow on each end. 
 * The arrows match the color and loadID of the load.
 * 
 * array is the data array for a LabelSeries that will display these arrows.
 * pos and len are the position and length of the load.
 * color is the color of the load line, so that the arrows can match that color.
 * loadID is the name of the load that these arrows belong to. It is part of allowing users to click on these arrows to select the load to move/delete it.
 */
function getDistributedLoadMiniArrows(data, loadName, load, beamLen){
    let numArrows = Math.floor(load.length / beamLen * 20) + 1
    // Evenly spaced
    for(let i = 0; i <= numArrows; i++) {
        let x = load.location + (i/numArrows) * load.length
        data.push({x: x, y: -3, label: "\u2193", loadID: loadName, style: {fontSize: 25, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle", fill: load.color}})
    }
}

// Function for adding the cantilever support visual display.
function getCantileverSupportDisplay() {
    let support = []
    support.push(<LineSeries data = {[{x : 0, y : -10}, {x : 0, y : 10}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : 10}, {x : -2, y : 6}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : 6}, {x : -2, y : 2}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : 2}, {x : -2, y : -2}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : -2}, {x : -2, y : -6}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : -6}, {x : -2, y : -10}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : 10}, {x : -2, y : 10}]} color = "#12939A"/>)
    support.push(<LineSeries data = {[{x : 0, y : -10}, {x : -2, y : -10}]} color = "#12939A"/>)
    return support
}

// Plot the reactions, R1 and R2.
function plotReactions(loads, beamProperties, supportProperties, scale){
    let R1 = 0
    let R2 = 0
    Object.values(loads).forEach(load => {
        R1 += R1SingleLoad(load, beamProperties, supportProperties)
        R2 += R2SingleLoad(load, beamProperties, supportProperties)
    })

    let reactionLabels = []
    // Left side reaction label (R1)
    reactionLabels.push({x: 2.5/100 * beamProperties.length, y: -40/100 * scale, label: formatVal(R1)(R1), style: {fontSize: 15, textAnchor: "middle"}})
    reactionLabels.push({x: 2.5/100 * beamProperties.length, y: -35/100 * scale, label: "\u2191", style: {fontSize: 35, textAnchor: "middle"}})
    // Right side reaction label (R2), only for Simply Supported
    if(supportProperties.type === "Simply Supported") {
        reactionLabels.push({x: 97.5/100 * beamProperties.length, y: -40/100 * scale, label: formatVal(R2)(R2),  style: {fontSize: 15, textAnchor: "middle"}})
        reactionLabels.push({x: 97.5/100 * beamProperties.length, y: -35/100 * scale, label: "\u2191", style: {fontSize: 35, textAnchor: "middle"}})
    }
    return reactionLabels
}

function R1SingleLoad(load, beamProperties, supportProperties){
    // Get relevant variables
    let F = load.mass * beamProperties.gravity
    let X = load.location
    let L = load.length
    let Lb = beamProperties.length

    let R1 = 0
    if(load.type === "Point") {
        if(supportProperties.type === "Cantilever")
            R1 = F
        else
            R1 = F/Lb * (Lb - X)
    }
    else if(load.type === "Distributed") {
        if(supportProperties.type === "Cantilever")
            R1 = F*L
        else
            R1 = F*L/Lb * (Lb - X - L/2)
    }
    else if(load.type === "Triangular") {
        if(supportProperties.type === "Cantilever")
            R1 = F*L
        else
            R1 = F*L/Lb * (Lb - X - L/2)
    }
    return R1
}

// R1 + R2 = F (or F*L for distributed load)
function R2SingleLoad(load, beamProperties, supportProperties) {
    // Get relevant variables
    let F = load.mass * beamProperties.gravity
    let L = load.length
    
    let R2 = 0
    if(load.type === "Point")
        R2 = F - R1SingleLoad(load, beamProperties, supportProperties)
    else if(load.type === "Distributed")
        R2 = F*L - R1SingleLoad(load, beamProperties, supportProperties)
    else if(load.type === "Triangular")
        R2 = F*L - R1SingleLoad(load, beamProperties, supportProperties)
    return R2
}

// Takes a function that applies to a single load, returns a list of data points for plotting the sum of that function applied to every load.
// The singleLoadFunction can return a value, or a 2-element array for instantaneous change.
// The first element of the array will connect to the line plot to the left, and the second element will connect to the right.
function plotSum(singleLoadFunction, loads, beamProperties, supportProperties) {
    // The list of x-values which the y-values will be calculated for. The resulting points will be connected in a line plot later.
    const xValues = []
    // Add every 100th of the beam, and the ends of each load (for point loads the ends are equal)
    for(let i = 0; i <= 100; i++)
        xValues.push((i/100)*beamProperties.length)
    Object.values(loads).forEach(load => 
        xValues.push(load.location, load.location+load.length)
    )
    // Sort the x values (else the line plot would go back and forth in the x direction)
    xValues.sort((a,b)=>(a > b)? 1 : -1)

    // Calculate y values.
    let plotData = []
    xValues.forEach(xValue => {
        // Before and after variables in case of instantaneous change
        let yValueBefore = 0
        let yValueAfter = 0
        Object.values(loads).forEach(load => {
            let singleYValue = singleLoadFunction(xValue, load, beamProperties, supportProperties)
            if(Array.isArray(singleYValue)) {
                yValueBefore += singleYValue[0]
                yValueAfter += singleYValue[1]
            }
            else {
                yValueBefore += singleYValue
                yValueAfter += singleYValue
            }
        })
        plotData.push({x:xValue, y:yValueBefore}, {x:xValue, y:yValueAfter})
    })
    return plotData
}

// Integral of integral of bending moment. 
// For cantilever, deflection and d/dx deflection are 0 at x=0.
// For simply supported beam, deflection is 0 at x=0 and x=beam length.
function deflectionSingleLoad(x, load, beamProperties, supportProperties) {
    // Get relevant variables
    let F = load.mass * beamProperties.gravity
    let X = load.location
    let L = load.length
    let Lb = beamProperties.length
    let EI = beamProperties.EI

    let y = 0
    if(load.type === "Point") {
        if(x < X)
            y = (x**3-3*x**2*X) / 6
        else
            y = (X**3-3*X**2*x) / 6

        if(supportProperties.type === "Simply Supported")
            y += (-2*Lb**2*X*x + 3*Lb*X*x**2 + 3*Lb*x*X**2 - X*x**3 - x*X**3) / 6 / Lb
    }
    else if(load.type === "Distributed") {
        if(x < X)
            y = (-3*L**2*x**2 - 6*L*X*x**2 + 2*L*x**3) / 12
        else if(x < X + L)
            y = (-1*(X-x)**4 - 6*L**2*x**2 - 12*L*X*x**2 + 4*L*x**3) / 24
        else
            y = ((L+X)**4 - X**4 - 4*L**3*x - 12*L**2*X*x - 12*L*X**2*x) / 24

        if(supportProperties.type === "Simply Supported")
            y += (x*X**4 - x*(L+X)**4 -2*L**2*x**3 - 4*L*x**3*X - 4*L**2*Lb**2*x + 4*L**3*Lb*x + 6*L**2*Lb*x**2 - 8*L*Lb**2*x*X + 12*L**2*Lb*x*X + 12*L*Lb*x*X**2 + 12*L*Lb*X*x**2) / 24 / Lb
    }
    else if(load.type === "Triangular") {
        if(x < X)
            y = (-3*L**2*x**2 - 6*L*X*x**2 + 2*L*x**3) / 12
        else if(x < X + L)
            y = (-1*(X-x)**4 - 6*L**2*x**2 - 12*L*X*x**2 + 4*L*x**3) / 24
        else
            y = ((L+X)**4 - X**4 - 4*L**3*x - 12*L**2*X*x - 12*L*X**2*x) / 24

        if(supportProperties.type === "Simply Supported")
            y += (x*X**4 - x*(L+X)**4 -2*L**2*x**3 - 4*L*x**3*X - 4*L**2*Lb**2*x + 4*L**3*Lb*x + 6*L**2*Lb*x**2 - 8*L*Lb**2*x*X + 12*L**2*Lb*x*X + 12*L*Lb*x*X**2 + 12*L*Lb*X*x**2) / 24 / Lb
    }

    y *= F / EI

    // Prevent floating point errors when there is only 1 point mass and it's on top of a supported end of the beam. It should be 0 but sometimes floating point errors happen here.
    if(Math.abs(y) < 10**-18)
        y = 0

    return y
}

// Integral of shear force. Bending moment is 0 at x=beam length, for both support types.
function bendingMomentSingleLoad(x, load, beamProperties, supportProperties) {
    // Get relevant variables
    let F = load.mass * beamProperties.gravity
    let X = load.location
    let L = load.length
    let Lb = beamProperties.length

    let y = 0
    if(load.type === "Point") {
        if(x < X)
            y = F * (x - X)
        else
            y = 0

        if(supportProperties.type === "Simply Supported")
            y -= F * X / Lb * (x-Lb)
    }
    else if(load.type === "Distributed") {
        if(x < X)
            y = F * L * (x-X-L/2)
        else if(x < X + L)
            y = F * (L*x - X*L + X*x - (L**2+X**2+x**2)/2)
        else
            y = 0
        
        if(supportProperties.type === "Simply Supported")
            y -= F * L * (2*X+L) / 2 / Lb * (x-Lb)
    }
    else if(load.type === "Triangular") {
        if(x < X)
            y = F * L * (x-X-L/2)
        else if(x < X + L)
            y = F * (L*x - X*L + X*x - (L**2+X**2+x**2)/2)
        else
            y = 0
        
        if(supportProperties.type === "Simply Supported")
            y -= F * L * (2*X+L) / 2 / Lb * (x-Lb)
    }
    return y
}

function shearForceSingleLoad(x, load, beamProperties, supportProperties) {
    // Get relevant variables
    let X = load.location
    let F = load.mass * beamProperties.gravity
    let L = load.length
    let Lb = beamProperties.length

    let y = 0
    if(load.type === "Point") {
        if(x < X)
            y = F
        else if(x == X)
            // Array represents instantaneous change in y
            y = [F,0]
        else
            y = 0

        // For Cantilever, shear force at x=0 is F. For Simply Supported, it is something else, and the whole graph is translated down.
        if(supportProperties.type === "Simply Supported") {
            if(Array.isArray(y)) {
                y[0] -= F * X / Lb
                y[1] -= F * X / Lb
            }
            else
                y -= F * X / Lb
        }
    }
    else if(load.type === "Distributed") {
        if(x < X)
            y = F * L
        else if(x < X + L)
            y = F * (X + L - x)
        else
            y = 0
        
        // For Cantilever, shear force at x=0 is F*L. For Simply Supported, it is something else, and the whole graph is translated down.
        if(supportProperties.type === "Simply Supported")
            y -= F * L * (2*X+L) / 2 / Lb
    }
    else if(load.type === "Triangular") {
        if(x < X)
            y = F * L
        else if(x < X + L)
            y = F * (X + L - x)
        else
            y = 0
        
        // For Cantilever, shear force at x=0 is F*L. For Simply Supported, it is something else, and the whole graph is translated down.
        if(supportProperties.type === "Simply Supported")
            y -= F * L * (2*X+L) / 2 / Lb
    }
    return y
}

// Find a scale for the y axis that comfortably fits the graph.
function getScale(dataList) {
    // Find the biggest absolute value in datalist
    let maxAbsVal = 0
    dataList.forEach(dataPoint =>
        maxAbsVal = Math.max(maxAbsVal, Math.abs(dataPoint.y))
    )
    
    // If the line is all 0, scale will be 1
    if(maxAbsVal == 0)
        return 1

/*
    // Else, the scale will be the smallest power of 2 greater than maxAbsVal
    let scale = 1
    while(scale > maxAbsVal)
        scale /= 2
    while(scale < maxAbsVal)
        scale *= 2

    return scale
*/
    
    return maxAbsVal * 1.5
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

// Function to pick the first unoccupied load name like load1, load2, load3...
function loadNamer(loads){
    let i = 1
    while(true){
        let name = "Load " + i
        if(!(name in loads))
            return name
        i++
    }
}

// Radio buttons displaying list of loads in the properties form
function loadRadioButtonsCreator(loads){
    let labels = []
    for(let load in loads)
        labels.push(<FormControlLabel control={<Radio/>}
            value={load}
            key={load}
            label={"Name = " + load + 
                ", Type = " + loads[load].type + 
                ": Location = " + (loads[load].location + loads[load].length / 2) + 
                ", Mass = " + loads[load].mass + 
                (loads[load].type!=="Point" ? ", Length = " + loads[load].length : "") + 
                (loads[load].type==="Triangular" ? ", Taller End = " + loads[load].tallerEnd : "")}
        />)
    return labels
}

// Generates a random color with RGBs in the range 0-159, opacity 50%.
function randomColor() {
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
    "#" + R + G + B + "80"
}

export default CombinedLoadApp