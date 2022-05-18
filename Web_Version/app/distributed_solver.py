import numpy as np
'''
R1 = 50
e   = 25
d  = 50
w  = 2
L   = 100
'''
def distributed_solver(R1 = 50, e   = 25, d  = 50, w  = 2, L   = 100):
    dummy = 1
    var1 = (((w*d)-R1)*((L-e-d)**2)/(-2)) + (w*(d**3))/6 - (R1*(e+d)**2)/2
    var2 = ((w*d)-R1)*((L-e-d)**3)/6 + (w*(d**4))/24 - R1*((e+d)**3)/6

    arr1 = [[0,0,0,1,1],[1,-1,0,0,0],[e,-e,-1,0,0],[0,-1,0,-1,0],[0,(e+d),1,-(e+d),-1]]
    arr2 = [[0],[0],[0],[var1],[var2]]

    arr1 = np.array(arr1)
    arr2 = np.array(arr2)

    arr1_inv = np.linalg.inv(arr1)
    result = np.matmul(arr1_inv,arr2)
    result = list(result)
#     print(result)
    c1,c2,c3,c4,c5 = result[0][0],result[1][0],result[2][0],result[3][0],result[4][0]
    return c1,c2,c3,c4,c5
    pass


if __name__ == "__main__":
    print(distributed_solver())
    print("hello")