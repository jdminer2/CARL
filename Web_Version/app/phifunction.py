import math
import numpy as np
class SimplySupportedBeamPhiFunction :
    def __init__(self,coeff ,L, I, isSin, sign):
        self.pi = math.pi
        self.constant = (self.pi* (I/L))
        self.coeff = coeff
        self.isSin = isSin
        self.sign = sign

        pass

    def getNextCoeff(self):
        return self.constant * self.coeff
        pass
    def value(self,x):
        if(type(x) is np.ndarray):
            return self.ndvalue(x)
        sinCosCoeff = x * self.constant
        res = None
        if self.isSin :
            res = math.sin(sinCosCoeff) * self.coeff * self.sign
        else:
            res = math.cos(sinCosCoeff)* self.coeff* self.sign
        return res
    def ndvalue(self,x):
        sinCosCoeff = x * self.constant
        res = None
        if self.isSin:
            sinCosCoeff = np.sin(sinCosCoeff)
            res = sinCosCoeff * self.coeff * self.sign
        else:
            sinCosCoeff = np.cos(sinCosCoeff)
            res = sinCosCoeff * self.coeff * self.sign
        return res
        pass