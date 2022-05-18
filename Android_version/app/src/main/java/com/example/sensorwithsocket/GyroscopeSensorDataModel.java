package com.example.sensorwithsocket;

import android.os.Build;

import androidx.annotation.RequiresApi;
import androidx.lifecycle.ViewModel;

public final class GyroscopeSensorDataModel extends ViewModel {
    private float gyX;
    private float gyY;
    private float gyZ;

    public final float getGyX() {
        return this.gyX;
    }

    public final void setGyX(float var1) {
        this.gyX = var1;
    }

    public final float getGyY() {
        return this.gyY;
    }

    public final void setGyY(float var1) {
        this.gyY = var1;
    }

    public final float getGyZ() {
        return this.gyZ;
    }

    public final void setGyZ(float var1) {
        this.gyZ = var1;
    }

    public GyroscopeSensorDataModel(float gyX, float gyY, float gyZ) {
        this.gyX = gyX;
        this.gyY = gyY;
        this.gyZ = gyZ;
    }


    public GyroscopeSensorDataModel() {
        this(0.0F, 0.0F, 0.0F);
    }

    public final float component1() {
        return this.gyX;
    }

    public final float component2() {
        return this.gyY;
    }

    public final float component3() {
        return this.gyZ;
    }



    public final GyroscopeSensorDataModel copy(float gyX, float gyY, float gyZ) {
        return new GyroscopeSensorDataModel(gyX, gyY, gyZ);
    }

    // $FF: synthetic method
    public static GyroscopeSensorDataModel copy$default(GyroscopeSensorDataModel var0, float var1, float var2, float var3, int var4, Object var5) {
        if ((var4 & 1) != 0) {
            var1 = var0.gyX;
        }

        if ((var4 & 2) != 0) {
            var2 = var0.gyY;
        }

        if ((var4 & 4) != 0) {
            var3 = var0.gyZ;
        }

        return var0.copy(var1, var2, var3);
    }


    public String toString() {
        return "GyroscopeSensorDataModel(gyX=" + this.gyX + ", gyY=" + this.gyY + ", gyZ=" + this.gyZ + ")";
    }

    @RequiresApi(api = Build.VERSION_CODES.N)
    public int hashCode() {
        return (Float.hashCode(this.gyX) * 31 + Float.hashCode(this.gyY)) * 31 + Float.hashCode(this.gyZ);
    }

    public boolean equals(Object var1) {
        if (this != var1) {
            if (var1 instanceof GyroscopeSensorDataModel) {
                GyroscopeSensorDataModel var2 = (GyroscopeSensorDataModel)var1;
                if (Float.compare(this.gyX, var2.gyX) == 0 && Float.compare(this.gyY, var2.gyY) == 0 && Float.compare(this.gyZ, var2.gyZ) == 0) {
                    return true;
                }
            }

            return false;
        } else {
            return true;
        }
    }
}
