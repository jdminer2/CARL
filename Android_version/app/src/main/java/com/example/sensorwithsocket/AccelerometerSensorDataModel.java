package com.example.sensorwithsocket;

import android.app.Activity;
import android.app.Application;
import android.os.Build;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModel;

public final class AccelerometerSensorDataModel extends ViewModel {
    private float accX;
    private float accY;
    private float accZ;

    public final float getAccX() {
        return this.accX;
    }

    public final void setAccX(float var1) {
        this.accX = var1;
    }

    public final float getAccY() {
        return this.accY;
    }

    public final void setAccY(float var1) {
        this.accY = var1;
    }

    public final float getAccZ() {
        return this.accZ;
    }

    public final void setAccZ(float var1) {
        this.accZ = var1;
    }


    public AccelerometerSensorDataModel(float accX, float accY, float accZ) {
        this.accX = accX;
        this.accY = accY;
        this.accZ = accZ;

    }

    public AccelerometerSensorDataModel() {
        this(0.0F, 0.0F, 0.0F);
    }

    public final float component1() {
        return this.accX;
    }

    public final float component2() {
        return this.accY;
    }

    public final float component3() {
        return this.accZ;
    }

    public final AccelerometerSensorDataModel copy(float accX, float accY, float accZ) {
        return new AccelerometerSensorDataModel(accX, accY, accZ);
    }

    // $FF: synthetic method
    public static AccelerometerSensorDataModel copy$default(AccelerometerSensorDataModel var0, float var1, float var2, float var3, int var4, Object var5) {
        if ((var4 & 1) != 0) {
            var1 = var0.accX;
        }

        if ((var4 & 2) != 0) {
            var2 = var0.accY;
        }

        if ((var4 & 4) != 0) {
            var3 = var0.accZ;
        }

        return var0.copy(var1, var2, var3);
    }

    public String toString() {
        return "AccelerometerSensorDataModel(accX=" + this.accX + ", accY=" + this.accY + ", accZ=" + this.accZ + ")";
    }

    @RequiresApi(api = Build.VERSION_CODES.N)
    public int hashCode() {
        return (Float.hashCode(this.accX) * 31 + Float.hashCode(this.accY)) * 31 + Float.hashCode(this.accZ);
    }

    public boolean equals(Object var1) {
        if (this != var1) {
            if (var1 instanceof AccelerometerSensorDataModel) {
                AccelerometerSensorDataModel var2 = (AccelerometerSensorDataModel)var1;
                if (Float.compare(this.accX, var2.accX) == 0 && Float.compare(this.accY, var2.accY) == 0 && Float.compare(this.accZ, var2.accZ) == 0) {
                    return true;
                }
            }

            return false;
        } else {
            return true;
        }
    }
}
