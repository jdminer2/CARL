package com.example.sensorwithsocket;

public class LowPassFilter {
    private float timeConstant;
    private static final float NANO_SECONDS = 1000000000.0f;
    private float alpha;
    private long count;
    private long currentTimeInNanos;
    private float[] gravity;
    private float startTimeInNanos;

    LowPassFilter(){
        this.timeConstant = 0.18f;
        this.gravity = new float[3];
        reset();
    }

    public float[] filter(float[] input){
        if(startTimeInNanos == 0L) {
            startTimeInNanos = System.nanoTime();
        }

        currentTimeInNanos = System.nanoTime();

        // TODO: check if following lines are useful
        //val samplePeriod = 1 / (count++ / ((currentTimeInNanos - startTimeInNanos) / NANO_SECONDS))
        //this.alpha = timeConstant / (timeConstant + samplePeriod)

        float alpha = 0.8f;

        gravity[0] = alpha * gravity[0] + (1 - alpha) * input[0];
        gravity[1] = alpha * gravity[1] + (1 - alpha) * input[1];
        gravity[2] = alpha * gravity[2] + (1 - alpha) * input[2];

        float[] output = new float[3];
        output[0] = input[0] - gravity[0];
        output[1] = input[1] - gravity[1];
        output[2] = input[2] - gravity[2];

        return output;
    }

    public void changeTimeConstant(float timeConstant){
        this.timeConstant = timeConstant;
    }

    public void reset(){
        this.startTimeInNanos = 0L;
        this.currentTimeInNanos = 0L;
        this.count = 0L;
    }
}
