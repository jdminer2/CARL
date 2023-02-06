import { HorizontalGridLines, LabelSeries, LineSeries, VerticalGridLines, XAxis, XYPlot, YAxis } from "react-vis"
function MainPlot(props){
    if(props.dynamic)
        return (
            <XYPlot 
                height={window.innerHeight * 0.5} width={(innerWidth > 500) ? (window.innerWidth * 0.4) : window.innerWidth}
                xDomain={[0, props.beamProperties["Length of Beam"]]} yDomain ={[props.deflectionScale * 10,props.deflectionScale * 10]} margin={{ left: 60, right: 60 }}
            >
                <VerticalGridLines/>
                <HorizontalGridLines/>
                <XAxis tickFormat={formatVal(props.beamProperties["Length of Beam"])} title={"Load Locations"} />
                <YAxis tickFormat={formatVal(props.deflectionScale)}/>
                {/* Display the beam */}
                <LineSeries data={updateMdata(props.mData, props.beamProperties["Length of Beam"])} curve={'curveMonotoneX'}/>
                {/* Display the supports. */}
                <LabelSeries data={[{
                    x: 0, y: 0, yOffset: 24, label: "\u25b2",
                    style: { fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle" }
                },
                {
                    x: props.beamProperties["Length of Beam"], y: 0, yOffset: 24, label: "\u2b24",
                    style: { fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle" }
                }]} />
                {/* Display the loads */}
                <LabelSeries data={labelMakerForLoads(props.loads, props.beamProperties["Length of Beam"], props.selectedLoadID, true, props.mData)}
                    onValueClick={element => props.setSelectedLoadID(element.loadID)} />
            </XYPlot>
        )
    else
        return (
            <XYPlot
                height={window.innerHeight * 0.5} width={(innerWidth > 500) ? (window.innerWidth * 0.4) : window.innerWidth}
                xDomain={[0, props.beamProperties["Length of Beam"]]} yDomain={[-100, 100]} margin={{ left: 60, right: 60 }}
            >
                <VerticalGridLines />
                <HorizontalGridLines />
                <XAxis tickFormat={formatVal(props.beamProperties["Length of Beam"])} title={"Load Locations"} />
                <YAxis hideTicks />
                {/* Display the beam line. */}
                <LineSeries data={[{ x: 0, y: 0 }, { x: props.beamProperties["Length of Beam"], y: 0 }]} />
                {/* Display the supports. */}
                {(props.beamProperties["Support Type"] === "Simply Supported")
                    ?
                    // Simply Supported supports
                    <LabelSeries data={[{
                        x: props.beamProperties["Pinned Support Position"], y: 0, yOffset: 24, label: "\u25b2",
                        style: { fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle" }
                    },
                    {
                        x: props.beamProperties["Roller Support Position"], y: 0, yOffset: 24, label: "\u2b24",
                        style: { fontSize: 25, font: "verdana", fill: "#12939A", dominantBaseline: "text-after-edge", textAnchor: "middle" }
                    }]} />
                    :
                    // Cantilever support
                    getCantileverSupportDisplay(props.beamProperties["Length of Beam"])
                }
                {/* Display the labels and arrows for loads. */}
                <LabelSeries data={labelMakerForLoads(props.loads, props.beamProperties["Length of Beam"], props.selectedLoadID, false)} 
                    onValueClick={element => props.setSelectedLoadID(element.loadID)} />
                {/* Display the line parts of uniform and triangular loads. */}
                {props.loads.map((load, loadID) => {
                    if (load.Type === "Point")
                        return
                    let data = [{ x: load.X1, y: 8 * (930 / (window.innerHeight - 100)) },
                    { x: load.X2, y: 8 * (930 / (window.innerHeight - 100)) }]
                    if (load.Type === "Triangular")
                        data.push({ x: (load["Taller End"] === "Left") ? load.X1 : load.X2, y: 20 * (930 / (window.innerHeight - 100)) },
                            { x: load.X1, y: 8 * (930 / (window.innerHeight - 100)) })

                    return (
                        <LineSeries
                            data={data}
                            onSeriesClick={() => {props.setSelectedLoadID(loadID)}}
                            key={loadID}
                            color={load.Color}
                            strokeWidth={3}
                        />
                    )
                })}
            </XYPlot>
        )
}

function updateMdata(data, beamLength){
    // Horizontally stretch the given data to cover the length of the beam
    let d = []
    for(let o in data){
        d.push( {x:data[o].x * beamLength/9 , y:data[o].y})
    }
    return d
}

// Function for adding the cantilever support visual display.
function getCantileverSupportDisplay(beamLength) {
    let support = []
    let leftSide = -2 / 100 * beamLength * (1920 / (window.innerWidth + ((innerWidth > 500) ? -300 : 440)))
    // Outer rectangle parts
    support.push(<LineSeries data={[{ x: leftSide, y: 10 * (930 / (window.innerHeight - 100)) },
    { x: 0, y: 10 * (930 / (window.innerHeight - 100)) },
    { x: 0, y: -10 * (930 / (window.innerHeight - 100)) },
    { x: leftSide, y: -10 * (930 / (window.innerHeight - 100)) }]}
        color="#12939A"
        key="box" />)
    // Diagonal parts
    support = support.concat([-10, -6, -2, 2, 6].map(val =>
        <LineSeries data={[{ x: leftSide, y: val * (930 / (window.innerHeight - 100)) },
        { x: 0, y: (val + 4) * (930 / (window.innerHeight - 100)) }]}
            color="#12939A"
            key={val} />
    ))
    return support
}



/**
 * Function to create load labels and arrows for the Load Location plot.
 * For point loads it puts load name, position, and load force, with an arrow.
 * For non-point loads it also includes length, and puts many mini-arrows.
 * This function is not responsible for the line/triangle parts of non-point loads.
 * Point load labels are higher than the rest to reduce the amount of overlapping text.
 */
function labelMakerForLoads(loads, beamLength, selectedLoadID, dynamic, mData) {
    if(dynamic && mData===undefined)
        return null
    var data = []
    loads.forEach((load, loadID) => {
        // xLoc is the center of the load. It serves as the location for labels, and the x coordinate users see for loads.
        let xLoc = (load.X1 + load.X2) / 2 // Convert to display format, where position = the middle of the load
        let yLoc = dynamic ? calcLoadHeight(xLoc, mData, beamLength) : 0

        // Check if the load is a point load, and if it is the selected load.
        let isPoint = load.Type === "Point"
        let isSelected = loadID == selectedLoadID

        // For selected load, the stats will be labelled with letters.
        let statsLabel = ""
        // X or X1 label
        statsLabel += (isSelected ? (isPoint ? "X=" : "X1=") : "") + load.X1 + ", "
        // X2 label if applicable
        if (load.Type !== "Point")
            statsLabel += (isSelected ? "X2=" : "") + load.X2 + ", "
        // P or W label
        statsLabel += (isSelected ? (isPoint ? "P=" : "W=") : "") + load["Load Force"]

        // Load name and stats labels. For point loads it will be 10 units higher.
        data.push({ x: xLoc, y: yLoc, yOffset: (isPoint ? -75 : -55), label: load.Name, loadID: loadID, style: { fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle" } })
        data.push({ x: xLoc, y: yLoc, yOffset: (isPoint ? -65 : -45), label: statsLabel, loadID: loadID, style: { fontSize: 10, dominantBaseline: "text-after-edge", textAnchor: "middle" } })

        // Point Loads have a big arrow, non-point loads have mini arrows
        getLoadArrows(data, load, loadID, beamLength, yLoc)
    })
    return data
}

/**
 * Function for adding the arrows representing point loads, or the mini-arrows under non-point loads
 * 
 * For point loads:
 * One big black arrow at the location
 * For non-point loads:
 * At least one arrow per 5% beamlength, plus arrows on each end. 
 * The arrows match the color and loadID of the load.
 * 
 * loadID is the index of the load that these arrows belong to. It helps users click on loads to select them
 */
function getLoadArrows(data, load, loadID, beamLength, yLoc) {
    if (load.Type === "Point")
        data.push({ x: load.X1, y: yLoc, yOffset: 10, label: "\u2193", loadID: loadID, style: { fontSize: 45, font: "verdana", dominantBaseline: "text-after-edge", textAnchor: "middle" } })
    else {
        let numArrows = Math.floor((load.X2 - load.X1) / beamLength * 20) + 1
        // Evenly spaced
        for (let i = 0; i <= numArrows; i++) {
            let x = load.X1 + (i / numArrows) * (load.X2 - load.X1)
            data.push({ x: x, y: yLoc, yOffset: 6, label: "\u2193", loadID: loadID, style: { fontSize: 25, font: "verdana", fill: load.Color, dominantBaseline: "text-after-edge", textAnchor: "middle" } })
        }
    }
}

// Find the y position of a load at x=loc, according to the given data.
function calcLoadHeight(loc, data, beamLength){
    if(data === undefined){
        return 0;
    }
    const x = (9/beamLength)*loc
    const xLeft = Math.floor(x)
    const xRight = xLeft + 1
    let y
    if(0 <= xLeft <= 9 && 0 <= xRight <= 9) {
        const yLeft = data[xLeft].y
        const yRight = data[xRight].y
        const m = (yRight-yLeft)/(xRight-xLeft)
        y = m * (x-xLeft) + yLeft
    }
    else
        y = 0
    return y
}

/**
     * This function produces a tick formatting function for XYPlot using the given scale.
     * 
     * Values are rounded to 6 significant digits, and values smaller than 10^-10 are rounded to 0.
     * If the scale is large or small enough (but not 0), numbers will be displayed in scientific notation.
     */
function formatVal(scale) {
    // If the scale is very large or tiny, return a function that converts vals to scientific notation.
    if (10 ** 5 <= Math.abs(scale) || (10 ** -10 <= Math.abs(scale) && Math.abs(scale) <= 10 ** -4))
        return val => {
            val = Number(val.toPrecision(6))
            if (Math.abs(val) <= 10 ** -10)
                return "0"
            return "" + val.toExponential()
        }
    // If scale is normal or scale is exactly 0, return a function that just returns val.
    else
        return val => {
            val = Number(val.toPrecision(6))
            if (Math.abs(val) <= 10 ** -10)
                return "0"
            return "" + val
        }
    // The returned values must be Strings for XYPlot's tickFormat, else 0 will be interpreted as false and will not display
}

export default MainPlot