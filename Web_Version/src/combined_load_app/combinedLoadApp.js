import '../App.css'
import React, { useEffect, useState} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField} from '@mui/material'
import LoadSelector from '../components/LoadSelector';
import {HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis} from "react-vis";
import {inv, multiply} from "mathjs";


function CombinedLoadApp(){

    const butStyle = {background: "black", height:window.innerHeight/12,
        width:window.innerWidth/10 ,borderRadius: 8, color: "white"}
    const [beamProperties,setBeamProperties] = useState({length: 100, elasticity: 1.0, inertia: 1.0, density: 1.0, area: 1.0, dampingRatio:0.02, rA: 85000.0, EI: 210000000000.0, mass:10.0, gravity:9.8, loacationOfLoad:20})
    const [onceLoaded, setOnceLoaded] = useState(false)
    const [isBeamIni, setIsBeamIni] = useState(false)
    const [loads,setLoads] = useState({load1: {mass:10.0, location:50.0, type:"d", length:25, color:"#12345680"}, load2: {mass:10.0, location: 20.0, type: "c", length: 0}, load3: {mass: 15.0, location: 60.0, type: "d", length: 25, color: "#40960080"}, load4: {mass: 20.0, location: 70.0, type: "c", length: 25}, load5: {mass: 10.0, location: 30.0, type: "c", length: 25}})
    const [selectedLoad, setSelectedLoad] = useState('load1')
    const [loadUpdated, setLoadUpdated] = useState(false)
    const [newMass, setNewMass] = useState(10.0)
    const [newLocation, setNewLocation] = useState(10)
    const [newLoadType, setNewLoadType] = useState("c")
    const [newLoadLength, setNewLoadLength] = useState(25)
    const [newLoadName, setNewLoadName] = useState("newLoad")
    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    /**
     * Function is executed upon closing the Add A Load menu either by Canceling or Confirming.
     * This function creates a new load.
     */
    const handleClose = (event) => {
        // If closed via cancel button, do nothing.
        if(event === "cancel"){
            setOpen(false);
            return;
        }
        // If closed via confirm button, create a new load.
        // Pick a random color, in the range #000000 to #9F9F9F, always opacity 50%.
        let newR = Math.floor(Math.random() * 160).toString(16);
        let newG = Math.floor(Math.random() * 160).toString(16);
        let newB = Math.floor(Math.random() * 160).toString(16);
        let newColor = "#" + newR + newG + newB + "80";
        // Make the load.
        loads[newLoadName] = {mass: newMass, location: newLocation, type: newLoadType, length: (newLoadType === "c")?0:newLoadLength, color: newColor};
        setSelectedLoad(newLoadName);
        setLoadUpdated(true);
        setOpen(false);
    };
    useEffect(()=>{if(loadUpdated === false){return;}
        setLoadUpdated(false);loadNamer();dataMakerForLoads(loads,beamProperties)},[loadUpdated,dataMakerForLoads])

    // Function to pick the first unoccupied load name like load1, load2, load3...
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
        delete loads[selectedLoad];

        for(let load in loads){
            setSelectedLoad(load)
            break;
        }
        setLoadUpdated(true)
    }

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
        loads[selectedLoad].location += disp;
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

    function handleDropdownChange(event){
        setSelectedLoad(event.target.value);
    }
    
    function handleSubmit(data){
        setBeamProperties(data)
        setIsBeamIni(true)
    }

    if(!isBeamIni){
        var data = beamProperties;
        return(<form onSubmit={()=> {handleSubmit(data)}}>
            <div></div>
            <label>Length of beam:
                <input
                    defaultValue={100}
                    type="text"
                    onChange={(e) => {data.length = e.target.value}}
                />
            </label>
            <div></div>
            <label>Elasticity:
                <input
                    defaultValue={1.0}
                    type="text"
                    onChange={(e) => {data.elasticity = e.target.value}}
                />
            </label>
            <div></div>
            <label>Inertia:
                <input
                    defaultValue={1.0}
                    type="text"
                    onChange={(e) => {data.inertia = e.target.value}}
                />
            </label>
            <div></div>
            <label>Density:
                <input
                    defaultValue={1.0}
                    type="text"
                    onChange={(e) => {data.density = e.target.value}}
                />
            </label>
            <div></div>
            <label>Area:
                <input
                    defaultValue={1.0}
                    type="text"
                    onChange={(e) => {data.area = e.target.value}}
                />
            </label>
            <div></div>
            <label>Damping Ratio:
                <input
                    defaultValue={0.02}
                    type="text"
                    onChange={(e) => {data.dampingRatio = e.target.value}}
                />
            </label>
            <div></div>
            <label>rA:
                <input
                    defaultValue={85000.0}
                    type="text"
                    onChange={(e) => {data.rA = e.target.value}}
                />
            </label>
            <div></div>
            <label>EI:
                <input
                    defaultValue={210000000000.0}
                    type="text"
                    onChange={(e) => {data.EI = e.target.value}}
                />
            </label>
            <div></div>
            <label>Gravity:
                <input
                    defaultValue={9.8}
                    type="text"
                    onChange={(e) => {data.gravity = e.target.value}}
                />
            </label>
            <div></div>
            <label>Location of Load:
                <input
                    defaultValue={20}
                    type="text"
                    onChange={(e) => {data.loacationOfLoad = e.target.value}}
                />
            </label>
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
                    <Button variant="outlined" onClick={handleClickOpen}>
                        Add a load
                    </Button>
                    <Dialog open={open} onClose={handleClose}>
                        <DialogTitle>Add A load</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Please enter load properties (Don't fill in the length if load is Concentrated)
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
                                defaultValue={newMass}
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
                                defaultValue={newLocation}
                                onChange={(val)=>{setNewLocation(parseFloat(val.target.value))}}
                                fullWidth
                                variant="standard"
                            />
                            <TextField
                                autoFocus
                                margin="dense"
                                label="TYPE(enter c for concentrated or d for distributed)"
                                type="text"
                                defaultValue={newLoadType}
                                onChange={(val)=>{setNewLoadType(val.target.value.toString())}}
                                fullWidth
                                variant="standard"
                            />
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Length (only if distributed)"
                                type="number"
                                defaultValue={newLoadLength}
                                onChange={(val)=>{setNewLoadLength(parseFloat(val.target.value))}}
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

                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Load location"}/>
                    <YAxis/>
                    <LineSeries data = {[{x : 0, y : 0},{x : 100,y : 0}]} />
                    <LabelSeries data={dataMakerForLoads(loads,beamProperties)} onValueClick = {(d,event)=>{loadSwitcher(d,event)}} />
                    {/* Display distributed loads. */}
                    {Object.entries(loads).map((load) => {
                        console.log(load[0]);
                        console.log(load[1]);
                        if(load[1].type==="d")
                            return (
                                <LineSeries 
                                    color={load[1].color}
                                    strokeWidth={3}
                                    data={[{x:load[1].location,y:8},{x:(load[1].location+load[1].length),y:8}]}
                                    onSeriesClick={(event) => {setSelectedLoad(load[0])}}
                                />
                            );
                    })}
                </XYPlot>
                <LoadSelector loadList={loads} value={selectedLoad} onChange={handleDropdownChange} />
                <div><span>{"*** selected : " + selectedLoad.toString() + " ***"}</span></div>
                <Button variant="contained" sx={{margin: 0.5}} id={"multi_left_btn"} onClick={()=>{playerMovement(-1,1,10)}}><span>&#8592;</span></Button>
                <Button variant="contained" sx={{margin: 0.5}} id={"multi_jump_btn"} onClick={()=>{playerMovement(0,5,10)}}><span>JUMP</span></Button>
                <Button variant="contained" sx={{margin: 0.5}} id={"multi_right_btn"} onClick={()=>{playerMovement(1,1,10)}}><span>&#8594;</span></Button>
                <Button variant="contained" sx={{margin: 0.5}} id={"multi_delete_btn"}onClick={()=>{deleteLoad()}}>delete</Button>

            </div>
            <div>
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[3, 3]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Deflection"}/>
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
                    <XAxis title = {"Sheer Force"}/>
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
 * For centralized loads it puts load name, mass, and position.
 * For distributed loads it puts load name, mass, position, and length. 
 * Distributed load labels are lower than centralized load labels to reduce the amount of overlapping text.
 * 
 * This function also creates arrow text characters to indicate the positions of loads.
 * This function is not responsible for displaying the line part of the distributed loads, but it does give the arrows.
 * @param {*} loads 
 * @param {*} beamProperties 
 * @returns 
 */
function dataMakerForLoads(loads, beamProperties){
    var data = []
    for(let load in loads){
        console.log("load is : " + load.type)
        // Centralized Loads
        if(loads[load].type === "c"){
            // Put load name.
            data.push({x: loads[load].location, y: 35, loadID: load, label: load.toString(), style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            // Put load stats (mass, position).
            data.push({x: loads[load].location, y: 30, loadID: load, label: "m=" + loads[load].mass + ", x=" + loads[load].location, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            // Put a big arrow.
            data.push({x: loads[load].location, y: -5, loadID: load, label: "\u2193", style: {fontSize: 45, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        // Distributed Loads
        }else{
            // Put load name.
            data.push({x: loads[load].location+loads[load].length/2, y: 25, loadID: load, label: load.toString(), style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            // Put load stats (mass, position, length).
            data.push({x: loads[load].location+loads[load].length/2, y: 20, loadID: load, label: "m=" + loads[load].mass + ", x=" + loads[load].location +", L=" + loads[load].length, style: {fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            // Put a small arrow every 5 units from the left-end.
            for(let i = loads[load].location; i < loads[load].location+loads[load].length; i += 5)
                data.push({x: i, y: -3, loadID: load, label: "\u2193",  style: {fontSize: 25, dominantBaseline: "text-after-edge", textAnchor: "middle", fill: loads[load].color}})
            // Put a small arrow at the right-end.
            data.push({x: loads[load].location + loads[load].length, y: -3, loadID: load, label: "\u2193", color: loads[load].color, style: {fontSize: 25, dominantBaseline: "text-after-edge", textAnchor: "middle", fill: loads[load].color}})
        }
    }
    return data;
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
        if(myload.type === "c"){
            let p = myload.mass
            let l = length
            let a = myload.location
            allDataList.push(shearForceDataConcentrated(p,l,a))
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
function shearForceDataConcentrated(p,l,a){
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
        if(myload.type === "c"){
            let p = myload.mass
            let l = length
            let a = myload.location
            allDataList.push(movementBendingDiagramConcentrated(p,l,a))
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
function movementBendingDiagramConcentrated(p,l,a){
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
        if(myload.type === "c"){
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
            if(loads[load].type !== "c"){
                continue
            }
            var p = loads[load].mass;
            var a = loads[load].location
            var val = deflectionOfSingleLoadConcentrated(p,x,length,a);
            y += val;
        }
        dataList.push({x:x,y:-1*y})
        x+= delta
    }
    let allDataList = [dataList]
    for(let load in loads){
        let myload = loads[load]
        if(myload.type === "c"){
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


function deflectionOfSingleLoadConcentrated(p,x,l,a){
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