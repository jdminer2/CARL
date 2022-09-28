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
    const [initialFormWarning, setInitialFormWarning] = useState("");

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

    // useEffect(()=>{
    //     setInfoUpdated(false);
    // },[infoUpdated])

    function loadMovement(newLoc){
        // Prevent player from moving out of bounds.
        if(newLoc < 0)
            newLoc = 0;
        else if(newLoc + loadLength > loadData.length)
            newLoc = loadData.length - loadLength;
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

        // Check that location of load is a number >= 0.
        if(parseFloat(loadData.locationOfLoad) != loadData.locationOfLoad) {
            setInitialFormWarning("Location of Load must be a number.");
            return;
        }
        loadData.locationOfLoad = Number(loadData.locationOfLoad);
        if(loadData.locationOfLoad < 0) {
            setInitialFormWarning("Location of Load must be at least 0.");
            return;
        }

        // Check that length of load is a number >= 0.
        if(parseFloat(loadData.lengthOfLoad) != loadData.lengthOfLoad){
            setInitialFormWarning("Length of Load must be a number.");
            return;
        }
        loadData.lengthOfLoad = Number(loadData.lengthOfLoad);
        if(loadData.lengthOfLoad < 0) {
            setInitialFormWarning("Length of Load must be at least 0.");
            return;
        }

        // Check that length + location <= beam length (so the right-edge is in-bounds).
        if(loadData.locationOfLoad + loadData.lengthOfLoad > loadData.length){
            setInitialFormWarning("Location of Load + Length of Load must be less than or equal to Length of Beam.");
            return;
        }

        // No errors.
        setInitialFormWarning("");
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }else {
        console.log("came here")
        if(!isLoadInitialized){
            function handleSubmit(data, e){
                if(initialFormWarning === "") {
                    setLoadData(data)
                    setIsLoadInitialized(true);
                    setLoadLocation(parseFloat(data.locationOfLoad));
                    setLoadLength(parseInt(data.lengthOfLoad));
                    // setTestUrl("{'length': "+ loadData.length +", 'elasticity': "+ loadData.elasticity +", 'inertia': "+ loadData.inertia +", 'density': "+ loadData.density +", 'area': "+ loadData.area +", 'dampingRatio':"+ loadData.dampingRatio +", 'rA': "+ loadData.rA +", 'EI': "+ loadData.EI +", 'mass': "+ loadData.mass +", 'gravity': "+ loadData.gravity +", 'force': "+ loadData.mass * loadData.gravity +", 'locationOfLoad': "+ loadData.locationOfLoad +", 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 2, 'timelimit' : 100, 'q': 0, 'mt': 0}")
                    // console.log(testUrl)
                } else
                    e.preventDefault();
            }
            if(!isLoadInitialized){
                var data = loadData;
                return (
                    <form onSubmit={(e)=> {handleSubmit(data, e)}}>
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
                                defaultValue={25}
                                type="text"
                                onChange={(e) => {
                                    data.locationOfLoad = e.target.value
                                    validateInputsInitialForm();
                                }}
                            />
                        </label>
                        <div></div>
                        <label>Length of Load:
                            <input
                                defaultValue={50}
                                type="text"
                                onChange={(e) => {
                                    data.lengthOfLoad = e.target.value
                                    validateInputsInitialForm();
                                }}
                            />
                        </label>
                        <div></div>
                        {/* Text display for invalid inputs. */}
                        <div><span style={{fontWeight: 'bold'}}>{initialFormWarning}</span></div>
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
                        {/* Display the beam */}
                        <LineSeries data={[{x:0,y:0},{x:100,y:0}]}/>
                        <LabelSeries data={[{x: 0, y: -11, label: "\u25b2", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}},
                                        {x: 100, y: -11, label: "\u2b24", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}}]} />
                        {/* Display the load */}
                        <LineSeries data={[{x:loadLocation,y:8},{x:(loadLocation+loadLength),y:8}]} color="#79c7e3" />
                        <LabelSeries data={getDistributedLoadMiniArrows(loadLocation, loadLength)} />
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

function getDistributedLoadMiniArrows(pos, len){
    // Load will have more arrows the longer it is: at least every 5 units, and one on each end. They are all evenly spaced.
    let arrowsArray=[];
    let numArrows = Math.floor(len / 5) + 1;
    for(let i = 0; i <= numArrows; i++)
        arrowsArray.push({x: pos + (i / numArrows) * len, y: -3, label: "\u2193",  style: {fontSize: 25, font: "verdana", fill: "#79c7e3", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
    return arrowsArray;
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