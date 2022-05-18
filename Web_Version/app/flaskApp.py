from flask import jsonify
from flask import Flask
from app.newInputProcessor import *
from app.main import *
from flask_cors import CORS , cross_origin
app = Flask(__name__, static_folder='../build/',    static_url_path='')
CORS(app)

@app.route('/')
def hello_world():
    return app.send_static_file('index.html')

@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('index.html')

@app.route('/test/latency/<arg>', methods=['GET', 'POST'])
def testSomeFunc(arg):
    print(arg)
    return {"res":myMainfunc()[1].tolist()}

@app.route('/test/modalFreq/<arg>', methods=['GET', 'POST'])
def testModalFreq(arg):
    return str(calculateModalMatrices())

@app.route('/test/statespace/<arg>', methods=['GET', 'POST'])
def testStateSpace(arg):
    return str(makeStateSpaceMatrices())

@app.route('/test/qmat/<arg>', methods=['GET', 'POST'])
def testQValues(arg):
    return str(myMainfunc()[0])

@app.route('/test/dispvals/<arg>', methods=['GET', 'POST'])
@cross_origin()
def testDispVals(arg):
    args = processInputs(arg)
    res = startProcessing(args)
    q, fdisp,y = myMainfunc(res)
    qAndQdot = y[:,:10]
    response = jsonify({'message' : fdisp.tolist() , 'q' : qAndQdot.tolist()})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response
