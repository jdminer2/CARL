// This file is unused and may no longer work

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

import React, { useEffect, useState, useRef} from 'react';
import { useReactToPrint } from "react-to-print";


function Ce325App(){
    const butStyle = {background: "black", height:window.innerHeight/12,
        width:window.innerWidth/10 ,borderRadius: 8, color: "white"}
    const [isLoadInitialized, setIsLoadInitialized] = useState(false)
    const [loadData, setLoadData] = useState({length : 100, elasticity : 1.0, inertia: 1.0, density : 1.0, area: 1.0, dampingRatio:0.02, rA : 85000.0, EI: 210000000000.0,mass:10.0, gravity:9.8,locationOfLoad:20})


    const [playerLoc , setPlayerLoc] = useState(48)
    const [initialFormWarning, setInitialFormWarning] = useState("");
    const printDivRef = useRef();

    // This helps the window automatically focus on the XYPlot, so users don't need to click on the screen before using keyboard controls to move loads.
    const focusRef = React.useRef(null);
    useEffect(()=>{
        if(focusRef.current !== null)
            focusRef.current.focus();
    }, [isLoadInitialized]);

    // This makes the XYPlots scale when the user resizes the window.
    const [windowSize, setWindowSize] = useState({height:window.innerHeight, width:window.innerWidth});
    useEffect(() => {
        window.addEventListener("resize", () =>
            setWindowSize({height:window.innerHeight, width:window.innerWidth})
        )
        return () => 
            window.removeEventListener("resize", setWindowSize({height:window.innerHeight, width:window.innerWidth}))
    },[window.innerHeight, window.innerWidth]);

    function playerMovement(loc){
        // Prevent player from moving out of bounds.
        if(loc < 0)
            loc = 0;
        else if(loc > loadData.length)
            loc = loadData.length;
        setPlayerLoc(loc);
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
            playerMovement(playerLoc-1)
        // Right arrow key.
        else if(event.keyCode == 39)
            playerMovement(playerLoc+1)
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

    const handlePrint = useReactToPrint({
        content: () => printDivRef.current
    });

    // // eslint-disable-next-line react-hooks/exhaustive-deps
    if(!isLoadInitialized) {
        function handleSubmit(data, e) {
            if(initialFormWarning === "") {
                setLoadData(data)
                setIsLoadInitialized(true);
                setPlayerLoc(data.locationOfLoad)
            } else
                e.preventDefault();
        }

        if (!isLoadInitialized) {
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
    return (
        <div className={"rowC"} ref={focusRef} onKeyDown={handleKeyDown} tabIndex="0">
            <div className="App">
                <h1>CARL</h1>
                <XYPlot height={window.innerHeight * 0.7} width={window.innerWidth/2.1} yDomain ={[-100,100]} margin = {{left : 5}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Actual Displacement"}/>
                    <YAxis/>
                    {/* Display the player */}
                    <LineSeries data = {[{x:playerLoc ,y: 0},{x:playerLoc,y: 20}]} stroke = "black"/>
                    {/* Display the beam */}
                    <LineSeries data = {[{x : 0, y : 0},{x : loadData.length ,y : 0}]} />
                    <LabelSeries data={[{x: 0, y: -8, label: "\u25b2", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}},
                                        {x: loadData.length, y: -8, label: "\u2b24", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}}]} />
                </XYPlot>
                <Button variant="contained" sx={{margin: 0.5}} id={"single_325_left_btn"} onClick={()=>{playerMovement(playerLoc-1)}}><span>&#8592;</span></Button>
                <Button variant="contained" sx={{margin: 0.5}} id={"single_325_right_btn"} onClick={()=>{playerMovement(playerLoc+1)}}><span>&#8594;</span></Button>
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
                {/*<XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} >*/}
                {/*    <VerticalGridLines/>*/}
                {/*    <HorizontalGridLines/>*/}
                {/*    <XAxis title = {"Plot Reactions"}/>*/}
                {/*    <YAxis/>*/}
                {/*    <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />*/}
                {/*    <LabelSeries data={plotReactions(playerLoc,loadData.length)} />*/}
                {/*</XYPlot>*/}

                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2.05} yDomain = {[-3000, 3000]} >
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"Bending Moment Diagram"}/>
                    <XAxis/>
                    <YAxis/>
                    <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />
                    <LineSeries data={movementBendingDiagram(playerLoc,loadData.length)} color="black"/>
                </XYPlot>
                {/*<XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-1, 1]}>*/}
                {/*    <VerticalGridLines/>*/}
                {/*    <HorizontalGridLines/>*/}
                {/*    <XAxis title = {"Influence Line of Ra"}/>*/}
                {/*    <XAxis/>*/}
                {/*    <YAxis/>*/}
                {/*    <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />*/}
                {/*    <LineSeries data={influenceLinesDiagramRa(playerLoc,loadData.length)} curve={'curveMonotoneX'} color="green"/>*/}
                {/*</XYPlot>*/}
                {/*<XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-1, 1]} >*/}
                {/*    <VerticalGridLines/>*/}
                {/*    <HorizontalGridLines/>*/}
                {/*    <XAxis title = {"Influence Line of Rb"}/>*/}
                {/*    <XAxis/>*/}
                {/*    <YAxis/>*/}
                {/*    <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />*/}
                {/*    <LineSeries data={influenceLinesDiagramRb(playerLoc,loadData.length)} curve={'curveMonotoneX'} color="purple"/>*/}
                {/*</XYPlot>*/}
                {/*<XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-1, 1]}>*/}
                {/*    <VerticalGridLines/>*/}
                {/*    <HorizontalGridLines/>*/}
                {/*    <XAxis title = {"Shear Influence Line of the Section"}/>*/}
                {/*    <XAxis/>*/}
                {/*    <YAxis/>*/}
                {/*    <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />*/}
                {/*    <LineSeries data={influenceLineOfTheSection(playerLoc,loadData.length)} curve={'curveMonotoneX'} color="pink"/>*/}
                {/*</XYPlot>*/}
                {/*<XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-30, 30]}>*/}
                {/*    <VerticalGridLines/>*/}
                {/*    <HorizontalGridLines/>*/}
                {/*    <XAxis title = {"Bending Influence Line of the Section"}/>*/}
                {/*    <XAxis/>*/}
                {/*    <YAxis/>*/}
                {/*    <LineSeries data = {[{x : 0, y : 0},{x : loadData.length,y : 0}]} />*/}
                {/*    <LineSeries data={influenceLineOfTheSectionBending(playerLoc,loadData.length)} curve={'curveMonotoneX'} color="yellow"/>*/}
                {/*</XYPlot>*/}
            </div>
        </div>



    );
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

export default Ce325App;