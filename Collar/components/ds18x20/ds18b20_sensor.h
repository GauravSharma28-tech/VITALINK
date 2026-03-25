#include "driver/gpio.h"

/**
 * Initiallize 
 * @param pin GPIO PIN Number of DS18B20
 */
void ds18b20_init_sensor();

/**
 * Read the temperature (wait for 800 ms)
 */
void getTemperature(float *);