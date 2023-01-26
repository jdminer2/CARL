import '../App.css'
import React, { useState } from 'react'
import { HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis } from "react-vis"
import { complex, add, subtract, multiply, divide, sqrt, cbrt, abs } from 'mathjs'

/**
 * Props:
 * title - title of the plot, also determines whether reactions/maximum deflection are shown
 * loads - loads for calculations
 * beamProperties - beam properties for calculations
 * steps - number of x-values that will be drawn on the plot, and that can be selected using mouse hover. 
 *         Does not affect accuracy of calculations, only smoothness of the graph.
 *         More steps = more fine detail plotted, but more lag.
 * color - color of the plot curve
 */
function SidePlot(props) {
    // The scale of the plot
    const [scale, setScale] = useState(1)
    // The selected coordinate on the plot
    const [coord, setCoord] = useState({ title: props.title, x: 0, y: [0, 0] })

    // Gives (x,y) plot points for diagram, and updates the scale for the plot.
    function diagram() {
        // The list of x-values to plot in a line plot.
        const xValues = []

        // A certain number of evenly spaced steps on the beam, including the endpoints
        for (let i = 0; i <= props.steps; i++)
            xValues.push((i / props.steps) * props.beamProperties["Length of Beam"])

        // The support locations if applicable
        if (props.beamProperties["Support Type"] === "Simply Supported")
            xValues.push(props.beamProperties["Pinned Support Position"], props.beamProperties["Roller Support Position"])

        // The endpoints of each load
        props.loads.forEach(load =>
            xValues.push(load.X1, load.X2)
        )

        // Sort the x values so the line plot connects each point from left to right, not skipping and going back and forth
        xValues.sort((a, b) => (a > b) ? 1 : -1)
        // Remove duplicates to reduce lag
        let prev = -1
        for (let i = 0; i < xValues.length; i++) {
            let val = xValues[i]
            if (val == prev) {
                // Delete val
                xValues.splice(i, 1)
                i--
            }
            else
                prev = xValues[i]
        }

        // Calculate and plot the y values.
        let plotData = []
        xValues.forEach(xValue => {
            let yValue = sumFunction(chooseSingleLoadFunction(props.title), props.loads, props.beamProperties, xValue)
            plotData.push({ x: xValue, y: yValue[0] })
            // If instant change, plot the second value
            if (abs(yValue[0] - yValue[1]) >= 10 ** -10)
                plotData.push({ x: xValue, y: yValue[1] })
        })

        // Update plot scale if needed
        let newScale = getScale(plotData)
        if (newScale != scale) {
            setScale(newScale)
            if(props.title==="Deflection Diagram")
                props.setDeflectionScale(newScale)
        }


        return plotData
    }

    /**
     * Update the selected coordinate of the plot
     * enteredX is the x-value to update to
     * isTyping is true if the coordinate was changed via the textbox, false if it was changed via mouse movement
     */
    function updateCoord(enteredX, isTyping) {
        let x = enteredX
        let y = coord.y
        if (parseFloat(x) == x) {
            x = Number(x)
            x = Number(formatVal(x)(x))
            if (x >= 0 && x <= props.beamProperties["Length of Beam"]) {
                y = sumFunction(chooseSingleLoadFunction(props.title), props.loads, props.beamProperties, x)
            }
        }
        // Do not update x if isTyping, or else textbox's contents will be changed as the user is typing, may prevent user from typing trailing 0 after decimal point
        setCoord({ title: coord.title, x: (isTyping ? enteredX : x), y: y })
    }

    // Returns whether coord.x is a number and in-bounds.
    // If it is, then a grey line can be drawn to represent the current coordinate
    function validX() {
        let x = coord.x
        // Check if number
        if (parseFloat(x) == x) {
            x = Number(x)
            x = Number(formatVal(x)(x))
            // Check if in-bounds
            if (x >= 0 && x <= props.beamProperties["Length of Beam"])
                return true
        }
        return false
    }

    return (
        <div className={"rowC"}>
            {/* Plot */}
            <XYPlot height={window.innerHeight * 0.5} width={window.innerWidth * ((innerWidth > 500) ? 0.4 : 2 / 3)}
                xDomain={[0, props.beamProperties["Length of Beam"]]} yDomain={[scale, scale]} margin={{ left: 60, right: 60 }}>
                <VerticalGridLines />
                <HorizontalGridLines />
                <XAxis tickFormat={formatVal(props.beamProperties["Length of Beam"])} title={props.title} />
                <YAxis tickFormat={formatVal(scale)} />
                {/* Beam */}
                <LineSeries data={[{ x: 0, y: 0 }, { x: props.beamProperties["Length of Beam"], y: 0 }]} />
                {/* Function being plotted */}
                <LineSeries data={diagram()} onNearestX={(datapoint, e) => updateCoord(datapoint.x, false)} color={props.color} />
                {/* Current X indicator (if valid X) */}
                {validX() ? <LineSeries data={[{ x: coord.x, y: scale }, { x: coord.x, y: -1 * scale }]} color="grey" strokeWidth="1px" /> : []}
                {/* Reaction labels (if applicable) */}
                {<LabelSeries data={reactions(props.title, props.loads, props.beamProperties)} />}
            </XYPlot>
            {/* Side Info */}
            <div style={{ width: "100%" }}>
                <div style={{ height: "25%" }} />
                <div style={{ height: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div>
                        {displayCoord(coord, updateCoord)}
                        {props.title === "Deflection Diagram" ?
                            /* Maximum Deflection (Deflection Plot only) */
                            <div>
                                Maximum Deflection:<br />
                                {maximumDeflection(props.loads, props.beamProperties)}
                            </div>
                            : ""}
                    </div>
                </div>
                <div style={{ height: "50%" }}>
                    {props.title === "Shear Force Diagram" ?
                        <img src={require("../resources/images/Diagram_sign_convention_1200dpi.png")}
                            alt="Sign Convention Diagram for Shear Force and Bending Moment"
                            style={{ height: "100%", width: "100%", objectFit: "contain" }} />
                        : []}
                </div>
            </div>
        </div>
    )
}

/**
 * Create text displaying the currently viewed coordinate for a plot.
 * If the y value undergoes instant change at the selected x value, display yLeft and yRight.
 */
function displayCoord(coord, updateCoord) {
    let y = coord.y
    let yString
    if (abs(y[0] - y[1]) >= 10 ** -10)
        yString = "yLeft=" + formatVal(y[0])(y[0]) + ", yRight=" + formatVal(y[1])(y[1])
    else
        yString = "y=" + formatVal(y[0])(y[0])

    return (
        <div>
            {coord.title}<br />
            x=<input type="text"
                value={coord.x}
                style={{ width: 50 }}
                onChange={(e) => {
                    updateCoord(e.target.value, true)
                }}
            /> {yString}
        </div>
    )
}

// Get reaction labels
function reactions(title, loads, beamProperties) {
    let reactionLabels = []

    // Only Shear Force Diagram and Bending Moment Diagram display any type of reaction
    if (!["Shear Force Diagram", "Bending Moment Diagram"].includes(title))
        return reactionLabels

    let pinnedSupportPos = beamProperties["Pinned Support Position"]
    let rollerSupportPos = beamProperties["Roller Support Position"]

    // Sum reactions from single load
    // For simply supported, R1 is left support and R2 is right
    // For cantilever, R1 contains shear reaction and R2 contains moment reaction
    let [R1, R2] = sumFunction(reactionsSingleLoad, loads, beamProperties, 0)

    // Cantilever reactions
    if (beamProperties["Support Type"] === "Cantilever") {
        // Shear force reaction
        if (title === "Shear Force Diagram") {
            reactionLabels.push({ x: 0, y: 0, yOffset: 32, label: "\u2191", style: { fontSize: 35, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle" } })
            reactionLabels.push({ x: 0, y: 0, yOffset: 43, label: formatVal(R1)(R1), style: { fontSize: 15, dominantBaseline: "text-after-edge", textAnchor: "middle" } })
        }
        // Bending moment reaction
        else {
            reactionLabels.push({ x: 0, y: 0, yOffset: 20, label: "\u21ba", style: { fontSize: 35, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle" } })
            reactionLabels.push({ x: 0, y: 0, yOffset: 43, label: formatVal(R2)(R2), style: { fontSize: 15, dominantBaseline: "text-after-edge", textAnchor: "middle" } })
        }
    }
    // Simply supported reaction arrows
    else {
        // For simply supported beam, there is no bending moment reaction
        if (title !== "Shear Force Diagram")
            return reactionLabels

        // Match R1 and R2 to pinned or roller supports
        let pinnedReaction, rollerReaction
        if (pinnedSupportPos < rollerSupportPos)
            [pinnedReaction, rollerReaction] = [R1, R2]
        else
            [rollerReaction, pinnedReaction] = [R2, R1]

        // If the supports are too close together, lower one of the support labels
        let tooCloseTogether = abs(pinnedSupportPos - rollerSupportPos) < 8 / 100 * beamProperties["Length of Beam"] * (1920 / (window.innerWidth + ((innerWidth > 500) ? -300 : 30)))

        // Pinned reaction label
        reactionLabels.push({ x: pinnedSupportPos, y: 0, yOffset: 24, label: "\u25b2", style: { fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle" } })
        reactionLabels.push({ x: pinnedSupportPos, y: 0, yOffset: 54, label: "\u2191", style: { fontSize: 35, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle" } })
        reactionLabels.push({ x: pinnedSupportPos, y: 0, yOffset: 70, label: formatVal(pinnedReaction)(pinnedReaction), style: { fontSize: 15, dominantBaseline: "text-after-edge", textAnchor: "middle" } })

        // Roller reaction label
        reactionLabels.push({ x: rollerSupportPos, y: 0, yOffset: 24, label: "\u2b24", style: { fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle" } })
        reactionLabels.push({ x: rollerSupportPos, y: 0, yOffset: tooCloseTogether ? 60 : 54, label: "\u2191", style: { fontSize: 35, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle" } })
        reactionLabels.push({ x: rollerSupportPos, y: 0, yOffset: tooCloseTogether ? 90 : 70, label: formatVal(rollerReaction)(rollerReaction), style: { fontSize: 15, dominantBaseline: "text-after-edge", textAnchor: "middle" } })
    }
    return reactionLabels
}

// Finds the maximum absolute value of deflection for the beam. 
// This works as long as weight on the beam is a piecewise linear function of position.
function maximumDeflection(loads, beamProperties) {
    // Get all candidate points for extrema. The max must be among these candidates.
    let criticalPoints = getCriticalPoints(loads, beamProperties)

    // Simplified deflection function
    let yAtX = x => sumFunction(deflectionSingleLoad, loads, beamProperties, x)

    // Find the max absolute value from the candidate points
    let maxX = "None"
    let maxY = "None"
    criticalPoints.forEach(x => {
        let y = yAtX(x)
        y.forEach(yVal => {
            yVal = abs(Number(formatVal(yVal)(yVal)))
            if (maxY === "None" || yVal > maxY) {
                maxX = x
                maxY = yVal
            }
        })
    })
    // It's impossible for the values to still be "None" at this point

    let x = formatVal(maxX)(maxX)
    let y = yAtX(maxX)
    y = abs(y[0]) > abs(y[1]) ? y[0] : y[1]
    y = formatVal(y)(y)

    return "x=" + x + ", y=" + y
}

/**
 * According to the first derivative test, extrema can only occur when slope is 0 or undefined, or at endpoints.
 * This function finds all of the points where slope is 0 or undefined, or endpoints.
 */
function getCriticalPoints(loads, beamProperties) {
    // Get the segments of the beam.
    let segmentEndpoints = getSegmentEndpoints(loads, beamProperties)

    let criticalPoints = []
    // For each segment of the beam
    for (let i = 0; i < segmentEndpoints.length - 1; i++) {
        // Find slope polynomial at the midpoint of the segment
        let midpoint = (segmentEndpoints[i] + segmentEndpoints[i + 1]) / 2
        let polynomial = [0, 0, 0, 0, 0]
        getSubloads(loads, beamProperties).forEach(load => {
            deflectionSlopePolynomialSingleLoad(load, beamProperties, midpoint).forEach((a, i) => {
                polynomial[i] += a
            })
        })
        // Get all the zeroes of the slope polynomial that are between the segment's endpoints
        findRoots(polynomial, midpoint).forEach(value => {
            if (segmentEndpoints[i] <= value && value <= segmentEndpoints[i + 1])
                criticalPoints.push(value)
        })
    }
    // Add segment endpoints
    criticalPoints = criticalPoints.concat(segmentEndpoints)

    return criticalPoints
}

/**
 * If the beam is split into segments by the support locations and load endpoints, each segment will have its own polynomial for slope.
 * This function finds the endpoints of each segment, sorted in ascending order.
 */
function getSegmentEndpoints(loads, beamProperties) {
    let segmentEndpoints = []
    // Edges of the beam
    segmentEndpoints.push(0, beamProperties["Length of Beam"])
    // Supports in the beam
    if (beamProperties["Support Type"] === "Simply Supported")
        segmentEndpoints.push(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // Locations/Endpoints of all loads
    loads.forEach(load =>
        segmentEndpoints.push(load.X1, load.X2)
    )

    // Sort ascending and remove duplicates
    segmentEndpoints.sort((a, b) => (a > b) ? 1 : -1)
    let prev = -1
    for (let i = 0; i < segmentEndpoints.length; i++) {
        let val = segmentEndpoints[i]
        if (val == prev) {
            // Delete val
            segmentEndpoints.splice(i, 1)
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
    if (abs(polynomial[4]) >= 10 ** -10) {
        // read in Ax^4 + Bx^3 + Cx^2 + Dx^1 + E
        let A, B, C, D, E
        [E, D, C, B, A] = polynomial
        // convert to x^4 + ax^2 + bx^1 + c
        let a, b, c
        [a, b, c] = [-3 * B ** 2 / 8 / A ** 2 + C / A, B ** 3 / 8 / A ** 3 - B * C / 2 / A ** 2 + D / A, -3 * B ** 4 / 256 / A ** 4 + C * B ** 2 / 16 / A ** 3 - B * D / 4 / A ** 2 + E / A]

        if (abs(b) <= 10 ** -10) {
            // x^4 + ax^2 + c -> quadratic equation
            let roots = []
            findRoots([c, a, 1, 0, 0], null).forEach(value => {
                if (value >= 0)
                    roots.push(sqrt(value) - B / 4 / A, -1 * sqrt(value) - B / 4 / A)
            })
            return roots
        }
        else {
            let y = findRoots([a * c - b ** 2 / 4, -2 * c, -1 * a, 2, 0], null)[0]
            let roots = [];
            [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(option => {
                let q1 = multiply(option[0], sqrt(2 * y - a))
                let q2 = multiply(option[1], sqrt(subtract(-2 * y - a, divide(2 * b, q1))))
                let r = complex(add(q1, q2))
                if (abs(r.im) <= 10 ** -10)
                    roots.push(r.re / 2 - B / 4 / A)
            })
            return roots
        }
        // https://en.wikipedia.org/wiki/Cubic_equation
    } else if (abs(polynomial[3]) >= 10 ** -10) {
        // read in ax^3 + bx^2 + cx^1 + d
        let a, b, c, d
        [d, c, b, a,] = polynomial

        let d0 = b ** 2 - 3 * a * c
        let d1 = 2 * b ** 3 - 9 * a * b * c + 27 * a ** 2 * d

        let C = complex(cbrt(divide(add(d1, sqrt(d1 ** 2 - 4 * d0 ** 3)), 2)))
        if (abs(C) <= 10 ** -10)
            C = complex(cbrt(divide(subtract(d1, sqrt(d1 ** 2 - 4 * d0 ** 3)), 2)))

        if (abs(C) <= 10 ** -10)
            return [-1 / 3 / a * b]
        else {
            let roots = []
            for (let i = 0; i < 3; i++) {
                let r = complex(multiply(-1 / 3 / a, add(add(b, C), divide(d0, C))))
                if (abs(r.im) <= 10 ** -10)
                    roots.push(r.re)
                C = complex(multiply(C, complex(-1 / 2, sqrt(3) / 2)))
            }
            return roots
        }
        // Quadratic Equation
    } else if (abs(polynomial[2]) >= 10 ** -10) {
        // read in ax^2 + bx + c
        let a, b, c
        [c, b, a, ,] = polynomial

        let q = b ** 2 - 4 * a * c
        if (q >= 0) {
            return [(-1 * b + sqrt(q)) / 2 / a, (-1 * b - sqrt(q)) / 2 / a]
        }
        else
            return []
        // Linear
    } else if (abs(polynomial[1]) >= 10 ** -10) {
        // read in ax + b
        let a, b
        [b, a, , ,] = polynomial
        return [-1 * b / a]
        // Constant
    } else
        // If constant non-zero, never 0, so no points need to be returned. 
        // If constant zero, always 0, but still no points need to be returned
        // because in that case the deflection will have constant height, 
        // and extrema evaluation already considers the endpoints of this segment which will find that same constant height.
        return []
}

/** 
 * Takes a function that applies to a single load, applies it to every load and returns the sum. 
 * Can also sum arrays of length 2.
 * For plots, if [0] and [1] are different, it means instant change in y. [0] connects to the plot to the left, and [1] connects to the plot to the right.
 * For reactions, [0] is the left reaction, [1] is the right reaction, or [0] is the shear reaction and [1] is the moment reaction.
 * 
 * Even if the function being summed does not return an array, the result of the sum will always be converted to a 2-length array.
 */
function sumFunction(singleLoadFunction, loads, beamProperties, x) {
    let y = [0, 0]
    getSubloads(loads, beamProperties).forEach(load => {
        let individualY = singleLoadFunction(load, beamProperties, x)
        if (Array.isArray(individualY)) {
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

// Convert each taller-end-left triangle into a taller-end-right triangle subtracted from a rectangle
function getSubloads(loads) {
    let newLoads = []

    loads.forEach(load => {
        if (load.Type === "Triangular" && load["Taller End"] === "Left") {
            newLoads.push({ ["Load Force"]: -1 * load["Load Force"], X1: load.X1, X2: load.X2, Type: "Triangular", ["Taller End"]: "Right" })
            newLoads.push({ ["Load Force"]: load["Load Force"], X1: load.X1, X2: load.X2, Type: "Uniform" })
        }
        else
            newLoads.push(load)
    })

    return newLoads
}

/**
 * Return the reactions.
 * For cantilever: [0] is shear reaction, [1] is moment reaction.
 * For simply supported: [0] is left support reaction, [1] is right support reaction.
 */
function reactionsSingleLoad(load, beamProperties, x) {
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let W = load["Load Force"]
    let X = load.X1
    let L = load.X2 - load.X1

    // Multiplier using load force
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff

    if (load.Type === "Point") {
        coeff = W
        lCoeff = 0
    }
    else if (load.Type === "Uniform") {
        coeff = W * L
        lCoeff = 1 / 2
    }
    else if (load.Type === "Triangular") {
        coeff = W * L / 2
        lCoeff = 2 / 3
    }

    if (beamProperties["Support Type"] === "Cantilever")
        return [coeff, coeff * (X + L * lCoeff)]
    else
        return [coeff * (1 - (X + L * lCoeff - a) / b), coeff * (X + L * lCoeff - a) / b]
}

// If a 2-length array is returned, that represents instantaneous change, which occurs at point loads and support locations.
function shearForceSingleLoad(load, beamProperties, x) {
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let W = load["Load Force"]
    let X = load.X1
    let L = load.X2 - load.X1

    // Multiplier using load force
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff
    let y

    if (load.Type === "Point") {
        coeff = W
        lCoeff = 0

        if (x < X)
            y = 1
        else if (x == X)
            // Array represents instantaneous change in y
            y = [1, 0]
        else
            y = 0
    }
    else if (load.Type === "Uniform") {
        coeff = W * L
        lCoeff = 1 / 2

        if (x < X)
            y = 1
        else if (x < X + L)
            y = 1 - (x - X) / L
        else
            y = 0
    }
    else if (load.Type === "Triangular") {
        coeff = W * L / 2
        lCoeff = 2 / 3

        if (x < X)
            y = 1
        else if (x < X + L)
            y = 1 - (x - X) ** 2 / L ** 2
        else
            y = 0
    }

    if (beamProperties["Support Type"] === "Simply Supported") {
        if (!Array.isArray(y))
            y = [y, y]
        if (x <= a)
            y[0] -= 1
        else if (x <= a + b)
            y[0] -= (X + L * lCoeff - a) / b

        if (x < a)
            y[1] -= 1
        else if (x < a + b)
            y[1] -= (X + L * lCoeff - a) / b
    }

    // Round off floating point errors and multiply by coeff. If array, do it to both elements of array.
    if (Array.isArray(y)) {
        if (abs(y[0]) < 10 ** -10)
            y[0] = 0
        if (abs(y[1]) < 10 ** -10)
            y[1] = 0

        y[0] *= coeff
        y[1] *= coeff
    }
    else {
        if (abs(y) < 10 ** -10)
            y = 0

        y *= coeff
    }

    // Send the graph back to 0 at the support for cantilever.
    if (beamProperties["Support Type"] === "Cantilever" && x == 0) {
        if (Array.isArray(y))
            y = [0, y[1]]
        else
            y = [0, y]
    }


    return y
}

/**
 * Integral of shear force.
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

    let W = load["Load Force"]
    let X = load.X1
    let L = load.X2 - load.X1

    // Multiplier using load force
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff
    let y

    if (load.Type === "Point") {
        coeff = W
        lCoeff = 0

        if (x < X)
            y = x - X - L * lCoeff
        else
            y = 0
    }
    else if (load.Type === "Uniform") {
        coeff = W * L
        lCoeff = 1 / 2

        if (x < X)
            y = x - X - L * lCoeff
        else if (x < X + L)
            y = x - X - L * lCoeff - (x - X) ** 2 / 2 / L
        else
            y = 0
    }
    else if (load.Type === "Triangular") {
        coeff = W * L / 2
        lCoeff = 2 / 3

        if (x < X)
            y = x - X - L * lCoeff
        else if (x < X + L)
            y = x - X - L * lCoeff - (x - X) ** 3 / 3 / L ** 2
        else
            y = 0
    }

    if (beamProperties["Support Type"] === "Simply Supported") {
        if (x < a)
            y -= x - X - L * lCoeff
        else if (x < a + b)
            y -= (a - X - L * lCoeff) * (a + b - x) / b
    }

    // Round off floating point errors and multiply by coeff.
    if (abs(y) < 10 ** -10)
        y = 0

    y *= coeff

    // Send the graph back to 0 at the support for cantilever.
    if (beamProperties["Support Type"] === "Cantilever" && x == 0)
        y = [0, y]

    return y
}

/**
 * Integral of bending moment divided by EI; slope of deflection. 
 * 
 * To eliminate arbitrary constants:
 * For cantilever, deflection and rotation at x=0 are 0.
 * For simply supported, deflection at each support location is 0.
 */
function rotationSingleLoad(load, beamProperties, x) {
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let W = load["Load Force"]
    let X = load.X1
    let L = load.X2 - load.X1

    // Multiplier using load force
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff
    let y

    if (load.Type === "Point") {
        coeff = W
        lCoeff = 0

        if (x < X)
            y = x ** 2 / 2 - x * (X + L * lCoeff)
        else
            y = -1 * X ** 2 / 2
    }
    else if (load.Type === "Uniform") {
        coeff = W * L
        lCoeff = 1 / 2

        if (x < X)
            y = x ** 2 / 2 - x * (X + L * lCoeff)
        else if (x < X + L)
            y = x ** 2 / 2 - x * (X + L * lCoeff) - (x - X) ** 3 / 6 / L
        else
            y = (X + L) ** 2 / 2 - (X + L) * (X + L * lCoeff) - L ** 2 / 6
    }
    else if (load.Type === "Triangular") {
        coeff = W * L / 2
        lCoeff = 2 / 3

        if (x < X)
            y = x ** 2 / 2 - x * (X + L * lCoeff)
        else if (x < X + L)
            y = x ** 2 / 2 - x * (X + L * lCoeff) - (x - X) ** 4 / 12 / L ** 2
        else
            y = -1 * (X + L) * (X / 2 + L / 6) - L ** 2 / 12
    }

    if (beamProperties["Support Type"] === "Simply Supported") {
        if (x < a)
            y += -1 * x ** 2 / 2 + x * (X + L * lCoeff)
        else if (x < a + b)
            y += a ** 2 / 2 + (a - X - L * lCoeff) * (a ** 2 + x ** 2 - 2 * a * x - 2 * b * x) / 2 / b
        else
            y += a ** 2 / 2 - (a - X - L * lCoeff) * (a + b / 2)

        // From solving arbitrary constants
        y += ((3 * a ** 2 + 2 * a * b) + (-6 * a - 2 * b) * (X + L * lCoeff)) / 6
    }

    y *= coeff / beamProperties.Elasticity / beamProperties.Inertia

    // From solving arbitrary constants
    if (beamProperties["Support Type"] === "Simply Supported") {
        let cantileverBeamProperties = { ...beamProperties }
        cantileverBeamProperties["Support Type"] = "Cantilever"

        y += deflectionSingleLoad(load, cantileverBeamProperties, a) / b
        y -= deflectionSingleLoad(load, cantileverBeamProperties, a + b) / b
    }

    return y
}

/**
 * Second integral of bending moment divided by EI; integral of rotation.
 * 
 * To eliminate arbitrary constants:
 * For cantilever, deflection and slope at x=0 are 0.
 * For simply supported beam, deflection at each support location is 0.
 */
function deflectionSingleLoad(load, beamProperties, x) {
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let W = load["Load Force"]
    let X = load.X1
    let L = load.X2 - load.X1

    // Multiplier using load force
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff
    let y

    if (load.Type === "Point") {
        coeff = W
        lCoeff = 0

        // Get base deflection
        if (x < X)
            y = (x ** 3 - 3 * x ** 2 * (X + L * lCoeff)) / 6
        else
            y = (X ** 3 - 3 * X ** 2 * x) / 6
    }
    else if (load.Type === "Uniform") {
        coeff = W * L
        lCoeff = 1 / 2

        // Get base deflection
        if (x < X)
            y = (x ** 3 - 3 * x ** 2 * (X + L * lCoeff)) / 6
        else if (x < X + L)
            y = (x ** 3 - 3 * x ** 2 * (X + L * lCoeff)) / 6 - (x - X) ** 4 / 24 / L
        else
            y = ((X + L) ** 3 - 3 * (X + L) ** 2 * (X + L * lCoeff)) / 6 - L ** 3 / 24 + ((X + L) ** 2 / 2 - (X + L) * (X + L * lCoeff) - L ** 2 / 6) * (x - (X + L))
    }
    else if (load.Type === "Triangular") {
        coeff = W * L / 2
        lCoeff = 2 / 3

        // Get base deflection
        if (x < X)
            y = (x ** 3 - 3 * x ** 2 * (X + L * lCoeff)) / 6
        else if (x < X + L)
            y = (x ** 3 - 3 * x ** 2 * (X + L * lCoeff)) / 6 - (x - X) ** 5 / 60 / L ** 2
        else
            y = ((X + L) ** 3 - 3 * (X + L) ** 2 * (X + L * lCoeff)) / 6 - L ** 3 / 60 + (3 * L ** 2 + 8 * L * X + 6 * X ** 2) * (X + L - x) / 12
    }


    if (beamProperties["Support Type"] === "Simply Supported") {
        if (x < a)
            y -= (x ** 3 - 3 * x ** 2 * (X + L * lCoeff)) / 6
        else if (x < a + b)
            y += a ** 2 / 2 * (x - a / 3) + (a - X - L * lCoeff) * (a ** 2 * x + x ** 3 / 3 - a ** 3 / 3 - a * x ** 2 - b * x ** 2) / 2 / b
        else
            y += a ** 2 / 2 * (x - a / 3) + (a - X - L * lCoeff) * (a ** 2 + b ** 2 / 3 + a * b - x * b - 2 * a * x) / 2

        // From solving arbitrary constants
        y += ((3 * a ** 2 * x - 2 * a ** 3) + (3 * a ** 2 - 6 * a * x) * (X + L * lCoeff)) / 6
        y += ((2 * a * b * x - 2 * a ** 2 * b) + (-2 * b * x + 2 * a * b) * (X + L * lCoeff)) / 6
    }

    // Round off floating point errors.
    if (abs(y) < 10 ** -10)
        y = 0

    y *= coeff / beamProperties.Elasticity / beamProperties.Inertia

    // From solving arbitrary constants
    if (beamProperties["Support Type"] === "Simply Supported") {
        let cantileverBeamProperties = { ...beamProperties }
        cantileverBeamProperties["Support Type"] = "Cantilever"

        y += (x - a - b) / b * deflectionSingleLoad(load, cantileverBeamProperties, a)
        y += (a - x) / b * deflectionSingleLoad(load, cantileverBeamProperties, a + b)
    }

    return y
}

/**
 * Function used for finding zeroes of rotation/candidate extrema of deflection.
 * 
 * Integral of bending moment; rotation times EI. 
 * Cannot use true rotation or else some coefficients may be too small and root-finder will consider it equal to 0.
 * This function returns an array instead of a value. [a0,a1,a2,a3,a4] represents a0*x^0 + a1*x^1 + a2*x^2 + a3*x^3 + a4*x^4.
 * 
 * To eliminate arbitrary constants:
 * For cantilever, deflection and slope at x=0 are 0.
 * For simply supported beam, deflection at each support location is 0.
 */
function deflectionSlopePolynomialSingleLoad(load, beamProperties, x) {
    // a-segment is to the left of both supports
    let a = Math.min(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"])
    // b-segment is between both supports
    let b = Math.max(beamProperties["Pinned Support Position"], beamProperties["Roller Support Position"]) - a
    // c-segment is to the right of both supports
    let c = beamProperties["Length of Beam"] - b

    let W = load["Load Force"]
    let X = load.X1
    let L = load.X2 - load.X1

    // Multiplier using load force
    let coeff
    // A number frequently multiplied by L, which depends on load type
    let lCoeff
    // Polynomial array
    let a0, a1, a2, a3, a4
    [a0, a1, a2, a3, a4] = [0, 0, 0, 0, 0]

    if (load.Type === "Point") {
        coeff = W
        lCoeff = 0

        if (x < X) {
            // y = x**2/2 - x*(X+L*lCoeff)
            a2 = 1 / 2
            a1 = -1 * (X + L * lCoeff)
        }
        else {
            // y = -1*X**2/2
            a0 = -1 * X ** 2 / 2
        }
    }
    else if (load.Type === "Uniform") {
        coeff = W * L
        lCoeff = 1 / 2

        if (x < X) {
            // y = x**2/2 - x*(X+L*lCoeff)
            a2 = 1 / 2
            a1 = -1 * (X + L * lCoeff)
        }
        else if (x < X + L) {
            // y = x**2/2 - x*(X+L*lCoeff) - (x-X)**3/6/L
            a3 = -1 / 6 / L
            a2 = 3 * X / 6 / L + 1 / 2
            a1 = -3 * X ** 2 / 6 / L + -1 * (X + L * lCoeff)
            a0 = X ** 3 / 6 / L
        }
        else {
            // y = (X+L)**2/2 - (X+L)*(X+L*lCoeff) - L**2/6
            a0 = (X + L) ** 2 / 2 - (X + L) * (X + L * lCoeff) - L ** 2 / 6
        }
    }
    else if (load.Type === "Triangular") {
        coeff = W * L / 2
        lCoeff = 2 / 3

        if (x < X) {
            // y = x**2/2 - x*(X+L*lCoeff)
            a2 = 1 / 2
            a1 = -1 * (X + L * lCoeff)
        }
        else if (x < X + L) {
            // y = x**2/2 - x*(X+L*lCoeff) - (x-X)**4/12/L**2
            a4 = -1 / 12 / L ** 2
            a3 = 4 * X / 12 / L ** 2
            a2 = -6 * X ** 2 / 12 / L ** 2 + 1 / 2
            a1 = 4 * X ** 3 / 12 / L ** 2 + -1 * (X + L * lCoeff)
            a0 = -1 * X ** 4 / 12 / L ** 2
        }
        else {
            // y = -1*(X+L)*(X/2 + L/6) - L**2/12
            a0 = -1 * (X + L) * (X / 2 + L / 6) - L ** 2 / 12
        }
    }

    if (beamProperties["Support Type"] === "Simply Supported") {
        if (x < a) {
            // y += -x**2/2 + x*(X+L*lCoeff)
            a2 += -1 / 2
            a1 += X + L * lCoeff
        }
        else if (x < a + b) {
            // y += a**2/2 + (a - X - L * lCoeff) * (a**2 + x**2 - 2*a*x - 2*b*x) / 2 / b
            a2 += (a - X - L * lCoeff) / 2 / b
            a1 += (a - X - L * lCoeff) * -1 * (a + b) / b
            a0 += (a - X - L * lCoeff) * a ** 2 / 2 / b + a ** 2 / 2
        }
        else {
            // y += a**2/2 - (a - X - L * lCoeff) * (a + b/2)
            a0 += a ** 2 / 2 - (a - X - L * lCoeff) * (a + b / 2)
        }

        // y += ((3*a**2 + 2*a*b) + (-6*a - 2*b) * (X + L * lCoeff)) / 6
        a0 += ((3 * a ** 2 + 2 * a * b) + (-6 * a - 2 * b) * (X + L * lCoeff)) / 6
    }

    // y *= coeff / beamProperties.Elasticity / beamProperties.Inertia
    // This result will be EI times the true rotation
    [a0, a1, a2, a3, a4] = [a0 * coeff, a1 * coeff, a2 * coeff, a3 * coeff, a4 * coeff]

    // From solving arbitrary constants
    if (beamProperties["Support Type"] === "Simply Supported") {
        let cantileverBeamProperties = { ...beamProperties }
        cantileverBeamProperties["Support Type"] = "Cantilever"

        // y += deflectionSingleLoad(a, load, cantileverBeamProperties)/b
        a0 += deflectionSingleLoad(load, cantileverBeamProperties, a) * beamProperties.Elasticity * beamProperties.Inertia / b
        // y -= deflectionSingleLoad(a+b, load, cantileverBeamProperties)/b
        a0 -= deflectionSingleLoad(load, cantileverBeamProperties, a + b) * beamProperties.Elasticity * beamProperties.Inertia / b
    }

    return [a0, a1, a2, a3, a4]
}

// Find a scale for the y axis that comfortably fits the given dataList.
function getScale(dataList) {
    // Find the biggest absolute y-value in datalist
    let maxAbsVal = 0
    dataList.forEach(dataPoint =>
        maxAbsVal = Math.max(maxAbsVal, abs(dataPoint.y))
    )

    // If the line is all 0, scale will be 1
    if (maxAbsVal <= 10 ** -10)
        return 1

    // Peak of the graph stays at a constant height on the graph as scale continuously changes.
    return maxAbsVal * 1.5

    // Plot scale tries to stay still, until maxAbsVal forces a change by becoming too small (<50%) or too large (>100%).
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
    if (abs(scale) >= 10 ** 5 || (abs(scale) <= 10 ** -4 && abs(scale) >= 10 ** -10))
        return val => {
            val = Number(Number(val).toPrecision(6))
            if (abs(val) <= 10 ** -10)
                val = 0
            return "" + (val == 0 ? val : val.toExponential())
        }
    // If scale is regular or scale is exactly 0, return a function that just returns val.
    else
        return val => {
            val = Number(Number(val).toPrecision(6))
            if (abs(val) <= 10 ** -10)
                val = 0
            return "" + val
        }
    // The returned values must be Strings for XYPlot's tickFormat, else 0 will be read as false and will not display
}

// Uses the plot's title to determine which function to graph.
function chooseSingleLoadFunction(title) {
    if (title === "Shear Force Diagram")
        return shearForceSingleLoad
    if (title === "Bending Moment Diagram")
        return bendingMomentSingleLoad
    if (title === "Rotation Diagram")
        return rotationSingleLoad
    if (title === "Deflection Diagram")
        return deflectionSingleLoad
}

export default SidePlot