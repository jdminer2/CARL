package com.example.sensorwithsocket;

import java.util.Collections;
import java.util.LinkedList;
import java.util.Queue;

public class PeakPicking {

    private Queue<Float> previousValue;
    PeakPicking(){
        previousValue = new LinkedList<>();
    }
    public float discoverPeaks(float newReading){
        float output= 0.0f;
        previousValue.add(newReading);
        if(previousValue.size() <= 2){
            return output;
        }
        float oldValue = previousValue.poll();
        if(oldValue < 0 && newReading < 0){
            if(oldValue > previousValue.peek() && previousValue.peek() <= newReading) {
                output = previousValue.peek();
            }else{
                if(oldValue < previousValue.peek() && previousValue.peek() >= newReading) {
                    output = previousValue.peek();
                }
            }
        }
        return output;
    }
}
