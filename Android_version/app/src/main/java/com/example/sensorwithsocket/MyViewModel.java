package com.example.sensorwithsocket;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Application;
import android.util.Log;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.arch.core.util.Function;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.Transformations;
import androidx.lifecycle.ViewModel;

import java.util.Arrays;
import java.util.List;

public class MyViewModel extends ViewModel {
    LiveData<String> movement;
    LiveData<AccelerometerSensorDataModel> accStreamLiveData;
    LiveData<GyroscopeSensorDataModel> gyroStreamLiveData;
    MutableLiveData<String> movementUpdate;
    @SuppressLint("StaticFieldLeak")
    Activity activity;
    MyViewModel(Activity activity, LiveData<AccelerometerSensorDataModel> accStreamLiveData, LiveData<GyroscopeSensorDataModel> gyroStreamLiveData){
        this.activity = activity;
        this.accStreamLiveData = accStreamLiveData;
        this.gyroStreamLiveData = gyroStreamLiveData;
        this.movement = Transformations.map(MainActivity.movement, new Function<String, String>() {
            @Override
            public String apply(String input) {
                MainActivity mainActivity = ((MainActivity)activity);
                if(input.equals(Movement.IDLE.name())){
                    // from here send request to server
                }else if(input.equals(Movement.STEP.name())){
                    int direction = mainActivity.direction;
                    if(direction == 1){ // go right
                        if(mainActivity.isWebViewActive){
                            mainActivity.mainWebView.loadUrl("javascript:document.getElementById('single_right_btn').click()");
                            mainActivity.mainWebView.loadUrl("javascript:document.getElementById('multi_right_btn').click()");
                        }else {
                            mainActivity.rightBtn.performClick();
                        }
                    }else{
                        if(mainActivity.isWebViewActive){
                            mainActivity.mainWebView.loadUrl("javascript:document.getElementById('single_left_btn').click()");
                            mainActivity.mainWebView.loadUrl("javascript:document.getElementById('multi_left_btn').click()");
                        }else {
                            mainActivity.leftBtn.performClick();
                        }
                    }
//                    Toast.makeText(activity.getBaseContext(), "step detected",Toast.LENGTH_LONG).show();
                }else if(input.equals(Movement.JUMP.name())){
                    if(mainActivity.isWebViewActive){
                        mainActivity.mainWebView.loadUrl("javascript:document.getElementById('single_jump_btn').click()");
                        mainActivity.mainWebView.loadUrl("javascript:document.getElementById('multi_jump_btn').click()");
                    }else {
                        mainActivity.jumpBtn.performClick();
                    }
//                    Toast.makeText(activity.getBaseContext(), "jump detected",Toast.LENGTH_LONG).show();
                }else if(input.equals(Movement.TURN.name())){
                    mainActivity.directionalBtn.performClick();
//                    Toast.makeText(activity.getBaseContext(), "Turn *** detected",Toast.LENGTH_LONG).show();
                }
                return null;
            }
        });
    }

    public LiveData<String> getMovement(){
        return this.movement;
    }
    public LiveData<AccelerometerSensorDataModel> getAccStreamLiveData(){
        return this.accStreamLiveData;
    }
    public LiveData<GyroscopeSensorDataModel> getGyroStreamLiveData(){
        return this.gyroStreamLiveData;
    }

}
