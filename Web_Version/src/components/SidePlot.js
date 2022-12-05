import '../App.css'
import React, {useEffect, useState} from 'react'
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField} from '@mui/material'
import {HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis} from "react-vis"
import {complex,add,subtract,multiply,divide,sqrt,cbrt,abs} from 'mathjs'

/**
 * Props:
 * loads
 * beamProperties
 * singleLoadFunction
 * title
 * color
 * showReactions
 * showGlobalMin
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
        let reactionLabels = []

        // If the supports are on top of each other, don't display reactions because they will be infinite or invalid
        if(abs(props.beamProperties["Pinned Support Position"] - props.beamProperties["Roller Support Position"]) <= 10**-10)
            return reactionLabels

        // Compute the reactions, R1 and R2.
        let [R1,R2] = sumFunction(reactionsSingleLoad, null, props.loads, props.beamProperties)

        if(props.beamProperties["Support Type"] === "Simply Supported") {
            // If the supports are in the same spot, don't put any labels because the reactions are infinite.
            if(abs(props.beamProperties["Pinned Support Position"] - props.beamProperties["Roller Support Position"]) <= 10**-10);
            else {
                let pinnedLeft = props.beamProperties["Pinned Support Position"] < props.beamProperties["Roller Support Position"]
                // Left side reaction label
                reactionLabels.push({x: props.beamProperties["Pinned Support Position"], y: -60/100 * scale * window.devicePixelRatio, label: (pinnedLeft?formatVal(R1)(R1):formatVal(R2)(R2)), style: {fontSize: 15, textAnchor: "middle"}})
                reactionLabels.push({x: props.beamProperties["Pinned Support Position"], y: -55/100 * scale * window.devicePixelRatio, label: "\u2191", style: {fontSize: 35, textAnchor: "middle"}})
                reactionLabels.push({x: props.beamProperties["Pinned Support Position"], y: -40/100 * scale * window.devicePixelRatio,  label: "\u25b2", style: {fontSize: 25, textAnchor: "middle", font: "verdana", fill: "#12939A"}})
                // Right side reaction label
                reactionLabels.push({x: props.beamProperties["Roller Support Position"], y: -70/100 * scale * window.devicePixelRatio, label: (pinnedLeft?formatVal(R2)(R2):formatVal(R1)(R1)),  style: {fontSize: 15, textAnchor: "middle"}})
                reactionLabels.push({x: props.beamProperties["Roller Support Position"], y: -55/100 * scale * window.devicePixelRatio, label: "\u2191", style: {fontSize: 35, textAnchor: "middle"}})
                reactionLabels.push({x: props.beamProperties["Roller Support Position"], y: -40/100 * scale * window.devicePixelRatio,  label: "\u2b24", style: {fontSize: 25, textAnchor: "middle", font: "verdana", fill: "#12939A"}})
            }
        }
        else {
            reactionLabels.push({x: 7.5/100 * props.beamProperties["Length of Beam"] * window.devicePixelRatio, y: -40/100 * scale * window.devicePixelRatio, label: formatVal(R1)(R1), style: {fontSize: 15, textAnchor: "middle"}})
            reactionLabels.push({x: 7.5/100 * props.beamProperties["Length of Beam"] * window.devicePixelRatio, y: -35/100 * scale * window.devicePixelRatio, label: "\u2191", style: {fontSize: 35, textAnchor: "middle"}})
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
                y = sumFunction(chooseSingleLoadFunction(props.title), x, props.loads, props.beamProperties)
                if(abs(y[0]-y[1]) >= 10**-10) {
                    y = ""
                }
                else
                    y = formatVal(y[0])(y[0])
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
                    {props.title === "Deflection Diagram"?
                    <div>
                        Global Minimum:<br/>
                        {globalMin(props.loads,props.beamProperties)}
                    </div>
                    :""}
                </div>
            </div>
        </div>
    )
}

/**
 * 
 */ 
function globalMin(loads, beamProperties) {
    // Split the beam into segments at each changePoint. changePoints are points where the polynomial of the beam may change.
    let changePoints = []
    // Edges of the beam
    changePoints.push(0, beamProperties["Pinned Support Position"])
    // Supports in the beam
    changePoints.push(beamProperties["Roller Support Position"], beamProperties["Length of Beam"])
    // Edges of all loads
    loads.forEach(load => 
        changePoints.push(load.Location, load.Location+load.Length)
    )
    
    // Sort ascending and remove duplicates
    changePoints.sort((a,b)=>(a > b)? 1 : -1)
    let prev = -1
    for(let i = 0; i < changePoints.length; i++) {
        if(changePoints[i] == prev) {
            changePoints.splice(i,1)
            i--
        }
        else
            prev = changePoints[i]
    }

    // By the first derivative test, candidate extrema for deflection only occur when slope is 0 or undefined, or can occur at endpoints.
    let candidateExtrema = []
    candidateExtrema.push(changePoints[0])
    // Each segment of the beam
    for(let i = 0; i < changePoints.length - 1; i++) {
        let x = (changePoints[i] + changePoints[i+1])/2
        let polynomial = [0,0,0,0,0]
        // Find slope polynomial at the center of the segment, summing all single-load polynomials
        getSubloads(loads,beamProperties).forEach(load=>{
            slopeSingleLoad(x, load, beamProperties).forEach((a,i)=>{
                polynomial[i] += a
            })
        })
        // Get all the zeroes of this polynomial that are inside the segment
        findRoots(polynomial, x).forEach(value => {
            if(changePoints[i] <= value && value <= changePoints[i + 1])
                candidateExtrema.push(value)
        })
        // Get endpoints of the segments
        candidateExtrema.push(changePoints[i+1])
    }

    // Deflection function
    let yAtX = x => sumFunction(deflectionSingleLoad,x,loads,beamProperties)[0]

    // Get the min and max of the segments
    //let maxX = "None"
    //let maxY = "None"
    let minX = "None"
    let minY = "None"
    candidateExtrema.forEach(x => {
        let y = yAtX(x)
        y = formatVal(y)(y)
        //if(maxY === "None" || y > maxY) {
        //    maxX = x
        //    maxY = y
        //}
        if(minY === "None" || y < minY) {
            minX = x
            minY = y
        }
    })
    // It's impossible for the values to still be "None" at this point

    let x = formatVal(minX)(minX)
    let y = yAtX(minX)
    y = formatVal(y)(y)

    return "x=" + x + ", y=" + y
}

// Function to find zeroes of a polynomial up to quartic
function findRoots(polynomial, middleOfInterval) {
    // https://en.wikipedia.org/wiki/Quartic_equation
    if(abs(polynomial[4]) >= 10**-10) {
        // read in Ax^4 + Bx^3 + Cx^2 + Dx^1 + E
        let A,B,C,D,E
        [E,D,C,B,A] = polynomial
        // convert to x^4 + ax^2 + bx^1 + c
        let a,b,c
        [a,b,c] = [-3*B**2/8/A**2 + C/A, B**3/8/A**3 - B*C/2/A**2 + D/A, -3*B**4/256/A**4 + C*B**2/16/A**3 - B*D/4/A**2 + E/A]

        if(abs(b) <= 10**-10) {
            // x^4 + ax^2 + c -> quadratic equation
            let roots = []
            findRoots([c,a,1,0,0],null).forEach(value=> {
                if(value >= 0)
                    roots.push(sqrt(value) - B/4/A, -1*sqrt(value) - B/4/A)
            })
            return roots
        }
        else {
            let y = findRoots([a*c-b**2/4,-2*c,-1*a,2,0],null)[0]
            let roots = [];
            [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(option =>{
                let q1 = multiply(option[0],sqrt(2*y-a))
                let q2 = multiply(option[1],sqrt(subtract(-2*y-a,divide(2*b,q1))))
                let r = complex(add(q1,q2))
                if(abs(r.im) <= 10**-10)
                    roots.push(r.re/2 - B/4/A)
            })
            return roots
        }
    // https://en.wikipedia.org/wiki/Cubic_equation
    } else if(abs(polynomial[3]) >= 10**-10) {
        // read in ax^3 + bx^2 + cx^1 + d
        let a,b,c,d
        [d,c,b,a,] = polynomial

        let d0 = b**2 - 3*a*c
        let d1 = 2*b**3 - 9*a*b*c + 27*a**2*d

        let C = complex(cbrt(divide(add(d1,sqrt(d1**2 - 4*d0**3)),2)))
        if(abs(C) <= 10**-10)
            C = complex(cbrt(divide(subtract(d1,sqrt(d1**2 - 4*d0**3)),2)))

        if(abs(C) <= 10**-10)
            return [-1/3/a*b]
        else {
            let roots = []
            for(let i = 0; i < 3; i++) {
                let r = complex(multiply(-1/3/a,add(add(b,C),divide(d0,C))))
                if(abs(r.im) <= 10**-10)
                    roots.push(r.re)
                C = complex(multiply(C,complex(-1/2,sqrt(3)/2)))
            }
            return roots
        }
    // Quadratic Equation
    } else if(abs(polynomial[2]) >= 10**-10) {
        // read in ax^2 + bx + c
        let a,b,c
        [c,b,a,,] = polynomial

        let q = b**2 - 4*a*c
        if(q >= 0) {
            return [(-1*b + sqrt(q))/2/a, (-1*b - sqrt(q))/2/a]
        }
        else
            return []
    // Linear
    } else if(abs(polynomial[1]) >= 10**-10) {
        // read in ax + b
        let a,b
        [b,a,,,] = polynomial
        return [-1*b/a]
    // Constant
    } else if(abs(polynomial[0]) >= 10**-10) {
        // never 0
        return []
    // Zero
    } else {
        // always 0 but we only need to look at the middle of the interval
        return [middleOfInterval]
    }
}

// Takes a function that applies to a single load, applies it to every load and returns the sum. Can also sum arrays of length 2.
// Can represent instantaneous change in y. [0] is before (connects to the plot to the left), [1] is after (connects to the plot to the right).
// The array format is also used for reactions, in which case [0] is the left reaction and [1] is the right.
function sumFunction(singleLoadFunction, x, loads, beamProperties) {
    let y = [0,0]
    getSubloads(loads, beamProperties).forEach(load => {
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

function getSubloads(loads, beamProperties) {
    let newLoads = []

    // Convert triangles with taller left-end to taller right-end
    loads.forEach(load => {
        if(load.Type === "Triangular" && load["Taller End"] === "Left") {
            newLoads.push({Mass:load.Mass, Location:load.Location, Length:load.Length, Type:"Distributed"})
            newLoads.push({Mass:-1*load.Mass, Location:load.Location, Length:load.Length, Type:"Triangular", ["Taller End"]:"Right"})
        }
        else
            newLoads.push(load)
    })

    return newLoads
}

// Integral of integral of bending moment. 
// For cantilever, deflection and slope are 0 at x=0.
// For simply supported beam, deflection is 0 at x=0 and x=beam length.
function deflectionSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    let c = beamProperties["Length of Beam"] - b

    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length

    let y
    let rTerm
    let coeff
    // Only used if b == 0
    let cSlope

    if(load.Type === "Point") {
        rTerm = 0
        coeff = F

        if(x < X)
            y = (x**3 - 3*x**2*(X+L*rTerm)) / 6
        else
            y = (X**3 - 3*X**2*x) / 6

        cSlope = [a**2/2 - a*(X+L*rTerm), 
                  -1*X**2/2,
                  -1*X**2/2]
    }
    else if(load.Type === "Distributed") {
        rTerm = 1/2
        coeff = F * L

        if(x < X)
            y = (x**3 - 3*x**2*(X+L*rTerm)) / 6
        else if(x < X + L)
            y = (x**3 - 3*x**2*(X+L*rTerm)) / 6 - (x-X)**4/24/L
        else
            y = ((X+L)**3 - 3*(X+L)**2*(X+L*rTerm)) / 6 - L**3/24 + ((X+L)**2/2 - (X+L)*(X+L*rTerm) - L**2/6)*(x - (X + L))

        
        cSlope = [a**2/2 - a*(X+L*rTerm), 
                  a**2/2 - a*(X+L*rTerm) - (a-X)**3/6/L, 
                  (X+L)**2/2 - (X+L)*(X+L*rTerm) - L**2/6] 
    }
    else if(load.Type === "Triangular") {
        rTerm = 2/3
        coeff = F * L / 2

        if(x < X)
            y = (x**3 - 3*x**2*(X+L*rTerm)) / 6
        else if(x < X + L)
            y = (x**3 - 3*x**2*(X+L*rTerm)) / 6 - (x-X)**5/60/L**2
        else
            y = ((X+L)**3 - 3*(X+L)**2*(X+L*rTerm)) / 6 - L**3/60 + (3*L**2 + 8*L*X + 6*X**2)*(X+L-x)/12

        cSlope = [a**2/2 - a*(X+L*rTerm), 
                  a**2/2 - a*(X+L*rTerm) - (a-X)**4/12/L**2, 
                  -1*(X+L)*(X/2 + L/6) - L**2/12] 
    }


    if(beamProperties["Support Type"] === "Simply Supported") {
        if(x < a)
            y -= (x**3 - 3*x**2*(X+L*rTerm)) / 6
        else if(x < a+b)
            y += a**2/2*(x - a/3) + (a - X - L*rTerm)*(a**2*x + x**3/3 - a**3/3 - a*x**2 - b*x**2)/2/b
        else
            y += a**2/2*(x - a/3) + (a - X - L*rTerm)*(a**2 + b**2/3 + a*b - x*b - 2*a*x)/2
        
        // From solving arbitrary constanst to make y=0 at support positions
        y += ((3*a**2*x - 2*a**3) + (3*a**2 - 6*a*x)*(X+L*rTerm))/6
        if(abs(b/beamProperties["Length of Beam"]) <= 10**-10) {
            if(a < X)
                cSlope = cSlope[0]
            else if(a < X+L)
                cSlope = cSlope[1]
            else
                cSlope = cSlope[2]
            y += (a-x) * cSlope
        }
        else
            y += ((2*a*b*x - 2*a**2*b) + (-2*b*x + 2*a*b)*(X+L*rTerm))/6
    }

    // Prevent floating point errors.
    if(abs(y) < 10**-10)
        y = 0
    
    y *= coeff / beamProperties.EI

    // From solving arbitrary constants to make y=0 at support positions
    if(beamProperties["Support Type"] === "Simply Supported") {
        let cantileverBeamProperties = {...beamProperties}
        cantileverBeamProperties["Support Type"] = "Cantilever"

        if(abs(b/beamProperties["Length of Beam"]) <= 10**-10)
            y -= deflectionSingleLoad(a, load, cantileverBeamProperties)
        else {
            y += (x - a - b) / b * deflectionSingleLoad(a, load, cantileverBeamProperties)
            y += (a - x) / b * deflectionSingleLoad(a + b, load, cantileverBeamProperties)
        }
    }

    return y
}

// Integral of bending moment. 
// For cantilever, deflection and slope are 0 at x=0.
// For simply supported beam, deflection is 0 at x=0 and x=beam length.
// This function returns an array representing the polynomial for y at this point, instead of returning the y at this point
// [a0,a1,a2,a3,a4] represents a0*x^0 + a1*x^1 + a2*x^2 + a3*x^3 + a4*x^4
// This function also won't be used when x is at an instant change of slope, so does not contain the if statements for that
function slopeSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    let c = beamProperties["Length of Beam"] - b
    
    let F = load.Mass * beamProperties.Gravity
    let L = load.Length
    let X = load.Location

    let a0,a1,a2,a3,a4
    [a0,a1,a2,a3,a4] = [0,0,0,0,0]
    let rTerm
    let coeff

    if(load.Type === "Point") {
        rTerm = 0
        coeff = F

        if(x < X) {
            // y = x**2/2 - x*(X+L*rTerm)
            a2 = 1/2
            a1 = -1*(X+L*rTerm)
        }
        else {
            // y = -1*X**2/2
            a0 = -1*X**2/2
        }
    }
    else if(load.Type === "Distributed") {
        rTerm = 1/2
        coeff = F * L

        if(x < X) {
            // y = x**2/2 - x*(X+L*rTerm)
            a2 = 1/2
            a1 = -1*(X+L*rTerm)
        }
        else if(x < X + L) {
            // y = x**2/2 - x*(X+L*rTerm) - (x-X)**3/6/L
            a3 = -1 /6/L
            a2 = 3*X /6/L + 1/2
            a1 = -3*X**2 /6/L + -1*(X+L*rTerm)
            a0 = X**3 /6/L
        }
        else {
            // y = (X+L)**2/2 - (X+L)*(X+L*rTerm) - L**2/6
            a0 = (X+L)**2/2 - (X+L)*(X+L*rTerm) - L**2/6
        }
    }
    else if(load.Type === "Triangular") {
        rTerm = 2/3
        coeff = F * L / 2

        if(x < X) {
            // y = x**2/2 - x*(X+L*rTerm)
            a2 = 1/2
            a1 = -1*(X+L*rTerm)
        }
        else if(x < X + L) {
            // y = x**2/2 - x*(X+L*rTerm) - (x-X)**4/12/L**2
            a4 = -1 /12/L**2
            a3 = 4*X /12/L**2
            a2 = -6*X**2 /12/L**2 + 1/2
            a1 = 4*X**3 /12/L**2 + -1*(X+L*rTerm)
            a0 = -1*X**4 /12/L**2
        }
        else {
            // y = -1*(X+L)*(X/2 + L/6) - L**2/12
            a0 = -1*(X+L)*(X/2 + L/6) - L**2/12
        }
    }

    if(beamProperties["Support Type"] === "Simply Supported") {
        if(x < a) {
            // y += -x**2/2 + x*(X+L*rTerm)
            a2 += -1/2
            a1 += X+L*rTerm
        }
        else if(x < a+b) {
            // y += a**2/2 + (a - X - L * rTerm) * (a**2 + x**2 - 2*a*x - 2*b*x) / 2 / b
            a2 += (a - X - L*rTerm)/2/b
            a1 += (a - X - L*rTerm)*-1*(a+b)/b
            a0 += (a - X - L*rTerm)*a**2/2/b + a**2/2
        }
        else {
            // y += a**2/2 - (a - X - L * rTerm) * (a + b/2)
            a0 += a**2/2 - (a - X - L * rTerm) * (a + b/2)
        }

        if(abs(b/beamProperties["Length of Beam"]) <= 10**-10) {
            // y += a**2/2 - a*(X+L*rTerm)
            a0 += a**2/2 - a*(X+L*rTerm)
        }
        else {
            // y += ((3*a**2 + 2*a*b) + (-6*a - 2*b) * (X + L * rTerm)) / 6
            a0 += ((3*a**2 + 2*a*b) + (-6*a - 2*b) * (X + L * rTerm)) / 6
        }
    }

    // y *= coeff
    [a0,a1,a2,a3,a4] = [a0*coeff,a1*coeff,a2*coeff,a3*coeff,a4*coeff]

    // From solving arbitrary constants to make y=0 at support positions
    if(beamProperties["Support Type"] === "Simply Supported") {
        let cantileverBeamProperties = {...beamProperties}
        cantileverBeamProperties["Support Type"] = "Cantilever"

        if(abs(b/beamProperties["Length of Beam"]) <= 10**-10) {
            // y -= slopeSingleLoad(a, load, cantileverBeamProperties)
            let vals = slopeSingleLoad(a, load, cantileverBeamProperties)
            a0 -= vals[0]
            a1 -= vals[1]
            a2 -= vals[2]
            a3 -= vals[3]
            a4 -= vals[4]
        }
        else {
            // y += deflectionSingleLoad(a, load, cantileverBeamProperties)/b
            a0 += deflectionSingleLoad(a, load, cantileverBeamProperties)*cantileverBeamProperties.EI/b
            // y -= deflectionSingleLoad(a+b, load, cantileverBeamProperties)/b
            a0 -= deflectionSingleLoad(a+b, load, cantileverBeamProperties)*cantileverBeamProperties.EI/b
        }
    }

    return [a0,a1,a2,a3,a4]
}

// Integral of shear force. Bending moment is 0 at x=beam length, for all support types.
function bendingMomentSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    let c = beamProperties["Length of Beam"] - b
    
    let F = load.Mass * beamProperties.Gravity
    let L = load.Length
    let X = load.Location

    let y
    let rTerm
    let coeff

    if(load.Type === "Point") {
        rTerm = 0
        coeff = F

        if(x < X)
            y = x - X - L*rTerm
        else
            y = 0
    }
    else if(load.Type === "Distributed") {
        rTerm = 1/2
        coeff = F * L

        if(x < X)
            y = x - X - L*rTerm
        else if(x < X + L)
            y = x - X - L*rTerm - (x-X)**2/2 / L
        else
            y = 0
    }
    else if(load.Type === "Triangular") {
        rTerm = 2/3
        coeff = F * L / 2

        if(x < X)
            y = x - X - L*rTerm
        else if(x < X + L)
            y = x - X - L*rTerm - (x-X)**3/3 / L**2
        else
            y = 0
    }

    if(beamProperties["Support Type"] === "Simply Supported") {
        if(x < a)
            y -= x - X - L * rTerm
        else if(x == a && abs(b/beamProperties["Length of Beam"]) <= 10**-10)
            y = [y - (x - X - L * rTerm), y]
        else if(x < a+b)
            y -= (a - X - L * rTerm) * (a + b - x) / b
        
    }

    if(Array.isArray(y)) {
        // Prevent floating point errors.
        if(abs(y[0]) < 10**-10)
            y[0] = 0
        if(abs(y[1]) < 10**-10)
            y[1] = 0

        y[0] *= coeff
        y[1] *= coeff
    }
    else {
        // Prevent floating point errors.
        if(abs(y) < 10**-10)
            y = 0

        y *= coeff
    }

    return y
}

function shearForceSingleLoad(x, load, beamProperties) {
    // Get relevant variables
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    let c = beamProperties["Length of Beam"] - b
    
    let F = load.Mass * beamProperties.Gravity
    let L = load.Length
    let X = load.Location

    let y
    let rTerm
    let coeff

    if(load.Type === "Point") {
        rTerm = 0
        coeff = F

        if(x < X)
            y = 1
        else if(x == X)
            // Array represents instantaneous change in y
            y = [1,0]
        else
            y = 0
    }
    else if(load.Type === "Distributed") {
        rTerm = 1/2
        coeff = F * L

        if(x < X)
            y = 1
        else if(x < X + L)
            y = 1 - (x-X)/L
        else
            y = 0
    }
    else if(load.Type === "Triangular") {
        rTerm = 2/3
        coeff = F * L / 2

        if(x < X)
            y = 1
        else if(x < X + L)
            y = 1 - (x-X)**2/L**2
        else
            y = 0
    }

    // For Simply Supported, the support reactions will shift parts of shear force down
    if(beamProperties["Support Type"] === "Simply Supported") {
        if(!Array.isArray(y))
            y = [y,y]
        if(x <= a)
            y[0] -= 1
        else if(x <= a+b)
            y[0] -= (X + L * rTerm - a) / b

        if(x < a)
            y[1] -= 1
        else if(x < a+b)
            y[1] -= (X + L * rTerm - a) / b
    }

    if(Array.isArray(y)) {
        // Prevent floating point errors.
        if(abs(y[0]) < 10**-10)
            y[0] = 0
        if(abs(y[1]) < 10**-10)
            y[1] = 0

        y[0] *= coeff
        y[1] *= coeff
    }
    else {
        // Prevent floating point errors.
        if(abs(y) < 10**-10)
            y = 0
        
        y *= coeff
    }

    return y
}

function reactionsSingleLoad(_, load, beamProperties){
    // Get relevant variables
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    let c = beamProperties["Length of Beam"] - b
    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length

    let rTerm
    let coeff

    if(load.Type === "Point") {
        rTerm = 0
        coeff = F
    }
    else if(load.Type === "Distributed") {
        rTerm = 1/2
        coeff = F * L
    }
    else if(load.Type === "Triangular") {
        rTerm = 2/3
        coeff = F * L / 2
    }

    if(beamProperties["Support Type"] === "Cantilever")
        return [coeff, 0]
    else
        return [coeff * (1 - (X + L * rTerm - a)/b), coeff * (X + L * rTerm - a)/b]
}

// Find a scale for the y axis that comfortably fits the graph.
function getScale(dataList) {
    // Find the biggest absolute value in datalist
    let maxAbsVal = 0
    dataList.forEach(dataPoint =>
        maxAbsVal = Math.max(maxAbsVal, abs(dataPoint.y))
    )
    
    // If the line is all 0, scale will be 1
    if(maxAbsVal <= 10**-10)
        return 1
    
    // Extreme stays in place while plot scale changes
    return maxAbsVal * 1.5
    // Plot scale stays in place while extreme changes, until extreme is no longer between the 50% and 100% marks
    //return 2 ** Math.ceil(Math.log2(maxAbsVal))
}

// This function returns another function so it can be used in XYPlot's tickFormat.
// To use formatting in areas other than the tickFormat, the function must be called like "formatVal(value)(value)"
// Values are rounded to 6 significant digits, and values tinier than 10^-10 are rounded to 0.
// If the scale is large or tiny enough (but not 0), numbers will be displayed in scientific notation.
function formatVal(scale) {
    // If the scale is very large or tiny, return a function that converts vals to scientific notation.
    if(abs(scale) >= 10**5 || (10**-4 >= abs(scale) && abs(scale) >= 10**-10))
        return val => {
            val = Number(Number(val).toPrecision(6))
            if(abs(val) <= 10**-10)
                val = 0
            return "" + (val == 0 ? val : val.toExponential())
        }
    // If scale is normal or scale is exactly 0, return a function that just returns val.
    else
        return val => {
            val = Number(Number(val).toPrecision(6))
            if(abs(val) <= 10**-10)
                val = 0
            return "" + val
        }
    // The returned values must be Strings for XYPlot's tickFormat, else 0 will be read as false and will not display
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