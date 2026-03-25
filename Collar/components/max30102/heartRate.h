#include <stdbool.h>
#include <stdint.h>

bool checkForBeat(int32_t sample);
int16_t averageDCEstimator(int32_t *p, uint16_t x);
int16_t lowPassFIRFilter(int16_t din);
int32_t mul16(int16_t x, int16_t y);