from app.MyFuncs import *
import ast
def testargs():
    # return {'length': 100.0, 'elasticity': 1.0, 'inertia': 1.0, 'density': 1.0, 'area': 1.0, 'dampingRatio': 0.02, 'rA': 85000.0, 'EI': 210000000000.0, 'mass': 10.0, 'gravity': 9.81, 'force': 98.1, 'locationOfLoad': 27.0, 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 1.0,'timelimit':10}
    return "{'length': 100.0, 'elasticity': 1.0, 'inertia': 1.0, 'density': 1.0, 'area': 1.0, 'dampingRatio': 0.02, 'rA': 85000.0, 'EI': 210000000000.0, 'mass': 10.0, 'gravity': 9.81, 'force': '[1,2,3]', 'locationOfLoad': '[27.0,8,10]', 'nDOF': 5, 'pointsToAnimate': 10, 'timeLength': 10, 'magnitude': 1.0,'timelimit':10}"

def processInputs(args):
    print(args)
    args = ast.literal_eval(args)
    print(args)
    return args

def startProcessing(args):
    length = args["length"]
    elasticity = args["elasticity"]
    inertia = args["inertia"]
    density = args["density"]
    area = args["area"]
    dampingRatio = args["dampingRatio"]
    rA = args["rA"] #density * area
    # EI = 2.1 * 10.0.pow(11) // elasticity * inertia
    EI = args["EI"]
    mass = args["mass"]
    gravity = args["gravity"]
    force = args["force"]
    locationOfLoad = args["locationOfLoad"]
    nDOF = args["nDOF"]
    pointsToAnimate = args["pointsToAnimate"]
    timeLength = args["timeLength"]
    magnitude = args["magnitude"]
    # result dict
    res = {}
    phi = createPhiMatrix(nDOF,length)

    res["phi"] = phi
    dphi,ddphi = createDiffPhi(phi,nDOF,length)
    res["dphi"] = dphi
    res["ddphi"] = ddphi
    K = createMatrixK(phi,dphi, ddphi, EI,nDOF,length)
    res["K"] = K

    M = createMatrixM(phi,rA,nDOF,length)
    res["M"] = M

    G = createMatrixG(phi,rA,magnitude,locationOfLoad,nDOF,length,True)
    res["G"] = G
    modeShapes, naturalFreq = calculateModeShapesAndNaturalFrequencies(K,M,nDOF)
    res["modeShapes"] = modeShapes
    res["naturalFreq"] = naturalFreq
    modalMatrices = calculateModalMatrices(dampingRatio,M,K,G,modeShapes,naturalFreq,nDOF)
    res["Mr"] = modalMatrices["Mr"]
    res["Kr"] = modalMatrices["Kr"]
    res["Gr"] = modalMatrices["Gr"]
    res["Cr"] = modalMatrices["Cr"]
    C = calculateDampingMatrix(modeShapes,modalMatrices["Cr"])
    res["C"] = C
    stateSpaceMatrices = makeStateSpaceMatrices(K,M,G,C,nDOF,length)
    res["As"] = stateSpaceMatrices["As"]
    res["Bs"] = stateSpaceMatrices["Bs"]
    res["Cs"] = stateSpaceMatrices["Cs"]
    res["Ds"] = stateSpaceMatrices["Ds"]
    res["ss"] = stateSpaceMatrices
    res["force"] = force
    res['timelimit'] = args['timelimit']
    res['q'] = args['q']
    return res



if __name__ == '__main__':
    print(testargs())
    # processInputs("{'a' : 100}")
    # print(ast.literal_eval("'q' : 'str(['5'])'"))