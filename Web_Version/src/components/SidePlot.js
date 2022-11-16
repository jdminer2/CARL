import '../App.css'
import React, {useEffect, useState} from 'react'
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField} from '@mui/material'
import {HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis} from "react-vis"

/**
 * Props:
 * loads
 * beamProperties
 * singleLoadFunction
 * title
 * color
 * showReactions
 * showGlobalExtreme
 */
function SidePlot (props) {
    // The scale of the plot
    const [scale, setScale] = useState(1)
    const [coord,setCoord] = useState({title:props.title, x:0, y:0})
    
    // Returns LineSeries plot points for deflection diagram. Also updates the scale for the plot.
    function diagram() {
        // The list of x-values to plot in a line plot.
        const xValues = []
        // Every 100th of the beam
        for(let i = 0; i <= 100; i++)
            xValues.push((i/100)*props.beamProperties["Length of Beam"])
        // The endpoints of each load
        props.loads.forEach(load => 
            xValues.push(load.Location, load.Location+load.Length)
        )
        // Sort the x values so the line plot goes through each point in ascending order, not back and forth
        xValues.sort((a,b)=>(a > b)? 1 : -1)

        // Calculate the y values.
        let plotData = []
        xValues.forEach(xValue => {
            let yValue = sumFunction(chooseSingleLoadFunction(props.title), xValue, props.loads, props.beamProperties)
            plotData.push({x:xValue, y:yValue[0]}, {x:xValue, y:yValue[1]})
        })

        // Update plot scale if needed
        let newScale = getScale(plotData)
        if(newScale != scale)
            setScale(newScale)

        return plotData
    }

    function reactions() {
        // Plot the reactions, R1 and R2.
        let [R1,R2] = sumFunction(reactionsSingleLoad, null, props.loads, props.beamProperties)

        let reactionLabels = []
        // Left side reaction label (R1)
        reactionLabels.push({x: 2.5/100 * props.beamProperties["Length of Beam"], y: -40/100 * scale, label: formatVal(R1)(R1), style: {fontSize: 15, textAnchor: "middle"}})
        reactionLabels.push({x: 2.5/100 * props.beamProperties["Length of Beam"], y: -35/100 * scale, label: "\u2191", style: {fontSize: 35, textAnchor: "middle"}})
        // Right side reaction label (R2), only for Simply Supported
        if(props.beamProperties["Support Type"] === "Simply Supported") {
            reactionLabels.push({x: 97.5/100 * props.beamProperties["Length of Beam"], y: -40/100 * scale, label: formatVal(R2)(R2),  style: {fontSize: 15, textAnchor: "middle"}})
            reactionLabels.push({x: 97.5/100 * props.beamProperties["Length of Beam"], y: -35/100 * scale, label: "\u2191", style: {fontSize: 35, textAnchor: "middle"}})
        }
        return reactionLabels
    }

    function updateCoord(enteredX, isTyping){
        let x = enteredX
        let y = coord.y
        if(parseFloat(x) == x) {
            x = Number(x)
            x = formatVal(x)(x)
            if(x >= 0 && x <= props.beamProperties["Length of Beam"]) {
                y = sumFunction(chooseSingleLoadFunction(props.title), x, props.loads, props.beamProperties)[0]
                y = formatVal(y)(y)
            }
        }
        setCoord({title:coord.title, x:(isTyping?enteredX:x), y:y})
    }

    function validX() {
        let x = coord.x
        if(parseFloat(x) == x) {
            x = Number(x)
            x = formatVal(x)(x)
            if(x >= 0 && x <= props.beamProperties["Length of Beam"])
                return true
        }
        return false
    }

    return (
        <div className={"rowC"}>
            <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth * 0.4} xDomain={[0,props.beamProperties["Length of Beam"]]} yDomain ={[scale, scale]} margin = {{left:60, right:60}}>
                {/*<h1>Shear Force Diagram</h1>*/}
                <VerticalGridLines/>
                <HorizontalGridLines/>
                <XAxis tickFormat = {formatVal(props.beamProperties["Length of Beam"])} title = {props.title}/>
                <YAxis tickFormat = {formatVal(scale)}/>
                {/* Beam */}
                <LineSeries data = {[{x:0, y:0}, {x:props.beamProperties["Length of Beam"],y:0}]} />
                {/* Plot */}
                <LineSeries data={diagram()} onNearestX = {(datapoint,e) => updateCoord(datapoint.x, false)} color={props.color}/>
                {/* Current X */}
                {validX() ? <LineSeries data = {[{x:coord.x, y:scale}, {x:coord.x, y:-1*scale}]} color="grey" strokeWidth="1px"/> : []}
                {props.showReactions?<LabelSeries data={reactions()} />:[]}
            </XYPlot>
            <div style={{display:"flex", alignItems:"center", justifyContent:"center", width:"100%"}}>
                <div>
                    {coord.title}<br/>
                    x=<input type="text"
                        value={coord.x}
                        style={{width:50}}
                        onChange={(e) => {
                            updateCoord(e.target.value, true)
                        }}
                    />, y={coord.y}<br/>
                    {props.showGlobalExtreme?
                    <div>
                        Global Extreme:<br/>
                        {globalExtreme(props.loads,props.beamProperties,chooseSingleLoadFunction(props.title))}
                    </div>
                    :""}
                </div>
            </div>
        </div>
    )
}

/**
 * Finds the global min/max of the plot, [x,y]. This is only valid for plots that have one local extreme. If there are multiple peaks, it does not work.
 * As long as mass and gravity are positive, this will work for all the graphs.
 * 
 * Since bending moment is always positive, integral of bending moment a.k.a derivative of deflection is always increasing.
 * If it's always increasing it can only cross 0 once, so there's only one critical point for deflection, so there's only one local minimum.
 * This means I can find it by just going down the slope.
 */ 
function globalExtreme(loads, beamProperties, singleLoadFunction) {
    let yAtX = x => sumFunction(singleLoadFunction,x,loads,beamProperties)[0]

    let xA = 0
    let xD = beamProperties["Length of Beam"]

    // Each iteration reduces the search interval (xA to xD) to 0.51 of the previous.
    // 0.51^25 is about 4.9*10^-8, which is small enough that formatVal erases any further detail, so 25 is enough iterations.
    let numIterations = 25
    for(let i = 0; i < numIterations; i++) {
        let xB = 0.51 * xA + 0.49 * xD
        let xC = 0.49 * xA + 0.51 * xD
        let yB = Math.abs(yAtX(xB))
        let yC = Math.abs(yAtX(xC))

        // If the 49% mark is greater than the 51% mark, discard everything right of the 51% mark
        if(yB > yC)
            xD = xC
        // If the 51% mark is greater than the 49% mark, discard everything left of the 49% mark
        else
            xA = xB
    }

    let x = formatVal(xA)(xA)
    let yA = yAtX(xA)
    let y = formatVal(yA)(yA)

    return "x=" + x + ", y=" + y
}

// Takes a function that applies to a single load, applies it to every load and returns the sum. Can also sum arrays of length 2.
// Can represent instantaneous change in y. [0] is before (connects to the plot to the left), [1] is after (connects to the plot to the right).
// The array format is also used for reactions, in which case [0] is the left reaction and [1] is the right.
function sumFunction(singleLoadFunction, x, loads, beamProperties) {
    let y = [0,0]
    loads.forEach(load => {
        let individualY = singleLoadFunction(x, load, beamProperties)
        if(Array.isArray(individualY)) {
            y[0] += individualY[0]
            y[1] += individualY[1]
        }
        else {
            y[0] += individualY
            y[1] += individualY
        }
    })
    return y
}

// Integral of integral of bending moment. 
// For cantilever, deflection and d/dx deflection are 0 at x=0.
// For simply supported beam, deflection is 0 at x=0 and x=beam length.
function deflectionSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length
    let Lb = beamProperties["Length of Beam"]
    let EI = beamProperties.EI

    let y = 0
    if(load.Type === "Point") {
        if(x < X)
            y = (x**3-3*x**2*X) / 6
        else
            y = (X**3-3*X**2*x) / 6

        if(beamProperties["Support Type"] === "Simply Supported")
            y += (-2*Lb**2*X*x + 3*Lb*X*x**2 + 3*Lb*x*X**2 - X*x**3 - x*X**3) / 6 / Lb
    }
    else if(load.Type === "Distributed") {
        if(x < X)
            y = (-3*L**2*x**2 - 6*L*X*x**2 + 2*L*x**3) / 12
        else if(x < X + L)
            y = (-1*(X-x)**4 - 6*L**2*x**2 - 12*L*X*x**2 + 4*L*x**3) / 24
        else
            y = ((L+X)**4 - X**4 - 4*L**3*x - 12*L**2*X*x - 12*L*X**2*x) / 24

        if(beamProperties["Support Type"] === "Simply Supported")
            y += (x*X**4 - x*(L+X)**4 -2*L**2*x**3 - 4*L*x**3*X - 4*L**2*Lb**2*x + 4*L**3*Lb*x + 6*L**2*Lb*x**2 - 8*L*Lb**2*x*X + 12*L**2*Lb*x*X + 12*L*Lb*x*X**2 + 12*L*Lb*X*x**2) / 24 / Lb
    }
    else if(load.Type === "Triangular") {
        if(load["Taller End"] === "Left") {
            let subLoad1 = {Mass:load.Mass, Location:load.Location, Length:load.Length, Type:"Distributed"}
            let subLoad2 = {Mass:-1*load.Mass, Location:load.Location, Length:load.Length, Type:"Triangular", ["Taller End"]:"Right"}
            return deflectionSingleLoad(x, subLoad1, beamProperties) + deflectionSingleLoad(x, subLoad2, beamProperties)
        }
        if(x < X)
            y = L/2 * (x**3/6 - X*x**2/2 - L*x**2/3)
        else if(x < X + L)
            y = L/2 * (X**3/6 - x*X**2/2 - L*x**2/3 + (x-X)**3/6 - (x-X)**5/60/L**2)
        else
            y = L/2 * (X**3/6 + L**3/6 - (X+L)*X**2/2 - L*(X+L)**2/3 - L**3/60 - (L**2/4 + X**2/2 + 2*L*X/3)*(x-X-L))

        if(beamProperties["Support Type"] === "Simply Supported")
            y += L/2 * (-30*x*X**3 - 60*L*x*X**2 + 90*x*X**2*Lb - 30*x**3*X - 45*L**2*x*X - 60*x*X*Lb**2 + 90*x**2*X*Lb + 120*L*x*X*Lb - 20*L*x**3 - 12*L**3*x - 40*L*x*Lb**2 + 60*L*x**2*Lb + 45*L**2*x*Lb) / 180 / Lb
    }

    y *= F / EI

    // Prevent floating point errors when there is only 1 point mass and it's on top of a supported end of the beam. It should be 0 but sometimes floating point errors happen here.
    if(Math.abs(y) < 10**-18)
        y = 0

    return y
}

// Integral of shear force. Bending moment is 0 at x=beam length, for both support types.
function bendingMomentSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length
    let Lb = beamProperties["Length of Beam"]

    let y = 0
    if(load.Type === "Point") {
        if(x < X)
            y = F * (x - X)
        else
            y = 0

        if(beamProperties["Support Type"] === "Simply Supported")
            y -= F * X / Lb * (x-Lb)
    }
    else if(load.Type === "Distributed") {
        if(x < X)
            y = F * L * (x-X-L/2)
        else if(x < X + L)
            y = F * (L*x - X*L + X*x - (L**2+X**2+x**2)/2)
        else
            y = 0
        
        if(beamProperties["Support Type"] === "Simply Supported")
            y -= F*L * (X + L/2)/Lb * (x-Lb)
    }
    else if(load.Type === "Triangular") {
        if(load["Taller End"] === "Left") {
            let subLoad1 = {Mass:load.Mass, Location:load.Location, Length:load.Length, Type:"Distributed"}
            let subLoad2 = {Mass:-1*load.Mass, Location:load.Location, Length:load.Length, Type:"Triangular", ["Taller End"]:"Right"}
            return bendingMomentSingleLoad(x, subLoad1, beamProperties) + bendingMomentSingleLoad(x, subLoad2, beamProperties)
        }
        if(x < X)
            y = F*L/2 * (x-X-L*2/3)
        else if(x < X + L)
            y = F*L/2 * ((x-X) - (x-X)**3/3/L**2 - 2*L/3)
        else
            y = 0
        
        if(beamProperties["Support Type"] === "Simply Supported")
            y -= F*L/2 * (X + L * 2/3)/Lb * (x-Lb)
    }
    return y
}

function shearForceSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let X = load.Location
    let F = load.Mass * beamProperties.Gravity
    let L = load.Length
    let Lb = beamProperties["Length of Beam"]

    let y = 0
    if(load.Type === "Point") {
        if(x < X)
            y = F
        else if(x == X)
            // Array represents instantaneous change in y
            y = [F,0]
        else
            y = 0

        // For Cantilever, shear force at x=0 is F. For Simply Supported, it is something else, and the whole graph is translated down.
        if(beamProperties["Support Type"] === "Simply Supported") {
            if(Array.isArray(y)) {
                y[0] -= F * X / Lb
                y[1] -= F * X / Lb
            }
            else
                y -= F * X / Lb
        }
    }
    else if(load.Type === "Distributed") {
        if(x < X)
            y = F * L
        else if(x < X + L)
            y = F * (L - (x-X))
        else
            y = 0
        
        // For Cantilever, shear force at x=0 is F*L. For Simply Supported, it is something else, and the whole graph is translated down.
        if(beamProperties["Support Type"] === "Simply Supported")
            y -= F*L * (X + L/2)/Lb
    }
    else if(load.Type === "Triangular") {
        if(load["Taller End"] === "Left") {
            let subLoad1 = {Mass:load.Mass, Location:load.Location, Length:load.Length, Type:"Distributed"}
            let subLoad2 = {Mass:-1*load.Mass, Location:load.Location, Length:load.Length, Type:"Triangular", ["Taller End"]:"Right"}
            return shearForceSingleLoad(x, subLoad1, beamProperties) + shearForceSingleLoad(x, subLoad2, beamProperties)
        }
        if(x < X)
            y = F * L / 2
        else if(x < X + L)
            y = F * (L - (x-X)**2/L) / 2 
        else
            y = 0
        
        // For Cantilever, shear force at x=0 is F*L. For Simply Supported, it is something else, and the whole graph is translated down.
        if(beamProperties["Support Type"] === "Simply Supported")
            y -= F*L/2 * (X + L * 2/3)/Lb
    }
    return y
}

function reactionsSingleLoad(_, load, beamProperties){
    // Get relevant variables
    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length
    let Lb = beamProperties["Length of Beam"]

    if(load.Type === "Point") {
        if(beamProperties["Support Type"] === "Cantilever")
            return [F,0]
        else
            return [F * (Lb - X)/Lb, F * X/Lb]
    }
    else if(load.Type === "Distributed") {
        if(beamProperties["Support Type"] === "Cantilever")
            return [F*L,0]
        else
            return [F*L * (Lb - X - L/2)/Lb, F*L * (X + L/2)/Lb]
    }
    else if(load.Type === "Triangular") {
        if(load["Taller End"] === "Left") {
            let subLoad1 = {Mass:load.Mass, Location:load.Location, Length:load.Length, Type:"Distributed"}
            let subLoad2 = {Mass:-1*load.Mass, Location:load.Location, Length:load.Length, Type:"Triangular", ["Taller End"]:"Right"}
            return [reactionsSingleLoad(_, subLoad1, beamProperties)[0] + reactionsSingleLoad(_, subLoad2, beamProperties)[0],
                    reactionsSingleLoad(_, subLoad1, beamProperties)[1] + reactionsSingleLoad(_, subLoad2, beamProperties)[1]]
        }
        if(beamProperties["Support Type"] === "Cantilever")
            return [F*L/2,0]
        else
            return [F*L/2 * (Lb - X - L * 2/3)/Lb, F*L/2 * (X + L * 2/3)/Lb]
    }
    return null
}

// Find a scale for the y axis that comfortably fits the graph.
function getScale(dataList) {
    // Find the biggest absolute value in datalist
    let maxAbsVal = 0
    dataList.forEach(dataPoint =>
        maxAbsVal = Math.max(maxAbsVal, Math.abs(dataPoint.y))
    )
    
    // If the line is all 0, scale will be 1
    if(maxAbsVal == 0)
        return 1
    
    // Extreme stays in place while plot scale changes
    return maxAbsVal * 1.5
    // Plot scale stays in place while extreme changes, until extreme is no longer between the 50% and 100% marks
    //return 2 ** Math.ceil(Math.log2(maxAbsVal))
}

// This function returns a formatting function for numbers, using the given scale.
function formatVal(scale) {
    // If the scale is very large or tiny, return a function that converts vals to scientific notation.
    if(Math.abs(scale) >= 10**5 || (Math.abs(scale) <= 10**-4 && scale != 0))
        return val => {
            val = Number(Number(val).toPrecision(6))
            return "" + (val == 0 ? val : val.toExponential())
        }
    // If scale is normal or scale is exactly 0, return a function that just returns val.
    else
        return val => {
            val = Number(Number(val).toPrecision(6))
            return "" + val
        }
    // Both functions round the vals to a precision of 6 to avoid floating point trails.
    // They must also be concatenated with a string or some labels will not display 0 (they view it as false and put no label)
}

function chooseSingleLoadFunction(title) {
    if(title === "Deflection Diagram")
        return deflectionSingleLoad
    if(title === "Bending Moment Diagram")
        return bendingMomentSingleLoad
    if(title === "Shear Force Diagram")
        return shearForceSingleLoad
}

export default SidePlot