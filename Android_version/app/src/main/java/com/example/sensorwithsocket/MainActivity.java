package com.example.sensorwithsocket;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.arch.core.util.Function;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.Observer;
import androidx.lifecycle.Transformations;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;
import androidx.lifecycle.ViewModelStore;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.view.inputmethod.InputMethodSession;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.Toast;

import com.jjoe64.graphview.GraphView;
import com.jjoe64.graphview.Viewport;
import com.jjoe64.graphview.series.DataPoint;
import com.jjoe64.graphview.series.LineGraphSeries;

import org.json.JSONException;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

import io.socket.client.Socket;
import io.socket.emitter.Emitter;

public class MainActivity extends AppCompatActivity implements MovementDetectionCallback {
    public static MutableLiveData<String> movement;
    DeadReckoning deadReckoning;
    DeadReckoning deadReckoningGyro;
    AccSensorDataLiveData accSensorLiveData;
    GySensorDataLiveData gySensorDataLiveData;
    LiveData<AccelerometerSensorDataModel> accStreamLiveData;
    LiveData<GyroscopeSensorDataModel> gyStreamLiveData;
    MyViewModel viewModel;
    Button tester;
    Button leftBtn, rightBtn, jumpBtn;
    boolean enableSensor;
    Socket socket;
    private int mi;
    private List<List<Double>> data;
    private DataModel dataModel;
    private DataPointModel pointModel;
    private LineGraphSeries<DataPoint> series;
    private GraphView graph;
    private Viewport viewport;
    private boolean requestSent;
    private boolean isStarted;
    private Runnable runnable;
    private Handler handler;
    private int delay;
    private double location;
    private double force;
    private boolean firstSent;// delete it later
    private List<List<Double>> q;
    private Button desktopVersionSwitch;
    public boolean isWebViewActive;
    public WebView mainWebView;
    public Button directionalBtn;
    public int direction;
    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        MainActivity.movement = new MutableLiveData<>();
        this.direction = 1;
        this.isWebViewActive = false;
        this.desktopVersionSwitch = findViewById(R.id.dswitch);
        this.enableSensor = true;
        initForSocketsAndGraph(true);
        this.mainWebView = findViewById(R.id.main_web_view);
        this.leftBtn = findViewById(R.id.left_btn);
        this.rightBtn = findViewById(R.id.right_btn);
        this.jumpBtn = findViewById(R.id.jump_btn);
        this.directionalBtn = findViewById(R.id.directional_btn);
        this.location = 20.00;
        resetWebView();
        if(enableSensor){
            tester = findViewById(R.id.tester);
            this.deadReckoning = new DeadReckoningImpl();
            this.accSensorLiveData = new AccSensorDataLiveData(this);
            this.accStreamLiveData = Transformations.map(accSensorLiveData, new Function<float[], AccelerometerSensorDataModel>() {
                @Override
                public AccelerometerSensorDataModel apply(float[] input) {
                    float[] filteredReadings = deadReckoning.filterAccelerometerReadings(input);
                    deadReckoning.peakEstimation(filteredReadings[2]);
                    return null;
                }
            });

            this.gySensorDataLiveData = new GySensorDataLiveData(this);
            this.deadReckoningGyro = new DeadReckoningImpl(true);
            this.gyStreamLiveData = Transformations.map(gySensorDataLiveData, new Function<float[], GyroscopeSensorDataModel>() {
                @Override
                public GyroscopeSensorDataModel apply(float[] input) {
                    float[] filteredReadings = deadReckoningGyro.filterAccelerometerReadings(input);
//                    float[] filteredReadings = input;
                    float peak = deadReckoningGyro.peakEstimation(filteredReadings[0]);
                    return null;
                }
            });

            viewModel = new MyViewModel(this, accStreamLiveData,gyStreamLiveData);
            deadReckoning.subscribeForMovementChanges(this);
            deadReckoningGyro.subscribeForMovementChanges(this);
            directionalBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    direction *= -1;
                    if(direction == -1){
                        directionalBtn.setText("<-");
                    }else{
                        directionalBtn.setText("->");
                    }
                }
            });
            tester.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    if(!firstSent){
                        attemptSend("trial",false);
                        firstSent = true;
                    }
                    MainActivity.this.getMovement(Movement.STEP);

                }
            });
            setUpObservers();
            desktopVersionSwitch.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    isWebViewActive = true;
                    mainWebView.reload();
                    mainWebView.setVisibility(View.VISIBLE);
                    directionalBtn.setVisibility(View.VISIBLE);
                    setButtonsVisiblity(View.INVISIBLE);
                }
            });
            rightBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    if(!firstSent){
                        Toast.makeText(MainActivity.this,"Not yet started", Toast.LENGTH_LONG).show();
                        return;
                    }
                    if(requestSent){
                        Toast.makeText(MainActivity.this,"Slow Down", Toast.LENGTH_LONG).show();
                        return;
                    }
                    if(q == null){
                        return;
                    }
                    mainWebView.loadUrl("javascript:document.getElementById('single_right_btn').click()");
                    MainActivity.this.location += 1;int ival = getIval();
                    if(MainActivity.this.location > 100)
                        MainActivity.this.location = 100;
                    String qstring = Arrays.toString(q.get(ival).toArray());
                    Log.d("qstring",qstring);
                    String msg = "{'length': 100, 'elasticity': 29000.0, 'inertia': 2000.0, 'density': 0.283, 'area': 1.0, 'dampingRatio': 0.02, 'rA': 85000.0, 'EI': 58000000.0, 'mass': 10.0, 'gravity': 9.81, 'force': 98.1, 'locationOfLoad': "+MainActivity.this.location+", 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': "+1+", 'timelimit' : 10, 'q' : '"+ qstring +"', 'mt': "+ival+"}";
                    attemptSend(msg,true);
                }
            });
            leftBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    if(!firstSent){
                        Toast.makeText(MainActivity.this,"Not yet started", Toast.LENGTH_LONG).show();
                        return;
                    }
                    if(requestSent){
                        Toast.makeText(MainActivity.this,"Slow Down", Toast.LENGTH_LONG).show();
                        return;
                    }
                    MainActivity.this.location -= 1;int ival = getIval();
                    if(MainActivity.this.location < 0)
                        MainActivity.this.location = 0;
                    String qstring = Arrays.toString(q.get(ival).toArray());
                    Log.d("qstring",qstring);
                    String msg = "{'length': 100, 'elasticity': 29000.0, 'inertia': 2000.0, 'density': 0.283, 'area': 1.0, 'dampingRatio': 0.02, 'rA': 85000.0, 'EI': 58000000.0, 'mass': 10.0, 'gravity': 9.81, 'force': 98.1, 'locationOfLoad': "+MainActivity.this.location+", 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': "+1+", 'timelimit' : 10, 'q' : '"+ qstring +"', 'mt': "+ival+"}";
                    attemptSend(msg,true);
                 }
            });
            jumpBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    if(!firstSent){
                        Toast.makeText(MainActivity.this,"Not yet started", Toast.LENGTH_LONG).show();
                        return;
                    }
                    if(requestSent){
                        Toast.makeText(MainActivity.this,"Slow Down", Toast.LENGTH_LONG).show();
                        return;
                    }
                    int ival = getIval();
                    String qstring = Arrays.toString(q.get(ival).toArray());
                    Log.d("qstring",qstring);
                    String msg = "{'length': 100, 'elasticity':29000.0, 'inertia': 2000.0, 'density': 0.283, 'area': 1.0, 'dampingRatio': 0.02, 'rA': 85000.0, 'EI': 58000000.0, 'mass': 10.0, 'gravity': 9.81, 'force': 98.1, 'locationOfLoad': "+MainActivity.this.location+", 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': "+ 5 +", 'timelimit' : 10, 'q' : '"+ qstring +"', 'mt': "+ival+"}";
                    attemptSend(msg,true);
                }
            });
        }

    }
    private void resetWebView(){
        if(isWebViewActive){
            mainWebView.reload();
        }
        isWebViewActive = false;
        WebSettings webSettings = mainWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        mainWebView.loadUrl("https://sail-ncsu.herokuapp.com/");
        this.mainWebView.setVisibility(View.INVISIBLE);
        setButtonsVisiblity(View.VISIBLE);
    }
    private int getIval(){
        int ival = mi + 40;
        if(dataModel.getGraphData() == null || dataModel.getGraphData().getValue() == null){
            return 0;
        }
        if(dataModel.getGraphData().getValue().size() <= ival){
            while(ival >= dataModel.getGraphData().getValue().size()){
                ival -= 1;
            }
        }
        int force = 2;
        if(ival <= 0){
            ival = 2;
        }
        return ival;
    }
    private void initForSocketsAndGraph(boolean wantTo){
        if(!wantTo){
            return;
        }
        this.location = 20.0D;
        handler = new Handler();
        MySocketIo mySocketIo = new MySocketIo("https://sail-ncsu.herokuapp.com/");
        this.socket = mySocketIo.getSocket();
        this.socket.connect();
        graph = findViewById(R.id.graph);
        this.series = new LineGraphSeries<>();
        graph.addSeries(this.series);
        this.viewport = graph.getViewport();
        this.viewport.setYAxisBoundsManual(true);
        this.viewport.setMinX(-1.0);
        viewport.setMinY(-7000000.0);
        viewport.setMaxX(9.0);
        viewport.setMaxY(7000000.0);
        viewport.setScalable(true);
        pointModel = new ViewModelProvider(this, new ViewModelProvider.Factory() {
            @NonNull
            @Override
            public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
                 try{
                     return modelClass.newInstance();
                 }catch (Exception e){
                     return null;
                 }
            }
        }).get(DataPointModel.class);
        isStarted = false;
        dataModel = new ViewModelProvider(this, new ViewModelProvider.Factory() {
            @NonNull
            @Override
            public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
                try{
                    return modelClass.newInstance();
                }catch (Exception e){
                    return null;
                }
            }
        }).get(DataModel.class);

        Observer<List<List<Double>>> dataObserver = new Observer<List<List<Double>>>() {
            @Override
            public void onChanged(List<List<Double>> lists) {
                if(!isStarted){
                    isStarted = true;
                }else{
//                    Toast.makeText(MainActivity.this, "ran on observer thread running", Toast.LENGTH_SHORT).show();
                }
                pointModel.getGraphDataPoints().setValue(lists.get(0));
                mi = 0;
//                Toast.makeText(MainActivity.this, "The observer got new data", Toast.LENGTH_SHORT).show();
            }
        };
        Observer<List<Double>> dataPointObserver = new Observer<List<Double>>() {
            @Override
            public void onChanged(List<Double> doubles) {
                int i = 0;
                if(doubles != null){
                    LineGraphSeries<DataPoint> tempSeries = new LineGraphSeries<>();
                    while(i < doubles.size()){
                        DataForGraph.addTheData(tempSeries,(double)i,doubles.get(i));
//                        Log.d("dataPoint","" + i + doubles.get(i));
                        i += 1;
                    }
                    LineGraphSeries<DataPoint> player = new LineGraphSeries<>();
                    double pos = (9D/100D) * location;
                    int px = (int)((9D/100D) * location );
                    double x1 = px;
                    double y1 = doubles.get(px);
                    double x2 = px + 1;
                    double y2 = doubles.get(px + 1);
                    double m = (y2-y1)/(x2-x1);
                    double c = y1 - (m*x1);
                    double py = (m*pos) + c;
                    DataForGraph.addTheData(player,pos,py);
                    DataForGraph.addTheData(player,pos,py + 4000000D);

                    graph.removeAllSeries();
                    graph.addSeries(tempSeries);
                    graph.addSeries(player);
                }
            }
        };
        dataModel.getGraphData().observe(this,dataObserver);
        pointModel.getGraphDataPoints().observe(this,dataPointObserver);
        socket.on("message", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                requestSent = false;
                if(args[0] != null){
                    try{
                        Log.d("arg",args[0].toString());
                        List<List<Double>> dataList = DataForGraph.getDataAsList(args[0].toString());

                        List<List<Double>> qDataList = DataForGraph.getQdataAsList(args[0].toString());
                        Log.d("qTest1", "ran"+ qDataList.get(5).toString());
                        Log.d("qTest2", "ran"+dataList.get(5).toString());
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                Log.d("qtest3",args[0].toString());
                                requestSent = false;
                                q = qDataList;
                                data  = dataList;
                                Log.d("qTest","ran"+ qDataList.get(5).toString());
                                dataModel.getGraphData().setValue(dataList);
//                                Toast.makeText(MainActivity.this, "got new data", Toast.LENGTH_SHORT).show();
                            }
                        });
                    }catch (JSONException e){
                        Log.d("errj","error occured");
                        e.printStackTrace();
                    }
                }else{
                    Log.d("errorInRespons","error in response");
                }
            }
        });
        tester = findViewById(R.id.tester);
        tester.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                attemptSend("trial",false);
            }
        });
    }
    private void setButtonsVisiblity(int visiblity){
        leftBtn.setVisibility(visiblity);
        rightBtn.setVisibility(visiblity);
        jumpBtn.setVisibility(visiblity);
        tester.setVisibility(visiblity);
        desktopVersionSwitch.setVisibility(visiblity);
    }
    public double getLocation(){
        return this.location;
    }
    public int getMi(){
        return this.mi;
    }

    public List<List<Double>> getQ(){
        return this.q;
    }
    public void setLocation(double location){
        this.location = location;
    }
    public void attemptSend(String msg, boolean conMessage){
        if(socket.connected()){
//            Toast.makeText(this,"socket connected",Toast.LENGTH_LONG).show();
        }

        String tMsg= "{'length': 100, 29000.0, 'inertia': 2000.0, 'density': 0.283, 'area': 1.0, 'dampingRatio': 0.02, 'rA': 85000.0, 'EI': 58000000.0, 'mass': 10.0, 'gravity': 9.81, 'force': 98.1, 'locationOfLoad': 20, 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 2, 'timelimit' : 100, 'q': 0, 'mt': 0}";
        if(conMessage){
            tMsg=msg;
        }
        Log.d("sendingMessage", tMsg);
        requestSent = true;
        this.socket.emit("message",tMsg);
    }

    @Override
    protected void onResume() {
        runnable = new Runnable() {
            @Override
            public void run() {
                handler.postDelayed(runnable,(long) delay);
                boolean con = pointModel != null && dataModel != null && pointModel.getGraphDataPoints() != null && dataModel.getGraphData() != null && dataModel.getGraphData().getValue() != null && pointModel.getGraphDataPoints().getValue() != null;
                if(con){
                    if(mi >= dataModel.getGraphData().getValue().size() - 30 && !requestSent){
//                        attemptSend("actual request will come here - place holder",false);
                        int ival = getIval();
                        String qstring = Arrays.toString(q.get(ival).toArray());
//                        Log.d("qstring",qstring);
                        String msg = "{'length': 100, 'elasticity': 29000.0, 'inertia': 2000.0, 'density': 0.283, 'area': 1.0, 'dampingRatio': 0.02, 'rA': 85000.0, 'EI': 58000000.0, 'mass': 10.0, 'gravity': 9.81, 'force': 98.1, 'locationOfLoad': "+MainActivity.this.location+", 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': "+1+", 'timelimit' : 100, 'q' : '"+ qstring +"', 'mt': "+ival+"}";
                        attemptSend(msg,true);
//                        attemptSend("{'length': 100, 'elasticity': 29000.0, 'inertia': 2000.0, 'density': 0.283, 'area': 1.0, 'dampingRatio': 0.02, 'rA': 85000.0, 'EI': 58000000.0, 'mass': 10.0, 'gravity': 9.81, 'force': 98.1, 'locationOfLoad': 20, 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 2, 'timelimit' : 100, 'q': "+ q.get(mi).toString()+", 'mt': 0}",true);
                    }
                    if(mi >= dataModel.getGraphData().getValue().size()-1){
                        return;
                    }
                    pointModel.getGraphDataPoints().setValue(Objects.requireNonNull(dataModel.getGraphData().getValue()).get(mi));
                    mi+=1;
                }
            }
        };
        handler.postDelayed(runnable,(long)delay);
        super.onResume();
        new Thread(new Runnable() {
            @Override
            public void run() {
                MainActivity v = MainActivity.this;
            }
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        this.handler.removeCallbacks(runnable);
    }

    @Override
    public void onBackPressed() {
        if(isWebViewActive){
            resetWebView();
        }else{
            super.onBackPressed();
        }
    }

    @Override
    public void getMovement(Movement movement) {
        MainActivity.movement.setValue(movement.name());
    }
    public void setUpObservers(){
        viewModel.getMovement().observe(this, new Observer<String>() {
            @Override
            public void onChanged(String s) {
//                Toast.makeText(MainActivity.this, "movement changed", Toast.LENGTH_SHORT).show();
            }
        });
        viewModel.getAccStreamLiveData().observe(this, new Observer<AccelerometerSensorDataModel>() {
            @Override
            public void onChanged(AccelerometerSensorDataModel accelerometerSensorDataModel) {
            }
        });
        System.out.println(viewModel.getGyroStreamLiveData());
        Log.d("testob",""+viewModel.getGyroStreamLiveData());
        viewModel.getGyroStreamLiveData().observe(this, new Observer<GyroscopeSensorDataModel>() {
            @Override
            public void onChanged(GyroscopeSensorDataModel gyroscopeSensorDataModel) {
            }
        });
    }

}