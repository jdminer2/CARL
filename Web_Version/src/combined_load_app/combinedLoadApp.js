import '../App.css'
import React, { useEffect, useState} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField} from '@mui/material'
import LoadSelector from '../components/LoadSelector';
import {HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis} from "react-vis";
import {inv, max, multiply} from "mathjs";
import { letterSpacing } from '@mui/system';


function CombinedLoadApp(){

    const butStyle = {background: "black", height:window.innerHeight/12,
        width:window.innerWidth/10 ,borderRadius: 8, color: "white"}
    const [beamProperties,setBeamProperties] = useState({supportType: "Simply Supported", length: 100, elasticity: 1.0, inertia: 1.0, density: 1.0, area: 1.0, dampingRatio:0.02, rA: 85000.0, EI: 210000000000.0, mass:10.0, gravity:9.8})
    const [onceLoaded, setOnceLoaded] = useState(false)
    const [isBeamIni, setIsBeamIni] = useState(false)
    const [loads,setLoads] = useState({})
    const [selectedLoad, setSelectedLoad] = useState('load1')
    const [loadUpdated, setLoadUpdated] = useState(false)
    const [newLoadData, setNewLoadData] = useState({name:loadNamer(), mass:10.0, location:beamProperties.length / 2, type:"Point", length:0, color:"#00000080"})
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [initialFormWarning, setInitialFormWarning] = useState("");
    const [loadFormWarning, setLoadFormWarning] = useState("");
    const [hideLengthField, setHideLengthField] = useState(true);
    const [deflectionScale, setDeflectionScale] = useState(1);
    const [bendingMomentScale, setBendingMomentScale] = useState(1);
    const [shearForceScale, setShearForceScale] = useState(1);
    const [render, reRender] = useState(true);

    // This helps the window automatically focus on the XYPlot, so users don't need to click on the screen before using keyboard controls to move loads.
    const focusRef = React.useRef(null);
    useEffect(()=>{
        if(focusRef.current !== null)
            focusRef.current.focus();
    }, [onceLoaded]);

    // This makes the XYPlots scale when the user resizes the window.
    const [windowSize, setWindowSize] = useState({height:window.innerHeight, width:window.innerWidth});
    useEffect(() => {
        window.addEventListener("resize", () =>
            setWindowSize({height:window.innerHeight, width:window.innerWidth})
        )
        return () => 
            window.removeEventListener("resize", setWindowSize({height:window.innerHeight, width:window.innerWidth}))
    },[window.innerHeight, window.innerWidth]);

    const handleClickOpenAdd = () => {
        // Pick a random color, in the range #000000 to #9F9F9F, always opacity 50%.
        let newR = Math.floor(Math.random() * 160).toString(16);
        if(newR.length < 2)
            newR = "0"+newR;
        let newG = Math.floor(Math.random() * 160).toString(16);
        if(newG.length < 2)
            newG = "0"+newG;
        let newB = Math.floor(Math.random() * 160).toString(16);
        if(newB.length < 2)
            newB = "0"+newB;
        let color = "#" + newR + newG + newB + "80";
        setNewLoadData({name:loadNamer(), mass:10.0, location:beamProperties.length / 2, type:"Point", length:0, color:color});
        setHideLengthField(true);
        console.log(newLoadData.color);
        setOpenAdd(true);
    };
    const handleClickOpenEdit = () => {
        setNewLoadData({name:selectedLoad, mass:loads[selectedLoad].mass, location:loads[selectedLoad].location + loads[selectedLoad].length / 2, type:loads[selectedLoad].type, length:loads[selectedLoad].length, color:loads[selectedLoad].color});
        setHideLengthField(loads[selectedLoad].type === "Point");
        setOpenEdit(true);
    };

    /**
     * Function is executed upon closing the Add Load menu either by Canceling or Confirming.
     * This function creates a new load.
     */
    const handleCloseAdd = (event) => {
        // If closed via cancel button or clicking outside, do nothing.
        if(event !== "confirm"){
            setOpenAdd(false);
            setLoadFormWarning("");
            return;
        }
        // Check if errors are present
        validateInputsLoadForm(true);
        if(loadFormWarning !== "")
            return;
        // If closed via confirm button, create a new load.
        if(newLoadData.type === "Point")
            newLoadData.length = 0;
        loads[newLoadData.name] = {mass:newLoadData.mass, location:(newLoadData.location - newLoadData.length / 2), type:newLoadData.type, length:newLoadData.length, color:newLoadData.color};
        setSelectedLoad(newLoadData.name);
        setLoadUpdated(true);
        setOpenAdd(false);
        setLoadFormWarning("");
    };
    /**
     * Function is executed upon closing the Edit Load menu either by Canceling or Confirming.
     * This function modifies an existing load.
     */
    const handleCloseEdit = (event) => {
        // If closed via cancel button or clicking outside, do nothing.
        if(event !== "confirm"){
            setOpenEdit(false);
            setLoadFormWarning("");
            return;
        }
        // Check if errors are present
        validateInputsLoadForm(false);
        if(loadFormWarning !== "")
            return;
        // If closed via confirm button, replace new load stats except color.
        if(newLoadData.type === "Point")
            newLoadData.length = 0;
        for(let load in loads) {
            // This is done to preserve the ordering of the loads list.
            if(load !== selectedLoad) {
                let mass = loads[load].mass;
                let location = loads[load].location;
                let type = loads[load].type;
                let length = loads[load].length;
                let color = loads[load].color;
                delete loads[load];
                loads[load] = {mass:mass, location:location, type:type, length:length, color:color}
            }
            else {
                delete loads[load];
                loads[newLoadData.name] = {mass:newLoadData.mass, location:(newLoadData.location - newLoadData.length / 2), type:newLoadData.type, length:newLoadData.length, color:newLoadData.color};
                setSelectedLoad(newLoadData.name);
                setLoadUpdated(true);
                setOpenEdit(false);
                setLoadFormWarning("");
            }
        }
        validateInputsInitialForm();
    };
        useEffect(()=>{if(loadUpdated === false){return;}
            setLoadUpdated(false);loadNamer();dataMakerForLoads(loads,selectedLoad,beamProperties)},[loadUpdated,dataMakerForLoads])

    // Function to pick the first unoccupied load name like load1, load2, load3...
    function loadNamer(){
        var n = 1;
        var name = ""
        while(true){
            name = "Load " + n;
            console.log(name in loads)
            if(name in loads){
                n += 1;
                continue;
            }
            break;
        }
        return name;
    }

    function deleteLoad(){
        delete loads[selectedLoad];

        for(let load in loads){
            setSelectedLoad(load)
            break;
        }
        setLoadUpdated(true)
        validateInputsInitialForm();
    }

    // Function for when you click on a load, selects that load.
    function loadSwitcher(d,event){
        console.log("got called in load switcher")
        console.log(d)
        for(let load in loads){
            if(load === d.loadID){
                console.log("load was selected")
                setSelectedLoad(load)
                break;
            }
        }
    }
    function playerMovement(disp,mag,tl){
        if(!(selectedLoad in loads)){
            return
        }
        // Prevent player from moving out of bounds.
        let newLoc = loads[selectedLoad].location + disp;
        let loadLength = 0;
        if(loads[selectedLoad].type === "Distributed")
            loadLength = loads[selectedLoad].length;
        if(newLoc < 0)
            newLoc = 0;
        else if(newLoc + loadLength > beamProperties.length)
            newLoc = beamProperties.length - loadLength;
        loads[selectedLoad].location = newLoc;
        setLoadUpdated(true)
    }

    /**
     * Function allowing users to use the left, jump, and right features by pressing Arrow keys.
     */
    function handleKeyDown(event){
        // Don't mess with anything while forms are open.
        if(openAdd || openEdit)
            return;
        // Prevent arrow keys from scrolling the screen.
        if([37,38,39,40].includes(event.keyCode))
            event.preventDefault();
        // Left arrow key.
        if(event.keyCode == 37)
            playerMovement(-1,1,10);
        // Up arrow key (Jump).
        else if(event.keyCode == 38)
            playerMovement(0,5,10);
        // Right arrow key.
        else if(event.keyCode == 39)
            playerMovement(1,1,10);
    }

    /**
     * This function checks the initial form inputs to ensure that they are valid. 
     * All inputs must be nonnegative numbers. Beam length and EI must be nonzero. 
     * Load location must be less than or equal to beam length.
     * This function also converts the string inputs into number inputs.
     */
     function validateInputsInitialForm(){
        // Check that length is a number > 0.
        if(parseFloat(beamProperties.length) != beamProperties.length){
            setInitialFormWarning("Length of Beam must be a number.");
            return;
        }
        beamProperties.length = Number(beamProperties.length);
        if(beamProperties.length <= 0) {
            setInitialFormWarning("Length of Beam must be greater than 0.");
            return;
        }

        // Check that elasticity is a number >= 0
        if(parseFloat(beamProperties.elasticity) != beamProperties.elasticity){
            setInitialFormWarning("Elasticity must be a number.");
            return;
        }
        beamProperties.elasticity = Number(beamProperties.elasticity);
        if(beamProperties.elasticity < 0) {
            setInitialFormWarning("Elasticity must be at least 0.");
            return;
        }

        // Check that inertia is a number >= 0.
        if(parseFloat(beamProperties.inertia) != beamProperties.inertia){
            setInitialFormWarning("Inertia must be a number.");
            return;
        }
        beamProperties.inertia = Number(beamProperties.inertia);
        if(beamProperties.inertia < 0) {
            setInitialFormWarning("Inertia must be at least 0.");
            return;
        }

        // Check that density is a number >= 0.
        if(parseFloat(beamProperties.density) != beamProperties.density){
            setInitialFormWarning("Density must be a number.");
            return;
        }
        beamProperties.density = Number(beamProperties.density);
        if(beamProperties.density < 0) {
            setInitialFormWarning("Density must be at least 0.");
            return;
        }

        // Check that area is a number >= 0.
        if(parseFloat(beamProperties.area) != beamProperties.area){
            setInitialFormWarning("Area must be a number.");
            return;
        }
        beamProperties.area = Number(beamProperties.area);
        if(beamProperties.area < 0) {
            setInitialFormWarning("Area must be at least 0.");
            return;
        }


        // Check that damping ratio is a number >= 0.
        if(parseFloat(beamProperties.dampingRatio) != beamProperties.dampingRatio){
            setInitialFormWarning("Damping Ratio must be a number.");
            return;
        }
        beamProperties.dampingRatio = Number(beamProperties.dampingRatio);
        if(beamProperties.dampingRatio < 0) {
            setInitialFormWarning("Damping Ratio must be at least 0.");
            return;
        }


        // Check that rA is a number >= 0.
        if(parseFloat(beamProperties.rA) != beamProperties.rA){
            setInitialFormWarning("rA must be a number.");
            return;
        }
        beamProperties.rA = Number(beamProperties.rA);
        if(beamProperties.rA < 0) {
            setInitialFormWarning("rA must be at least 0.");
            return;
        }

        // Check that EI is a number > 0.
        if(parseFloat(beamProperties.EI) != beamProperties.EI){
            setInitialFormWarning("EI must be a number.");
            return;
        }
        beamProperties.EI = Number(beamProperties.EI);
        if(beamProperties.EI <= 0) {
            setInitialFormWarning("EI must be greater than 0.");
            return;
        }

        // Check that gravity is a number >= 0.
        if(parseFloat(beamProperties.gravity) != beamProperties.gravity){
            setInitialFormWarning("Gravity must be a number.");
            return;
        }
        beamProperties.gravity = Number(beamProperties.gravity);
        if(beamProperties.gravity < 0) {
            setInitialFormWarning("Gravity must be at least 0.");
            return;
        }

        // Check that loads are not invalidated by length of beam change.
        for(let load in loads)
            if(loads[load].type === "Point" && loads[load].location > beamProperties.length) {
                setInitialFormWarning(load + " location must be less than or equal to Length of Beam.");
                return;
            }
            else if(loads[load].type === "Distributed" && loads[load].location + loads[load].length / 2 > beamProperties.length) {
                setInitialFormWarning("Right end of " + load + " is out of bounds (Location is " + (loads[load].location + loads[load].length / 2) + ", must be less than or equal to Length of Beam).");
                return;
            }
        
        // No errors.
        setInitialFormWarning("");
    }

    /**
     * This function checks the initial form inputs to ensure that they are valid. 
     * All inputs must be nonnegative numbers. Beam length and EI must be nonzero. 
     * Load location must be less than or equal to beam length.
     * This function also converts the string inputs into number inputs.
     */
     function validateInputsLoadForm(isAdding){
        // Check that name is not in use, unless when editing if the name is the same as the original name.
        if((newLoadData.name in loads) && (isAdding || newLoadData.name !== selectedLoad)) {
            setLoadFormWarning("Name is already in use.");
            return;
        }

        // Check that mass is a number >= 0.
        if(parseFloat(newLoadData.mass) != newLoadData.mass){
            setLoadFormWarning("Mass must be a number.");
            return;
        }
        newLoadData.mass = Number(newLoadData.mass);
        if(newLoadData.mass < 0) {
            setLoadFormWarning("Mass must be at least 0.");
            return;
        }

        // Check that location is a number.
        if(parseFloat(newLoadData.location) != newLoadData.location){
            setLoadFormWarning("Location must be a number.");
            return;
        }
        newLoadData.location = Number(newLoadData.location);

        // Check that type is either d or p.
        if(newLoadData.type !== "Distributed" && newLoadData.type !== "Point") {
            setLoadFormWarning("Type must be Distributed or Point Load.");
            return;
        }
        setHideLengthField(newLoadData.type === "Point");

        // Check that length is a number >= 0.
        if(parseFloat(newLoadData.length) != newLoadData.length){
            setLoadFormWarning("Length must be a number.");
            return;
        }
        newLoadData.length = Number(newLoadData.length);
        if(newLoadData.length < 0) {
            setLoadFormWarning("Length must be at least 0.");
            return;
        }

        // Check that load location is in-bounds, for point load.
        if(newLoadData.type === "Point") {
            if(newLoadData.location < 0) {
                setLoadFormWarning("Location must be at least 0.");
                return;
            }
            if(newLoadData.location > beamProperties.length) {
                setLoadFormWarning("Location must be less than or equal to Length of Beam.");
                return;
            }
        }
        // Check that left and right ends of the load are in-bounds, for distributed load.
        else {
            let leftEnd = newLoadData.location - newLoadData.length / 2;
            let rightEnd = newLoadData.location + newLoadData.length / 2;
            if(leftEnd < 0) {
                setLoadFormWarning("Left end of load is out of bounds (Location is " + leftEnd + ", must be at least 0).");
                return;
            }
            if(rightEnd > beamProperties.length){
                setLoadFormWarning("Right end of load is out of bounds (Location is " + rightEnd + ", must be less than or equal to Length of Beam).");
                return;
            }
        }

        // No errors.
        setLoadFormWarning("");
    }

    // Function for using the load selector dropdown or initial form radio buttons to change selected load
    function handleSelectedChange(event){
        setSelectedLoad(event.target.value);
    }
    
    // Function for submitting the initial inputs form
    function handleSubmit(data, e){
        validateInputsInitialForm();
        if(initialFormWarning === "") {
            setBeamProperties(data);
            setIsBeamIni(true);
        } else
            e.preventDefault();
    }

    function loadRadioButtonsCreator(){
        let labels = [];
        for(let load in loads)
            labels.push(<FormControlLabel
                key={load} value={load} control={<Radio/>}
                label={load + ": Location = " + (loads[load].location + loads[load].length / 2) + ", Mass = " + loads[load].mass + ", Type = " + loads[load].type + (loads[load].type==="Distributed" ? ", Length = " + loads[load].length : "")}
            />)
        return labels;
    }
    
    function deflectionDiagram(loads, beamProperties){
        const pointsToDraw = []
        // Add every 100th of the beam length.
        for(let i = 0; i <= 100; i++)
            pointsToDraw.push((i/100)*beamProperties.length)
    
        // Also add all the point loads, and the start and end of distrib loads
        Object.values(loads).forEach(load => {
            pointsToDraw.push(load.location)
            if(load.type === "Distributed")
                pointsToDraw.push(load.location+load.length)
        })
        // Sort the points by location
        pointsToDraw.sort((a,b)=>(a > b)? 1 : -1)
    
        let plotData = []
        pointsToDraw.forEach(ptd => {
            let plotDataY = 0
            Object.values(loads).forEach(load =>
                plotDataY += deflectionSingleLoad(ptd, load, beamProperties)
            )
            plotData.push({x:ptd, y:plotDataY})
        })

        let newScale = getScale(plotData)
        if(newScale != deflectionScale)
            setDeflectionScale(newScale)

        return plotData
    }

    function bendingMomentDiagram(loads, beamProperties){
        const pointsToDraw = []
        // Add every 100th of the beam length.
        for(let i = 0; i <= 100; i++)
            pointsToDraw.push((i/100)*beamProperties.length)
    
        // Also add all the point loads, and the start and end of distrib loads
        Object.values(loads).forEach(load => {
            pointsToDraw.push(load.location)
            if(load.type === "Distributed")
                pointsToDraw.push(load.location+load.length)
        })
        // Sort the points by location
        pointsToDraw.sort((a,b)=>(a > b)? 1 : -1)
    
        let plotData = []
        pointsToDraw.forEach(ptd => {
            let plotDataY = 0
            Object.values(loads).forEach(load =>
                plotDataY += bendingMomentSingleLoad(ptd, load, beamProperties)
            )
            plotData.push({x:ptd, y:plotDataY})
        })

        let newScale = getScale(plotData)
        if(newScale != bendingMomentScale)
            setBendingMomentScale(newScale)

        return plotData
    }

    function shearForceDiagram(loads, beamProperties){
        const pointsToDraw = []
        // Add every 100th of the beam length.
        for(let i = 0; i <= 100; i++)
            pointsToDraw.push((i/100)*beamProperties.length)
    
        // Also add all the point loads, and the start and end of distrib loads
        Object.values(loads).forEach(load => {
            pointsToDraw.push(load.location)
            if(load.type === "Distributed")
                pointsToDraw.push(load.location+load.length)
        })
        // Sort the points by location
        pointsToDraw.sort((a,b)=>(a > b)? 1 : -1)
    
        let plotData = []
        pointsToDraw.forEach(ptd => {
            let plotDataY = 0
            Object.values(loads).forEach(load =>
                plotDataY += shearForceSingleLoad(ptd, load, beamProperties)
            )
            plotData.push({x:ptd, y:plotDataY})
        })

        let newScale = getScale(plotData)
        if(newScale != shearForceScale)
            setShearForceScale(newScale)

        return plotData
    }
    
    // Display the initial inputs form
    if(!isBeamIni){
        var data = beamProperties;
        return(<form onSubmit={(e)=> {handleSubmit(data, e)}}>
            <div></div>
            <FormControl>
                <FormLabel id="supportTypeRadios">Support Type</FormLabel>
                <RadioGroup
                    row
                    aria-labelledby="supportTypeRadios"
                    value={beamProperties.supportType}
                    onChange={(val)=>{
                        beamProperties.supportType = val.target.value;
                        validateInputsInitialForm();
                        reRender(!render);
                    }}
                >
                    <FormControlLabel value="Simply Supported" control={<Radio />} label="Simply Supported" />
                    <FormControlLabel value="Cantilever" control={<Radio />} label="Cantilever" />
                </RadioGroup>
            </FormControl>
            <div></div>
            <label>Length of Beam:
                <input
                    defaultValue={100}
                    type="text"
                    onChange={(e) => {
                        data.length = e.target.value
                        validateInputsInitialForm();
                    }}
                />
            </label>
            <div></div>
            <label>Elasticity:
                <input
                    defaultValue={1.0}
                    type="text"
                    onChange={(e) => {
                        data.elasticity = e.target.value
                        validateInputsInitialForm();
                    }}
                />
            </label>
            <div></div>
            <label>Inertia:
                <input
                    defaultValue={1.0}
                    type="text"
                    onChange={(e) => {
                        data.inertia = e.target.value
                        validateInputsInitialForm();
                    }}
                />
            </label>
            <div></div>
            <label>Density:
                <input
                    defaultValue={1.0}
                    type="text"
                    onChange={(e) => {
                        data.density = e.target.value
                        validateInputsInitialForm();
                    }}
                />
            </label>
            <div></div>
            <label>Area:
                <input
                    defaultValue={1.0}
                    type="text"
                    onChange={(e) => {
                        data.area = e.target.value
                        validateInputsInitialForm();
                    }}
                />
            </label>
            <div></div>
            <label>Damping Ratio:
                <input
                    defaultValue={0.02}
                    type="text"
                    onChange={(e) => {
                        data.dampingRatio = e.target.value
                        validateInputsInitialForm();
                    }}
                />
            </label>
            <div></div>
            <label>rA:
                <input
                    defaultValue={85000.0}
                    type="text"
                    onChange={(e) => {
                        data.rA = e.target.value
                        validateInputsInitialForm();
                    }}
                />
            </label>
            <div></div>
            <label>EI:
                <input
                    defaultValue={210000000000.0}
                    type="text"
                    onChange={(e) => {
                        data.EI = e.target.value
                        validateInputsInitialForm();
                    }}
                />
            </label>
            <div></div>
            <label>Gravity:
                <input
                    defaultValue={9.8}
                    type="text"
                    onChange={(e) => {
                        data.gravity = e.target.value
                        validateInputsInitialForm();
                    }}
                />
            </label>
            <p></p>
            <FormLabel id="loadSelection" style={{fontWeight: "bold"}}>List of Loads</FormLabel>
            <div></div>
            <RadioGroup
                aria-labelledby="loadSelection"
                name="loadSelectionRadioBtns"
                value={selectedLoad}
                onChange={handleSelectedChange}
                sx={{display:'inline-flex'}}
            >
                {loadRadioButtonsCreator()}
            </RadioGroup>
            <p></p>
            <Button variant="outlined" sx={{width:135}} onClick={handleClickOpenAdd}>
                Add Load
            </Button>
            <Button variant="outlined" sx={{width:135}} onClick={handleClickOpenEdit} disabled={Object.keys(loads).length === 0}>
                Edit Load
            </Button>
            <Button variant="outlined" sx={{width:135}} onClick={deleteLoad} disabled={Object.keys(loads).length === 0}>
                Delete Load
            </Button>
            {/* Add Load menu */}
            <Dialog open={openAdd} onClose={handleCloseAdd}>
                <DialogTitle>Add Load</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter load properties
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        defaultValue={newLoadData.name}
                        type="text"
                        onChange={(val)=>{
                            newLoadData.name = val.target.value;
                            validateInputsLoadForm(true);
                        }}
                        fullWidth
                        variant="standard"
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        label={hideLengthField?"Mass":"Mass Per Meter"}
                        defaultValue={newLoadData.mass}
                        type="text"
                        onChange={(val)=>{
                            newLoadData.mass = val.target.value;
                            validateInputsLoadForm(true);    
                        }}
                        fullWidth
                        variant="standard"
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Location"
                        type="text"
                        defaultValue={newLoadData.location}
                        onChange={(val)=>{
                            newLoadData.location = val.target.value;
                            validateInputsLoadForm(true);
                        }}
                        fullWidth
                        variant="standard"
                    />
                    <FormControl>
                        <FormLabel id="newLoadTypeRadios" sx={{mt:1}}>Type</FormLabel>
                        <RadioGroup
                            row
                            aria-labelledby="newLoadTypeRadios"
                            value={newLoadData.type}
                            onChange={(val)=>{
                                newLoadData.type = val.target.value;
                                validateInputsLoadForm(true);
                            }}
                        >
                            <FormControlLabel value="Point" control={<Radio />} label="Point Load" />
                            <FormControlLabel value="Distributed" control={<Radio />} label="Distributed Load" />
                        </RadioGroup>
                    </FormControl>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Length (Distributed Load)"
                        type="text"
                        defaultValue={newLoadData.length}
                        onChange={(val)=>{
                            newLoadData.length = val.target.value;
                            validateInputsLoadForm(true);
                        }}
                        fullWidth
                        variant="standard"
                        disabled={hideLengthField}
                    />

                </DialogContent>
                <DialogContentText align="center" sx={{fontWeight: "bold", height:30}}>{loadFormWarning}</DialogContentText>
                <DialogActions>
                    <Button onClick={()=>{handleCloseAdd("cancel")}}>Cancel</Button>
                    <Button onClick={()=>{handleCloseAdd("confirm")}}>Confirm</Button>
                </DialogActions>
            </Dialog>
            {/* Edit Load menu */}
            <Dialog open={openEdit} onClose={handleCloseEdit}>
                <DialogTitle>Edit Load</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter load properties
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        defaultValue={newLoadData.name}
                        type="text"
                        onChange={(val)=>{
                            newLoadData.name = val.target.value;
                            validateInputsLoadForm(false);
                        }}
                        fullWidth
                        variant="standard"
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        label={hideLengthField?"Mass":"Mass Per Meter"}
                        defaultValue={newLoadData.mass}
                        type="text"
                        onChange={(val)=>{
                            newLoadData.mass = val.target.value;
                            validateInputsLoadForm(false);
                        }}
                        fullWidth
                        variant="standard"
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Location"
                        type="text"
                        defaultValue={newLoadData.location}
                        onChange={(val)=>{
                            newLoadData.location = val.target.value;
                            validateInputsLoadForm(false);
                        }}
                        fullWidth
                        variant="standard"
                    />
                    <FormControl>
                        <FormLabel id="newLoadTypeRadios" sx={{mt:1}}>Type</FormLabel>
                        <RadioGroup
                            row
                            aria-labelledby="newLoadTypeRadios"
                            value={newLoadData.type}
                            label="Type"
                            onChange={(val)=>{
                                newLoadData.type = val.target.value;
                                validateInputsLoadForm(false);
                            }}
                        >
                            <FormControlLabel value="Point" control={<Radio />} label="Point Load" />
                            <FormControlLabel value="Distributed" control={<Radio />} label="Distributed Load" />
                        </RadioGroup>
                    </FormControl>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Length (Distributed Load)"
                        type="text"
                        defaultValue={newLoadData.length}
                        onChange={(val)=>{
                            newLoadData.length = val.target.value;
                            validateInputsLoadForm(false);
                        }}
                        fullWidth
                        variant="standard"
                        disabled={hideLengthField}
                    />

                </DialogContent>
                <DialogContentText align="center" sx={{fontWeight: "bold", height:30}}>{loadFormWarning}</DialogContentText>
                <DialogActions>
                    <Button onClick={()=>{handleCloseEdit("cancel")}}>Cancel</Button>
                    <Button onClick={()=>{handleCloseEdit("confirm")}}>Confirm</Button>
                </DialogActions>
            </Dialog>
            <p></p>
            <div></div>
            {/* Text display for invalid inputs. */}
            <div><span style={{fontWeight: 'bold'}}>{initialFormWarning}</span></div> 
            <div></div>     
            <input type="submit" value="Analyze" autoFocus/>
            <div></div>
        </form>);
    }

    if(!onceLoaded){
        setOnceLoaded(true)
    }
    return(
        <div className={"rowC"} ref={focusRef} onKeyDown={handleKeyDown} tabIndex="0">
            <div>
                <h1>CARL</h1>
                {/* Main Plot */}
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain={[-100, 100]} margin={{left: 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis tickFormat={formatVal(beamProperties.length)} title = {"Load Location"}/>
                    <YAxis/>
                    {/* Display the beam. */}
                    <LineSeries data = {[{x: 0, y: 0}, {x: beamProperties.length, y: 0}]} />
                    <LabelSeries data={[{x: 0, y: -11, label: "\u25b2", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}},
                                        {x: beamProperties.length, y: -11, label: "\u2b24", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}}]} />
                    {/* Display the loads. */}
                    <LabelSeries data={dataMakerForLoads(loads,selectedLoad,beamProperties)} onValueClick={(d,event)=>{loadSwitcher(d,event)}} />
                    {/* Display the line part of distributed loads. */}
                    {Object.entries(loads).map((load) => {
                        console.log(load[0]);
                        console.log(load[1]);
                        if(load[1].type==="Distributed")
                            return (
                                <LineSeries 
                                    color={load[1].color}
                                    strokeWidth={3}
                                    data={[{x: load[1].location, y: 8}, {x: (load[1].location+load[1].length), y: 8}]}
                                    onSeriesClick={(event) => {setSelectedLoad(load[0])}}
                                    key={load.toString()}
                                />
                            );
                    })}
                </XYPlot>
                {/* Load Selection dropdown */}
                <LoadSelector loadList={loads} value={selectedLoad} onChange={handleSelectedChange} />
                <div>
                    {/* Add Load button */}
                    <Button variant="outlined" sx={{width:135}} onClick={handleClickOpenAdd}>
                        Add Load
                    </Button>
                    {/* Edit Load button */}
                    <Button variant="outlined" sx={{width:135}} onClick={handleClickOpenEdit} disabled={Object.keys(loads).length === 0}>
                        Edit Load
                    </Button>
                    <Button variant="outlined" sx={{width:135}} onClick={deleteLoad} disabled={Object.keys(loads).length === 0}>
                        Delete Load
                    </Button>
                    {/* Add Load menu */}
                    <Dialog open={openAdd} onClose={handleCloseAdd}>
                        <DialogTitle>Add Load</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Please enter load properties
                            </DialogContentText>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Name"
                                defaultValue={newLoadData.name}
                                type="text"
                                onChange={(val)=>{
                                    newLoadData.name = val.target.value;
                                    validateInputsLoadForm(true);
                                }}
                                fullWidth
                                variant="standard"
                            />
                            <TextField
                                autoFocus
                                margin="dense"
                                label={hideLengthField?"Mass":"Mass Per Meter"}
                                defaultValue={newLoadData.mass}
                                type="text"
                                onChange={(val)=>{
                                    newLoadData.mass = val.target.value;
                                    validateInputsLoadForm(true);    
                                }}
                                fullWidth
                                variant="standard"
                            />
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Location"
                                type="text"
                                defaultValue={newLoadData.location}
                                onChange={(val)=>{
                                    newLoadData.location = val.target.value;
                                    validateInputsLoadForm(true);
                                }}
                                fullWidth
                                variant="standard"
                            />
                            <FormControl>
                                <FormLabel id="newLoadTypeRadios" sx={{mt:1}}>Type</FormLabel>
                                <RadioGroup
                                    row
                                    aria-labelledby="newLoadTypeRadios"
                                    value={newLoadData.type}
                                    label="Type"
                                    onChange={(val)=>{
                                        newLoadData.type = val.target.value;
                                        validateInputsLoadForm(true);
                                    }}
                                >
                                    <FormControlLabel value="Point" control={<Radio />} label="Point Load" />
                                    <FormControlLabel value="Distributed" control={<Radio />} label="Distributed Load" />
                                </RadioGroup>
                            </FormControl>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Length (Distributed Load)"
                                type="text"
                                defaultValue={newLoadData.length}
                                onChange={(val)=>{
                                    newLoadData.length = val.target.value;
                                    validateInputsLoadForm(true);
                                }}
                                fullWidth
                                variant="standard"
                                disabled={hideLengthField}
                            />

                        </DialogContent>
                        <DialogContentText align="center" sx={{fontWeight: "bold", height:30}}>{loadFormWarning}</DialogContentText>
                        <DialogActions>
                            <Button onClick={()=>{handleCloseAdd("cancel")}}>Cancel</Button>
                            <Button onClick={()=>{handleCloseAdd("confirm")}}>Confirm</Button>
                        </DialogActions>
                    </Dialog>
                    {/* Edit Load menu */}
                    <Dialog open={openEdit} onClose={handleCloseEdit}>
                        <DialogTitle>Edit Load</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Please enter load properties
                            </DialogContentText>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Name"
                                defaultValue={newLoadData.name}
                                type="text"
                                onChange={(val)=>{
                                    newLoadData.name = val.target.value;
                                    validateInputsLoadForm(false);
                                }}
                                fullWidth
                                variant="standard"
                            />
                            <TextField
                                autoFocus
                                margin="dense"
                                label={hideLengthField?"Mass":"Mass Per Meter"}
                                defaultValue={newLoadData.mass}
                                type="text"
                                onChange={(val)=>{
                                    newLoadData.mass = val.target.value;
                                    validateInputsLoadForm(false);
                                }}
                                fullWidth
                                variant="standard"
                            />
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Location"
                                type="text"
                                defaultValue={newLoadData.location}
                                onChange={(val)=>{
                                    newLoadData.location = val.target.value;
                                    validateInputsLoadForm(false);
                                }}
                                fullWidth
                                variant="standard"
                            />
                            <FormControl>
                                <FormLabel id="newLoadTypeRadios" sx={{mt:1}}>Type</FormLabel>
                                <RadioGroup
                                    row
                                    aria-labelledby="newLoadTypeRadios"
                                    value={newLoadData.type}
                                    label="Type"
                                    onChange={(val)=>{
                                        newLoadData.type = val.target.value;
                                        validateInputsLoadForm(false);
                                    }}
                                >
                                    <FormControlLabel value="Point" control={<Radio />} label="Point Load" />
                                    <FormControlLabel value="Distributed" control={<Radio />} label="Distributed Load" />
                                </RadioGroup>
                            </FormControl>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Length (Distributed Load)"
                                type="text"
                                defaultValue={newLoadData.length}
                                onChange={(val)=>{
                                    newLoadData.length = val.target.value;
                                    validateInputsLoadForm(false);
                                }}
                                fullWidth
                                variant="standard"
                                disabled={hideLengthField}
                            />

                        </DialogContent>
                        <DialogContentText align="center" sx={{fontWeight: "bold", height:30}}>{loadFormWarning}</DialogContentText>
                        <DialogActions>
                            <Button onClick={()=>{handleCloseEdit("cancel")}}>Cancel</Button>
                            <Button onClick={()=>{handleCloseEdit("confirm")}}>Confirm</Button>
                        </DialogActions>
                    </Dialog>
                </div>
                <div>
                    {/* Control buttons */}
                    <Button variant="contained" sx={{margin: 0.5}} id={"multi_left_btn"} onClick={()=>{playerMovement(-1,1,10)}}><span>&#8592;</span></Button>
                    <Button variant="contained" sx={{margin: 0.5}} id={"multi_jump_btn"} onClick={()=>{playerMovement(0,5,10)}}><span>JUMP</span></Button>
                    <Button variant="contained" sx={{margin: 0.5}} id={"multi_right_btn"} onClick={()=>{playerMovement(1,1,10)}}><span>&#8594;</span></Button>
                </div>
            </div>
            <div>
                <h1>Plots</h1>
                {/* Side plots */}
                {/* Deflection Diagram */}
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[deflectionScale, deflectionScale]} margin = {{left : 60, right:60}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis tickFormat = {formatVal(beamProperties.length)} title = {"Deflection Diagram"}/>
                    <YAxis tickFormat = {formatVal(deflectionScale)}/>
                    <LineSeries data = {[{x : 0, y : 0},{x : beamProperties.length,y : 0}]} />
                    <LineSeries data={deflectionDiagram(loads, beamProperties)} curve={'curveMonotoneX'}/>
                    <LabelSeries data={plotReactions(loads, beamProperties, deflectionScale)} />
                </XYPlot>
                {/* Bending Moment Diagram */}
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[bendingMomentScale, bendingMomentScale]} margin = {{left : 60, right:60}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis tickFormat = {formatVal(beamProperties.length)} title = {"Bending Moment Diagram"}/>
                    <YAxis tickFormat = {formatVal(bendingMomentScale)}/>

                    <LineSeries data = {[{x : 0, y : 0},{x : beamProperties.length,y : 0}]} />
                    <LineSeries data={bendingMomentDiagram(loads,beamProperties)}/>
                </XYPlot>
                {/* Shear Force Diagram */}
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[shearForceScale, shearForceScale]} margin = {{left : 60, right:60}}>
                    {/*<h1>Shear Force Diagram</h1>*/}
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis tickFormat = {formatVal(beamProperties.length)} title = {"Shear Force Diagram"}/>
                    <YAxis tickFormat = {formatVal(shearForceScale)}/>
                    <LineSeries data = {[{x : 0, y : 0},{x : beamProperties.length,y : 0}]} />
                    <LineSeries data={shearForceDiagram(loads, beamProperties)}/>
                </XYPlot>
            </div>
        </div>
    )
}

/**
 * Function for load labels for the Load Location plot.
 * For point loads it puts load name, mass, and position.
 * For distributed loads it puts load name, mass, position, and length. 
 * Distributed load labels are lower than point load labels to reduce the amount of overlapping text.
 * 
 * This function also creates arrow text characters to indicate the positions of loads.
 * This function is not responsible for displaying the line part of the distributed loads, but it does give the arrows.
 */
function dataMakerForLoads(loads, selectedLoad, beamProperties){
    var data = []
    for(let load in loads){
        console.log("load is : " + load.type)
        // Point Loads
        if(loads[load].type === "Point"){
            // Put load label.
            data.push({x: loads[load].location, y: 35, label: load.toString(), loadID: load, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            let label;
            if(load === selectedLoad)
                label = "m=" + loads[load].mass + ", x=" + loads[load].location;
            else
                label = loads[load].mass + ", " + loads[load].location;
            data.push({x: loads[load].location, y: 30, label: label, loadID: load, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            // Put a big arrow.
            data.push({x: loads[load].location, y: -5, label: "\u2193", loadID: load, style: {fontSize: 45, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        // Distributed Loads
        }else{
            // Put load label.
            data.push({x: loads[load].location+loads[load].length/2, y: 25, label: load.toString(), loadID: load, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            let label;
            if(load === selectedLoad)
                label = "m=" + loads[load].mass + ", x=" + (loads[load].location + loads[load].length / 2) +", L=" + loads[load].length;
            else
                label = loads[load].mass + ", " + (loads[load].location + loads[load].length / 2) + ", " + loads[load].length;
            data.push({x: loads[load].location+loads[load].length/2, y: 20, label: label, loadID: load, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            // Put small arrows under distributed load line. 
            console.log(loads[load].color);
            getDistributedLoadMiniArrows(data, loads[load].location, loads[load].length, beamProperties.length, loads[load].color, load);
        }
    }
    return data;
}

/**
 * Function for adding mini arrows under the distributed loads.
 * Loads will have at least one arrow per 5 units, and always have an arrow on each end. 
 * There is also an arrow on each end of the load, and the arrows match the color and loadID of the load.
 * 
 * array is the data array for a LabelSeries that will display these arrows.
 * pos and len are the position and length of the load.
 * color is the color of the load line, so that the arrows can match that color.
 * loadID is the name of the load that these arrows belong to. It is part of allowing users to click on these arrows to select the load to move/delete it.
 */
function getDistributedLoadMiniArrows(array, pos, len, beamLen, color, loadID){
    let numArrows = Math.floor(len / beamLen * 20) + 1;
    for(let i = 0; i <= numArrows; i++)
        array.push({x: pos + (i/numArrows) * len, y: -3, label: "\u2193", loadID: loadID, style: {fontSize: 25, font: "verdana", fill: color, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
}

function plotReactions(loads,beamProperties,scale){
    let R1 = 0
    let R2 = 0
    Object.values(loads).forEach(load => {
        R1 += R1SingleLoad(load, beamProperties)
        R2 += R2SingleLoad(load, beamProperties)
    })

    let reactionLabels = []
    // Left side reaction label
    reactionLabels.push({x: 0, y: -40/100*scale, label: formatVal(R1)(R1) , style: {fontSize: 15}})
    reactionLabels.push({x: 0, y: -35/100*scale, label: "\u2191", style: {fontSize: 35}})
    // Right side reaction label
    if(beamProperties.supportType === "Simply Supported") {
        reactionLabels.push({x: beamProperties.length, y: -40/100*scale, label: formatVal(R2)(R2),  style: {fontSize: 15}})
        reactionLabels.push({x: beamProperties.length, y: -35/100*scale, label: "\u2191", style: {fontSize: 35}})
    }
    return reactionLabels
}

function R1SingleLoad(load, beamProperties){
    // Get relevant variables
    let F = load.mass * beamProperties.gravity
    let X = load.location
    let L = load.length
    let Lb = beamProperties.length

    let R1
    if(load.type === "Point") {
        if(beamProperties.supportType === "Cantilever")
            R1 = F
        else
            R1 = F/Lb * (Lb - X)
    }
    else {
        if(beamProperties.supportType === "Cantilever")
            R1 = F*L
        else
            R1 = F*L/Lb * (Lb - X - L/2)
    }
    return R1
}

function R2SingleLoad(load, beamProperties) {
    // Get relevant variables
    let F = load.mass * beamProperties.gravity
    let L = load.length
    
    let R2
    if(load.type === "Point")
        R2 = F - R1SingleLoad(load, beamProperties)
    else
        R2 = F*L - R1SingleLoad(load, beamProperties)
    return R2
}

function deflectionSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let F = load.mass * beamProperties.gravity
    let X = load.location
    let L = load.length
    let Lb = beamProperties.length
    let EI = beamProperties.EI

    let y
    if(load.type === "Point") {
        if(x < X)
            y = (x**3-3*x**2*X) / 6
        else
            y = (X**3-3*X**2*x) / 6

        if(beamProperties.supportType === "Simply Supported")
            y += (-2*Lb**2*X*x + 3*Lb*X*x**2 + 3*Lb*x*X**2 - X*x**3 - x*X**3) / 6 / Lb
    }
    else {
        if(x < X)
            y = (-3*L**2*x**2 - 6*L*X*x**2 + 2*L*x**3) / 12
        else if(x < X + L)
            y = (-1*(X-x)**4 - 6*L**2*x**2 - 12*L*X*x**2 + 4*L*x**3) / 24
        else
            y = ((L+X)**4 - X**4 - 4*L**3*x - 12*L**2*X*x - 12*L*X**2*x) / 24

        if(beamProperties.supportType === "Simply Supported")
            y += (x*X**4 - x*(L+X)**4 -2*L**2*x**3 - 4*L*x**3*X - 4*L**2*Lb**2*x + 4*L**3*Lb*x + 6*L**2*Lb*x**2 - 8*L*Lb**2*x*X + 12*L**2*Lb*x*X + 12*L*Lb*x*X**2 + 12*L*Lb*X*x**2) / 24 / Lb
    }

    y *= F / EI

    return y
}

function bendingMomentSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let F = load.mass * beamProperties.gravity
    let X = load.location
    let L = load.length
    let Lb = beamProperties.length

    let y
    if(load.type === "Point") {
        if(x < X)
            y = F * (x - X)
        else
            y = 0

        if(beamProperties.supportType === "Simply Supported")
            y -= F * X / Lb * (x-Lb)
    }
    else {
        if(x < X)
            y = F * L * (x-X-L/2)
        else if(x < X + L)
            y = F * (L*x - X*L + X*x - (L**2+X**2+x**2)/2)
        else
            y = 0
        
        if(beamProperties.supportType === "Simply Supported")
            y -= F * L * (2*X+L) / 2 / Lb * (x-Lb)
    }
    return y
}
    
function shearForceSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let X = load.location
    let F = load.mass * beamProperties.gravity
    let L = load.length
    let Lb = beamProperties.length

    let y
    if(load.type === "Point") {
        if(x < X)
            y = F
        else
            y = 0

        if(beamProperties.supportType === "Simply Supported")
            y -= F * X / Lb
    }
    else {
        if(x < X)
            y = F * L
        else if(x < X + L)
            y = F * (X - x + L)
        else
            y = 0
        
        if(beamProperties.supportType === "Simply Supported")
            y -= F * L * (2*X+L) / 2 / Lb
    }
    return y
}

function getScale(dataList) {
    // Find the biggest absolute value from the data list
    let maxAbsVal = 0
    dataList.forEach(dataPoint =>
        maxAbsVal = Math.max(maxAbsVal, Math.abs(dataPoint.y))
    )
    
    // If the line is flat at 0, scale will be 1
    if(maxAbsVal == 0)
        return 1

    // Else, the scale will be the smallest power of 2 greater than maxAbsVal
    let scale = 1
    while(scale > maxAbsVal)
        scale /= 2
    while(scale < maxAbsVal)
        scale *= 2

    return scale
}

function formatVal(scale) {
    if(scale >= 10**5 || scale <= 10**-4)
        return val => {
            val = Number(val.toPrecision(6))
            return val == 0 ? val : val.toExponential()
        }
    else
        return val => {
            return Number(val.toPrecision(6))
        }
}

export default CombinedLoadApp;