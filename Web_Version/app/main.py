import numpy as np
from scipy import signal
import app.flaskApp
from app.MyFuncs import *
from app.statespacematrices import *
import matplotlib.pyplot as plt
from app.newInputProcessor import *


def myMainfunc(ss = makeStateSpaceMatrices(),force = [98.1,98.2,98.3], timelimit = 10,args = None):
    sys = signal.StateSpace(ss["As"],ss["Bs"],ss["Cs"],ss["Ds"])
    if 'force' in ss:
        force = ss['force']
    else:
        force = [98.1,98.2,98.3]
    if 'timelimit' in ss:
        timelimit = ss['timelimit']
    else:
        timelimit = 10
    tstep = np.arange(0, timelimit, 1e-2)
    U = np.zeros((tstep.shape[0])) # here there might be a change
    print("tstep shap&&&&&&&&&&&&&&&&&&&&&&&&")
    print(tstep.shape[0])
#     U = U + force if type(force) == type(98.1) else makeU(tstep.shape[0],force)
    force = [force] if type(force) != type([1,2,3]) else force
    U = np.array([ [j for j in force] for i in range(tstep.shape[0])])
    #new code
    print("new code")
    print(tstep)

    print("end new code")
    #end new code
    if('q' in ss and ss['q'] != 0):
        # x0 = np.array(ast.literal_eval(ss['q'])[ss['mt']][0:10])
        x0 = np.array(ast.literal_eval(ss['q']))
    else:
        x0 = None
    _, y, s = signal.lsim(sys, U, tstep , x0)


    # put q , qdot of prev step

    t = tstep
    q = y[:,:5]
    finalDisplacements = calculateDisplacement(q, createPhiMatrix())
    finalDisplacements = np.array(finalDisplacements)
    return q,finalDisplacements,y
    pass
def makeU(s = 1000, force = [98.1]):
    if type(force) == type(1):
        force = [float(force)]
    U = force * ((s//len(force)) + 1)
    U = U[:s]
    U = np.array(U)
    return U


def calculateDisplacement(q : np.array , phi,pointsToAnimate : int = 10, nDOF = 5):
    xPlotPoints = linspace()
    xphi = np.zeros([5,10])
    for i in range(nDOF):
        row = np.zeros([1,10])
        for j in range(pointsToAnimate):
            row[0,j] = phi[i].value(xPlotPoints[j]) if j < pointsToAnimate-1 else 0.0
        xphi[i] = row
    disp = np.matmul(q,xphi)
    return disp

def animateDisplacement(finalDisplacement,xplot,t):
    x = np.array(xplot)
    y = np.array(finalDisplacement[0])

    plt.ion()
    fig = plt.figure()
    ax = fig.add_subplot(111)
    line1, = ax.plot(x, y, 'b-')

    for phase in range(len(t.tolist())):
        line1.set_ydata(np.array(finalDisplacement[phase]))
        fig.canvas.draw()
        fig.canvas.flush_events()

if __name__ == '__main__':
    # app.flaskApp.app.run()
    myMainfunc()
    # arg = str(testargs())
    # args = processInputs(arg)
    # res = startProcessing(args)
    # q, fdisp = myMainfunc(res)
    # print( 'hello' + str(fdisp.tolist()))