#include "uart_max30102.h"
#include "lora.h"
#include "max30102_sensor.h"
#include "ds18b20_sensor.h"
#include "esp_sleep.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "string.h"
#include "cJSON.h"
#include <freertos/projdefs.h>
#include "heartRate.h"
#include "esp_timer.h"
#include <sys/time.h>
#include "tinygps.h"
#include "nvs_flash.h"
#include "nvs.h"

// GPS Configuration
#define GPS_UART_NUM UART_NUM_2
#define GPS_TXD_PIN GPIO_NUM_17
#define GPS_RXD_PIN GPIO_NUM_16
#define GPS_UART_BAUD_RATE 9600 // Standard GPS baud rate
#define BUF_SIZE (1024)

int settimeofday(const struct timeval *tv, const struct timezone *tz);
#define DEVICE_ID 30
// Data structure for sensor readings
typedef struct
{
    int heart_rate;
    float temperature;
    float lon;
    float lat;
} sensor_data_t;

sensor_data_t shared_data;
sensor_data_t copy;
SemaphoreHandle_t data_mutex;

uint8_t prev_ack_retry = -1;
uint8_t before_me = 0xFF;
uint8_t my_position;
bool before_me_saved = false;
bool sentOnce = false;
bool sync_status;

uint16_t alloc_time;
uint16_t time_interval;

// STATE machines
typedef enum
{
    RX_MODE,          // LoRa in RX_MODE
    READ_SENSOR_MODE, // Request sensor data
    TX_MODE,          // LoRa in TX_MODE
    SETUP_MODE,       // Setup next wakeup time before sleep
    SLEEP
} app_mode_t;

typedef enum
{
    EVENT_START,
    EVENT_GLOBAL_TIMEOUT,
    EVENT_SYNC_TIME,
    EVENT_DATA_REQ,
    EVENT_READ_SENSORS_SUCCESS,
    EVENT_TX_COMPLETE,
    EVENT_ACK,
    EVENT_ACK_TIMEOUT,
    EVENT_ALLOC_TIMEOUT
} app_event_t;

typedef struct
{
    uint32_t unix;
    uint8_t alloc_time;
} sync_time_config_t;

typedef struct
{
    TaskHandle_t heart_rate_handle;
    TaskHandle_t temp_handle;
    TaskHandle_t gps_handle;
    TaskHandle_t read_sensor_handle;
} tasks_handle_t;

static tasks_handle_t tasks_handle = {
    .heart_rate_handle = NULL,
    .temp_handle = NULL,
    .gps_handle = NULL,
    .read_sensor_handle = NULL};

// Functions
float readTemperature(void);
int readHeartRate(void);
void readGps(float *, float *);
void createJsonDoc(char **);
void print_uint16_array(const uint16_t *, size_t, const char *);
void read_heartrate_task(void *);
void lora_send_task(void *);
void read_temp_task(void *);
void lora_receive_task(void *);
void setupTime();
void configSyncTime(void *);
void lora_peek_device_id(uint16_t *);
void gps_task(void *);
bool lora_new_rety_req(void);
void get_my_slot(uint8_t *, int, uint8_t *, uint8_t *);
void load_before_me(uint8_t *, uint16_t *, uint16_t *, uint8_t *, bool *);

bool sync_status = false;

void configSyncTime(void *pvParam)
{
    uint8_t rx_buffer[256];
    uint8_t dummy_buffer[256];
    uint32_t unix;
    uint8_t retry_count;
    uint8_t max_retry_count;
    uint8_t prev_retry_count = -1;
    uint8_t *sync_status_mask;
    uint8_t mode;

    while (1)
    {
        // lora_peek_header(&mode, 1);
        // if (mode != 0xA0)
        // {
        //     vTaskDelay(pdMS_TO_TICKS(20));
        //     lora_receive(); // Listen to next packet
        //     continue;
        // }

        // Receive packet with timeout (non-blocking alternative available)
        int bytes_received = lora_receive_packet(rx_buffer, sizeof(rx_buffer)); // Leave space for null terminator

        if (bytes_received <= 0 || rx_buffer[0] != 0xA0)
        {
            vTaskDelay(pdMS_TO_TICKS(20)); // Yield to avoid WDT
            continue;                      // Retry
        }

        // ESP_LOGI("TIME_CONFIG", "Received buffer size: %d", bytes_received);
        ESP_LOG_BUFFER_HEXDUMP("RX", rx_buffer, bytes_received, ESP_LOG_INFO);
        // memcpy(&unix, rx_buffer, 4);
        unix = rx_buffer[1] | (rx_buffer[2] << 8) | (rx_buffer[3] << 16) | (rx_buffer[4] << 24);
        alloc_time = rx_buffer[9] | (rx_buffer[10] << 8);
        time_interval = rx_buffer[11] | (rx_buffer[12] << 8);
        max_retry_count = rx_buffer[13];
        retry_count = rx_buffer[14];
        sync_status_mask = &rx_buffer[15];
        int len_sync_status = bytes_received - 15; // Sync_status_mask starts at 12th byte

        if (prev_retry_count == retry_count)
        {
            // New data has not yet arrived
            // ESP_LOGI("TIME_CONFIG", "UNIX: %d ALLOC_TIME: %d RETRY: %d", (int)unix, (int)alloc_time, (int)retry_count);
            vTaskDelay(pdMS_TO_TICKS(5));
            continue;
        }

        uint8_t byteMask = DEVICE_ID / 8;
        uint8_t bitMask = DEVICE_ID % 8;

        sync_status = ((sync_status_mask[byteMask] & (1 << bitMask)) != 0);
        ESP_LOGI("SYNC", "sync_status_mask[1] = %x", sync_status_mask[byteMask]);
        ESP_LOGI("SYNC", "Device %d status: %s", DEVICE_ID, sync_status ? "SYNCED" : "UNSYNCED");

        // If device is not synced
        if (!sync_status)
        {
            ESP_LOGI("TIME CONFIG", "current time: %d, time interval, %d, allocated time: %d, Max_retries: %d", (int)unix, (int)time_interval, (int)alloc_time, (int)max_retry_count);

            if (unix > 0)
            {
                setupTime(unix);
                uint16_t ack = (0xAA << 8) | DEVICE_ID;
                vTaskDelay(pdMS_TO_TICKS(10 * DEVICE_ID)); // Send Ack After 1 sec
                lora_send_packet((uint8_t *)&ack, sizeof(ack));
                ESP_LOGI("TIME_CONFIG", "Ack sent");
            }
            prev_retry_count = retry_count;
            vTaskDelay(pdMS_TO_TICKS(20));
            lora_peek_header(&mode, 1);
        }
        else if (retry_count < max_retry_count - 2)
        {
            ESP_LOGI("TIME_CONFIG", "Already Acked");
        }
        else
        {
            ESP_LOGI("TIME_CONFIG", "Going to deep sleep");
            get_my_slot(sync_status_mask, len_sync_status, &before_me, &my_position);
            ESP_LOGI("TIME CONFIG", "Device Id: %d , my position: %d and before me: %d", DEVICE_ID, (int)my_position, (int)before_me);

            if (!before_me_saved)
            {
                nvs_handle_t sync_nvs;
                esp_err_t err = nvs_open("sync_info", NVS_READWRITE, &sync_nvs);
                if (err == ESP_OK)
                {
                    err |= nvs_set_u8(sync_nvs, "before_me", before_me);

                    err |= nvs_set_u16(sync_nvs, "alloc_time", alloc_time);

                    err |= nvs_set_u16(sync_nvs, "time_interval", time_interval);

                    err |= nvs_set_u8(sync_nvs, "my_position", my_position);

                    err |= nvs_set_u8(sync_nvs, "sync_status", sync_status ? 1 : 0);

                    if (err == ESP_OK)
                    {
                        nvs_commit(sync_nvs);
                        ESP_LOGI("NVS", "Saved before_me = %d, Allocated_time = %d, Time_Interval = %d, my_position = %d, sync_status = %d", before_me, alloc_time, time_interval, my_position, sync_status ? 1 : 0);
                    }
                    else
                    {
                        ESP_LOGE("NVS", "Failed to write some keys");
                    }
                    nvs_close(sync_nvs);
                }
            }

            if (my_position > 2)
            {
                esp_sleep_enable_timer_wakeup((alloc_time - 5) * (my_position - 2) * 1000000);
                esp_deep_sleep_start();
            }
        }
        lora_receive(); // Listen to next packet
    }
}

void read_sensors_task(void *pvParam)
{
    if (!sentOnce)
    {
        // Heart Rate
        if (tasks_handle.heart_rate_handle != NULL)
        {
            vTaskResume(tasks_handle.heart_rate_handle);
        }
        else
        {
            xTaskCreate(read_heartrate_task, "heart_rate", 4096, NULL, 24, &tasks_handle.heart_rate_handle);
        }

        // Temperature Sensor
        if (tasks_handle.temp_handle != NULL)
        {
            vTaskResume(tasks_handle.temp_handle);
        }
        else
        {
            xTaskCreate(read_temp_task, "temp", 2048, NULL, 24, &tasks_handle.temp_handle);
        }

        // GPS
        if (tasks_handle.gps_handle != NULL)
        {
            vTaskResume(tasks_handle.gps_handle);
        }
        else
        {
            xTaskCreate(gps_task, "gps_task", 4096, NULL, 23, &tasks_handle.gps_handle);
        }

        vTaskDelay(pdMS_TO_TICKS(5000)); // Let the sensor get the reading for 10 secs
    }

    while (1)
    {
        uint8_t rx_buffer[256];
        uint16_t device_Id;
        uint8_t *ack_status_mask;

        int bytes_received = lora_receive_packet(rx_buffer, sizeof(rx_buffer));
        device_Id = rx_buffer[1] | (rx_buffer[2] << 8);
        ack_status_mask = &rx_buffer[4];

        // ESP_LOGI("SENSOR_MODE", "Bytes rcvd: %d", bytes_received);
        ESP_LOG_BUFFER_HEXDUMP("SENSOR_MODE", rx_buffer, bytes_received, ESP_LOG_INFO);

        if (device_Id > 255 || device_Id < DEVICE_ID || bytes_received == 0)
        {
            lora_receive();
            vTaskDelay(pdMS_TO_TICKS(10)); // Small delay to prevent CPU hogging
            continue;                      // Out of range & still not requesting from current device
        }

        uint8_t byteMask = DEVICE_ID / 8;
        uint8_t bitMask = DEVICE_ID % 8;

        ESP_LOGI("SENSOR_MODE", "Current request Id: %d", (int)device_Id);
        ESP_LOGI("SENSOR_MODE", "Heart Rate: %d Temperature: %.2f", shared_data.heart_rate, shared_data.temperature);

        if (!sentOnce)
        {
            xTaskCreate(lora_send_task, "LoRa_Task", 4 * 1024, NULL, 24, NULL);
            sentOnce = true;

            xTaskNotifyGive(tasks_handle.temp_handle);
            xTaskNotifyGive(tasks_handle.heart_rate_handle);
            xTaskNotifyGive(tasks_handle.gps_handle);

            vTaskDelay(pdMS_TO_TICKS(20));
            tasks_handle.read_sensor_handle = NULL;
            vTaskDelete(NULL);
        }
        else
        {
            if (device_Id == DEVICE_ID)
            {
                if ((ack_status_mask[byteMask] & (1 << bitMask)) != 0)
                {
                    max30102Sensor_shutdown();
                    ESP_LOGI("SENSOR_MODE", "Device data is already Acked by RX Station");
                    ESP_LOGI("SENSOR_MODE", "Going to deep sleep");
                    ESP_LOGI("SENSOR_MODE1", "my_position = %d, Allocated_time = %d, Time_Interval = %d", my_position, alloc_time, time_interval);
                    uint64_t sleep_us = (time_interval - alloc_time * (my_position + 1)) * 1000000;
                    int sleeping = (time_interval - alloc_time * (my_position + 1));
                    ESP_LOGI("SENSOR_MODE", "Going to sleep for %d s", sleeping);

                    // Update NVS
                    nvs_handle_t sync_nvs;
                    esp_err_t err = nvs_open("sync_info", NVS_READWRITE, &sync_nvs);
                    if (err == ESP_OK)
                    {
                        err |= nvs_set_u8(sync_nvs, "sync_status", 0);

                        if (err == ESP_OK)
                        {
                            nvs_commit(sync_nvs);
                            ESP_LOGI("NVS", "Updated Sync status : false");
                        }
                        nvs_close(sync_nvs);
                    }

                    esp_sleep_enable_timer_wakeup(sleep_us);
                    vTaskDelay(pdMS_TO_TICKS(100)); // Wait 100ms
                    esp_deep_sleep_start();
                }
                else
                {
                    ESP_LOGI("SENSOR_MODE", "Device data is not Acked.");
                    xTaskCreate(lora_send_task, "LoRa_Task", 4 * 1024, NULL, 24, NULL);
                    tasks_handle.read_sensor_handle = NULL;
                    vTaskDelete(NULL);
                }
            }

            vTaskDelay(pdMS_TO_TICKS(20));
            tasks_handle.read_sensor_handle = NULL;
            vTaskDelete(NULL);
        }

        // xTaskNotifyGive(tasks_handle.temp_handle);
        // xTaskNotifyGive(tasks_handle.heart_rate_handle);
        // xTaskNotifyGive(tasks_handle.gps_handle);
    }
}

void setupTime(uint32_t time_stamp)
{

    time_t seconds = (time_t)time_stamp;
    long microseconds = 0;

    struct timeval tv = {
        tv.tv_sec = seconds,
        tv.tv_usec = microseconds};

    settimeofday(&tv, NULL);
    time_t now;
    time(&now);
    ESP_LOGI("TIME", "System time set to: %s", ctime(&now));
}

void gps_task(void *pvParameters)
{
    // Configure UART parameters
    uart_config_t uart_config = {
        .baud_rate = GPS_UART_BAUD_RATE,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_APB,
    };

    // Install UART driver
    ESP_ERROR_CHECK(uart_driver_install(GPS_UART_NUM, BUF_SIZE * 2, 0, 0, NULL, 0));
    ESP_ERROR_CHECK(uart_param_config(GPS_UART_NUM, &uart_config));
    ESP_ERROR_CHECK(uart_set_pin(GPS_UART_NUM, GPS_TXD_PIN, GPS_RXD_PIN, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));

    // Set a pattern to detect the end of a GPS sentence ('\n')
    uart_enable_pattern_det_baud_intr(GPS_UART_NUM, '\n', 1, 9, 0, 0);

    uint8_t *data = (uint8_t *)malloc(BUF_SIZE);
    int newdata = 0;
    ESP_LOGI("SENSOR_MODE", "Obtaining current location from GPS....");
    while (1)
    {
        // if (ulTaskNotifyTake(pdTRUE, portMAX_DELAY))
        // {
        //     uart_flush(GPS_UART_NUM);
        //     if (data)
        //         free(data);
        //     ESP_ERROR_CHECK(uart_driver_delete(GPS_UART_NUM));
        //     vTaskDelete(NULL);
        // }
        // Read data from UART
        int len = uart_read_bytes(GPS_UART_NUM, data, BUF_SIZE, 20 / portTICK_PERIOD_MS);
        if (len > 0)
        {
            for (int i = 0; i < len; i++) // for all chars in string
            {
                // printf("%c", buf[i]);
                if (gps_encode(data[i]))
                    newdata = 1;
            }

            if (newdata)
            {
                float flat, flon;
                unsigned long age;
                gps_f_get_position(&flat, &flon, &age);
                xSemaphoreTake(data_mutex, portMAX_DELAY);
                shared_data.lon = flon;
                shared_data.lat = flat;
                xSemaphoreGive(data_mutex);
                newdata = 0;
                disable_gps();
                ESP_LOGI("GPS_TASK","Disable GPS");
                uart_flush(GPS_UART_NUM);
                ESP_ERROR_CHECK(uart_driver_delete(GPS_UART_NUM));
                vTaskDelete(NULL);
            }
        }

        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}

// UBX command to enable power save mode
const uint8_t ubx_power_save[] = {
    0xB5, 0x62, 0x06, 0x11, 0x02, 0x00, 0x08, 0x01, 0x22, 0x91};

// UBX command to completely disable navigation
const uint8_t ubx_nav_off[] = {
    0xB5, 0x62, 0x06, 0x04, 0x24, 0x00, 0xFF, 0xFF, 0x06, 0x03,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x17, 0xC2};

void disable_gps()
{
    // Send power save command
    uart_write_bytes(GPS_UART_NUM, (const char *)ubx_power_save, sizeof(ubx_power_save));
    vTaskDelay(100 / portTICK_PERIOD_MS);

    // Optional: Also send navigation off command for more complete shutdown
    // uart_write_bytes(GPS_UART_NUM, (const char *)ubx_nav_off, sizeof(ubx_nav_off));
    // vTaskDelay(100 / portTICK_PERIOD_MS);

    // Flush the UART to ensure commands are sent
    uart_flush(GPS_UART_NUM);
}

void read_heartrate_task(void *pvParameters)
{
    max30102Sensor_init();

    ESP_LOGI("SENSOR_MODE", "Reading Heart Rate");
    // Config
    const uint8_t RATE_SIZE = 4;          // Moving average window
    const uint16_t SAMPLES_PER_READ = 15; // FIFO size
    uint8_t rates[RATE_SIZE];
    uint8_t rateSpot = 0;
    int64_t lastBeat = 0;
    int beatAvg = 0, last_beatAvg = 0;

    // Buffers
    uint16_t red[SAMPLES_PER_READ], ir[SAMPLES_PER_READ];
    int64_t sample_times[SAMPLES_PER_READ];

    while (1)
    {
        if (ulTaskNotifyTake(pdTRUE, pdMS_TO_TICKS(100)))
        {
            // ESP_LOGI("SENSOR_MODE", "Suspend Heart Rate Sensor");
            vTaskSuspend(NULL);
        }
        // 1. Read FIFO (15 samples @ 400Hz = 37.5ms of data)
        readRaw(red, ir);
        int64_t batch_start = esp_timer_get_time(); // us (micro)

        // 2. Process each sample with timestamp
        for (size_t i = 0; i < SAMPLES_PER_READ; i++)
        {
            sample_times[i] = batch_start + (i * 2500); // 2.5ms spacing (100Hz)

            if (checkForBeat(ir[i]))
            {
                int64_t delta = (sample_times[i] - lastBeat) / 1000; // ms
                lastBeat = sample_times[i];

                if (delta > 0)
                {                                // Prevent division by zero
                    float bpm = 60000.0 / delta; // Correct BPM calculation
                    if (bpm > 20 && bpm < 255)
                    {
                        rates[rateSpot++] = (uint8_t)bpm;
                        rateSpot %= RATE_SIZE;

                        // Update average
                        beatAvg = 0;
                        for (uint8_t x = 0; x < RATE_SIZE; x++)
                            beatAvg += rates[x];
                        beatAvg /= RATE_SIZE;
                    }
                }
            }

            if (ir[i] < 500)
            {
                beatAvg = 0;
            }
        }

        // 3. Thread-safe data update (only if changed)
        if (beatAvg != last_beatAvg)
        {
            xSemaphoreTake(data_mutex, pdMS_TO_TICKS(10));
            shared_data.heart_rate = beatAvg;
            xSemaphoreGive(data_mutex);
            ESP_LOGI("HEART_RATE", "Heart Rate %d", beatAvg);
            last_beatAvg = beatAvg;
        }
        // printf("Heart Rate: %d Temp: %.2f\n", shared_data.heart_rate, shared_data.temperature);

        // 4. Delay until next batch (adjust for your actual FIFO refill rate)
        vTaskDelay(37.5 / portTICK_PERIOD_MS); // ~100Hz effective
    }
}

void lora_receive_task(void *pvParameters)
{
    ESP_LOGI("RX_MODE", "Lora Ready to Receive messages...");
    lora_receive();

    while (1)
    {
        uint8_t mode;
        uint16_t deviceId;

        if (lora_peek_header(&mode, 1))
        {
            // ESP_LOGI("RX", "Header: 0x%X", mode);
            lora_peek_device_id(&deviceId);
            // ESP_LOGI("LORA PEEK ID", "0x%02X", (int)deviceId);
            switch (mode)
            {
            case 0xA0: // Time configuration
                xTaskCreate(configSyncTime, "config_time_setup", 4096, NULL, 24, NULL);
                ESP_LOGI("RX_MODE", "Deleting lora receive task!");
                vTaskDelete(NULL);
                break;

            case 0xB0: // Read sensor task
            {
                if (!sync_status)
                {
                    break;
                }

                if (((int)deviceId == (int)before_me) ||
                    (((int)deviceId == DEVICE_ID) && lora_new_rety_req()))
                {
                    if (tasks_handle.read_sensor_handle != NULL)
                    {
                        tasks_handle.read_sensor_handle = NULL;
                    }

                    xTaskCreate(read_sensors_task, "read_sensor", 4096, NULL, 24, &tasks_handle.read_sensor_handle);

                    ESP_LOGI("RX_MODE", "Changing to Sensor read mode.... Requesting from %d", (int)deviceId);
                    vTaskDelete(NULL);
                }
                else if ((int)deviceId > DEVICE_ID)
                {
                    // max30102Sensor_shutdown();
                    ESP_LOGI("SENSOR_MODE", "Device data allocated time is over");
                    ESP_LOGI("SENSOR_MODE", "Going to deep sleep");
                    ESP_LOGI("SENSOR_MODE2", "my_position = %d, Allocated_time = %d, Time_Interval = %d", my_position, alloc_time, time_interval);
                    uint64_t sleep_us = (time_interval - alloc_time * (my_position + 1.5)) * 1000000;
                    int sleeping = sleep_us / 1000000;
                    ESP_LOGI("SENSOR_MODE", "Going to sleep for %d s", sleeping);
                    // Update NVS
                    nvs_handle_t sync_nvs;
                    esp_err_t err = nvs_open("sync_info", NVS_READWRITE, &sync_nvs);
                    if (err == ESP_OK)
                    {
                        err |= nvs_set_u8(sync_nvs, "sync_status", 0);

                        if (err == ESP_OK)
                        {
                            nvs_commit(sync_nvs);
                            ESP_LOGI("NVS", "Updated Sync status : false");
                        }
                        nvs_close(sync_nvs);
                    }
                    esp_sleep_enable_timer_wakeup(sleep_us);
                    vTaskDelay(pdMS_TO_TICKS(100)); // Wait 100ms
                    esp_deep_sleep_start();
                }
            }
            break;
            default:
                break;
            }
        }

        lora_receive();
        vTaskDelay(pdMS_TO_TICKS(10)); // Small delay to prevent CPU hogging
    }
}

void lora_send_task(void *pvParameters)
{
    ESP_LOGI("LORA_TX_MODE", "Preparing to send data....");
    char *msg = NULL;
    createJsonDoc(&msg);
    if (msg != NULL)
    {
        // Check LoRa packet size limit (e.g., 255 bytes)
        if (strlen(msg) <= 255)
        {
            lora_send_packet((uint8_t *)msg, strlen(msg));
            ESP_LOGI("LORA_TX_MODE", "Sent: %s (len=%d)", msg, strlen(msg));
        }
        else
        {
            ESP_LOGE("LORA_TX_MODE", "JSON too large!");
        }

        free(msg); // Free allocated memory!
    }
    else
    {
        ESP_LOGE("LORA", "JSON creation failed!");
    }

    // Provide some time to the RX station to reply
    vTaskDelay(pdMS_TO_TICKS(20));
    xTaskCreate(lora_receive_task, "lora_rx", 4096, NULL, 24, NULL);
    vTaskDelete(NULL);
}

void read_temp_task(void *pvParameter)
{
    // Initialize the temperature sensor
    ds18b20_init_sensor();
    ESP_LOGI("SENSOR_MODE", "Reading Temperature sensor");
    float temperature = 0;
    shared_data.temperature = 0;
    while (true)
    {
        if (ulTaskNotifyTake(pdTRUE, pdMS_TO_TICKS(100)))
        {
            // ESP_LOGI("SENSOR_MODE","Suspend from Temperature sensor");
            vTaskSuspend(NULL);
        }
        float temp;
        getTemperature(&temp);
        if (temp != temperature)
        {
            xSemaphoreTake(data_mutex, portMAX_DELAY);
            shared_data.temperature = temp;
            xSemaphoreGive(data_mutex);
            temperature = temp;
            // ESP_LOGI("SENSOR_MODE","Temperature: %0.2f ",temp);
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

void lora_peek_device_id(uint16_t *deviceId)
{
    uint32_t payload;
    lora_peek_header((uint8_t *)&payload, 3); // read the first 3 bytes without consuming
    *deviceId = (payload >> 8) & 0xFFFF;
    // *deviceId = (payload) & 0xFFFF;
}

bool lora_new_rety_req()
{
    uint32_t payload;
    uint8_t curr_retry;
    lora_peek_header((uint8_t *)&payload, 4);
    curr_retry = (payload >> 24) & 0xFF;
    if (curr_retry != prev_ack_retry)
    {
        prev_ack_retry = curr_retry;
        return true;
    }
    return false;
}

void app_main(void *pvParamaters)
{
    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    load_before_me(&before_me, &alloc_time, &time_interval, &my_position, &sync_status);
    ESP_LOGI("MAIN", "Retreiving Before me : %d", (int)before_me);

    // init_uart();
    data_mutex = xSemaphoreCreateMutex();
    if (data_mutex == NULL)
    {
        ESP_LOGE("MAIN", "Failed to create mutex!");
        return;
    }

    // Initialize Lora
    ESP_LOGI("LORA", "Initializing LoRa...");

    if (!lora_init())
    {
        ESP_LOGE("LORA", "Failed to initialize LoRa!");
        return;
    }
    lora_set_frequency(433E6); // Set frequency to 433 MHz (or 868E6 / 915E6 based on your module)
    lora_explicit_header_mode();
    lora_set_spreading_factor(7);
    lora_enable_crc();

    // xTaskCreate(read_temp_task, "ds18b20_task", 4096, NULL, 2, NULL);
    // xTaskCreate(read_heartrate_task, "HeartRate_Task", 4096, NULL, 2, NULL);
    // xTaskCreate(lora_send_task, "LoRa_Task", 4096, NULL, 1, NULL);
    xTaskCreate(lora_receive_task, "lora_rx", 4096, NULL, 24, NULL);
    // xTaskCreate(gps_task, "gps_task", 4096, NULL, 23, tasks_handle.gps_handle);

    ESP_LOGI("ESP32", "Tasks created, system running");
}

// Create Json Object
void createJsonDoc(char **jsonStr)
{
    // Read the sensor data
    ESP_LOGI("LORA_TX_MODE", "Preparing JSON Document...");

    // ESP_LOGI("LORA_TX_MODE", "Free stack: %u", uxTaskGetStackHighWaterMark(NULL));

    // ESP_LOGI("LORA_TX_MODE", "Mutex available: %d", uxSemaphoreGetCount(data_mutex));

    int id = DEVICE_ID;
    xSemaphoreTake(data_mutex, portMAX_DELAY);
    float temp = shared_data.temperature;
    int hr = shared_data.heart_rate;
    float lat = shared_data.lat;
    float lon = shared_data.lon;
    xSemaphoreGive(data_mutex);

    ESP_LOGI("LORA_TX_MODE", "Heart Rate: %d Temp: %0.2f", hr, temp);
    // Prepare Json Doc
    char temp_str[10], lat_str[10], lon_str[10], hr_str[10], dev_id[5];
    cJSON *doc = cJSON_CreateObject();

    // Format to 2 decimal places as strings
    snprintf(dev_id, sizeof(dev_id), "%d", id);
    snprintf(temp_str, sizeof(temp_str), "%.2f", temp);
    snprintf(hr_str, sizeof(hr_str), "%d", hr);
    snprintf(lat_str, sizeof(lat_str), "%.5f", lat);
    snprintf(lon_str, sizeof(lon_str), "%.5f", lon);

    // Add strings to JSON (not numbers)
    cJSON_AddStringToObject(doc, "i", dev_id);
    cJSON_AddStringToObject(doc, "t", temp_str);
    cJSON_AddStringToObject(doc, "h", hr_str);
    cJSON_AddStringToObject(doc, "la", lat_str);
    cJSON_AddStringToObject(doc, "lo", lon_str);

    // Compact Json
    *jsonStr = cJSON_PrintUnformatted(doc);

    // Clean up
    cJSON_Delete(doc);
}

void print_uint16_array(const uint16_t *arr, size_t len, const char *label)
{
    printf("%s: ", label);
    for (size_t i = 0; i < len; i++)
    {
        printf("%u ", arr[i]);
    }
    printf("\n");
}

// Mock sensor data (replace with actual sensor reads)
float readTemperature() { return 25.4; }
int readHeartRate() { return 72; }
void readGps(float *lat, float *lon)
{
    *lat = 7.25448;
    *lon = 80.59145;
}

void get_my_slot(uint8_t *sync_status_mask, int len, uint8_t *before_me, uint8_t *my_position)
{
    int current_device_id = 0;
    int prev_device_id = -1; // Sync device before me
    int position = 0;

    // Total collars
    int total_collars = 8 * len;

    for (size_t i = 0; i < total_collars; i++)
    {
        if (current_device_id == DEVICE_ID)
        {
            position++;
            break;
        }

        uint8_t byteMask = current_device_id / 8;
        uint8_t bitMask = current_device_id % 8;

        bool curr_dev_sync_status = ((sync_status_mask[byteMask] & (1 << bitMask)) != 0);

        if (curr_dev_sync_status)
        {
            position++;
            prev_device_id = current_device_id;
        }

        current_device_id++;
    }

    *before_me = (uint8_t)prev_device_id;
    *my_position = position;
}

void load_before_me(uint8_t *before_me, uint16_t *alloc_time, uint16_t *time_interval, uint8_t *my_position, bool *sync_status)
{
    nvs_handle_t sync_nvs;
    esp_err_t err = nvs_open("sync_info", NVS_READONLY, &sync_nvs);
    uint8_t flagRaw = 0;
    if (err == ESP_OK)
    {
        err |= nvs_get_u8(sync_nvs, "before_me", before_me);

        err |= nvs_get_u16(sync_nvs, "alloc_time", alloc_time);

        err |= nvs_get_u16(sync_nvs, "time_interval", time_interval);

        err |= nvs_get_u8(sync_nvs, "my_position", my_position);

        err |= nvs_get_u8(sync_nvs, "sync_status", &flagRaw);

        *sync_status = (flagRaw == 1); // retriving flag

        if (err == ESP_OK)
        {
            ESP_LOGI("NVS", "Restored before_me = %d, alloc_time = %d, time_interval = %d", *before_me, *alloc_time, *time_interval);
        }
        else if (err == ESP_ERR_NVS_NOT_FOUND)
        {
            ESP_LOGI("NVS", "before_me not yet stored");
            *before_me = 0xFF; // default/fallback value
        }
        else
        {
            ESP_LOGE("NVS", "Error reading before_me: %s", esp_err_to_name(err));
        }
        nvs_close(sync_nvs);
    }
    else
    {
        ESP_LOGE("NVS", "Failed to open NVS: %s", esp_err_to_name(err));
    }
}