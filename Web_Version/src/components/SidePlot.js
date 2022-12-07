import '../App.css'
import React, {useState} from 'react'
import {HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis} from "react-vis"
import {complex,add,subtract,multiply,divide,sqrt,cbrt,abs} from 'mathjs'

/**
 * Props:
 * title
 * loads
 * beamProperties
 * color
 * showReactions
 */
function SidePlot (props) {
    // The scale of the plot
    const [scale, setScale] = useState(1)
    // The selected coordinate on the plot
    const [coord,setCoord] = useState({title:props.title, x:0, y:0})
    
    // Gives (x,y) plot points for diagram, and updates the scale for the plot.
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
            let yValue = sumFunction(chooseSingleLoadFunction(props.title), props.loads, props.beamProperties, xValue)
            plotData.push({x:xValue, y:yValue[0]}, {x:xValue, y:yValue[1]})
        })

        // Update plot scale if needed
        let newScale = getScale(plotData)
        if(newScale != scale)
            setScale(newScale)

        return plotData
    }

    /**
     * Update the selected coordinate of the plot
     * enteredX is the x-value to update to
     * isTyping is true if the coordinate was changed via the textbox, false if it was changed via mouse movement
     */ 
    function updateCoord(enteredX, isTyping){
        let x = enteredX
        let y = coord.y
        if(parseFloat(x) == x) {
            x = Number(x)
            x = Number(formatVal(x)(x))
            if(x >= 0 && x <= props.beamProperties["Length of Beam"]) {
                y = sumFunction(chooseSingleLoadFunction(props.title), props.loads, props.beamProperties, x)
                if(abs(y[0]-y[1]) >= 10**-10) {
                    y = ""
                }
                else
                    y = formatVal(y[0])(y[0])
            }
        }
        // Do not update x if isTyping, or else textbox's contents will be changed as the user is typing
        setCoord({title:coord.title, x:(isTyping?enteredX:x), y:y})
    }

    // Returns whether coord.x is a number and in-bounds.
    // If it is, then a grey line can be drawn to represent the current coordinate
    function validX() {
        let x = coord.x
        // Check if number
        if(parseFloat(x) == x) {
            x = Number(x)
            x = Number(formatVal(x)(x))
            // Check if in-bounds
            if(x >= 0 && x <= props.beamProperties["Length of Beam"])
                return true
        }
        return false
    }

    return (
        <div className={"rowC"}>
            {/* Plot */}
            <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth * 0.4} xDomain={[0,props.beamProperties["Length of Beam"]]} yDomain ={[scale, scale]} margin = {{left:60, right:60}}>
                <VerticalGridLines/>
                <HorizontalGridLines/>
                <XAxis tickFormat = {formatVal(props.beamProperties["Length of Beam"])} title = {props.title}/>
                <YAxis tickFormat = {formatVal(scale)}/>
                {/* Beam */}
                <LineSeries data = {[{x:0, y:0}, {x:props.beamProperties["Length of Beam"],y:0}]} />
                {/* Function being plotted */}
                <LineSeries data={diagram()} onNearestX = {(datapoint,e) => updateCoord(datapoint.x, false)} color={props.color}/>
                {/* Current X indicator (if valid X) */}
                {validX() ? <LineSeries data = {[{x:coord.x, y:scale}, {x:coord.x, y:-1*scale}]} color="grey" strokeWidth="1px"/>:[]}
                {/* Reaction labels (optional) */}
                {props.showReactions ? <LabelSeries data={reactions(props.loads, props.beamProperties)} />:[]}
            </XYPlot>
            {/* Side Info */}
            <div style={{display:"flex", alignItems:"center", justifyContent:"center", width:"100%"}}>
                <div>
                    {/* Current coordinates */}
                    {coord.title}<br/>
                    x=<input type="text"
                        value={coord.x}
                        style={{width:50}}
                        onChange={(e) => {
                            updateCoord(e.target.value, true)
                        }}
                    />, y={coord.y}<br/>
                    {props.title === "Deflection Diagram"?
                    /* Global minimum (Deflection Plot only) */
                    <div>
                        Global Minimum:<br/>
                        {getExtremaInRange(props.title, props.loads, props.beamProperties, 0, props.beamProperties["Length of Beam"])}
                    </div>
                    :""}
                </div>
            </div>
        </div>
    )
}

/**
 * Get reaction labels
 */
function reactions(loads, beamProperties) {
    let reactionLabels = []
    let pinnedSupportPos = beamProperties["Pinned Support Position"]
    let rollerSupportPos = beamProperties["Roller Support Position"]

    // If the supports are on top of each other, don't display reactions because they will be infinite or invalid

    // Compute the reactions, R1 (left support) and R2 (right support)
    let [R1,R2] = sumFunction(reactionsSingleLoad, loads, beamProperties, 0)

    // Cantilever reaction arrow
    if(beamProperties["Support Type"] === "Cantilever") {
        // Left side reaction label only
        reactionLabels.push({x: 0, y: 0, yOffset: 32, label: "\u2191", style: {fontSize: 35, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        reactionLabels.push({x: 0, y: 0, yOffset: 43, label: formatVal(R1)(R1), style: {fontSize: 15, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
    }
    // Simply supported reaction arrows
    else {
        // Pinned and Roller Shapes
        reactionLabels.push({x: pinnedSupportPos, y: 0, yOffset: 24,  label: "\u25b2", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        reactionLabels.push({x: rollerSupportPos, y: 0, yOffset: 24,  label: "\u2b24", style: {fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        
        // If supports at the same spot, just one reaction arrow representing their sum.
        if(abs(pinnedSupportPos - rollerSupportPos) <= 10**-10) {
            reactionLabels.push({x: pinnedSupportPos, y: 0, yOffset: 54, label: "\u2191", style: {fontSize: 35, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            reactionLabels.push({x: pinnedSupportPos, y: 0, yOffset: 65, label: formatVal(R1)(R1), style: {fontSize: 15, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        }

        // Else one reaction arrow for each support.
        else {
            // pinnedLeft is true if the pinned support is on the left and the roller support is on the right
            let pinnedLeft = pinnedSupportPos < rollerSupportPos
            let tooCloseTogether = abs(pinnedSupportPos - rollerSupportPos) < 8/100 * beamProperties["Length of Beam"] * (1920 / (window.innerWidth - 300))

            // Pinned reaction label
            reactionLabels.push({x: pinnedSupportPos, y: 0, yOffset: 54, label: "\u2191", style: {fontSize: 35, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            reactionLabels.push({x: pinnedSupportPos, y: 0, yOffset: 70, label: (pinnedLeft?formatVal(R1)(R1):formatVal(R2)(R2)), style: {fontSize: 15, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            
            // Roller reaction label
            reactionLabels.push({x: rollerSupportPos, y: 0, yOffset: tooCloseTogether?60:54, label: "\u2191", style: {fontSize: 35, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle"}})
            reactionLabels.push({x: rollerSupportPos, y: 0, yOffset: tooCloseTogether?90:70, label: (pinnedLeft?formatVal(R2)(R2):formatVal(R1)(R1)),  style: {fontSize: 15, dominantBaseline: "text-after-edge", textAnchor: "middle"}})
        }
    }
    return reactionLabels
}

/**
 * Finds the minimum in the given range from left to right.
 * Requires left <= right
 * 
 * This only works for the deflection function.
 * Finding the maximum in the range is implemented, but commented out.
 */ 
 function getExtremaInRange(title, loads, beamProperties, left, right) {
    // Get all candidate points for min/max
    let criticalPoints = getCriticalPoints(title, loads, beamProperties, left, right)
    
    // Deflection function
    let yAtX = x => sumFunction(chooseSingleLoadFunction(title), loads, beamProperties, x)

    // Find the lowest/highest of the candidate points
    let minX = "None"
    let minY = "None"
    //let maxX = "None"
    //let maxY = "None"
    criticalPoints.forEach(x => {
        let y = yAtX(x)
        y.forEach(yVal => {
            yVal = Number(formatVal(yVal)(yVal))
            if(minY === "None" || yVal < minY) {
                minX = x
                minY = yVal
            }
            //if(maxY === "None" || yVal > maxY) {
            //    maxX = x
            //    maxY = yVal
            //}
        })
    })
    // It's impossible for the values to still be "None" at this point

    let x = formatVal(minX)(minX)
    let y = yAtX(minX)
    y = Math.min(Number(formatVal(y[0])(y[0])),Number(formatVal(y[1])(y[1])))
    y = formatVal(y)(y)

    return "x=" + x + ", y=" + y
}

/**
 * According to the first derivative test, max/min can only occur when slope is 0 or undefined, or at endpoints.
 * This function finds all of the points where slope is 0 or undefined, or endpoints.
 */
function getCriticalPoints(title, loads, beamProperties, left, right) {
    // Get the segments of the beam.
    let segmentEndpoints = getSegmentEndpoints(loads, beamProperties, left, right)

    let criticalPoints = []
    // For each segment of the beam
    for(let i = 0; i < segmentEndpoints.length - 1; i++) {
        let midpoint = (segmentEndpoints[i] + segmentEndpoints[i+1])/2
        // Find slope polynomial for this segment, summing all single-load polynomials
        let polynomial = [0,0,0,0,0]
        getSubloads(loads,beamProperties).forEach(load=>{
            chooseDerivativeSingleLoadFunction(title)(load, beamProperties, midpoint).forEach((a,i)=>{
                polynomial[i] += a
            })
        })
        // Get all the zeroes of the slope polynomial that are between the segment's endpoints
        findRoots(polynomial, midpoint).forEach(value => {
            if(segmentEndpoints[i] <= value && value <= segmentEndpoints[i + 1])
                criticalPoints.push(value)
        })
    }
    // Get segment endpoints
    criticalPoints = criticalPoints.concat(segmentEndpoints)

    return criticalPoints
}

/**
 * The beam has segments, where each segment has its own polynomial.
 * This function finds the endpoints of each segment, sorted in ascending order.
 */
function getSegmentEndpoints(loads, beamProperties, left, right) {
    let segmentEndpoints = []
    // Edges of the range to find extrema in
    segmentEndpoints.push(left, right)
    // Supports in the beam
    segmentEndpoints.push(beamProperties["Roller Support Position"], beamProperties["Length of Beam"])
    // Locations/Endpoints of all loads
    loads.forEach(load => 
        segmentEndpoints.push(load.Location, load.Location+load.Length)
    )
    
    // Sort ascending and remove duplicates or out-of-range values
    segmentEndpoints.sort((a,b)=>(a > b)? 1 : -1)
    let prev = -1
    for(let i = 0; i < segmentEndpoints.length; i++) {
        let val = segmentEndpoints[i]
        if(val == prev || val > right || val < left) {
            // Delete val
            segmentEndpoints.splice(i,1)
            i--
        }
        else
            prev = segmentEndpoints[i]
    }

    return segmentEndpoints
}

/**
 * Function to find zeroes of the given polynomial. 
 * Works for polynomials up to quartic.
 * 
 * polynomial must be [a0,a1,a2,a3,a4], representing a polynomial a4*x^4 + a3*x^3 = a2*x^2 + a1*x + a0.
 */ 
function findRoots(polynomial) {
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
    } else
        // If constant non-zero, never 0. If constant zero, always 0 but no points need to be returned.
        return []
}

/** 
 * Takes a function that applies to a single load, applies it to every load and returns the sum. 
 * Can also sum arrays of length 2.
 * For plots, if [0] and [1] are different, it means instant increase/decrease. [0] connects to the plot to the left, and [1] connects to the plot on the right.
 * For reactions, [0] is the left reaction, [1] is the right reaction.
 * 
 * Even if the function being summed does not return an array, the result of the sum will always be a 2-length array.
 */
function sumFunction(singleLoadFunction, loads, beamProperties, x) {
    let y = [0,0]
    getSubloads(loads, beamProperties).forEach(load => {
        let individualY = singleLoadFunction(load, beamProperties, x)
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

/**
 * Convert each taller-end-left triangle into a taller-end-right triangle subtracted from a rectangle
 */
function getSubloads(loads, beamProperties) {
    let newLoads = []

    // Convert triangles with taller left-end to taller right-end
    loads.forEach(load => {
        if(load.Type === "Triangular" && load["Taller End"] === "Left") {
            newLoads.push({Mass:-1*load.Mass, Location:load.Location, Length:load.Length, Type:"Triangular", ["Taller End"]:"Right"})
            newLoads.push({Mass:load.Mass, Location:load.Location, Length:load.Length, Type:"Distributed"})
        }
        else
            newLoads.push(load)
    })

    return newLoads
}

/**
 * Second integral of bending moment divided by EI.
 * 
 * To eliminate arbitrary constants:
 * For cantilever, deflection and slope at x=0 are 0.
 * For simply supported beam where supports are at the same location, deflection and slope at support location are 0.
 * For simply supported beam where supports are at different locations, deflection at each support location is 0.
 */
function deflectionSingleLoad(load, beamProperties, x) {
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length

    // Multiplier using mass, gravity, and EI
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff
    // Deflection
    let y
    // Extra term for simply supported beam where b==0, depends on load type and whether load is in the a-segment, b-segment, or c-segment
    let cSlope

    if(load.Type === "Point") {
        coeff = F / beamProperties.EI
        lCoeff = 0

        // Get base deflection
        if(x < X)
            y = (x**3 - 3*x**2*(X+L*lCoeff)) / 6
        else
            y = (X**3 - 3*X**2*x) / 6

        // Get cSlope
        if(a < X)
            cSlope = a**2/2 - a*(X+L*lCoeff)
        else 
            cSlope = -1*X**2/2
    }
    else if(load.Type === "Distributed") {
        coeff = F * L / beamProperties.EI
        lCoeff = 1/2

        // Get base deflection
        if(x < X)
            y = (x**3 - 3*x**2*(X+L*lCoeff)) / 6
        else if(x < X + L)
            y = (x**3 - 3*x**2*(X+L*lCoeff)) / 6 - (x-X)**4/24/L
        else
            y = ((X+L)**3 - 3*(X+L)**2*(X+L*lCoeff)) / 6 - L**3/24 + ((X+L)**2/2 - (X+L)*(X+L*lCoeff) - L**2/6)*(x - (X + L))

        // Get cSlope
        if(a < X)
            cSlope = a**2/2 - a*(X+L*lCoeff)
        else if(a < X + L)
            cSlope = a**2/2 - a*(X+L*lCoeff) - (a-X)**3/6/L
        else
            cSlope = (X+L)**2/2 - (X+L)*(X+L*lCoeff) - L**2/6
    }
    else if(load.Type === "Triangular") {
        coeff = F * L / 2 / beamProperties.EI
        lCoeff = 2/3

        // Get base deflection
        if(x < X)
            y = (x**3 - 3*x**2*(X+L*lCoeff)) / 6
        else if(x < X + L)
            y = (x**3 - 3*x**2*(X+L*lCoeff)) / 6 - (x-X)**5/60/L**2
        else
            y = ((X+L)**3 - 3*(X+L)**2*(X+L*lCoeff)) / 6 - L**3/60 + (3*L**2 + 8*L*X + 6*X**2)*(X+L-x)/12

        // Get cSlope
        if(a < X)
            cSlope = a**2/2 - a*(X+L*lCoeff)
        else if(a < X + L)
            cSlope = a**2/2 - a*(X+L*lCoeff) - (a-X)**4/12/L**2
        else
            cSlope = -1*(X+L)*(X/2 + L/6) - L**2/12
    }


    if(beamProperties["Support Type"] === "Simply Supported") {
        if(x < a)
            y -= (x**3 - 3*x**2*(X+L*lCoeff)) / 6
        else if(x < a+b)
            y += a**2/2*(x - a/3) + (a - X - L*lCoeff)*(a**2*x + x**3/3 - a**3/3 - a*x**2 - b*x**2)/2/b
        else
            y += a**2/2*(x - a/3) + (a - X - L*lCoeff)*(a**2 + b**2/3 + a*b - x*b - 2*a*x)/2
        
        // From solving arbitrary constants
        y += ((3*a**2*x - 2*a**3) + (3*a**2 - 6*a*x)*(X+L*lCoeff))/6
        if(abs(b/beamProperties["Length of Beam"]) <= 10**-10)
            y += (a-x) * cSlope
        else
            y += ((2*a*b*x - 2*a**2*b) + (-2*b*x + 2*a*b)*(X+L*lCoeff))/6
    }

    // Round off floating point errors.
    if(abs(y) < 10**-10)
        y = 0
    
    y *= coeff

    // From solving arbitrary constants
    if(beamProperties["Support Type"] === "Simply Supported") {
        let cantileverBeamProperties = {...beamProperties}
        cantileverBeamProperties["Support Type"] = "Cantilever"

        if(abs(b/beamProperties["Length of Beam"]) <= 10**-10)
            y -= deflectionSingleLoad(load, cantileverBeamProperties, a)
        else {
            y += (x - a - b) / b * deflectionSingleLoad(load, cantileverBeamProperties, a)
            y += (a - x) / b * deflectionSingleLoad(load, cantileverBeamProperties, a + b)
        }
    }

    return y
}

/**
 * Integral of bending moment; slope of deflection times EI. 
 * Cannot use true slope or else some coefficients will be too small and root-finder will consider it equal to 0.
 * This function returns an array instead of a value. [a0,a1,a2,a3,a4] represents a0*x^0 + a1*x^1 + a2*x^2 + a3*x^3 + a4*x^4.
 * This function also won't be used when x is at an instant change of slope. It may not work in those cases.
 * 
 * To eliminate arbitrary constants:
 * For cantilever, deflection and slope at x=0 are 0.
 * For simply supported beam where supports are at the same location, deflection and slope at support location are 0.
 * For simply supported beam where supports are at different locations, deflection at each support location is 0.
 */
function deflectionSlopePolynomialSingleLoad(load, beamProperties, x) {
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length

    // Multiplier using mass and gravity
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff
    // Polynomial array
    let a0,a1,a2,a3,a4
    [a0,a1,a2,a3,a4] = [0,0,0,0,0]

    if(load.Type === "Point") {
        coeff = F
        lCoeff = 0

        if(x < X) {
            // y = x**2/2 - x*(X+L*lCoeff)
            a2 = 1/2
            a1 = -1*(X+L*lCoeff)
        }
        else {
            // y = -1*X**2/2
            a0 = -1*X**2/2
        }
    }
    else if(load.Type === "Distributed") {
        coeff = F * L
        lCoeff = 1/2

        if(x < X) {
            // y = x**2/2 - x*(X+L*lCoeff)
            a2 = 1/2
            a1 = -1*(X+L*lCoeff)
        }
        else if(x < X + L) {
            // y = x**2/2 - x*(X+L*lCoeff) - (x-X)**3/6/L
            a3 = -1 /6/L
            a2 = 3*X /6/L + 1/2
            a1 = -3*X**2 /6/L + -1*(X+L*lCoeff)
            a0 = X**3 /6/L
        }
        else {
            // y = (X+L)**2/2 - (X+L)*(X+L*lCoeff) - L**2/6
            a0 = (X+L)**2/2 - (X+L)*(X+L*lCoeff) - L**2/6
        }
    }
    else if(load.Type === "Triangular") {
        coeff = F * L / 2
        lCoeff = 2/3

        if(x < X) {
            // y = x**2/2 - x*(X+L*lCoeff)
            a2 = 1/2
            a1 = -1*(X+L*lCoeff)
        }
        else if(x < X + L) {
            // y = x**2/2 - x*(X+L*lCoeff) - (x-X)**4/12/L**2
            a4 = -1 /12/L**2
            a3 = 4*X /12/L**2
            a2 = -6*X**2 /12/L**2 + 1/2
            a1 = 4*X**3 /12/L**2 + -1*(X+L*lCoeff)
            a0 = -1*X**4 /12/L**2
        }
        else {
            // y = -1*(X+L)*(X/2 + L/6) - L**2/12
            a0 = -1*(X+L)*(X/2 + L/6) - L**2/12
        }
    }

    if(beamProperties["Support Type"] === "Simply Supported") {
        if(x < a) {
            // y += -x**2/2 + x*(X+L*lCoeff)
            a2 += -1/2
            a1 += X+L*lCoeff
        }
        else if(x < a+b) {
            // y += a**2/2 + (a - X - L * lCoeff) * (a**2 + x**2 - 2*a*x - 2*b*x) / 2 / b
            a2 += (a - X - L*lCoeff)/2/b
            a1 += (a - X - L*lCoeff)*-1*(a+b)/b
            a0 += (a - X - L*lCoeff)*a**2/2/b + a**2/2
        }
        else {
            // y += a**2/2 - (a - X - L * lCoeff) * (a + b/2)
            a0 += a**2/2 - (a - X - L * lCoeff) * (a + b/2)
        }

        if(abs(b/beamProperties["Length of Beam"]) <= 10**-10) {
            // y += a**2/2 - a*(X+L*lCoeff)
            a0 += a**2/2 - a*(X+L*lCoeff)
        }
        else {
            // y += ((3*a**2 + 2*a*b) + (-6*a - 2*b) * (X + L * lCoeff)) / 6
            a0 += ((3*a**2 + 2*a*b) + (-6*a - 2*b) * (X + L * lCoeff)) / 6
        }
    }

    // y *= coeff
    [a0,a1,a2,a3,a4] = [a0*coeff,a1*coeff,a2*coeff,a3*coeff,a4*coeff]

    // From solving arbitrary constants
    if(beamProperties["Support Type"] === "Simply Supported") {
        let cantileverBeamProperties = {...beamProperties}
        cantileverBeamProperties["Support Type"] = "Cantilever"

        if(abs(b/beamProperties["Length of Beam"]) <= 10**-10) {
            // y -= deflectionSingleLoad(load, cantileverBeamProperties, a)
            let vals = deflectionSlopePolynomialSingleLoad(load, cantileverBeamProperties, a)
            a0 -= vals[0]
            a1 -= vals[1]
            a2 -= vals[2]
            a3 -= vals[3]
            a4 -= vals[4]
        }
        else {
            // y += deflectionSingleLoad(a, load, cantileverBeamProperties)/b
            a0 += deflectionSingleLoad(load, cantileverBeamProperties, a)*cantileverBeamProperties.EI/b
            // y -= deflectionSingleLoad(a+b, load, cantileverBeamProperties)/b
            a0 -= deflectionSingleLoad(load, cantileverBeamProperties, a + b)*cantileverBeamProperties.EI/b
        }
    }

    return [a0,a1,a2,a3,a4]
}

/**
 * Integral of shear force.
 * If a 2-length array is returned, that represents instantaneous change, which only occurs if both supports are at the same location in simply supported beam.
 * 
 * To eliminate arbitrary constant:
 * For simply supported beam, bending moment is 0 at all support positions.
 * For cantilever beam, bending moment is 0 at the free end (right end) of the beam.
 */
function bendingMomentSingleLoad(load, beamProperties, x) {
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length

    // Multiplier using mass and gravity
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff
    let y

    if(load.Type === "Point") {
        coeff = F
        lCoeff = 0

        if(x < X)
            y = x - X - L*lCoeff
        else
            y = 0
    }
    else if(load.Type === "Distributed") {
        coeff = F * L
        lCoeff = 1/2

        if(x < X)
            y = x - X - L*lCoeff
        else if(x < X + L)
            y = x - X - L*lCoeff - (x-X)**2/2 / L
        else
            y = 0
    }
    else if(load.Type === "Triangular") {
        coeff = F * L / 2
        lCoeff = 2/3

        if(x < X)
            y = x - X - L*lCoeff
        else if(x < X + L)
            y = x - X - L*lCoeff - (x-X)**3/3 / L**2
        else
            y = 0
    }

    if(beamProperties["Support Type"] === "Simply Supported") {
        if(x < a)
            y -= x - X - L * lCoeff
        else if(x == a && abs(b/beamProperties["Length of Beam"]) <= 10**-10)
            y = [y - (x - X - L * lCoeff), y]
        else if(x < a+b)
            y -= (a - X - L * lCoeff) * (a + b - x) / b
        
    }

    // Round off floating point errors and multiply by coeff. If array, do it to both elements of array.
    if(Array.isArray(y)) {
        if(abs(y[0]) < 10**-10)
            y[0] = 0
        if(abs(y[1]) < 10**-10)
            y[1] = 0

        y[0] *= coeff
        y[1] *= coeff
    }
    else {
        if(abs(y) < 10**-10)
            y = 0

        y *= coeff
    }

    return y
}

/**
 * If a 2-length array is returned, that represents instantaneous change, which occurs at point loads and support locations.
 */
function shearForceSingleLoad(load, beamProperties, x) {
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length

    // Multiplier using mass and gravity
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff
    let y

    if(load.Type === "Point") {
        coeff = F
        lCoeff = 0

        if(x < X)
            y = 1
        else if(x == X)
            // Array represents instantaneous change in y
            y = [1,0]
        else
            y = 0
    }
    else if(load.Type === "Distributed") {
        coeff = F * L
        lCoeff = 1/2

        if(x < X)
            y = 1
        else if(x < X + L)
            y = 1 - (x-X)/L
        else
            y = 0
    }
    else if(load.Type === "Triangular") {
        coeff = F * L / 2
        lCoeff = 2/3

        if(x < X)
            y = 1
        else if(x < X + L)
            y = 1 - (x-X)**2/L**2
        else
            y = 0
    }

    if(beamProperties["Support Type"] === "Simply Supported") {
        if(!Array.isArray(y))
            y = [y,y]
        if(x <= a)
            y[0] -= 1
        else if(x <= a+b)
            y[0] -= (X + L * lCoeff - a) / b

        if(x < a)
            y[1] -= 1
        else if(x < a+b)
            y[1] -= (X + L * lCoeff - a) / b
    }

    // Round off floating point errors and multiply by coeff. If array, do it to both elements of array.
    if(Array.isArray(y)) {
        if(abs(y[0]) < 10**-10)
            y[0] = 0
        if(abs(y[1]) < 10**-10)
            y[1] = 0

        y[0] *= coeff
        y[1] *= coeff
    }
    else {
        if(abs(y) < 10**-10)
            y = 0
        
        y *= coeff
    }

    return y
}

/**
 * 
 */
 function bendingMomentSlopePolynomialSingleLoad(load, beamProperties, x) {
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length

    // Multiplier using mass and gravity
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff
    // Polynomial array
    let a0,a1,a2
    [a0,a1,a2] = [0,0,0]

    if(load.Type === "Point") {
        coeff = F
        lCoeff = 0

        if(x < X)
            // y = 1
            a0 = 1
        else
            // y = 0
            a0 = 0
    }
    else if(load.Type === "Distributed") {
        coeff = F * L
        lCoeff = 1/2

        if(x < X)
            // y = 1
            a0 = 1
        else if(x < X + L) {
            // y = 1 - (x-X)/L
            a1 = -1/L
            a0 = 1 + X/L
        }
        else
            // y = 0
            a0 = 0
    }
    else if(load.Type === "Triangular") {
        coeff = F * L / 2
        lCoeff = 2/3

        if(x < X)
            // y = 1
            a0 = 1
        else if(x < X + L) {
            // y = 1 - (x-X)**2/L**2
            a2 = -1/L**2
            a1 = 2*X/L**2
            a0 = 1 - X**2/L**2
        }
        else
            // y = 0
            a0 = 0
    }

    if(beamProperties["Support Type"] === "Simply Supported") {
        if(x < a)
            // y -= 1
            a0 -= 1
        else if(x < a+b)
            // y -= (X + L * lCoeff - a) / b
            a0 -= (X + L * lCoeff - a) / b
    }

    // Multiply by coeff.
    [a0,a1,a2] = [a0*coeff,a1*coeff,a2*coeff]

    return [a0,a1,a2,0,0]
}

/**
 * 
 */
 function shearForceSlopePolynomialSingleLoad(load, beamProperties, x) {
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length

    // Multiplier using mass and gravity
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff
    // Polynomial array
    let a0,a1
    [a0,a1] = [0,0]

    if(load.Type === "Point") {
        coeff = F
        lCoeff = 0

        if(x < X);
            // y = 1
        else;
            // y = 0
    }
    else if(load.Type === "Distributed") {
        coeff = F * L
        lCoeff = 1/2

        if(x < X);
            // y = 1
        else if(x < X + L) {
            // y = 1 - (x-X)/L
            a1 = -1/L
        }
        else;
            // y = 0
    }
    else if(load.Type === "Triangular") {
        coeff = F * L / 2
        lCoeff = 2/3

        if(x < X);
            // y = 1
        else if(x < X + L) {
            // y = 1 - (x-X)**2/L**2
            a1 = -2/L**2
            a0 = 2*X/L**2
        }
        else;
            // y = 0
    }

    if(beamProperties["Support Type"] === "Simply Supported") {
        if(x < a);
            // y -= 1
        else if(x < a+b);
            // y -= (X + L * lCoeff - a) / b
    }

    // Multiply by coeff.
    [a0,a1] = [a0*coeff,a1*coeff]

    return [a0,a1,0,0,0]
}

/**
 * Return the reactions.
 * For cantilever: [0] is reaction, [1] is 0.
 * For simply supported: [0] is left support, [1] is right support.
 */
function reactionsSingleLoad(load, beamProperties, x){
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let F = load.Mass * beamProperties.Gravity
    let X = load.Location
    let L = load.Length

    // Multiplier using mass and gravity
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff

    if(load.Type === "Point") {
        coeff = F
        lCoeff = 0
    }
    else if(load.Type === "Distributed") {
        coeff = F * L
        lCoeff = 1/2
    }
    else if(load.Type === "Triangular") {
        coeff = F * L / 2
        lCoeff = 2/3
    }

    if(beamProperties["Support Type"] === "Cantilever" || b <= 10**-10)
        return [coeff, 0]
    else
        return [coeff * (1 - (X + L * lCoeff - a)/b), coeff * (X + L * lCoeff - a)/b]
}

/**
 * Find a scale for the y axis that comfortably fits the given dataList.
 */
function getScale(dataList) {
    // Find the biggest absolute y-value in datalist
    let maxAbsVal = 0
    dataList.forEach(dataPoint =>
        maxAbsVal = Math.max(maxAbsVal, abs(dataPoint.y))
    )
    
    // If the line is all 0, scale will be 1
    if(maxAbsVal <= 10**-10)
        return 1
    
    // Peak of the graph stays at a constant height on the graph as scale continuously changes.
    return maxAbsVal * 1.5

    // Plot scale stays constant, until extreme forces a change by becoming too small (<50%) or too large (>100%).
    //return 2 ** Math.ceil(Math.log2(maxAbsVal))
}

/**
 * Number formatting function used in XYPlot's tickFormat and other areas.
 * XYPlot's tickFormat requires this function to return another function.
 * Areas that need it to return a function form will use "formatVal(scale)", and areas that do not will use "formatVal(scale)(val)".
 * Often, areas will use "formatVal(val)(val)" to round a value neatly without considering a scale.
 * 
 * Values are rounded to 6 significant digits, and values smaller than 10^-10 are rounded to 0.
 * If the scale is large or small enough (but not 0), numbers will be displayed in scientific notation.
 */
function formatVal(scale) {
    // If the scale is very large or small, return a function that converts vals to scientific notation.
    if(abs(scale) >= 10**5 || (abs(scale) <= 10**-4 && abs(scale) >= 10**-10))
        return val => {
            val = Number(Number(val).toPrecision(6))
            if(abs(val) <= 10**-10)
                val = 0
            return "" + (val == 0 ? val : val.toExponential())
        }
    // If scale is regular or scale is exactly 0, return a function that just returns val.
    else
        return val => {
            val = Number(Number(val).toPrecision(6))
            if(abs(val) <= 10**-10)
                val = 0
            return "" + val
        }
    // The returned values must be Strings for XYPlot's tickFormat, else 0 will be read as false and will not display
}

/**
 * Uses the plot's title to determine which function to graph.
 */
function chooseSingleLoadFunction(title) {
    if(title === "Deflection Diagram")
        return deflectionSingleLoad
    if(title === "Bending Moment Diagram")
        return bendingMomentSingleLoad
    if(title === "Shear Force Diagram")
        return shearForceSingleLoad
}
/**
 * Uses the plot's title to determine which function is the derivative of the graphed function.
 */
 function chooseDerivativeSingleLoadFunction(title) {
    if(title === "Deflection Diagram")
        return deflectionSlopePolynomialSingleLoad
    if(title === "Bending Moment Diagram")
        return bendingMomentSlopePolynomialSingleLoad
    if(title === "Shear Force Diagram")
        return shearForceSlopePolynomialSingleLoad
}

export default SidePlot