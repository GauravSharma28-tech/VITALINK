#include <stdint.h>

void max30102Sensor_init();
void max30102Sensor_shutdown(void);
void readRaw(uint16_t sensorDataRED[],uint16_t sensorDataIR[]);