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

import React, {useEffect, useRef, useState} from 'react';
import {useInterval} from "../useInterval";
import io from "socket.io-client"
import {useReactToPrint} from "react-to-print";
// let endpoint = "wss://react-vis-app.herokuapp.com/" // this is when run on server ***** change it
let endpoint = "wss://react-vis-app-test.herokuapp.com/" // this is when run on server ***** change it
// let endpoint = "http://127.0.0.1:5000/"
let socket = io.connect(endpoint);

function SingleLoadApp(){
    const butStyle = {background: "black", height:window.innerHeight/12,
        width:window.innerWidth/10 ,borderRadius: 8, color: "white"}
    const [error, setError] = useState(null);
    const [isLoadInitialized, setIsLoadInitialized] = useState(false)
    const [loadData, setLoadData] = useState({length : 100, elasticity : 1.0, inertia: 1.0, density : 1.0, area: 1.0, dampingRatio:0.02, rA : 85000.0, EI: 210000000000.0,mass:10.0, gravity:9.8,locationOfLoad:20})
    const printDivRef = useRef();
    const [isLoaded, setIsLoaded] = useState(false);
    const [items, setItems] = useState([]);
    const [playerLoc , setPlayerLoc] = useState(48)
    const [onceLoaded, setOnceLoaded] = useState(false)
    const [nextItems,setNextItems] = useState(undefined)
    const [testUrl, setTestUrl] = useState("{'length': "+ loadData.length +", 'elasticity': "+ loadData.elasticity +", 'inertia': "+ loadData.inertia +", 'density': "+ loadData.density +", 'area': "+ loadData.area +", 'dampingRatio':"+ loadData.dampingRatio +", 'rA': "+ loadData.rA +", 'EI': "+ loadData.EI +", 'mass': "+ loadData.mass +", 'gravity': "+ loadData.gravity +", 'force': "+ loadData.mass * loadData.gravity +", 'locationOfLoad': "+ loadData.locationOfLoad +", 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 2, 'timelimit' : 100, 'q': 0, 'mt': 0}")
    // const [testUrl, setTestUrl] = useState("{'length': 100, 'elasticity': 1.0, 'inertia': 1.0, 'density': 1.0, 'area': 1.0, 'dampingRatio': 0.02, 'rA': 85000.0, 'EI': 210000000000.0, 'mass': 10.0, 'gravity': 9.81, 'force': 98.1, 'locationOfLoad': 20, 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 2, 'timelimit' : 100, 'q': 0, 'mt': 0}")
    const [butClicked, setButClicked] = useState(false)
    const [tPing, setTping] = useState(2);
    const [ticker, setTicker] = useState(1)
    const [initialFormWarning, setInitialFormWarning] = useState("");
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
    const [mi, setI] = useState(0)

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

    const handlePrint = useReactToPrint({
        content: () => printDivRef.current
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const pingReceived = () => {
        socket.on('pong', message => {
            console.log("ping received")
            console.log(message.message)
            var t = Date.now();
            // console.log("type is : " + typeof Date.now())
            // var p = new Date(t).getTime() - new Date(message.message).getTime()
            var p = t - Number(message.message)
            setTping(p)
            // setTping((tPing*100 + p)/101)
            console.log(tPing)
        })
    }
    const responseReceived = () => {
        // if(isLoadInitialized === false){
        //     return;
        // }
        socket.on('message',message => {
            setItems(message)
            setI(0)
            setButClicked(false)
            setIsLoaded(true)
        })
    }
    useEffect(() =>{
        pingReceived()
    },[pingReceived])
    useEffect(() => {
        socket.emit("message",testUrl)
    },[testUrl])
    useEffect(() =>{
        responseReceived()
    },[responseReceived])

    function playerMovement(loc,mag,ival, butPressed,tl){
        // ival = Math.min([ival+10,items.message.length-1])
        if(butPressed){
            ival = Math.min(ival+20,items.message.length -1)
            setIsLoaded(false)
        }
        // Prevent player from moving out of bounds.
        if(loc < 0)
            loc = 0;
        else if(loc > loadData.length)
            loc = loadData.length;
        setPlayerLoc(loc);
        // const turl = "{'length': 100, 'elasticity': 1.0, 'inertia': 1.0, 'density': 1.0, 'area': 1.0, 'dampingRatio': 0.02, 'rA': 85000.0, 'EI': 210000000000.0, 'mass': 10.0, 'gravity': 9.81, 'force': 98.1, 'locationOfLoad':"+ loc +", 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': " + mag + ", 'timelimit' : "+tl+", 'q' : '[" +items.q[ival]+"]', 'mt' : "+ival+"}"
        const turl = "{'length': "+ loadData.length +", 'elasticity': "+ loadData.elasticity +", 'inertia': "+ loadData.inertia +", 'density': "+ loadData.density +", 'area': "+ loadData.area +", 'dampingRatio':"+ loadData.dampingRatio +", 'rA': "+ loadData.rA +", 'EI': "+ loadData.EI +", 'mass': "+ loadData.mass +", 'gravity': "+ loadData.gravity +", 'force': "+ loadData.mass * loadData.gravity +", 'locationOfLoad': "+ loc  +", 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': " + mag + ", 'timelimit' : "+tl+", 'q' : '[" +items.q[ival]+"]', 'mt' : "+ival+"}"
        console.log(turl)

        setButClicked(true)
        // setIsLoaded(false)

        setTestUrl(turl)
        // socket.emit("message",turl)
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
            playerMovement(playerLoc-1,2,mi,true,0.5)
        // Up arrow key (Jump).
        else if(event.keyCode == 38)
            playerMovement(playerLoc,10,mi,true,0.5)
        // Right arrow key.
        else if(event.keyCode == 39)
            playerMovement(playerLoc+1,2,mi,true,0.5)
    }

    /**
     * This function checks the initial form inputs to ensure that they are valid. 
     * All inputs must be nonnegative numbers. Beam length and EI must be nonzero. 
     * Load location must be less than or equal to beam length.
     * This function also converts the string inputs into number inputs.
     */
    function validateInputsInitialForm(){
        // Check that length is a number > 0.
        if(parseFloat(loadData.length) != loadData.length){
            setInitialFormWarning("Length of Beam must be a number.");
            return;
        }
        loadData.length = Number(loadData.length);
        if(loadData.length <= 0) {
            setInitialFormWarning("Length of Beam must be greater than 0.");
            return;
        }

        // Check that elasticity is a number >= 0
        if(parseFloat(loadData.elasticity) != loadData.elasticity){
            setInitialFormWarning("Elasticity must be a number.");
            return;
        }
        loadData.elasticity = Number(loadData.elasticity);
        if(loadData.elasticity < 0) {
            setInitialFormWarning("Elasticity must be at least 0.");
            return;
        }

        // Check that inertia is a number >= 0.
        if(parseFloat(loadData.inertia) != loadData.inertia){
            setInitialFormWarning("Inertia must be a number.");
            return;
        }
        loadData.inertia = Number(loadData.inertia);
        if(loadData.inertia < 0) {
            setInitialFormWarning("Inertia must be at least 0.");
            return;
        }

        // Check that density is a number >= 0.
        if(parseFloat(loadData.density) != loadData.density){
            setInitialFormWarning("Density must be a number.");
            return;
        }
        loadData.density = Number(loadData.density);
        if(loadData.density < 0) {
            setInitialFormWarning("Density must be at least 0.");
            return;
        }

        // Check that area is a number >= 0.
        if(parseFloat(loadData.area) != loadData.area){
            setInitialFormWarning("Area must be a number.");
            return;
        }
        loadData.area = Number(loadData.area);
        if(loadData.area < 0) {
            setInitialFormWarning("Area must be at least 0.");
            return;
        }


        // Check that damping ratio is a number >= 0.
        if(parseFloat(loadData.dampingRatio) != loadData.dampingRatio){
            setInitialFormWarning("Damping Ratio must be a number.");
            return;
        }
        loadData.dampingRatio = Number(loadData.dampingRatio);
        if(loadData.dampingRatio < 0) {
            setInitialFormWarning("Damping Ratio must be at least 0.");
            return;
        }


        // Check that rA is a number >= 0.
        if(parseFloat(loadData.rA) != loadData.rA){
            setInitialFormWarning("rA must be a number.");
            return;
        }
        loadData.rA = Number(loadData.rA);
        if(loadData.rA < 0) {
            setInitialFormWarning("rA must be at least 0.");
            return;
        }

        // Check that EI is a number > 0.
        if(parseFloat(loadData.EI) != loadData.EI){
            setInitialFormWarning("EI must be a number.");
            return;
        }
        loadData.EI = Number(loadData.EI);
        if(loadData.EI <= 0) {
            setInitialFormWarning("EI must be greater than 0.");
            return;
        }

        // Check that mass is a number >= 0.
        if(parseFloat(loadData.mass) != loadData.mass){
            setInitialFormWarning("Mass must be a number.");
            return;
        }
        loadData.mass = Number(loadData.mass);
        if(loadData.mass < 0) {
            setInitialFormWarning("Mass must be at least 0.");
            return;
        }

        // Check that gravity is a number >= 0.
        if(parseFloat(loadData.gravity) != loadData.gravity){
            setInitialFormWarning("Gravity must be a number.");
            return;
        }
        loadData.gravity = Number(loadData.gravity);
        if(loadData.gravity < 0) {
            setInitialFormWarning("Gravity must be at least 0.");
            return;
        }

        // Check that location of load is a number >= 0 and <= beam length.
        if(parseFloat(loadData.locationOfLoad) != loadData.locationOfLoad) {
            setInitialFormWarning("Location of Load must be a number.");
            return;
        }
        loadData.locationOfLoad = Number(loadData.locationOfLoad);
        if(loadData.locationOfLoad < 0) {
            setInitialFormWarning("Location of Load must be at least 0.");
            return;
        }
        if(loadData.locationOfLoad > loadData.length){
            setInitialFormWarning("Location of Load must be less than or equal to Length of Beam.");
            return;
        }

        // No errors.
        setInitialFormWarning("");
    }

    useInterval(updateGraph, 1);
    // useEffect(() => {
    //     const interval = setInterval(emitPing, 2000);
    //     return () => {return clearInterval(interval)};
    // }, [emitPing]);
    // useInterval(emitPing, 0.5);
    function emitPing(){
        console.log("pong called")
        socket.emit('pong', Date.now())
    }
    function calcPlayerLoc(loc, data){
        var px  = (9/loadData.length)*loc
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
    // // eslint-disable-next-line react-hooks/exhaustive-deps
    function updateGraph(){
        // if(ticker % 100 === 0){
        //   emitPing()
        //   setTicker(1)
        // }else{
        //   setTicker(ticker + 1)
        // }
        if(!isLoadInitialized){
            return;
        }
        if(!isLoaded){
            console.log("not loaded yet")
            //console.log(items)
            if(!onceLoaded){
                return
            }
        }
        //console.log(items)
        if(items.message === undefined){
            return;
        }

        if(mi < items.message.length) {
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
            setI(mi + 1);
            setData(data)
            if(mi === items.message.length - 20){
                playerMovement(playerLoc,2, items.message.length-1,true,10)
            }
        }else{
            setIsLoaded(false)
            // playerMovement(playerLoc,1, items.message.length-1,true,10)
        }

    }
    if (error) {
        return <div>Error: {error.message}</div>;
    }else {
        if(!isLoadInitialized){
            function handleSubmit(data, e){
                if(initialFormWarning === "") {
                    setLoadData(data)
                    setIsLoadInitialized(true);
                    setPlayerLoc(data.locationOfLoad)
                    setTestUrl("{'length': "+ loadData.length +", 'elasticity': "+ loadData.elasticity +", 'inertia': "+ loadData.inertia +", 'density': "+ loadData.density +", 'area': "+ loadData.area +", 'dampingRatio':"+ loadData.dampingRatio +", 'rA': "+ loadData.rA +", 'EI': "+ loadData.EI +", 'mass': "+ loadData.mass +", 'gravity': "+ loadData.gravity +", 'force': "+ loadData.mass * loadData.gravity +", 'locationOfLoad': "+ loadData.locationOfLoad +", 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 2, 'timelimit' : 100, 'q': 0, 'mt': 0}")
                    console.log(testUrl)
                } else
                    e.preventDefault();
            }
            if(!isLoadInitialized){
                var data = loadData;
                return (
                    <form onSubmit={(e) => {
                        handleSubmit(data, e)
                    }}>
                        <div>
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
                        </div>
                        <div>
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
                        </div>
                        <div>
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
                        </div>
                        <div>
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
                        </div>
                        <div>
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
                        </div>
                        <div>
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
                        </div>
                        <div>
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
                        </div>
                        <div>
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
                        </div>
                        <div></div>
                        <label>Mass:
                            <input
                                defaultValue={10.0}
                                type="text"
                                onChange={(e) => {
                                    data.mass = e.target.value
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
                        <div></div>
                        <label>Location of Load:
                            <input
                                defaultValue={20}
                                type="text"
                                onChange={(e) => {
                                    data.locationOfLoad = e.target.value
                                    validateInputsInitialForm();
                                }}
                            />
                        </label>
                        <div></div>
                        {/* Text display for invalid inputs. */}
                        <div><span style={{fontWeight: 'bold'}}>{initialFormWarning}</span></div>
                        <div></div>
                        <input type="submit" value="Analyze" autoFocus/>
                        <div></div>
                        {/* eslint-disable-next-line no-undef */}
                        <div><img src={require("../resources/images/Single_load_schematic.png")} height={212.2} width={582.8} align="middle"/></div>

                    </form>
                )
            }
        }
        if(items.message === undefined){
            return (<div>{'Waiting for response...'}</div>)
        }
        if(mData === undefined){
            return(<div>{'undefined'}</div>)
        }
        if(!onceLoaded){
            setOnceLoaded(true)
        }
        var ymin = -60000000;
        var mulScale  = 1
        return (
            <div className={"rowC"} ref={focusRef} onKeyDown={handleKeyDown} tabIndex="0">
                <div className="App">
                    <h1>CARL</h1>
                    <XYPlot height={window.innerHeight * 0.7} width={window.innerWidth/2} yDomain ={[ymin*mulScale,-1 * ymin*mulScale]} margin = {{left : 10}}>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis title = {"Actual Displacement"}/>
                        <YAxis/>
                        {/* Display beam */}
                        <LineSeries data={updateMdata(mData, loadData.length)} curve={'curveMonotoneX'}/>
                        <LabelSeries data={[{x: 0, y: -8 * (ymin*mulScale/-100), label: "\u25b2", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}},
                                        {x: loadData.length, y: -8* (ymin*mulScale/-100), label: "\u2b24", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}}]} />
                        {/* Display player */}
                        <LineSeries data = {[{x:(playerLoc),y: calcPlayerLoc(playerLoc,updateMdata(mData))},{x:(playerLoc),y: (calcPlayerLoc(playerLoc,mData) + 15000000)}]} stroke = "black"/>
                    </XYPlot>
                    <Button variant="contained" sx={{margin: 0.5}} id={"single_left_btn"} onClick={()=>{playerMovement(playerLoc-1,2,mi,true,0.5)}}><span>&#8592;</span></Button>
                    <Button variant="contained" sx={{margin: 0.5}} id={"single_jump_btn"} onClick={()=>{playerMovement(playerLoc,10,mi,true,0.5)}}>JUMP</Button>
                    <Button variant="contained" sx={{margin: 0.5}} id={"single_right_btn"} onClick={()=>{playerMovement(playerLoc+1,2,mi,true,0.5)}}><span>&#8594;</span></Button>
                    <Button variant="contained" sx={{margin: 0.5}} id={"perform_print_325_btn"} onClick={()=>{handlePrint()}}><span>Print Plots</span></Button>
                </div>
                <div id={"printable_div"} ref={printDivRef}>
                    <h1>Plots</h1>
                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[-1 * calculateDispYdomain(loadData.mass,loadData.length,loadData.EI,1) , calculateDispYdomain(loadData.mass,loadData.length,loadData.EI,1)]} margin={{left:100}} >
                        <XAxis title = {"Deflection Diagram"}/>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis/>
                        <YAxis/>
                        <LineSeries data={deflection(loadData.mass,playerLoc,loadData.EI,1,loadData.length)} />
                    </XYPlot>
                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} >
                        {/*<h1>Shear Force Diagram</h1>*/}
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis title = {"Shear Force and Reaction Diagram"}/>
                        <YAxis/>
                        {/*<LineSeries data = {[{x:((9/loadData.length)*playerLoc),y: calcPlayerLoc(playerLoc,mData)},{x:((9/loadData.length)*playerLoc),y: (calcPlayerLoc(playerLoc,mData) + 15000000)}]} stroke = "black"/>*/}
                        <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />
                        <LineSeries data={shearForceData(playerLoc,loadData.length)} color="red" />
                        <LabelSeries data={plotReactions(playerLoc,loadData.length)} />
                    </XYPlot>

                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2.05} yDomain = {[-3000, 3000]} >
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis title = {"Bending Moment Diagram"}/>
                        <XAxis/>
                        <YAxis/>
                        <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />
                        <LineSeries data={movementBendingDiagram(playerLoc,loadData.length)} color="black"/>
                    </XYPlot>
                    </div>

                    {/*<div>*/}
                    {/*    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} margin = {{left : 10}}>*/}
                    {/*        /!*<h1>Shear Force Diagram</h1>*!/*/}
                    {/*        <VerticalGridLines/>*/}
                    {/*        <HorizontalGridLines/>*/}
                    {/*        <XAxis title = {"Shear Force"}/>*/}
                    {/*        <YAxis/>*/}
                    {/*        /!*<LineSeries data = {[{x:((9/loadData.length)*playerLoc),y: calcPlayerLoc(playerLoc,mData)},{x:((9/loadData.length)*playerLoc),y: (calcPlayerLoc(playerLoc,mData) + 15000000)}]} stroke = "black"/>*!/*/}
                    {/*        <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />*/}
                    {/*        <LineSeries data={shearForceData(playerLoc)}/>*/}
                    {/*    </XYPlot>*/}
                    {/*    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} margin = {{left : 10}}>*/}
                    {/*        <VerticalGridLines/>*/}
                    {/*        <HorizontalGridLines/>*/}
                    {/*        <XAxis title = {"Plot Reactions"}/>*/}
                    {/*        <YAxis/>*/}
                    {/*        <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />*/}
                    {/*        <LabelSeries data={plotReactions(playerLoc)} />*/}
                    {/*    </XYPlot>*/}

                    <XYPlot height={window.innerHeight * 0.18} width={window.innerWidth/2} yDomain ={[-1, 1]} margin = {{left : 10}}>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis title = {"Influence Line of Ra"}/>
                        <XAxis/>
                        <YAxis/>
                        <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />
                        <LineSeries data={influenceLinesDiagramRa(playerLoc)} curve={'curveMonotoneX'}/>
                    </XYPlot>
                    <XYPlot height={window.innerHeight * 0.18} width={window.innerWidth/2} yDomain ={[-1, 1]} margin = {{left : 10}}>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis title = {"Influence Line of Rb"}/>
                        <XAxis/>
                        <YAxis/>
                        <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />
                        <LineSeries data={influenceLinesDiagramRb(playerLoc)} curve={'curveMonotoneX'}/>
                    </XYPlot>
                    <XYPlot height={window.innerHeight * 0.18} width={window.innerWidth/2} yDomain ={[-1, 1]} margin = {{left : 10}}>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis title = {"Shear Influence Line of the Section"}/>
                        <XAxis/>
                        <YAxis/>
                        <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />
                        <LineSeries data={influenceLineOfTheSection(playerLoc,loadData.length)} curve={'curveMonotoneX'}/>
                    </XYPlot>
                    <XYPlot height={window.innerHeight * 0.18} width={window.innerWidth/2} yDomain ={[-30, 30]} margin = {{left : 10}}>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis title = {"Bending Influence Line of the Section"}/>
                        <XAxis/>
                        <YAxis/>
                        <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />
                        <LineSeries data={influenceLineOfTheSectionBending(playerLoc)} curve={'curveMonotoneX'}/>
                    </XYPlot>
                    <XYPlot height={window.innerHeight * 0.18} width={window.innerWidth/2} yDomain ={[ymin*mulScale,-1 * ymin*mulScale]} margin = {{left : 10}}>
                        <h1>INFLUENCE LINES OF REACTION</h1>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis/>
                        <YAxis/>
                        <LineSeries data = {[{x:((9/loadData.length)*playerLoc),y: calcPlayerLoc(playerLoc,mData)},{x:((9/loadData.length)*playerLoc),y: (calcPlayerLoc(playerLoc,mData) + 15000000)}]} stroke = "black"/>
                        <LineSeries data={influenceLineReaction(playerLoc)} curve={'curveMonotoneX'}/>
                    </XYPlot>
                    <XYPlot height={window.innerHeight * 0.18} width={window.innerWidth/2} yDomain ={[ymin*mulScale,-1 * ymin*mulScale]} margin = {{left : 10}}>
                        <h1>DIFFERENT SECTION INFLUENCE LINES</h1>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis/>
                        <YAxis/>
                        <LineSeries data = {[{x:((9/loadData.length)*playerLoc),y: calcPlayerLoc(playerLoc,mData)},{x:((9/loadData.length)*playerLoc),y: (calcPlayerLoc(playerLoc,mData) + 15000000)}]} stroke = "black"/>
                        <LineSeries data={differentSectionInflunceLines(playerLoc)} curve={'curveMonotoneX'}/>
                    </XYPlot>
                {/*</div>*/}
            </div>



        );
        // return (<div>{tPing}</div>)
    }

}

function calculateDispYdomain(p,l,e,i){
    var x = 50;
    var a = 50;
    var val = p * (l-a) * x;
    val = val/(6 * l * e * i );
    val = val * ((l * l) - (x * x) - ((l-a) * (l-a)));
    return val * 1.5;
}

function shearForceData(location,length){
    var l = location
    var p = 100.0
    var l = length
    var r1 = (p*(l - location))/l
    var r2 = -1*(p - r1)
    const data = [
        {x: 0, y: 0},
        {x: 0, y: r1},
        {x: location, y: r1},
        {x: location, y: r2},
        {x: l, y: r2},
        {x: l, y: 0}
    ];
    return data
}
function movementBendingDiagram(location,length){
    var l = location
    var p = 100.0
    var l = length
    var r1 = (p*(l - location))/l
    var r2 = -1*(p - r1)
    const data = [
        {x: 0, y: 0},
        {x: location, y: r1*location},
        {x: l, y: 0}]
    return data
}
function plotReactions(location,length){
    var p = 100.0
    var l = length
    var r1 = (p*(l - location))/l
    var r2 = -1*(p - r1)
    const data = [
        {x: 0, y: -40, label: '' + r1, style: {fontSize: 15}},
        {x: 0, y: -35, label: "\u2191", style: {fontSize: 35}},
        {x: length, y: -35, label: "\u2191", style: {fontSize: 35}},
        {x: length, y: -40, label: '' +(-1* r2),  style: {fontSize: 15}}
    ]
    return data
}

function deflection(m,loc,e,i,l){
    // consider variable properties later
    var length = l
    var dataList = []
    var x = 0
    var delta = 1
    // dataList.push({x:0,y:0})
    while(x <=length){
        var y = 0;
        var p = m
        var a = loc
        var val = deflectionOfSingleLoad(p,x,length,a,e,i);
        y += val;
        console.log("y is " + y);
        dataList.push({x:x,y:-1*y})
        x+= delta
    }
    return dataList
}
function deflectionOfSingleLoad(p,x,l,a,e,i){

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

function influenceLinesDiagramRa(location,length){
    var p = 100.0
    var l = length
    var r1 = (p*(l - location))/l
    var r2 = -1*(p - r1)
    const data = [
        {x: 0, y: 0},
        {x: 0, y: 1},
        {x: location, y: r1/100},
        {x: length, y: 0},
    ]
    return data
}
function influenceLinesDiagramRb(location,length){

    var p = 100.0
    var l = length
    var r1 = (p*(l - location))/l
    var r2 = -1*(p - r1)
    const data = [
        {x: 0, y: 0},
        {x: location, y: -r2/100},
        {x: l, y: 1},
        {x: l, y: 0},
    ]
    return data
}
function influenceLineOfTheSection(location,length){

    var p = 100.0
    var l = length
    var r1 = (p*(l - location))/l
    var r2 = -1*(p - r1)
    const data = [
        {x: 0, y: 0},
        {x: location, y: -location/l},
        {x: location, y: (l-location)/l},
        {x: l, y: 0}]
    return data
}
function influenceLineOfTheSectionBending(location,length){

    var p = 100.0
    var l = length
    var r1 = (p*(l - location))/l
    var r2 = -1*(p - r1)
    const data = [
        {x: 0, y: 0},
        {x: location, y: (location*(l-location))/l},
        {x: l, y: 0}]
    return data
}
//
// function deflection(m,loc,e,i,l){
//     // consider variable properties later
//     var length = l
//     var dataList = []
//     var x = 0
//     var delta = 1
//     // dataList.push({x:0,y:0})
//     while(x <=length){
//         var y = 0;
//         var p = m
//         var a = loc
//         var val = deflectionOfSingleLoad(p,x,length,a,e,i);
//         y += val;
//         console.log("y is " + y);
//         dataList.push({x:x,y:-1*y})
//         x+= delta
//     }
//     return dataList
// }
// function deflectionOfSingleLoad(p,x,l,a,e,i){
//
//     var val =0;
//     if( x <= a){
//         val = p * (l-a) * x;
//         val = val/(6 * l * e * i );
//         val = val * ((l * l) - (x * x) - ((l-a) * (l-a)));
//     }else{
//         val = p * (l-a);
//         val = val/(6 * l * e * i );
//         val = val*((l*(Math.pow((x-a),3))/(l-a)) + (((l*l)-Math.pow(l-a,2))*x) - (x*x*x))
//     }
//     return val;
// }
// function calculateDispYdomain(p,l,e,i){
//     var x = 50;
//     var a = 50;
//     var val = p * (l-a) * x;
//     val = val/(6 * l * e * i );
//     val = val * ((l * l) - (x * x) - ((l-a) * (l-a)));
//     return val * 1.5;
// }
function updateMdata(data, length){
    let d = []
    for(let o in data){
        d.push( {x:data[o].x * length/9 , y:data[o].y})
    }
    return d
}
//
// function shearForceData(location,length){
//     var l = location
//     var p = 100.0
//     var l = length
//     var r1 = (p*(l - location))/l
//     var r2 = -1*(p - r1)
//     const data = [
//         {x: 0, y: 0},
//         {x: 0, y: r1},
//         {x: location, y: r1},
//         {x: location, y: r2},
//         {x: l, y: r2},
//         {x: l, y: 0}
//     ];
//     return data
// }
//
// function movementBendingDiagram(location){
//     var l = location
//     var p = 100.0
//     var l = 100.0
//     var r1 = (p*(l - location))/l
//     var r2 = -1*(p - r1)
//     const data = [
//         {x: 0, y: 0},
//         {x: location, y: r1*location},
//         {x: l, y: 0}]
//     return data
// }
// function plotReactions(location){
//     var l = location
//     var p = 100.0
//     var l = 100.0
//     var r1 = (p*(l - location))/l
//     var r2 = -1*(p - r1)
//     const data = [
//         {x: 0, y: -40, label: '' + r1, style: {fontSize: 15}},
//         {x: 0, y: -35, label: "\u2191", style: {fontSize: 35}},
//         {x: loadData.length, y: -35, label: "\u2191", style: {fontSize: 35}},
//         {x: loadData.length, y: -40, label: '' +(-1* r2),  style: {fontSize: 15}}
//     ]
//     return data
// }
function internalForce(location){

}
function influenceLineReaction(location){

}
function differentSectionInflunceLines(location){

}

// function influenceLinesDiagramRa(location){
//     var l = location
//     var p = 100.0
//     var l = 100.0
//     var r1 = (p*(l - location))/l
//     var r2 = -1*(p - r1)
//     const data = [
//         {x: 0, y: 0},
//         {x: 0, y: 1},
//         {x: location, y: r1/100},
//         {x: l, y: 0},
//     ]
//     return data
// }
// function influenceLinesDiagramRb(location){
//     var l = location
//     var p = 100.0
//     var l = 100.0
//     var r1 = (p*(l - location))/l
//     var r2 = -1*(p - r1)
//     const data = [
//         {x: 0, y: 0},
//         {x: location, y: -r2/100},
//         {x: l, y: 1},
//         {x: l, y: 0},
//     ]
//     return data
// }
// function influenceLineOfTheSection(location){
//     var l = location
//     var p = 100.0
//     var l = 100.0
//     var r1 = (p*(l - location))/l
//     var r2 = -1*(p - r1)
//     const data = [
//         {x: 0, y: 0},
//         {x: location, y: -location/l},
//         {x: location, y: (l-location)/l},
//         {x: l, y: 0}]
//     return data
// }
// function influenceLineOfTheSectionBending(location){
//     var l = location
//     var p = 100.0
//     var l = 100.0
//     var r1 = (p*(l - location))/l
//     var r2 = -1*(p - r1)
//     const data = [
//         {x: 0, y: 0},
//         {x: location, y: (location*(l-location))/l},
//         {x: l, y: 0}]
//     return data
// }

export default SingleLoadApp;