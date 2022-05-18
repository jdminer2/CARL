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
import React, { useEffect, useState} from 'react';
import io from "socket.io-client";
import {useInterval} from "../useInterval";

let endpoint = "wss://react-vis-app-test.herokuapp.com/" // this is when run on server ***** change it
// let endpoint = "http://127.0.0.1:5000/"
let socket = io.connect(endpoint);
function MultipleLoadApp(){

    const butStyle = {background: "black", height:window.innerHeight/12,
        width:window.innerWidth/10 ,borderRadius: 8, color: "white"}
    const maxLoads = 3;
    const [beamProperties,setBeamProperties] = useState({length : 100, elasticity : 1.0, inertia: 1.0, density : 1.0, area: 1.0, dampingRatio:0.02, rA : 85000.0, EI: 210000000000.0,mass:10.0, gravity:9.8,loacationOfLoad:20})
    const [onceLoaded, setOnceLoaded] = useState(false)
    const [isBeamIni, setIsBeamIni] = useState(false)
    const [isLoadInitialized, setIsLoadInitialized] = useState(false)
    // edit this to add or edit add a load
    const [loads,setLoads] = useState({load1 : {mass:10.0,location:50.0}, load3 : {mass:15.0, location: 60.0}, load2 : {mass:10.0, location: 20.0}, load4 : {mass: 20.0, location: 70.0} , load5 : {mass: 10.0, location: 30.0} })
    const [selectedLoad, setSelectedLoad] = useState('load1')
    const [loadUpdated, setLoadUpdated] = useState(false)
    const [newMass, setNewMass] = useState(10.0)
    const [newLocation, setNewLocation] = useState(10)
    const [newLoadName, setNewLoadName] = useState("newLoad")
    const [butClicked, setButClicked] = useState(false)
    const [tPing, setTping] = useState(2);
    const [isLoaded, setIsLoaded] = useState(false);
    const [items, setItems] = useState([]);
    //temp
    const lengthOfBeam = 100.0;
    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };
    const [error, setError] = useState(null);
    const [mData, setData] = useState([{x: 0, y: 0},
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 3, y: 0},
        {x: 4, y: 0},
        {x: 5, y: 0},
        {x: 6, y: 0},
        {x: 7, y: 0},
        {x: 8, y: 0},
        {x: 9, y: 0}
    ]);

    var loadData = beamProperties
    const [testUrl, setTestUrl] = useState("{'length': "+ loadData.length +", 'elasticity': "+ loadData.elasticity +", 'inertia': "+ loadData.inertia +", 'density': "+ loadData.density +", 'area': "+ loadData.area +", 'dampingRatio':"+ loadData.dampingRatio +", 'rA': "+ loadData.rA +", 'EI': "+ loadData.EI +", 'mass': ["+ [10.0,15.0,10.0,20.0,10.0] +"], 'gravity': "+ loadData.gravity +", 'force': ["+ [100.0,150.0,100.0,200.0,100.0] +"], 'locationOfLoad': ["+ [50,60,20,70,30] +"], 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 2, 'timelimit' : 100, 'q': 0, 'mt': 0}")
    // const [testUrl, setTestUrl] = useState(iurl)
    const [mi, setI] = useState(0)

    const responseReceived = () => {
        // if(isLoadInitialized === false){
        //     return;
        // }
        socket.on('message',message => {
            console.log("came here")
            setItems(message)
            setI(0)
            setButClicked(false)
            setIsLoaded(true)
        })
    }
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
        setLoadUpdated(false);loadNamer();},[loadUpdated,dataMakerForLoadsDynamic])
    useEffect(() => {
        socket.emit("message",testUrl)
    },[testUrl])
    useEffect(() =>{
        responseReceived()
    },[responseReceived])

    function calcPlayerLoc(loc, data){
        if(data === undefined){
            return 0;
        }
        var px  = (9/100)*loc
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
        console.log(py)
        return py
    }

    function updateGraph(){

        if(!isBeamIni){
            return;
        }
        if(!isLoaded){
            console.log("not loaded yet")
            // console.log(items)
            if(!onceLoaded){
                return
            }
        }
        // console.log(items)
        if(items.message === undefined){
            return;
        }
        const data = [
            {x: 0, y: items.message[mi][0]},
            {x: 1, y: items.message[mi][1]},
            {x: 2, y: items.message[mi][2]},
            {x: 3, y: items.message[mi][3]},
            {x: 4, y: items.message[mi][4]},
            {x: 5, y: items.message[mi][5]},
            {x: 6, y: items.message[mi][6]},
            {x: 7, y: items.message[mi][7]},
            {x: 8, y: items.message[mi][8]},
            {x: 9, y: items.message[mi][9]}
        ];

        if(mi < items.message.length) {
            setI(mi + 1);
            setData(data)
            if(mi === items.message.length - 20){
                // loacations
                playerMovement(0,2, 10)
            }
        }else{
            setIsLoaded(false)
            // playerMovement(playerLoc,1, items.message.length-1,true,10)
        }

    }
    useInterval(updateGraph, -1);


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
        if(!isLoaded){
            console.log("not loaded items is : ")
            console.log(items)
            return;
        }
        if(!(selectedLoad in loads)){
            return
        }
        setIsLoaded(false)
        loads[selectedLoad].location += disp;
        setLoadUpdated(true)
        var turl = makeUrl(mag,tl);
        setButClicked(true)
        console.log(turl)
        setTestUrl(turl)
    }
    function makeUrl(mag,tl){
        // var ival = Math.min([ival+10,items.message.length-1])
        var ival = mi;

        var ival = Math.min(ival+15,items.message.length -1)
        setIsLoaded(false)
        loadData = beamProperties
        var loc = makeLocMass(mag,"locations")
        var masses = makeLocMass(mag, "masses")
        var forces = []
        for(let mass in masses){
            forces.push(mass*loadData.gravity)
        }
        console.log("testing state")
        console.log(items)
        const turl = "{'length': "+ loadData.length +", 'elasticity': "+ loadData.elasticity +", 'inertia': "+ loadData.inertia +", 'density': "+ loadData.density +", 'area': "+ loadData.area +", 'dampingRatio':"+ loadData.dampingRatio +", 'rA': "+ loadData.rA +", 'EI': "+ loadData.EI +", 'mass': ["+ masses +"], 'gravity': "+ loadData.gravity +", 'force': ["+ forces +"], 'locationOfLoad': ["+ loc  +"], 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': " + mag + ", 'timelimit' : "+tl+", 'q' : '[" +items.q[ival]+"]', 'mt' : "+ival+"}"
        return turl
    }
    function makeLocMass(mag,need){
        var locations = []
        var masses = []
        for(let load in loads){
            locations.push(loads[load].location)
            if(load === loads[selectedLoad]){
                masses.push(loads[load].mass*mag)
            }else{
                masses.push(loads[load].mass)
            }
        }
        if(need === "locations"){
            return locations
        }else{
            return masses
        }
    }

    function handleSubmit(data){
        setBeamProperties(data)
        setIsBeamIni(true)
    }

    function dataMakerForLoadsDynamic(){
        if(mData===undefined){
            return null;
        }
        var data = []
        var length = beamProperties.length
        for(let load in loads){
            var ycord = calcPlayerLoc(loads[load].location,mData)// calculate y with a function for dynamic
            var xcord = loads[load].location
            data.push({x: xcord, y: ycord+5000000, label: "\u2193", style: {fontSize: 35}})
        }
        return data;
    }

    if(error){
        return <div>Error: {error.message}</div>;
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
            <input type="submit" value="analyze" />
            <div></div>
        </form>)
    }
    if(items.message === undefined){
        return (<div>{'undefined'}</div>)
    }
    if(mData === undefined){
        return(<div>{'undefined'}</div>)
    }
    if(!onceLoaded){
        setOnceLoaded(true)
    }
    return(
        <div className={"rowC"}>
            <div>
                <div>
                    <Button variant="outlined" onClick={handleClickOpen}>
                        Add a load
                    </Button>
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
                {/*change y min and scale*/}
                <XYPlot height={window.innerHeight * 0.7} width={window.innerWidth/2} yDomain ={[-100000000,100000000]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"ACTUAL DISPLACEMENT"}/>
                    <YAxis/>
                    {/*<LineSeries data = {[{x:((9/100)*playerLoc),y: calcPlayerLoc(playerLoc,mData)},{x:((9/100)*playerLoc),y: (calcPlayerLoc(playerLoc,mData) + 15000000)}]} stroke = "black"/>*/}
                    <LabelSeries data={dataMakerForLoadsDynamic()} allowOffsetToBeReversed={false} onValueClick = {(d,event)=>{loadSwitcher(d,event)}} />
                    <LineSeries data={updateMdata(mData)} curve={'curveMonotoneX'}/>
                </XYPlot>
                <div><span>{"*** selected : " + selectedLoad.toString() + " ***"}</span></div>
                <button style={butStyle} id={"multi_left_btn"} onClick={()=>{playerMovement(-1,1,10)}}><span>&#8592;</span></button>
                <button style={butStyle} id={"multi_right_btn"} onClick={()=>{playerMovement(1,1,10)}}><span>&#8594;</span></button>
                <button style={butStyle} id={"multi_jump_btn"} onClick={()=>{playerMovement(0,5,10)}}><span>JUMP</span></button>
                <button style={butStyle} id={"multi_delete_btn"}onClick={()=>{deleteLoad()}}>delete</button>
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Load location"}/>
                    <YAxis/>
                    <LineSeries data = {[{x : 0, y : 0},{x : 100,y : 0}]} />
                    <LabelSeries data={dataMakerForLoads(loads,beamProperties)} onValueClick = {(d,event)=>{loadSwitcher(d,event)}} />
                </XYPlot>
            </div>
            <div>
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} margin = {{left : 10}}>
                    {/*<h1>Shear Force Diagram</h1>*/}
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Shear Force"}/>
                    <YAxis/>
                    {/*<LineSeries data = {[{x:((9/100)*playerLoc),y: calcPlayerLoc(playerLoc,mData)},{x:((9/100)*playerLoc),y: (calcPlayerLoc(playerLoc,mData) + 15000000)}]} stroke = "black"/>*/}
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
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[-3000, 3000]} margin = {{left : 10}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Bending Moment Diagram"}/>
                    <XAxis/>
                    <YAxis/>
                    <LineSeries data = {[{x : 0, y : 0},{x : 100,y : 0}]} />
                    <LineSeries data={movementBendingDiagram(loads,beamProperties)}/>
                </XYPlot>
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[2, 2]} margin = {{left : 10}}>
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
function dataMakerForLoads(loads, beamProperties){

    var data = []
    var length = beamProperties.length
    for(let load in loads){
        var ycord = 0// calculate y with a function for dynamic
        data.push({x: loads[load].location , y: 0, label: "\u2193", style: {fontSize: 35}})
        data.push({x: loads[load].location , y: 40, label: load.toString(), style: {fontSize: 10}})
        data.push({x: loads[load].location , y: 50, label: loads[load].mass+","+ loads[load].location , style: {fontSize: 10}})
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
    var r2 = 0;
    var l = length;
    // use key >>>
    // calculating r1
    for(let load in loads){
        var p = loads[load].mass; // what is p ?
        // console.log('in for printing')
        // console.log(loads[load])
        var d = length - loads[load].location;
        var val = p * d;
        r1 += val;
        r2 += p;
    }
    r1 = r1/l;
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
    var r2 = 0;
    var l = length;
    // use key >>>
    // calculating r1
    for(let load in loads){
        var p = loads[load].mass; // what is p ?
        // console.log('in for printing')
        // console.log(loads[load])
        var d = length - loads[load].location;
        var val = p * d;
        r1 += val;
        r2 += p;
    }
    r1 = r1/l;
    // bending calculation
    dataList.push({x:0,y:0})
    // dynamically want to add data to a list for each load refer this code.
    for(let i = 0 ; i < loadList.length ; i++){
        var x = loadList[i].location
        var val = x*r1;
        for(let j = 0;j < i; j++){
            var xj = loadList[j].location;
            var pj = loadList[j].mass;
            val -= pj*(x-xj)
        }
        dataList.push({x:x,y:val})
    }
    dataList.push({x:length,y:0})

    return dataList;
    // lists
    // objects
    // for loop for objects, properties and for loop for lists.
}
function plotReactions(loads,beamProperties){
    var length = beamProperties.length;
    var r1 = 0;
    var r2 = 0;
    var l = length;
    // use key >>>

    for(let load in loads){
        var p = loads[load].mass; // what is p ?
        // console.log('in for printing') // debugging // equivalent to print in python
        // console.log(loads[load]) // debugging
        var d = length - loads[load].location;
        var val = p * d;
        r1 += val;
        r2 += p;
    }
    r1 = r1/l;
    r2 = r2 - r1;
    const data = [
        {x: 0, y: -40, label: '' + r1, style: {fontSize: 15}},
        {x: 0, y: -35, label: "\u2191", style: {fontSize: 35}},
        {x: 99, y: -35, label: "\u2191", style: {fontSize: 35}},
        {x: 99, y: -40, label: '' +(r2),  style: {fontSize: 15}}
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
export default MultipleLoadApp;
