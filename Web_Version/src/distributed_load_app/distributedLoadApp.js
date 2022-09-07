import '../App.css'
import 'react-vis/dist/style.css';
import {inv,multiply} from 'mathjs'
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

import React, { useEffect, useState} from 'react';
import {useInterval} from "../useInterval";
// import io from "socket.io-client"
// // let endpoint = "wss://react-vis-app.herokuapp.com/" // this is when run on server ***** change it
// let endpoint = "wss://react-vis-app-test.herokuapp.com/" // this is when run on server ***** change it
// // let endpoint = "http://127.0.0.1:5000/"
// let socket = io.connect(endpoint);

function DistributedLoadApp(){
    const butStyle = {background: "black", height:window.innerHeight/12,
        width:window.innerWidth/10 ,borderRadius: 8, color: "white"}
    const [error, setError] = useState(null);
    const [infoUpdated,setInfoUpdated] = useState(false);
    const [isLoadInitialized, setIsLoadInitialized] = useState(false);
    const [loadData, setLoadData] = useState({length : 100, elasticity : 1.0, inertia: 1.0, density : 1.0, area: 1.0, dampingRatio:0.02, rA : 85000.0, EI: 210000000000.0,mass:10.0, gravity:9.8,locationOfLoad:25,lengthOfLoad:50})
    const [loadLocation , setLoadLocation] = useState(25.0);
    const [loadLength,setLoadLength] = useState(50)


    // useEffect(()=>{
    //     setInfoUpdated(false);
    // },[infoUpdated])

    function loadMovement(newLoc){
        setLoadLocation(newLoc);
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
            loadMovement(loadLocation-1)
        // Up arrow key (Jump).
        //else if(event.keyCode == 38)
        //    playerMovement(playerLoc,10,mi,true,0.5)
        // Right arrow key.
        else if(event.keyCode == 39)
            loadMovement(loadLocation+1)
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }else {
        console.log("came here")
        if(!isLoadInitialized){
            function handleSubmit(data){
                setLoadData(data)
                setIsLoadInitialized(true);
                setLoadLocation(parseFloat(data.locationOfLoad));
                setLoadLength(parseInt(data.lengthOfLoad));
                // setTestUrl("{'length': "+ loadData.length +", 'elasticity': "+ loadData.elasticity +", 'inertia': "+ loadData.inertia +", 'density': "+ loadData.density +", 'area': "+ loadData.area +", 'dampingRatio':"+ loadData.dampingRatio +", 'rA': "+ loadData.rA +", 'EI': "+ loadData.EI +", 'mass': "+ loadData.mass +", 'gravity': "+ loadData.gravity +", 'force': "+ loadData.mass * loadData.gravity +", 'locationOfLoad': "+ loadData.locationOfLoad +", 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 2, 'timelimit' : 100, 'q': 0, 'mt': 0}")
                // console.log(testUrl)
            }
            if(!isLoadInitialized){
                var data = loadData;
                return (
                    <form onSubmit={()=> {handleSubmit(data)}}>
                        <div></div>
                        <label>Length of Beam:
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
                        <label>Mass:
                            <input
                                defaultValue={10.0}
                                type="text"
                                onChange={(e) => {data.mass = e.target.value}}
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
                                defaultValue={25}
                                type="text"
                                onChange={(e) => {data.locationOfLoad = e.target.value}}
                            />
                        </label>
                        <div></div>
                        <label>Length of Load:
                            <input
                                defaultValue={50}
                                type="text"
                                onChange={(e) => {data.lengthOfLoad = e.target.value}}
                            />
                        </label>
                        <div></div>
                        <input type="submit" value="analyze" autoFocus/>
                        <div></div>
                    </form>
                )
            }
        }
        var ymin = -60000000;
        var mulScale  = 1
        return (
            <div className={"rowC"} onKeyDown={handleKeyDown} tabIndex="0">
                <div className="App">
                    <h1>CARL</h1>
                    {/*ydomain changer*/}
                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100, 100]} margin = {{left : 10}}>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis title = {"Load Location"}/>
                        <YAxis/>
                        <LineSeries data={[{x:0,y:0},{x:100,y:0}]}/>
                        <LineSeries data={[{x:loadLocation,y:5},{x:(loadLocation+loadLength),y:5}]}/>
                        {/*<LineSeries data = {[{x:((9/100)*playerLoc),y: calcPlayerLoc(playerLoc,mData)},{x:((9/100)*playerLoc),y: (calcPlayerLoc(playerLoc,mData) + 15000000)}]} stroke = "black"/>*/}
                        {/*<LineSeries data={disLoadMovData()} curve={'curveMonotoneX'}/>*/}
                    </XYPlot>
                    <Button variant="contained" sx={{margin: 0.5}} id={"single_left_btn"} onClick={()=>{loadMovement(loadLocation-1)}}><span>&#8592;</span></Button>
                    {/*<Button variant="contained" sx={{margin: 0.5}} id={"single_jump_btn"} onClick={()=>{playerMovement(playerLoc,10,mi,true,0.5)}}>JUMP</Button>*/}
                    <Button variant="contained" sx={{margin: 0.5}} id={"single_right_btn"} onClick={()=>{loadMovement(loadLocation+1)}}><span>&#8594;</span></Button>
                </div>
                <div>
                    <h1>Plots</h1>
                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-0.07,0.07]} margin = {{left : 10}}>

                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis title = {"Deflection Diagram"}/>
                        <YAxis/>
                        {/*<LineSeries data = {[{x:((9/100)*playerLoc),y: calcPlayerLoc(playerLoc,mData)},{x:((9/100)*playerLoc),y: (calcPlayerLoc(playerLoc,mData) + 15000000)}]} stroke = "black"/>*/}
                        {/*<LineSeries data = {[{x:((9/100)*playerLoc),y: calcPlayerLoc(playerLoc,mData)},{x:((9/100)*playerLoc),y: (calcPlayerLoc(playerLoc,mData) + 15000000)}]} stroke = "black"/>*/}
                        <LineSeries data={[{x:0,y:0},{x:100,y:0}]}/>
                        <LineSeries data={deflectionCalculation(loadLocation,loadLength,2,100)} curve={'curveMonotoneX'}/>
                    </XYPlot>
                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-100,100]} margin = {{left : 10}}>

                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis  title = {"Sheer Force Diagram"} />
                        <YAxis/>
                        <LineSeries data={[{x:0,y:0},{x:100,y:0}]}/>
                        <LineSeries data={shearForceData(loadLocation,loadLength,2,100)} curve={'curveMonotoneX'}/>
                    </XYPlot>

                    <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} yDomain ={[-5000,5000]} margin = {{left : 10}}>
                        <VerticalGridLines/>
                        <HorizontalGridLines/>
                        <XAxis  title = {"Bending moment"} />
                        <YAxis/>
                        <LineSeries data={[{x:0,y:0},{x:100,y:0}]}/>
                        <LineSeries data={bendingMomentDiagram(loadLocation,loadLength,2,100)} curve={'curveMonotoneX'}/>
                    </XYPlot>

                </div>
            </div>

        );
    }

}
function deflectionCalculation(e,d,w,L){
    var R1 = reactionR1(e,d,w,L)[0]
    var cs = constantCalculation(R1,e,d,w,L);
    console.log(cs);
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
    // var c6 = (-1) * c5 * L
    // dataList.push({x:0,y:0})
    console.log("c5 is " + c5 + " c6 is " + c6);
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
    console.log("deff")
    console.log(dataList[75])
    console.log(dataList[25])
    return dataList

}
function constantCalculation(R1,e, d, w  , L){
    var dummy = 1
    var var1 = (((w*d)-R1)*((L-e-d)**2)/(-2)) + (w*(d**3))/6 - (R1*((e+d)**2))/2
    var var2 = ((w*d)-R1)*((L-e-d)**3)/6 + (w*(d**4))/24 - R1*((e+d)**3)/6

    var arr1 = [[0,0,0,L,1],[1,-1,0,0,0],[e,-1*e,-1,0,0],[0,1,0,-1,0],[0,(e+d),1,-1*(e+d),-1]]
    var arr2 = [[0],[0],[0],[var1],[var2]]
    // var arr1 = math.array(arr1)
    // var arr2 = np.array(arr2)

    // var arr1_inv = inv(arr1)
    var arr1_inv = inv(arr1)
    console.log(arr1_inv)
    var result = multiply(arr1_inv,arr2)
    // var result = list(result)
    console.log("vars")
    console.log(var1)
    console.log(var2)
    var res = [result[0][0],result[1][0],result[2][0],result[3][0],result[4][0]]
    console.log(res)
    // return c1,c2,c3,c4,c5
    return res;
}

function reactionR1(e,d,w,L){
    let R1 = w*d * ( L - e - (d/2))
    R1 = R1/L
    let R2 = w*d - R1
    return [R1,R2]
}

function shearForceData(e,d,w,L){
    var R1 = reactionR1(e,d,w,L)[0]
    let dataList = []
    for(let x = 0 ; x <= L;x++){
        if(x >= 0 && x <= e){
            dataList.push({x:x,y:R1})
        }else if (x > e && x <= (e + d)){
            dataList.push({x:x,y:R1 - w*(x-e)})
        }else{
            dataList.push({x:x,y:R1-w*d})
        }
    }
    return dataList
}

function bendingMomentDiagram(e,d,w,L){
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
export default DistributedLoadApp;