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
import LoadSelector from '../components/LoadSelector';
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
    const [loads,setLoads] = useState({load1 : {mass:10.0,location:50.0}, load2 : {mass:10.0, location: 20.0}, load3 : {mass:15.0, location: 60.0}, load4 : {mass: 20.0, location: 70.0} , load5 : {mass: 10.0, location: 30.0} })
    const [selectedLoad, setSelectedLoad] = useState('load1')
    const [loadUpdated, setLoadUpdated] = useState(false)
    const [newMass, setNewMass] = useState(10.0)
    const [newLocation, setNewLocation] = useState(10)
    const [newLoadName, setNewLoadName] = useState("newLoad")
    const [open, setOpen] = React.useState(false);
    const [errorWarning, setErrorWarning] = useState("");
    const handleClickOpen = () => {
        setOpen(true);
    };

    var loadData = beamProperties

    // Function for cancelling/confirming in the Add A Load menu.
    const handleClose = (event) => {
        if(event === "cancel"){
            setOpen(false);
            return;
        }
        // confirm came in
        loads[newLoadName] = {mass: newMass, location: newLocation};
        setLoadUpdated(true);
        setOpen(false);
    };
    // handle loads empty case
    useEffect(()=>{if(loadUpdated === false){return;}
        setLoadUpdated(false);loadNamer();dataMakerForLoads(loads,selectedLoad,beamProperties)},[loadUpdated,dataMakerForLoads])


    // Function to pick the first available load name of the form load1, load2, load3...
    function loadNamer(){
        var n = 1;
        var name = ""
        while(true){
            name = "load" + n;
            console.log(name in loads)
            if(name in loads){
                n += 1;
                continue;
            }
            break;
        }
        setNewLoadName(name);
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
     function validateInputs(){
        // Check that length is a number > 0.
        if(parseFloat(beamProperties.length) != beamProperties.length){
            setErrorWarning("Length of Beam must be a number.");
            return;
        }
        beamProperties.length = Number(beamProperties.length);
        if(beamProperties.length <= 0) {
            setErrorWarning("Length of Beam must be greater than 0.");
            return;
        }

        // Check that elasticity is a number >= 0
        if(parseFloat(beamProperties.elasticity) != beamProperties.elasticity){
            setErrorWarning("Elasticity must be a number.");
            return;
        }
        beamProperties.elasticity = Number(beamProperties.elasticity);
        if(beamProperties.elasticity < 0) {
            setErrorWarning("Elasticity must be at least 0.");
            return;
        }

        // Check that inertia is a number >= 0.
        if(parseFloat(beamProperties.inertia) != beamProperties.inertia){
            setErrorWarning("Inertia must be a number.");
            return;
        }
        beamProperties.inertia = Number(beamProperties.inertia);
        if(beamProperties.inertia < 0) {
            setErrorWarning("Inertia must be at least 0.");
            return;
        }

        // Check that density is a number >= 0.
        if(parseFloat(beamProperties.density) != beamProperties.density){
            setErrorWarning("Density must be a number.");
            return;
        }
        beamProperties.density = Number(beamProperties.density);
        if(beamProperties.density < 0) {
            setErrorWarning("Density must be at least 0.");
            return;
        }

        // Check that area is a number >= 0.
        if(parseFloat(beamProperties.area) != beamProperties.area){
            setErrorWarning("Area must be a number.");
            return;
        }
        beamProperties.area = Number(beamProperties.area);
        if(beamProperties.area < 0) {
            setErrorWarning("Area must be at least 0.");
            return;
        }


        // Check that damping ratio is a number >= 0.
        if(parseFloat(beamProperties.dampingRatio) != beamProperties.dampingRatio){
            setErrorWarning("Damping Ratio must be a number.");
            return;
        }
        beamProperties.dampingRatio = Number(beamProperties.dampingRatio);
        if(beamProperties.dampingRatio < 0) {
            setErrorWarning("Damping Ratio must be at least 0.");
            return;
        }


        // Check that rA is a number >= 0.
        if(parseFloat(beamProperties.rA) != beamProperties.rA){
            setErrorWarning("rA must be a number.");
            return;
        }
        beamProperties.rA = Number(beamProperties.rA);
        if(beamProperties.rA < 0) {
            setErrorWarning("rA must be at least 0.");
            return;
        }

        // Check that EI is a number > 0.
        if(parseFloat(beamProperties.EI) != beamProperties.EI){
            setErrorWarning("EI must be a number.");
            return;
        }
        beamProperties.EI = Number(beamProperties.EI);
        if(beamProperties.EI <= 0) {
            setErrorWarning("EI must be greater than 0.");
            return;
        }

        // Check that gravity is a number >= 0.
        if(parseFloat(beamProperties.gravity) != beamProperties.gravity){
            setErrorWarning("Gravity must be a number.");
            return;
        }
        beamProperties.gravity = Number(beamProperties.gravity);
        if(beamProperties.gravity < 0) {
            setErrorWarning("Gravity must be at least 0.");
            return;
        }

        // Check that location of load is a number >= 0 and <= beam length.
        if(parseFloat(loads[selectedLoad].location) != loads[selectedLoad].location) {
            setErrorWarning("Location of Load (L1) must be a number.");
            return;
        }
        loads[selectedLoad].location = Number(loads[selectedLoad].location);
        if(loads[selectedLoad].location < 0) {
            setErrorWarning("Location of Load (L1) must be at least 0.");
            return;
        }
        if(loads[selectedLoad].location > beamProperties.length){
            setErrorWarning("Location of Load (L1) must be less than or equal to Length of Beam.");
            return;
        }

        // No errors.
        setErrorWarning("");
    }
    
    // Function for using the load selector dropdown
    function handleDropdownChange(event){
        setSelectedLoad(event.target.value);
    }

    // Function for submitting the first inputs form
    function handleSubmit(data, e){
        if(errorWarning === "") {
            setBeamProperties(data)
            setIsBeamIni(true)
        } else
            e.preventDefault();
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
                        validateInputs();
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
                        validateInputs();
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
                        validateInputs();
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
                        validateInputs();
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
                        validateInputs();
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
                        validateInputs();
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
                        validateInputs();
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
                        validateInputs();
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
                        validateInputs();
                    }}
                />
            </label>
            <div></div>
            <label>Location of Load (L1):
                <input
                    defaultValue={20}
                    type="text"
                    onChange={(e) => {
                        loads[selectedLoad].location = e.target.value
                        validateInputs();
                    }}
                />
            </label>
            <div></div>
            {/* Text display for invalid inputs. */}
            <div><span style={{fontWeight: 'bold'}}>{errorWarning}</span></div> 
            <div></div>     
            <input type="submit" value="analyze" autoFocus/>
            <div></div>
        </form>);
    }

    if(!onceLoaded){
        setOnceLoaded(true)
    }
    return(
        <div className={"rowC"} onKeyDown={handleKeyDown} tabIndex="0">
            <div>
                <div>
                    {/* Display Add A Load button */}
                    <Button variant="outlined" onClick={handleClickOpen}>
                        Add a load
                    </Button>
                    {/* Display Add A Load menu */}
                    <Dialog open={open} onClose={handleClose}>
                        <DialogTitle>Add A load</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Please enter load properties
                            </DialogContentText>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Name of Load"
                                defaultValue={newLoadName}
                                type="text"
                                onChange={(val)=>{setNewLoadName(val.target.value)}}
                                fullWidth
                                variant="standard"
                            />
                            <TextField
                                autoFocus
                                margin="dense"
                                label="mass"
                                defaultValue={10}
                                type="number"
                                onChange={(val)=>{setNewMass(parseFloat(val.target.value))}}
                                fullWidth
                                variant="standard"
                            />
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Location"
                                type="number"
                                defaultValue={10}
                                onChange={(val)=>{setNewLocation(parseFloat(val.target.value))}}
                                fullWidth
                                variant="standard"
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={()=>{handleClose("cancel")}}>Cancel</Button>
                            <Button onClick={()=>{handleClose("confirm")}}>Confirm</Button>
                        </DialogActions>
                    </Dialog>
                </div>

                {/* Display main plot */}
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} xDomain = {[0, 100]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Load location"}/>
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
                <LoadSelector loadList={loads} value={selectedLoad} onChange={handleDropdownChange} />
                <div><span>{"*** selected : " + selectedLoad.toString() + " ***"}</span></div>
                {/* Display control buttons */}
                <Button variant="contained" sx={{margin: 0.5}} id={"multi_left_btn"} onClick={()=>{playerMovement(-1,1,10)}}><span>&#8592;</span></Button>
                <Button variant="contained" sx={{margin: 0.5}} id={"multi_jump_btn"} onClick={()=>{playerMovement(0,5,10)}}><span>JUMP</span></Button>
                <Button variant="contained" sx={{margin: 0.5}} id={"multi_right_btn"} onClick={()=>{playerMovement(1,1,10)}}><span>&#8594;</span></Button>
                <Button variant="contained" sx={{margin: 0.5}} id={"multi_delete_btn"}onClick={()=>{deleteLoad()}}>delete</Button>

            </div>
            <div>
                {/* Display side plots */}
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} margin = {{left : 10}}>
                    {/*<h1>Shear Force Diagram</h1>*/}
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Shear Force"}/>
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
                    <XAxis title = {"Deflection"}/>
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
    var diff = loadList[loadList.length-1].location*loadList[loadList.length-1].mass
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
