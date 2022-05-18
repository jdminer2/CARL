from app.phifunction import *
from scipy import integrate
import numpy as np
import scipy.linalg as LA
from sympy import *
def createPhiMatrix(nDOF = 5, length = 100):
    phi = []
    idx = 1
    while idx <= nDOF:
        phi.append(SimplySupportedBeamPhiFunction(1.0, length, idx, True, 1))
        idx += 1
    return phi

def dummyFunction():
    x = symbol