idf_component_register(
    SRCS ds18x20.c ds18b20_sensor.c
    INCLUDE_DIRS .
    REQUIRES onewire freertos log esp_idf_lib_helpers
)
