// This file is unused and may no longer work

import {useEffect,useRef} from "react";

export function useInterval(callback, delay){
    const saveCallback = useRef();
    useEffect(()=>{
        saveCallback.current = callback;
    }, [callback]);

    useEffect(() =>{
        function tick(){
            saveCallback.current();
        }
        if(delay !== null){
            const id = setInterval(tick,delay);
            return () => {
                clearInterval(id);
            };
        }
    }, [callback, delay]);
}