#include <iostream>

using namespace std;

/**
 * Computes 1/sqrt(x) using the magical constant 0x5F3759DF
 *
 * This numerical method extimates a good approximation using just a single divion operations.
 * Details: https://en.wikipedia.org/wiki/Fast_inverse_square_root
 *
 * @param x Float
 * @return 1/sqrt(x)
 */
float reverse_sqrt(float x){
    const float threehalfs = 1.5f;

    float x2 = x * 0.5f;
    float y = x;

    long i = *(long*) & y;
    i = 0x5f3759df - ( i >> 1 ); 

    y = *(float*) &i;
    y = y * (threehalfs - (x2 * y * y) );

    return y;

}

int main(void){

    float x = 12;
    float y = reverse_sqrt(x);

    printf("Reversed sqrt of %f is %f\n", x, y);

    return 0;
}