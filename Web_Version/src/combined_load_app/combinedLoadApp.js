import '../App.css'
import React, { useEffect, useState} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField} from '@mui/material'
import LoadSelector from '../components/LoadSelector';
import {HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis} from "react-vis";
import {inv, multiply} from "mathjs";


function CombinedLoadApp(){

    const butStyle = {background: "black", height:window.innerHeight/12,
        width:window.innerWidth/10 ,borderRadius: 8, color: "white"}
    const [beamProperties,setBeamProperties] = useState({length: 100, elasticity: 1.0, inertia: 1.0, density: 1.0, area: 1.0, dampingRatio:0.02, rA: 85000.0, EI: 210000000000.0, mass:10.0, gravity:9.8})
    const [onceLoaded, setOnceLoaded] = useState(false)
    const [isBeamIni, setIsBeamIni] = useState(false)
    const [loads,setLoads] = useState({})
    const [selectedLoad, setSelectedLoad] = useState('load1')
    const [loadUpdated, setLoadUpdated] = useState(false)
    const [newLoadData, setNewLoadData] = useState({name:loadNamer(), mass:10.0, location:beamProperties.length / 2, type:"p", length:0, color:"#00000080"})
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [initialFormWarning, setInitialFormWarning] = useState("");
    const [loadFormWarning, setLoadFormWarning] = useState("");
    const [hideLengthField, setHideLengthField] = useState(true);

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
        setNewLoadData({name:loadNamer(), mass:10.0, location:beamProperties.length / 2, type:"p", length:0, color:color});
        setHideLengthField(true);
        console.log(newLoadData.color);
        setOpenAdd(true);
    };
    const handleClickOpenEdit = () => {
        setNewLoadData({name:selectedLoad, mass:loads[selectedLoad].mass, location:loads[selectedLoad].location + loads[selectedLoad].length / 2, type:loads[selectedLoad].type, length:loads[selectedLoad].length, color:loads[selectedLoad].color});
        setHideLengthField(loads[selectedLoad].type === "p");
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
        if(newLoadData.type === "p")
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
        if(newLoadData.type === "p")
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
        if(loads[selectedLoad].type === "d")
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
        if(newLoadData.type !== "d" && newLoadData.type !== "p") {
            setLoadFormWarning("Type must be Distributed or Point Load.");
            return;
        }
        setHideLengthField(newLoadData.type === "p");

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
        if(newLoadData.type === "p") {
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
                setLoadFormWarning("The left end of the load is out of bounds (location is " + leftEnd + ", must be greater than or equal to 0).");
                return;
            }
            if(rightEnd > beamProperties.length){
                setLoadFormWarning("The right end of the load is out of bounds (location is " + rightEnd + ", must be less than or equal to Length of Beam).");
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
                label={load + ": Location = " + (loads[load].location + loads[load].length / 2) + ", Mass = " + loads[load].mass + ", Type = " + (loads[load].type==="p"?"Point":"Distributed" + ", Length = " + loads[load].length)} 
            />)
        return labels;
    }

    // Display the initial inputs form
    if(!isBeamIni){
        var data = beamProperties;
        return(<form onSubmit={(e)=> {handleSubmit(data, e)}}>
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
                        label="Mass"
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
                            <FormControlLabel value="p" control={<Radio />} label="Point Load" />
                            <FormControlLabel value="d" control={<Radio />} label="Distributed Load" />
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
                        label="Mass"
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
                            <FormControlLabel value="p" control={<Radio />} label="Point Load" />
                            <FormControlLabel value="d" control={<Radio />} label="Distributed Load" />
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
                    <XAxis title = {"Load Location"}/>
                    <YAxis/>
                    {/* Display the beam. */}
                    <LineSeries data = {[{x: 0, y: 0}, {x: 100, y: 0}]} />
                    <LabelSeries data={[{x: 0, y: -11, label: "\u25b2", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}},
                                        {x: 100, y: -11, label: "\u2b24", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}}]} />
                    {/* Display the loads. */}
                    <LabelSeries data={dataMakerForLoads(loads,selectedLoad,beamProperties)} onValueClick={(d,event)=>{loadSwitcher(d,event)}} />
                    {/* Display the line part of distributed loads. */}
                    {Object.entries(loads).map((load) => {
                        console.log(load[0]);
                        console.log(load[1]);
                        if(load[1].type==="d")
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
                                label="Mass"
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
                                    <FormControlLabel value="p" control={<Radio />} label="Point Load" />
                                    <FormControlLabel value="d" control={<Radio />} label="Distributed Load" />
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
                                label="Mass"
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
                                    <FormControlLabel value="p" control={<Radio />} label="Point Load" />
                                    <FormControlLabel value="d" control={<Radio />} label="Distributed Load" />
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
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[3, 3]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Deflection Diagram"}/>
                    <XAxis/>
                    <YAxis/>
                    <LineSeries data = {[{x : 0, y : 0},{x : 100,y : 0}]} />
                    <LineSeries data={deflection(loads, beamProperties)} curve={'curveMonotoneX'}/>
                </XYPlot>
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[-35000, 35000]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Bending Moment Diagram"}/>
                    <XAxis/>
                    <YAxis/>

                    <LineSeries data = {[{x : 0, y : 0},{x : 100,y : 0}]} />
                    <LineSeries data={movementBendingDiagram(loads,beamProperties)}/>
                </XYPlot>
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-600, 600]} margin = {{left : 10}}>
                    {/*<h1>Shear Force Diagram</h1>*/}
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Shear Force Diagram"}/>
                    <YAxis/>
                    <LineSeries data = {[{x : 0, y : 0},{x : 100,y : 0}]} />
                    <LineSeries data={shearForceData(loads, beamProperties)}/>
                </XYPlot>
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Plot Reactions"}/>
                    <YAxis/>
                    <LineSeries data = {[{x : 0, y : 0},{x : 100,y : 0}]} />
                    <LabelSeries data={plotReactions(loads, beamProperties)} />
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
        if(loads[load].type === "p"){
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
            getDistributedLoadMiniArrows(data, loads[load].location, loads[load].length, loads[load].color, load);
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
function getDistributedLoadMiniArrows(array, pos, len, color, loadID){
    let numArrows = Math.floor(len / 5) + 1;
    for(let i = 0; i <= numArrows; i++)
        array.push({x: pos + (i/numArrows) * len, y: -3, label: "\u2193", loadID: loadID, style: {fontSize: 25, font: "verdana", fill: color, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
}

function shearForceData(loads, beamProperties){
    var length = beamProperties.length;
    var x = 0
    var delta = 1
    let allDataList = []
    let cset = new Set();
    for(let load in loads){
        let myload = loads[load]
        if(myload.type === "d")
            continue
        cset.add(myload.location)
    }
    for(let load in loads){
        let myload = loads[load]
        if(myload.type === "p"){
            let p = myload.mass
            let l = length
            let a = myload.location
            allDataList.push(shearForceDataPointLoad(p,l,a))
            continue
        }
        let e = myload.location
        let d = myload.length
        let w = myload.mass
        let L = length
        allDataList.push(shearForceDataDistributed(e,d,w,L,cset))
    }
    let finalDataList = []
    x = 0
    while(x<=length){
        let yval = 0
        let yval1 = 0
        for(let list of allDataList){
            yval += list[x].y[0]
            yval1 += list[x].y[1]
        }
        finalDataList.push({x:x,y:yval})
        finalDataList.push({x:x,y:yval1})
        x+= delta
    }
    console.log("final list is of sheer is : ")
    console.log(finalDataList)
    return finalDataList
}
function shearForceDataPointLoad(p,l,a){
    let R1 = p*(l - a)/l
    let dataList = []
    for(let x = 0 ; x <= l;x++){
        let y = 0
        if(x >= 0 && x < a){
            y = R1
        }else if(x === a){
            dataList.push({x:x,y:[R1,R1 - p]})
            continue
        }else{
            y = R1 - p
        }
        dataList.push({x:x,y:[y,y]})
    }
    return dataList
}
function shearForceDataDistributed(e,d,w,L){
    var R1 = reactionR1(e,d,w,L)[0]
    let dataList = []
    for(let x = 0 ; x <= L;x++){
        let y = 0
        if(x >= 0 && x <= e){
            y = R1
        }else if (x > e && x <= (e + d)){
            y = R1 - w*(x-e)
        }else{
            y = R1-w*d
        }
        dataList.push({x:x,y:[y,y]})
    }
    return dataList
}

function movementBendingDiagram(loads, beamProperties){
    var length = beamProperties.length;
    var x = 0
    var delta = 1
    let allDataList = []

    for(let load in loads){
        let myload = loads[load]
        if(myload.type === "p"){
            let p = myload.mass
            let l = length
            let a = myload.location
            allDataList.push(movementBendingDiagramPointLoad(p,l,a))
            continue
        }
        let e = myload.location
        let d = myload.length
        let w = myload.mass
        let L = length
        allDataList.push(movementBendingDiagramDistributed(e,d,w,L))
    }
    let finalDataList = []
    x = 0
    while(x<=length){
        let yval = 0
        for(let list of allDataList){
            yval += list[x].y
        }
        finalDataList.push({x:x,y:yval})
        x+= delta
    }
    console.log("final list is  : ")
    console.log(finalDataList)
    return finalDataList
}
function movementBendingDiagramDistributed(e,d,w,L){
    var R1 = reactionR1(e,d,w,L)[0]
    var R2 = reactionR1(e,d,w,L)[1]
    let dataList = []
    for(let x = 0 ; x <= L;x++){
        let y = 0
        if(x >= 0 && x <= e){
            y = R1*x
        }else if (x > e && x <= (e + d)){
            y = R1*x - w * (x-e) * (x - e) / 2
        }else{
            y = R2 * (L - x)
        }
        dataList.push({x:x,y:y})
    }
    return dataList
}
function movementBendingDiagramPointLoad(p,l,a){
    let R1 = p*(l - a)/l
    let R2 = p*a/l
    let dataList = []
    for(let x = 0 ; x <= l;x++){
        let y = 0
        if(x >= 0 && x <= a){
            y = R1*x
        }else{
            y = R1*x - p * (x - a)
        }
        dataList.push({x:x,y:y})
    }
    return dataList
}
function plotReactions(loads,beamProperties){
    var length = beamProperties.length;
    var x = 0
    var delta = 1
    let allDataList = []
    let R1 = 0
    let R2 = 0
    for(let load in loads){
        let myload = loads[load]
        if(myload.type === "p"){
            let p = myload.mass
            let l = length
            let a = myload.location
            R1 += p*(l - a)/l
            R2 += p*a/l
            continue
        }
        let e = myload.location
        let d = myload.length
        let w = myload.mass
        let L = length
        let reactions = reactionR1(e,d,w,L)
        R1 += reactions[0]
        R2 += reactions[1]
    }

    const data = [
        {x: 0, y: -40, label: '' + R1, style: {fontSize: 15}},
        {x: 0, y: -35, label: "\u2191", style: {fontSize: 35}},
        {x: 99, y: -35, label: "\u2191", style: {fontSize: 35}},
        {x: 99, y: -40, label: '' +(R2),  style: {fontSize: 15}}
    ]
    return data
}
function deflection(loads, beamProperties){
    var length = beamProperties.length;
    var dataList = []
    var x = 0
    var delta = 1
    while(x <=length){
        var y = 0;
        for(let load in loads){
            if(loads[load].type !== "p"){
                continue
            }
            var p = loads[load].mass;
            var a = loads[load].location
            var val = deflectionOfSingleLoadPointLoad(p,x,length,a);
            y += val;
        }
        dataList.push({x:x,y:-1*y})
        x+= delta
    }
    let allDataList = [dataList]
    for(let load in loads){
        let myload = loads[load]
        if(myload.type === "p"){
            continue
        }
        let e = myload.location
        let d = myload.length
        let w = myload.mass
        let L = length
        allDataList.push(deflectionCalculation(e,d,w,L))
    }
    let finalDataList = []
    x = 0
    while(x<=length){
        let yval = 0
        for(let list of allDataList){
            yval += list[x].y
        }
        finalDataList.push({x:x,y:yval})
        x+= delta
    }
    console.log("deflection is : ")
    console.log(finalDataList)
    return finalDataList
}


function deflectionOfSingleLoadPointLoad(p,x,l,a){
    var e = 2110000;
    var i = 0.33;
    var val =0;
    if( x <= a){
        val = p * (l-a) * x;
        val = val/(6 * l * e * i );
        val = val * ((l * l) - (x * x) - ((l-a) * (l-a)));
    }else{
        val = p * (l-a);
        val = val/(6 * l * e * i );
        val = val*((l*(Math.pow((x-a),3))/(l-a)) + (((l*l)-Math.pow(l-a,2))*x) - (x*x*x))
    }
    return val;
}
function deflectionCalculation(e,d,w,L){
    var R1 = reactionR1(e,d,w,L)[0]
    var cs = constantCalculation(R1,e,d,w,L);
    var E = 21100000;
    var I = 3.78;
    var c1 =  cs[0];
    var c2 =  0
    var c3 =  cs[1];
    var c4 =  cs[2];
    var c5 =  cs[3];
    var c6 = cs[4]
    var dataList = []
    var x = 0
    var delta = 1
    while(x <=L){
        var y = 0;
        if(x < e){
            y = (1/(E*I)) * ((R1/6)*(x*x*x) + (c1 *x) + c2)
        }else if(x >= e && x <=e+d){
            var vmid = x-e
            vmid = w * vmid * vmid * vmid * vmid /24
            y = (1/(E*I)) * ((R1/6)*(x*x*x) - vmid + (c3 * x) +c4)
        }else {
            var vs = (w*d) - R1
            var vsm = L - x
            vs = vs * (vsm * vsm * vsm) /6

            y = (1/(E*I)) * (vs + (c5 * x) +c6)
        }
        dataList.push({x:x,y:y})
        x+= delta
    }
    return dataList

}
function constantCalculation(R1,e, d, w  , L){
    var var1 = (((w*d)-R1)*((L-e-d)**2)/(-2)) + (w*(d**3))/6 - (R1*((e+d)**2))/2
    var var2 = ((w*d)-R1)*((L-e-d)**3)/6 + (w*(d**4))/24 - R1*((e+d)**3)/6
    var arr1 = [[0,0,0,L,1],[1,-1,0,0,0],[e,-1*e,-1,0,0],[0,1,0,-1,0],[0,(e+d),1,-1*(e+d),-1]]
    var arr2 = [[0],[0],[0],[var1],[var2]]
    var arr1_inv = inv(arr1)
    var result = multiply(arr1_inv,arr2)
    var res = [result[0][0],result[1][0],result[2][0],result[3][0],result[4][0]]
    return res;
}

function reactionR1(e,d,w,L){
    let R1 = w*d * ( L - e - (d/2))
    R1 = R1/L
    let R2 = w*d - R1
    return [R1,R2]
}

export default CombinedLoadApp;