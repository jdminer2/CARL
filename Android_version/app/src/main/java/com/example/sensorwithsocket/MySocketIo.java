package com.example.sensorwithsocket;

import java.net.URISyntaxException;

import io.socket.client.IO;
import io.socket.client.Socket;

public class MySocketIo {
    private Socket mySocket;
    MySocketIo(String uri){
        try {
            this.mySocket = IO.socket(uri);
        }catch (URISyntaxException e){
            e.printStackTrace();
        }
    }
    public Socket getSocket(){
        return this.mySocket;
    }
}
