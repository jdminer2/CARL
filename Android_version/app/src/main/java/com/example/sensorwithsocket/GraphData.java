package com.example.sensorwithsocket;

import java.util.List;

public class GraphData {
    private List<List<Double>> message;

    public List<List<Double>> getMessage(){
        return this.message;
    }

    @Override
    public String toString(){
//        return Arrays.toString(message.get(0).toArray());
        return "" + message.get(1).toArray()[3];
    }


}
