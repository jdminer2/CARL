package com.example.sensorwithsocket;

import android.app.Activity;

import java.util.List;

public interface DeadReckoning {
    float[] filterAccelerometerReadings(float[] input);
    float peakEstimation(float input);
    void publishRotation(float[] input, Activity activity);
    void recordValues(float[] input);
    void stopRecording();
    void startRecording();
    List<float[]> getWalkPattern();
    void subscribeForMovementChanges(MovementDetectionCallback movementDetectionCallback);
    void setBorderTheta();
}
