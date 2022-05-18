package com.example.sensorwithsocket;

import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import java.util.List;

public class DataModel extends ViewModel {
    private MutableLiveData<List<List<Double>>> graphData;

    public MutableLiveData<List<List<Double>>> getGraphData(){
        if ( graphData == null) {
            graphData = new MutableLiveData<>();
        }

        return graphData;
    }
}
