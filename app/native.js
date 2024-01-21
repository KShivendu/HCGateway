
import { NativeModules } from 'react-native';

const LINKING_ERROR = 'Something went wrong while loading native modules';

const UsageStatsManager = NativeModules.UsageStatsManager
    ? NativeModules.UsageStatsManager
    : new Proxy(
        {},
        {
            get() {

                throw new Error(LINKING_ERROR);
            },
        }
    );

const LocationModule = NativeModules.Location
    ? NativeModules.Location
    : new Proxy(
        {},
        {
            get() {

                throw new Error(LINKING_ERROR);
            },
        }
    );


export function queryEvents(startTime, endTime) {
    // const sample = {
    //   "android": { "packageName": "android", "timestamp": "1693596028673" },
    //   "com.HCGateway": { "packageName": "com.HCGateway", "timestamp": "1693597430800" },
    //   "com.a0soft.gphone.uninstaller": { "packageName": "com.a0soft.gphone.uninstaller", "timestamp": "1693597407472" },
    //   "com.android.launcher": { "packageName": "com.android.launcher", "timestamp": "1693597414611" },
    //   "com.android.settings": { "packageName": "com.android.settings", "timestamp": "1693596419327" },
    //   "com.android.systemui": { "packageName": "com.android.systemui", "timestamp": "1693596031384" },
    //   "com.life360.android.safetymapd": { "packageName": "com.life360.android.safetymapd", "timestamp": "1693597406312" },
    // };
    return UsageStatsManager.queryEvents(`${startTime}`, `${endTime}`);
}

export function queryEventsStats(interval, startTime, endTime) {
    return UsageStatsManager.queryEventsStats(interval, startTime, endTime);
}

export function queryUsageStats(interval, startTime, endTime) {
    return UsageStatsManager.queryUsageStats(interval, startTime, endTime);
}

export function queryAndAggregateUsageStats(startTime, endTime) {
    return UsageStatsManager.queryAndAggregateUsageStats(startTime, endTime);
}

export function getAppDataUsage(packageName, networkType, startTime, endTime) {
    return UsageStatsManager.getAppDataUsage(
        packageName,
        networkType,
        startTime,
        endTime,
    );
}

export const EventFrequency = {
    INTERVAL_DAILY: 0,
    INTERVAL_WEEKLY: 1,
    INTERVAL_MONTHLY: 2,
    INTERVAL_YEARLY: 3,
    INTERVAL_BEST: 4,
    INTERVAL_COUNT: 4,
};

export function checkForPermission() {
    return UsageStatsManager.checkForPermission();
}

export function showUsageAccessSettings(packageName) {
    return UsageStatsManager.showUsageAccessSettings(packageName);
}

export function getConstants() {
    return UsageStatsManager.getConstants();
}

export function getCurrentPosition() {
    return LocationModule.getCurrentPosition({});
}

export function openGpsSettings() {
    return LocationModule.openGpsSettings();
}
