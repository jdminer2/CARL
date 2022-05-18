package com.example.sensorwithsocket;

import java.util.List;

public class QData {
    private List<List<Double>> q;

    public List<List<Double>> getQ(){
        return this.q;
    }

    @Override
    public String toString(){
//        return Arrays.toString(message.get(0).toArray());
        return "" + q.get(1).toArray()[3];
    }
}
