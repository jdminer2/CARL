package com.example.sensorwithsocket;

import android.util.Log;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import android.app.Activity;
import android.view.Surface;

public class DeadReckoningImpl implements DeadReckoning{
    private LowPassFilter lowPassFilter;
    private HighPassFilter highPassFilter;
    private PeakPicking peakPicking;
    private List<float[]> currPattern;
    private List<float[]> recordedPattern;
    private List<MovementDetectionCallback> observers;
    private boolean gyroFlag;
    // Half of the directions are interpreted as left-movement along the beam, and half are interpreted as right.
    // borderTheta and borderTheta + PI are the turning points between left and right movement.
    private float borderTheta = (float)(Math.PI/2);
    private float theta = 0;
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

    public void publishRotation(float[] input, Activity activity) {
        float oldTheta = theta;
        Log.d("turn", "" + input[0] +" "+ input[1] +" "+ input[2]);
        // angle represents counter-clockwise turning of the device, or technically the clockwise adjustment of the screen's display
        // it is assumed the user holds the device so that the top of the visual display points up or forward
        switch(activity.getWindowManager().getDefaultDisplay().getRotation()) {
            case Surface.ROTATION_0:
                theta += input[1]/5;
                break;
            case Surface.ROTATION_90:
                theta += input[0]/5;
                break;
            case Surface.ROTATION_180:
                theta -= input[1]/5;
                break;
            case Surface.ROTATION_270:
                theta -= input[0]/5;
                break;
        }
        theta += input[2]/5;

        Log.d("Rotation", ""+theta);

        // For some reason it worked better when I multiplied everything by 5.
        while(theta >= 2*Math.PI)
            theta -= 2*Math.PI;
        while(theta < 0)
            theta += 2*Math.PI;

        if((borderTheta <= oldTheta && oldTheta < borderTheta + Math.PI) != (borderTheta <= theta && theta < borderTheta + Math.PI))
            for(MovementDetectionCallback observer : observers)
                observer.getMovement(Movement.TURN);
    }

    private void publishMovement(float peak) {
        Movement movement = Movement.IDLE;

        if(peak >= 4.0f || peak <= -4.0f) {
            movement = Movement.JUMP;
        } else if(peak >= 0.5f || peak <= -0.5f) {
            movement = Movement.STEP;
        }

        for(MovementDetectionCallback observer : observers) {
            observer.getMovement(movement);
        }
    }

    // Resets borderTheta so the current direction is exactly in the middle between the two turning points.
    public void setBorderTheta() {
        borderTheta = (float)((theta + Math.PI/2) % Math.PI);
    }
}
