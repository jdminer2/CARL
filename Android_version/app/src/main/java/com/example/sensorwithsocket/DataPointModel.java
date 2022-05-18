package com.example.sensorwithsocket;

import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import java.util.List;

public class DataPointModel extends ViewModel {
    private MutableLiveData<List<Double>> graphDataPoints;
    public MutableLiveData<List<Double>> getGraphDataPoints(){
        if ( graphDataPoints == null) {
            graphDataPoints = new MutableLiveData<>();
        }

        return graphDataPoints;
    }
}
