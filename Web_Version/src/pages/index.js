import '../App.css'
import React, { useEffect, useState} from 'react';
import { Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';

const Home = () => {
    const [loadCount,setLoadCount] = useState("single");
    const [loadType,setLoadType] = useState("centralized");
    const [supportType,setSupportType] = useState("simplySupported");
    return(<div>
        <h1>Welcome to CARL SIMULATOR</h1>
        <FormControl>
            {/* Select single load or multiple load. */}
            <FormLabel id="loadCountSelection">Choose Number of Loads</FormLabel>
            <RadioGroup
                row
                aria-labelledby="loadCountSelection"
                name="loadCountSelectionRadioBtns"
                value={loadCount}
                onChange={(e) => {
                    setLoadCount(e.target.value);
                    if(loadType==="both")
                        setLoadType("centralized");
                }}
            >
                <FormControlLabel value="single" control={<Radio />} label="Single" />
                <FormControlLabel value="multiple" control={<Radio />} label="Multiple" />
            </RadioGroup>
            {/* Select centralized load, distributed load, or, if multiple was selected previously, both load types. */}
            <FormLabel id="loadTypeSelection">Choose Load Type</FormLabel>
            <RadioGroup
                row
                aria-labelledby="loadTypeSelection"
                name="loadTypeSelectionRadioBtns"
                value={loadType}
                onChange={(e) => setLoadType(e.target.value)}
            >
                <FormControlLabel value="centralized" control={<Radio />} label="Centralized" />
                <FormControlLabel value="distributed" control={<Radio />} label="Distributed" />
                {conditionalBothButton()}
            </RadioGroup>
            {/* Select simply supported beam or cantilever beam. */}
            <FormLabel id="supportTypeSelection">Choose Support Type</FormLabel>
            <RadioGroup
                row
                aria-labelledby="supportTypeSelection"
                name="supportTypeSelectionRadioBtns"
                value={supportType}
                onChange={(e) => setSupportType(e.target.value)}
            >
                <FormControlLabel value="simplySupported" control={<Radio />} label="Simply Supported Beam" />
                <FormControlLabel value="cantilever" control={<Radio />} label="Cantilever" />
            </RadioGroup>
            <Button variant="contained" href={selectDestination()}>
                Start
            </Button>
        </FormControl>

    </div>)

    /** 
        Function that controls whether the Both button is disabled in load type selection.
        It is disabled if the selected load count is Single.
    */
    function conditionalBothButton() {
        if(loadCount==="multiple")
            return <FormControlLabel value="both" control={<Radio />} label="Both" />
        else
            return <FormControlLabel value="both" control={<Radio />} label="Both" disabled />;
    }

    function selectDestination() {
        // Cantilever: only multiple-centralized-cantilever is available right now.
        if(supportType==="cantilever")
            return "./cantilever_beam"
        // Single-centralized-simplySupported
        else if(loadCount=="single" && loadType==="centralized")
            return "./single_load"
        // Single-distributed-simplySupported
        else if(loadCount=="single" && loadType==="distributed")
            return "./distributed_load"
        // Multiple-centralized-simplySupported
        else if(loadCount=="multiple" && loadType==="centralized")
            return "./multiple_loads"
        // Multiple-distributed-simplySupported and multiple-both-simplySupported
        else if(loadCount=="multiple")
            return "./combined_load"
        // There is currently no path to CE 325 from these radio buttons
    }
};
export default Home;