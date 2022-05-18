package com.example.sensorwithsocket;

import android.util.Log;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class DeadReckoningImpl implements DeadReckoning{
    private LowPassFilter lowPassFilter;
    private HighPassFilter highPassFilter;
    private PeakPicking peakPicking;
    private List<float[]> currPattern;
    private List<float[]> recordedPattern;
    private List<MovementDetectionCallback> observers;
    private boolean gyroFlag;
    private int theta = 0;
    DeadReckoningImpl(){
        this.lowPassFilter = new LowPassFilter();
        this.highPassFilter = new HighPassFilter();
        this.peakPicking = new PeakPicking();
        this.currPattern = new ArrayList<>();
        this.recordedPattern = new ArrayList<>();
        this.observers = new ArrayList<>();
        this.gyroFlag = false;
        this.theta = 0;
    }
    DeadReckoningImpl(boolean gyroFlag){
        this();
        this.gyroFlag = gyroFlag;
    }
    @Override
    public float[] filterAccelerometerReadings(float[] input) {
        float[] linearAcc = highPassFilter.filter(input);
        return lowPassFilter.filter(linearAcc);
    }

    @Override
    public float peakEstimation(float input) {
        float peak = peakPicking.discoverPeaks(input);
        publishMovement(peak);
        return peak;
    }

    @Override
    public void recordValues(float[] input) {
        currPattern.add(input);
    }

    @Override
    public void stopRecording() {
        recordedPattern = new ArrayList<>();
        recordedPattern.addAll(currPattern);
    }

    @Override
    public void startRecording() {
        this.currPattern = new ArrayList<>();
    }

    @Override
    public List<float[]> getWalkPattern() {
        return recordedPattern;
    }

    @Override
    public void subscribeForMovementChanges(MovementDetectionCallback movementDetectionCallback) {
        observers.add(movementDetectionCallback);
    }

    private void publishMovement(float peak) {
        Movement movement = Movement.IDLE;
        if(gyroFlag){

            if(peak >= 1.1f || peak <= -1.2f){
                movement = Movement.TURN;
            }
//            if(peak > 0.0f) {
//                Log.d("gpeak", "peak is : " + peak);
//                peak *= 10;
//            }
//
//            if(Math.abs(peak) >= 1.55f){
//                movement = Movement.TURN;
//                this.theta = 0;
//            }else if(peak >= 0.78f || peak <= -0.78f){
//                this.theta += (peak < 0)?-45:45;
//            }
//            else{
//                this.theta += ((int)(peak*22.5));
//            }
//
//            if(Math.abs(theta) >= 90) {
//                movement = Movement.TURN;
//                this.theta = 0;
//            }
//            if(theta != 0)
//                Log.d("theta", "theta is : " + theta);
        }else if(peak >= 4.0f || peak <= -4.0f) {
            movement = Movement.JUMP;
        } else if(peak >= 1.0f || peak <= -1.0f) {
            movement = Movement.STEP;
        }

        for(MovementDetectionCallback observer : observers) {
            observer.getMovement(movement);
        }
    }
}
