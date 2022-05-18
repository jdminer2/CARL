from app.phifunction import *
from scipy import integrate
import numpy as np
import scipy.linalg as LA
def createPhiMatrix(nDOF = 5, length = 100):
    phi = []
    idx = 1
    while idx <= nDOF:
        phi.append(SimplySupportedBeamPhiFunction(1.0, length, idx, True, 1))
        idx += 1
    return phi

def diffPhi( input: [SimplySupportedBeamPhiFunction], output:[SimplySupportedBeamPhiFunction], isSin: bool, sign: int, nDOF=5, length= 100):
    idx = 0
    while(idx < nDOF):
        output.append(
            SimplySupportedBeamPhiFunction(
                input[idx].getNextCoeff(),
                length,
                idx + 1,
                isSin,
                sign
            )
        )
        idx += 1
def createDiffPhi(phi,nDOF=5, length= 100):
    dPhi = []
    ddPhi = []
    diffPhi(phi, dPhi, False,1,nDOF, length)
    diffPhi(dPhi, ddPhi, True, -1, nDOF, length)

    return dPhi,ddPhi


def createMatrixK(phi = None,dphi = None,ddphi = None, EI = 2.1 * ((10.0)**(11)) ,nDOF = 5, length = 100.0):

    if phi == None:
        phi = createPhiMatrix()
    if dphi == None and ddphi == None:
        dphi , ddphi = createDiffPhi(phi)\

    matrix = np.array([[0.0]*nDOF]*nDOF)
    for i in range(nDOF):
        f = lambda p0: 1.0 * EI * ddphi[i].value(p0) * ddphi[i].value(p0)
        value = integrate.quadrature(f,0.0,length)
        matrix[i,i] = value[0]
    return matrix

def createMatrixM(phi = None, rA = 85000.0 ,nDOF = 5, length = 100.0):
    if phi == None:
        phi = createPhiMatrix()
    matrix = np.array([[0.0]*nDOF]*nDOF)
    for i in range(nDOF):
        f = lambda p0:1.0 * rA * phi[i].value(p0) * phi[i].value(p0)
        value = integrate.quadrature(f,0.0,length)
        matrix[i,i] = value[0]
    return matrix
def createMultiLoadMatrixG(phi = None, rA = 85000.0, magnitude = 1,locationOfLoad = [27,30,50],nDOF = 5, length = 100.0):
    if phi == None:
        phi = createPhiMatrix()
    matrix = np.array([[0.0]]*nDOF)
    if type(locationOfLoad) == type(1) or type(locationOfLoad) == type(2.01):
        locationOfLoad = [int(locationOfLoad)]
    locMatrix = np.array(locationOfLoad)
    res = {}
    for i in range(nDOF):
        value = magnitude * rA * phi[i].value(locMatrix)
        l = list(value)
        res[i] = l
#         for i in range(len(l)):
#             if not (i in res):
#                 res[i] = []
#             res[i].append(l[i])
    res = [res[i] for i in res]
    matrix = np.array(res)
    print(np.shape(matrix))
    return matrix

def createMatrixG(phi = None, rA = 85000.0, magnitude = 1,locationOfLoad = [27,3,5],nDOF = 5, length = 100.0,multiFlag = True):
    if multiFlag:
        return createMultiLoadMatrixG(phi,rA,magnitude,locationOfLoad,nDOF,length)
    if phi == None:
        phi = createPhiMatrix()
    matrix = np.array([[0.0]]*nDOF)
    for i in range(nDOF):
        value = magnitude * rA * phi[i].value(locationOfLoad)
        matrix[i,0] = value
    return matrix

def linspace(min = 0 , max = 100, points = 10):
    d = []
    for i in range(points):
        d += [min + i * (max - min) / (points - 1)]
    return d

def calculateModeShapesAndNaturalFrequencies(K = createMatrixK(),M = createMatrixM(), nDOF = 5):
    primitiveMatrixK = K
    primitiveMatrixM = M

    D,V = LA.eigh(primitiveMatrixK,primitiveMatrixM)
    modeShapes = V
    naturalFreq = np.array([[0.0] * nDOF] * nDOF)
    D = D.tolist()
    for i in range(len(D)):
        naturalFreq[i,i] = D[i]
    return modeShapes,naturalFreq

def calculateModalMatrices(dampingRatio = 0.02 ,M = createMatrixM(), K = createMatrixK(), G = createMatrixG(), modeShapes = calculateModeShapesAndNaturalFrequencies()[0], naturalFreq = calculateModeShapesAndNaturalFrequencies()[1],nDOF = 5 ):
    Mr = np.matmul(modeShapes.transpose(),np.matmul(M,modeShapes))
    Kr = np.matmul(modeShapes.transpose(),np.matmul(K,modeShapes))
    Gr = np.matmul(modeShapes.transpose(),G)
    placeHolderCr = np.array([[0.0]*nDOF]*nDOF)
    for i in range(nDOF):
        placeHolderCr[i,i] = 2.0 * dampingRatio * ((Mr[i,i] * Kr[i,i])**0.5)
    Cr = placeHolderCr
    return {"Mr":Mr, "Kr":Kr, "Gr":Gr, "Cr":Cr}

def calculateDampingMatrix(modeShapes = calculateModeShapesAndNaturalFrequencies()[0],Cr = calculateModalMatrices()["Cr"]):
    msInv = LA.inv(modeShapes)
    C = np.matmul(msInv,np.matmul(Cr,msInv))
    return C
def makeStateSpaceMatrices(K = createMatrixK(), M = createMatrixM(), G = createMatrixG(), C = calculateDampingMatrix(),nDOF = 5,length = 100):
#     As = np.concatenate((np.concatenate((np.zeros([nDOF,nDOF]),np.eye(nDOF)),axis=1), np.concatenate((np.matmul(LA.inv(M)*-1,K), np.matmul(LA.inv(M)*-1,C)),axis=1)),axis=0)
#     Bs = np.concatenate((np.zeros([nDOF,1]),G*-1),axis=0)
#     Cs = np.concatenate((np.eye(2*nDOF,2*nDOF), np.concatenate((np.matmul(LA.inv(M)*-1,K), np.matmul(LA.inv(M)*-1,C)),axis=1)),axis=0)
#     Ds = np.concatenate((np.zeros([2*nDOF,1]),G*-1),axis=0)
    print(nDOF)
    print(G*-1)
    As = np.concatenate((np.concatenate((np.zeros([nDOF,nDOF]),np.eye(nDOF)),axis=1), np.concatenate((np.matmul(LA.inv(M)*-1,K), np.matmul(LA.inv(M)*-1,C)),axis=1)),axis=0)
    Bs = np.concatenate((np.zeros([nDOF,np.shape(G)[1]]),G*-1),axis=0)
    Cs = np.concatenate((np.eye(2*nDOF,2*nDOF), np.concatenate((np.matmul(LA.inv(M)*-1,K), np.matmul(LA.inv(M)*-1,C)),axis=1)),axis=0)
    Ds = np.concatenate((np.zeros([2*nDOF,np.shape(G)[1]]),G*-1),axis=0)
    print(np.shape(Ds))
    return {"As":As,"Bs":Bs, "Cs":Cs, "Ds":Ds}
    pass



if __name__ == '__main__':
    createMatrixK()
    createMatrixM()
    createMatrixG()
    calculateModeShapesAndNaturalFrequencies()
    print(calculateModalMatrices())
    calculateDampingMatrix()
    makeStateSpaceMatrices()
    t = np.arange(0, 10, 1e-3)
    print(t.tolist())
    print("(*(*(*(*(_()())()")
    print("g is ")
    print(type(createMatrixG()))
    print('mod g')
    print(createMultiLoadMatrixG())
#     print(newMakeMatrixG())