import 'react'
import '../App.css'
import 'react-vis/dist/style.css';
import {
    XYPlot,
    LineSeries,
    VerticalGridLines,
    HorizontalGridLines,
    XAxis,
    YAxis,
    LabelSeries
} from 'react-vis';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import LoadSelector from '../components/LoadSelector';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import React, { useEffect, useState} from 'react';
import io from "socket.io-client";
import {useInterval} from "../useInterval";

// let endpoint = "wss://react-vis-app-test.herokuapp.com/" // this is when run on server ***** change it
// let endpoint = "http://127.0.0.1:5000/"
// let socket = io.connect(endpoint);
function CantileverBeamApp(){

    const butStyle = {background: "black", height:window.innerHeight/12,
        width:window.innerWidth/10 ,borderRadius: 8, color: "white"}
    const maxLoads = 3;
    const [beamProperties,setBeamProperties] = useState({length : 100, elasticity : 1.0, inertia: 1.0, density : 1.0, area: 1.0, dampingRatio:0.02, rA : 85000.0, EI: 210000000000.0,mass:10.0, gravity:9.8})
    const [onceLoaded, setOnceLoaded] = useState(false)
    const [isBeamIni, setIsBeamIni] = useState(false)
    const [isLoadInitialized, setIsLoadInitialized] = useState(false)
    // edit this to add or edit add a load
    const [loads,setLoads] = useState({})
    const [selectedLoad, setSelectedLoad] = useState('load1')
    const [loadUpdated, setLoadUpdated] = useState(false)
    const [newLoadData, setNewLoadData] = useState({name:loadNamer(), mass:10.0, location:beamProperties.length / 2})
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [initialFormWarning, setInitialFormWarning] = useState("");
    const [loadFormWarning, setLoadFormWarning] = useState("");

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
        setNewLoadData({name:loadNamer(), mass:10.0, location:beamProperties.length / 2});
        setOpenAdd(true);
    };
    const handleClickOpenEdit = () => {
        setNewLoadData({name:selectedLoad, ...loads[selectedLoad]});
        setOpenEdit(true);
    };


    var loadData = beamProperties

    // Function for cancelling/confirming in the Add Load menu.
    const handleCloseAdd = (event) => {
        if(event !== "confirm"){
            setOpenAdd(false);
            setLoadFormWarning("");
            return;
        }
        validateInputsLoadForm(true);
        if(loadFormWarning !== "")
            return;
        // confirm came in
        loads[newLoadData.name] = {mass: newLoadData.mass, location: newLoadData.location};
        setSelectedLoad(newLoadData.name);
        setLoadUpdated(true);
        setOpenAdd(false);
        setLoadFormWarning("");
    };
    // Function for cancelling/confirming in the Edit Load menu.
    const handleCloseEdit = (event) => {
        if(event !== "confirm"){
            setOpenEdit(false);
            setLoadFormWarning("");
            return;
        }
        validateInputsLoadForm(false);
        if(loadFormWarning !== "")
            return;
        // confirm came in
        for(let load in loads) {
            // This is done to preserve the ordering of the loads list.
            if(load !== selectedLoad) {
                let mass = loads[load].mass;
                let location = loads[load].location;
                delete loads[load];
                loads[load] = {mass:mass, location:location}
            }
            else {
                delete loads[load];
                loads[newLoadData.name] = {mass:newLoadData.mass, location:newLoadData.location};
                setSelectedLoad(newLoadData.name);
                setLoadUpdated(true);
                setOpenEdit(false);
                setLoadFormWarning("");
            }
        }
    };
    // handle loads empty case
    useEffect(()=>{if(loadUpdated === false){return;}
        setLoadUpdated(false);loadNamer();dataMakerForLoads(loads,selectedLoad,beamProperties)},[loadUpdated,dataMakerForLoads])


    // Function to pick the first available load name of the form load1, load2, load3...
    function loadNamer(){
        var n = 1;
        var name = ""
        while(true){
            name = "Load " + n;
            //console.log(name in loads)
            if(name in loads){
                n += 1;
                continue;
            }
            break;
        }
        return name;
    }

    function deleteLoad(){
        //deleteLoad(d,e)
        // to activate right click delete just add onRightClick to label with d,e
        delete loads[selectedLoad];

        for(let load in loads){
            setSelectedLoad(load)
            break;
        }
        setLoadUpdated(true)
        // playerMovement(0,1,10)
    }

    // This function determines which load was clicked, and selects it.
    function loadSwitcher(d,event){
        console.log("got called in load switcher")
        console.log(d)
        for(let load in loads){
            if(loads[load].location === d.x){
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
        if(newLoc < 0)
            newLoc = 0;
        else if(newLoc > beamProperties.length)
            newLoc = beamProperties.length;
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
            if(loads[load].location > beamProperties.length) {
                setInitialFormWarning(load + " location must be less than or equal to Length of Beam.");
                return;
            }
        
        // No errors.
        setInitialFormWarning("");
    }

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

        // Check that location is a number >= 0 and <= beam length.
        if(parseFloat(newLoadData.location) != newLoadData.location){
            setLoadFormWarning("Location must be a number.");
            return;
        }
        newLoadData.location = Number(newLoadData.location);
        if(newLoadData.location < 0) {
            setLoadFormWarning("Location must be at least 0.");
            return;
        }
        if(newLoadData.location > beamProperties.length) {
            setLoadFormWarning("Location must be less than or equal to Length of Beam.");
            return;
        }

        // No errors.
        setLoadFormWarning("");
    }
    

    // Function for using the load selector dropdown or initial form radio buttons to change selected load
    function handleSelectedChange(event){
        setSelectedLoad(event.target.value);
    }

    // Function for submitting the first inputs form
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
                label={load + ": Location = " + loads[load].location + ", Mass = " + loads[load].mass}
            />)
        return labels;
    }

    // Display the first inputs form 
    if(!isBeamIni){
        var data = beamProperties;
        return(<form onSubmit={(e)=> {handleSubmit(data, e)}}>
            <div></div>
            <label>Length of beam:
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
            <Dialog open={openAdd} onClose={handleCloseAdd} >
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
                {/* Display main plot */}
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} xDomain = {[0, 100]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Load Location"}/>
                    <YAxis/>
                    {/* Display Beam */}
                    <LineSeries data = {[{x : 0, y : 0},{x : 100, y : 0}]} color = "#12939A"/>
                    {/* Display the anchor next to the beam */}
                    <LineSeries data = {[{x : 0, y : -10}, {x : 0, y : 10}]} color = "#12939A"/>
                    <LineSeries data = {[{x : 0, y : 10}, {x : -2, y : 6}]} color = "#12939A"/>
                    <LineSeries data = {[{x : 0, y : 6}, {x : -2, y : 2}]} color = "#12939A"/>
                    <LineSeries data = {[{x : 0, y : 2}, {x : -2, y : -2}]} color = "#12939A"/>
                    <LineSeries data = {[{x : 0, y : -2}, {x : -2, y : -6}]} color = "#12939A"/>
                    <LineSeries data = {[{x : 0, y : -6}, {x : -2, y : -10}]} color = "#12939A"/>
                    <LineSeries data = {[{x : 0, y : 10}, {x : -2, y : 10}]} color = "#12939A"/>
                    <LineSeries data = {[{x : 0, y : -10}, {x : -2, y : -10}]} color = "#12939A"/>
                    {/* Display Loads */}
                    <LabelSeries data={dataMakerForLoads(loads,selectedLoad,beamProperties)} onValueClick = {(d,event)=>{loadSwitcher(d,event)}} />
                </XYPlot>
                {/* Display drop-down load selector */}
                <LoadSelector loadList={loads} value={selectedLoad} onChange={handleSelectedChange} />
                <div>
                    {/* Display Add Load button */}
                    <Button variant="outlined" sx={{width:135}} onClick={handleClickOpenAdd}>
                        Add Load
                    </Button>
                    {/* Display Edit Load button */}
                    <Button variant="outlined" sx={{width:135}} onClick={handleClickOpenEdit} disabled={Object.keys(loads).length === 0}>
                        Edit Load
                    </Button>
                    <Button variant="outlined" sx={{width:135}} onClick={deleteLoad} disabled={Object.keys(loads).length === 0}>
                        Delete Load
                    </Button>
                    {/* Display Add Load menu */}
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
                        </DialogContent>
                        <DialogContentText align="center" sx={{fontWeight: "bold", height:30}}>{loadFormWarning}</DialogContentText>
                        <DialogActions>
                            <Button onClick={()=>{handleCloseAdd("cancel")}}>Cancel</Button>
                            <Button onClick={()=>{handleCloseAdd("confirm")}}>Confirm</Button>
                        </DialogActions>
                    </Dialog>
                    {/* Display Edit Load menu */}
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
                        </DialogContent>
                        <DialogContentText align="center" sx={{fontWeight: "bold", height:30}}>{loadFormWarning}</DialogContentText>
                        <DialogActions>
                            <Button onClick={()=>{handleCloseEdit("cancel")}}>Cancel</Button>
                            <Button onClick={()=>{handleCloseEdit("confirm")}}>Confirm</Button>
                        </DialogActions>
                    </Dialog>
                </div>
                <div>
                    {/* Display control buttons */}
                    <Button variant="contained" sx={{margin: 0.5}} id={"multi_left_btn"} onClick={()=>{playerMovement(-1,1,10)}}><span>&#8592;</span></Button>
                    <Button variant="contained" sx={{margin: 0.5}} id={"multi_jump_btn"} onClick={()=>{playerMovement(0,5,10)}}><span>JUMP</span></Button>
                    <Button variant="contained" sx={{margin: 0.5}} id={"multi_right_btn"} onClick={()=>{playerMovement(1,1,10)}}><span>&#8594;</span></Button>
                </div>
            </div>
            <div>
                <h1>Plots</h1>
                {/* Display side plots */}
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} margin = {{left : 10}}>
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
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[-6500, 6500]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Bending Moment Diagram"}/>
                    <XAxis/>
                    <YAxis/>
                    <LineSeries data = {[{x : 0, y : 0},{x : 100,y : 0}]} />
                    <LineSeries data={movementBendingDiagram(loads,beamProperties)}/>
                </XYPlot>
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[35, 35]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Deflection Diagram"}/>
                    <XAxis/>
                    <YAxis/>
                    <LineSeries data = {[{x : 0, y : 0},{x : 100,y : 0}]} />
                    <LineSeries data={deflection(loads, beamProperties)} curve={'curveMonotoneX'}/>
                </XYPlot>


            </div>
        </div>
    )
}
function updateMdata(data){
    let d = []
    for(let o in data){
        d.push( {x:data[o].x * 100/9 , y:data[o].y})
    }
    return d
}
// This function converts data about loads so a LabelSeries can display it. This includes the labels above each load, and the arrow character representing each load.
function dataMakerForLoads(loads, selectedLoad, beamProperties){

    var data = []
    var length = beamProperties.length
    for(let load in loads){
        var ycord = 0// calculate y with a function for dynamic
        // Load label
        data.push({x: loads[load].location , y: 35, label: load.toString(), style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        let label;
        if(load === selectedLoad)
            label = "m="+loads[load].mass+", x="+ loads[load].location;
        else
            label = loads[load].mass+", "+ loads[load].location;
        data.push({x: loads[load].location , y: 28, label: label , style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        // Arrow icon
        data.push({x: loads[load].location , y: 0, label: "\u2193", style: {fontSize: 45, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
    }
    return data;
}
function shearForceData(loads, beamProperties){
    // sorting data
    var length = beamProperties.length
    var loadList = []
    for(var load in loads){
        loadList.push(loads[load])
    }
    loadList.sort((a,b)=>(a.location > b.location) ? 1 : -1);
    //
    var dataList = []
    var x = 0;
    var r1 = 0;
    // var r2 = 0;
    var l = length;
    // use key >>>
    // calculating r1
    for(let load in loads){
        var p = loads[load].mass; // what is p ?
        // console.log('in for printing')
        // console.log(loads[load])
        var d = length - loads[load].location;
        // var val = p * d;
        var val = p
        r1 += val;
        // r2 += p;
    }
    // r1 = r1 / 30
    // r1 = r1/l;
    // sheer calculation

    // dynamically want to add data to a list for each load refer this code.
    var cp = 0;
    for(let i = 0 ; i < loadList.length; i++){
        var x2 = loadList[i].location;
        var y = r1 - cp;
        cp+= loadList[i].mass;
        dataList.push({x:x,y:y})
        dataList.push({x:x2,y:y})
        x = x2;
    }
    dataList.push({x:x,y:r1-cp})
    dataList.push({x:length,y:r1-cp})
    return dataList;
    // lists
    // objects
    // for loop for objects, properties and for loop for lists.
}


function movementBendingDiagram(loads, beamProperties){
    // sorting data
    var length = beamProperties.length;
    var loadList = []
    for(var load in loads){
        loadList.push(loads[load])
    }
    loadList.sort((a,b)=>(a.location > b.location) ? 1 : -1);
    //
    var dataList = []
    var x = 0;
    var r1 = 0;
    var l = length;
    // use key >>>
    // calculating r1
    var s = 0
    for(let load in loads){
        var p = loads[load].mass; // what is p ?
        // console.log('in for printing')
        // console.log(loads[load])
        var d = length - loads[load].location;
        s += p
        var val = p * d;
        r1 += val;
        // r2 += p;
    }
    // r1 = r1/l;
    // bending calculation
    dataList.push({x:0,y:-1 * r1})
    //var diff = loadList[loadList.length-1].location*loadList[loadList.length-1].mass
    // dynamically want to add data to a list for each load refer this code.
    let tsum = 0;
    for(let i = 0 ; i < loadList.length ; i++){
        x = loadList[i].location
        val = x*s - r1;
        tsum = 0
        for(let j = 0;j < i; j++){
            var xj = loadList[j].location;
            var pj = loadList[j].mass;
            tsum += pj*(x-xj)
        }
        dataList.push({x:x,y:(val - tsum)})
    }
    dataList.push({x:length,y:100*s - r1 - tsum})
    for(let o of dataList){
        o.y -= 100*s - r1 - tsum
    }

    return dataList;
    // lists
    // objects
    // for loop for objects, properties and for loop for lists.
}
function plotReactions(loads,beamProperties){
    var length = beamProperties.length;
    var r1 = 0;
    var l = length;
    // use key >>>
    var s = 0;
    for(let load in loads){
        var p = loads[load].mass; // what is p ?
        // console.log('in for printing') // debugging // equivalent to print in python
        // console.log(loads[load]) // debugging
        s += p
        var d = length - loads[load].location;
        var val = p * d;
        r1 += val;
    }
    // devide by l ? doubt
    // r1 = r1/l;
    const data = [
        {x: 0, y: -40, label: 'M = ' + r1, style: {fontSize: 15}},
        {x: 0, y: -50, label: 'R = ' + s, style: {fontSize: 15}},
        {x: 0, y: -35, label: "\u2191", style: {fontSize: 35}}
    ]
    return data

}
function internalForce(loads,length){
    return [{x:0,y:0}]
}
function deflection(loads, beamProperties){
    // consider variable properties later
    var length = beamProperties.length;
    var dataList = []
    var x = 0
    var delta = 1
    // dataList.push({x:0,y:0})
    while(x <=length){
        var y = 0;
        for(let load in loads){
            var p = loads[load].mass;
            var a = loads[load].location
            var val = deflectionOfSingleLoad(p,x,length,a);
            y += val;
        }
        // console.log('data calculated')
        // console.log(y)
        dataList.push({x:x,y:-1*y})
        x+= delta
    }
    return dataList

}


function deflectionOfSingleLoad(p,x,l,a){
    // pass in properties object for variable e,i valuees
    var e = 2110000;
    var i = 0.33;
    var val =0;
    if( x <= a){
        // val = p * (l-a) * x;
        // val = val/(6 * l * e * i );
        // val = val * ((l * l) - (x * x) - ((l-a) * (l-a)));
        val = p * x * x *( 3 * a - x)

    }else{
        // val = p * (l-a);
        // val = val/(6 * l * e * i );
        // val = val*((l*(Math.pow((x-a),3))/(l-a)) + (((l*l)-Math.pow(l-a,2))*x) - (x*x*x))
        val = p *a * a * ( (3 * x) - a )
    }
    val = val /(6 * e * i)
    return val;
}
export default CantileverBeamApp;
