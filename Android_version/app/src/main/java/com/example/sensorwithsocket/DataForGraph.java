package com.example.sensorwithsocket;

import android.util.Log;

import com.google.gson.Gson;
import com.jjoe64.graphview.series.DataPoint;
import com.jjoe64.graphview.series.LineGraphSeries;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

public class DataForGraph {
    public ArrayList<Integer> a;

    public static List<Double> l;

    public static List<List<Double>> getDataAsList(String d) throws JSONException {
        Gson gson = new Gson();
        GraphData graphData = gson.fromJson(d,GraphData.class);
        Log.d("data is ", graphData.toString());
        return graphData.getMessage() ;
    }
    public static List<List<Double>> getQdataAsList(String d) throws JSONException{
        Gson gson = new Gson();
        QData QData = gson.fromJson(d,QData.class);
        Log.d("data is ", QData.toString());
        return QData.getQ();
    }
    public static void addTheData(LineGraphSeries<DataPoint> series, double x, double y){
        series.appendData(new DataPoint(x,y), true,15);
    }

}
