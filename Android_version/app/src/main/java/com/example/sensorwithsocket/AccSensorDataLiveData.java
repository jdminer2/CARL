package com.example.sensorwithsocket;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.util.Log;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

public class AccSensorDataLiveData extends MutableLiveData<float[]> implements SensorEventListener {
    private SensorManager sensorManager;

    @SuppressLint("ServiceCast")
    AccSensorDataLiveData(Activity activity){
        this.sensorManager = (SensorManager) activity.getSystemService(Context.SENSOR_SERVICE);
    }
    @Override
    public void onSensorChanged(SensorEvent event) {
        if(event.sensor.getType() == Sensor.TYPE_ACCELEROMETER){
//            Log.d("ACCSENSOR", "SOME VALUES CAME");
            postValue(event.values);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {

    }

    @Override
    protected void onActive() {
        Sensor gySensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        sensorManager.registerListener(this, gySensor, sensorManager.SENSOR_DELAY_NORMAL);
    }

    @Override
    protected void onInactive() {
        sensorManager.unregisterListener(this);
    }
}
