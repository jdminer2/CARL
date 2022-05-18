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

import React, { useEffect, useState, useRef} from 'react';
import { useReactToPrint } from "react-to-print";


function Ce325App(){
    const butStyle = {background: "black", height:window.innerHeight/12,
        width:window.innerWidth/10 ,borderRadius: 8, color: "white"}
    const [isLoadInitialized, setIsLoadInitialized] = useState(false)
    const [loadData, setLoadData] = useState({length : 100, elasticity : 1.0, inertia: 1.0, density : 1.0, area: 1.0, dampingRatio:0.02, rA : 85000.0, EI: 210000000000.0,mass:10.0, gravity:9.8,loacationOfLoad:20})


    const [playerLoc , setPlayerLoc] = useState(48)
    const printDivRef = useRef();

    function playerMovement(loc){
        if(loc <= loadData.length && loc >= 0) {
            setPlayerLoc(loc);
        }else{
            console.log("Max or min length reached")
        }
    }

    const handlePrint = useReactToPrint({
        content: () => printDivRef.current
    });

    // // eslint-disable-next-line react-hooks/exhaustive-deps
    if(!isLoadInitialized) {
        function handleSubmit(data) {
            setLoadData(data)
            setIsLoadInitialized(true);
            setPlayerLoc(data.loacationOfLoad)
        }

        if (!isLoadInitialized) {
            var data = loadData;
            return (
                <form onSubmit={() => {
                    handleSubmit(data)
                }}>
                    <div>
                        <label>Length of Beam:
                            <input
                                defaultValue={100}
                                type="text"
                                onChange={(e) => {
                                    data.length = e.target.value
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
                            }}
                        />
                    </label>
                    <div></div>
                    <label>Location of Load (L1):
                        <input
                            defaultValue={20}
                            type="text"
                            onChange={(e) => {
                                data.loacationOfLoad = e.target.value
                            }}
                        />
                    </label>
                    <div></div>
                    <input type="submit" value="analyze"/>
                    <div></div>
                    {/* eslint-disable-next-line no-undef */}
                    <div><img src={require("../resources/images/Single_load_schematic.png")} height={window.innerHeight/3} width={window.innerWidth/2.5}/></div>

                </form>
            )
        }
    }
    return (
        <div className={"rowC"}>
            <div className="App">
                <h1>CARL</h1>
                <XYPlot height={window.innerHeight * 0.7} width={window.innerWidth/2.1} yDomain ={[-100,100]} margin = {{left : 5}}>
                    <VerticalGridLines/>
                    <HorizontalGridLines/>
                    <XAxis title = {"ACTUAL DISPLACEMENT"}/>
                    <YAxis/>
                    <LineSeries data = {[{x:playerLoc ,y: 0},{x:playerLoc,y: 20}]} stroke = "black"/>
                    <LineSeries data = {[{x : 0, y : 0},{x : loadData.length ,y : 0}]} />
                </XYPlot>
                <button style={butStyle} id={"single_325_left_btn"} onClick={()=>{playerMovement(playerLoc-1)}}><span>&#8592;</span></button>
                <button style={butStyle} id={"single_325_right_btn"} onClick={()=>{playerMovement(playerLoc+1)}}><span>&#8594;</span></button>
                <button style={butStyle} id={"perform_print_325_btn"} onClick={()=>{handlePrint()}}><span>Print Plots</span></button>
            </div>
            <div id={"printable_div"} ref={printDivRef}>
                <div>Load Location is {playerLoc} </div>
                <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain = {[-1 * calculateDispYdomain(loadData.mass,loadData.length,loadData.EI,1) , calculateDispYdomain(loadData.mass,loadData.length,loadData.EI,1)]} margin={{left:100}} >
                    <XAxis title = {"Deflection"}/>
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
                    <XAxis title = {"Shear Diagram and Reaction Force"}/>
                    <YAxis/>
                    {/*<LineSeries data = {[{x:((9/100)*playerLoc),y: calcPlayerLoc(playerLoc,mData)},{x:((9/100)*playerLoc),y: (calcPlayerLoc(playerLoc,mData) + 15000000)}]} stroke = "black"/>*/}
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