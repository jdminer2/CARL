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
            let yValue = sumFunction(props.singleLoadFunction, xValue, props.loads, props.beamProperties)
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
                y = sumFunction(props.singleLoadFunction, x, props.loads, props.beamProperties)[0]
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
            <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth/2} xDomain={[0,props.beamProperties["Length of Beam"]]} yDomain ={[scale, scale]} margin = {{left:60, right:60}}>
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
            <div style={{width:window.innerWidth/8}}>
                <div>
                    {coord.title}
                </div>
                <div>
                    x=
                    <input type="text"
                        value={coord.x}
                        style={{width:50}}
                        onChange={(e) => {
                            updateCoord(e.target.value, true)
                        }}
                    />
                    , y={coord.y}
                </div>
                <div>
                    Global Extreme:<br/>
                    {props.showGlobalExtreme?globalExtreme(props.loads,props.beamProperties,props.singleLoadFunction):""}
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
        if(beamProperties["Support Type"] === "Cantilever")
            return [F*L,0]
        else
            return [F*L * (Lb - X - L/2)/Lb, F*L * (X + L/2)/Lb]
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
    
    return maxAbsVal * 1.5
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

export default SidePlot