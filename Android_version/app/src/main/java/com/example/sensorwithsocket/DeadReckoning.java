package com.example.sensorwithsocket;

import java.util.List;

public interface DeadReckoning {
    float[] filterAccelerometerReadings(float[] input);
    float peakEstimation(float input);
    void recordValues(float[] input);
    void stopRecording();
    void startRecording();
    List<float[]> getWalkPattern();
    void subscribeForMovementChanges(MovementDetectionCallback movementDetectionCallback);
}
