package com.HCGateway;

import android.annotation.TargetApi;
import android.app.AppOpsManager;
import android.app.usage.EventStats;
import android.app.usage.NetworkStats;
import android.app.usage.NetworkStatsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageInfo;
import android.net.ConnectivityManager;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.os.RemoteException;
import android.util.Log;
import android.widget.ArrayAdapter;
import androidx.annotation.RequiresApi;

import java.util.Calendar;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.MapBuilder;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.lang.Long;

// Geolocation:
import android.Manifest;
import android.location.Location;
import androidx.core.app.ActivityCompat;
import com.facebook.react.bridge.Callback;


public class UsageStatsManagerModule extends ReactContextBaseJavaModule {
  public static final String NAME = "UsageStatsManager";
  private ReactApplicationContext reactContext;
  private NetworkStatsManager networkStatsManager;

  UsageStatsManagerModule(ReactApplicationContext context) {
    super(context);
    // if (context == null) {
    // throw new Exception("React Context is null");
    // }
    reactContext = context;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      networkStatsManager = (NetworkStatsManager) context.getSystemService(Context.NETWORK_STATS_SERVICE);
    }
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();
    constants.put("INTERVAL_WEEKLY", UsageStatsManager.INTERVAL_WEEKLY);
    constants.put("INTERVAL_MONTHLY", UsageStatsManager.INTERVAL_MONTHLY);
    constants.put("INTERVAL_YEARLY", UsageStatsManager.INTERVAL_YEARLY);
    constants.put("INTERVAL_DAILY", UsageStatsManager.INTERVAL_DAILY);
    constants.put("INTERVAL_BEST", UsageStatsManager.INTERVAL_BEST);
    constants.put("TYPE_WIFI", ConnectivityManager.TYPE_WIFI);
    constants.put("TYPE_MOBILE", ConnectivityManager.TYPE_MOBILE);
    constants.put("TYPE_MOBILE_AND_WIFI", Integer.MAX_VALUE);
    return constants;
  }

  private boolean packageExists(String packageName) {
    PackageManager packageManager = reactContext.getPackageManager();
    ApplicationInfo info = null;
    try {
      info = packageManager.getApplicationInfo(packageName, 0);
    } catch (PackageManager.NameNotFoundException e) {
      e.printStackTrace();
      return false;
    }
    return true;
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public void showUsageAccessSettings(String packageName) {
    Intent intent = new Intent(android.provider.Settings.ACTION_USAGE_ACCESS_SETTINGS);
    if (packageExists(packageName)) {
      intent.setData(Uri.fromParts("package", packageName, null));
    }
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    reactContext.startActivity(intent);
  }

  @ReactMethod
  public void queryUsageStats(int interval, double startTime, double endTime, Promise promise) {
    WritableMap result = new WritableNativeMap();
    UsageStatsManager usageStatsManager = (UsageStatsManager) getReactApplicationContext()
        .getSystemService(Context.USAGE_STATS_SERVICE);
    long time = System.currentTimeMillis();
    List<UsageStats> queryUsageStats = usageStatsManager.queryUsageStats(interval, (long) startTime, (long) endTime);

    if (queryUsageStats != null) {
      for (UsageStats us : queryUsageStats) {
        if (us.getTotalTimeInForeground() != 0) {
          Log.d("UsageStats", us.getPackageName() + " = " + us.getTotalTimeInForeground());
          WritableMap usageStats = new WritableNativeMap();
          usageStats.putString("packageName", us.getPackageName());
          double totalTimeInSeconds = us.getTotalTimeInForeground() / 1000.0;
          usageStats.putDouble("totalTimeInForeground", totalTimeInSeconds);
          usageStats.putDouble("firstTimeStamp", us.getFirstTimeStamp());
          usageStats.putDouble("lastTimeStamp", us.getLastTimeStamp());
          usageStats.putDouble("lastTimeUsed", us.getLastTimeUsed());
          usageStats.putInt("describeContents", us.describeContents());
          usageStats.putString("appName", getAppNameFromPackage(us.getPackageName(), getReactApplicationContext()));
          result.putMap(us.getPackageName(), usageStats);
        }
      }
    }
    promise.resolve(result);
  }

  @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP_MR1)
  @ReactMethod
  public void queryAndAggregateUsageStats(double startTime, double endTime, Promise promise) {
    WritableMap result = new WritableNativeMap();
    UsageStatsManager usageStatsManager = (UsageStatsManager) getReactApplicationContext()
        .getSystemService(Context.USAGE_STATS_SERVICE);

    Map<String, UsageStats> queryUsageStats = usageStatsManager.queryAndAggregateUsageStats(
        (long) startTime, (long) endTime);

    if (queryUsageStats != null) {
      for (UsageStats us : queryUsageStats.values()) {
        if (us.getTotalTimeInForeground() != 0) {
          WritableMap usageStats = new WritableNativeMap();
          usageStats.putString("packageName", us.getPackageName());
          double totalTimeInSeconds = us.getTotalTimeInForeground() / 1000.0;
          usageStats.putDouble("totalTimeInForeground", totalTimeInSeconds);
          usageStats.putDouble("firstTimeStamp", us.getFirstTimeStamp());
          usageStats.putDouble("lastTimeStamp", us.getLastTimeStamp());
          usageStats.putDouble("lastTimeUsed", us.getLastTimeUsed());
          usageStats.putInt("describeContents", us.describeContents());
          usageStats.putBoolean("isSystem", isSystemApp(us.getPackageName()));
          usageStats.putString("appName", getAppNameFromPackage(us.getPackageName(), getReactApplicationContext()));
          result.putMap(us.getPackageName(), usageStats);
        }
      }
    }

    promise.resolve(result);
  }

  @RequiresApi(api = Build.VERSION_CODES.P)
  @ReactMethod
  public void queryEvents(String startTimeStr, String endTimeStr, Promise promise) {

    Long startTime = Long.parseLong(startTimeStr);
    Long endTime = Long.parseLong(endTimeStr);

    // Should direcltly pass Long but it's not supported.
    // https://stackoverflow.com/questions/41173949/exception-in-nativemodules-java-lang-runtimeexception-got-unknown-argument-c
    WritableMap result = new WritableNativeMap();
    UsageStatsManager usageStatsManager = (UsageStatsManager) reactContext
        .getSystemService(Context.USAGE_STATS_SERVICE);

    UsageEvents queryUsageStats = usageStatsManager.queryEvents(startTime, endTime);
    UsageEvents.Event us = new UsageEvents.Event();

    if (queryUsageStats != null) {
      while (queryUsageStats.hasNextEvent()) {
        queryUsageStats.getNextEvent(us);
        Log.e("APP", us.getPackageName() + " " + us.getTimeStamp());
        WritableMap usageStats = new WritableNativeMap();
        usageStats.putString("packageName", us.getPackageName());
        // us.getTimeStamp() is a long, but we need a string
        usageStats.putString("timestamp", Long.toString(us.getTimeStamp()));
        result.putMap(us.getPackageName(), usageStats);
      }
    }
    promise.resolve(result);
  }

  @RequiresApi(Build.VERSION_CODES.P)
  @ReactMethod
  public void queryEventsStats(int interval, double startTime, double endTime, Promise promise) {

    WritableMap result = new WritableNativeMap();
    UsageStatsManager usageStatsManager = (UsageStatsManager) reactContext
        .getSystemService(Context.USAGE_STATS_SERVICE);

    List<EventStats> queryUsageStats = usageStatsManager.queryEventStats(interval, (long) startTime, (long) endTime);
    // UsageEvents.Event us = new UsageEvents.Event();

    if (queryUsageStats != null) {
      for (EventStats us : queryUsageStats) {
        int eventType = us.getEventType();
        String eventTypeAsStr = "" + eventType;
        WritableMap usageStats = new WritableNativeMap();
        usageStats.putDouble("firstTimeStamp", (double) us.getFirstTimeStamp());
        usageStats.putDouble("lastTimeStamp", (double) us.getLastTimeStamp());
        usageStats.putDouble("lastTimeUsed", (double) us.getTotalTime());
        usageStats.putInt("describeContents", us.describeContents());
        result.putMap(eventTypeAsStr, usageStats);
      }
    }

    promise.resolve(result);
  }

  private Boolean isSystemApp(String packageName) {
    Boolean isSys = false;
    try {
      PackageManager packageManager = reactContext.getPackageManager();
      ApplicationInfo appInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA);
      if (appInfo != null && appInfo.flags == ApplicationInfo.FLAG_SYSTEM) {
        isSys = true;
      }
      return isSys;
    } catch (PackageManager.NameNotFoundException e) {
      e.printStackTrace();
      return isSys;
    }
  }

  private String getAppNameFromPackage(String packageName, ReactApplicationContext context) {
    try {
      PackageManager packageManager = context.getPackageManager();
      PackageInfo packageInfo = packageManager.getPackageInfo(packageName, 0);
      String appName = packageInfo.applicationInfo.loadLabel(packageManager).toString();
      Log.e("App List", appName);
      return appName;
    } catch (PackageManager.NameNotFoundException e) {
      e.printStackTrace();
      return null; // Or return a default value, e.g., "Unknown"
    }
  }

  @ReactMethod
  public void checkForPermission(Promise promise) {
    AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
    int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(),
        reactContext.getPackageName());
    promise.resolve(mode == AppOpsManager.MODE_ALLOWED);
  }

  @TargetApi(Build.VERSION_CODES.M)
  private double getDataUsage(int networkType, String subscriberId, int packageUid, long startTime, long endTime) {
    double currentDataUsage = 0.0;
    if (networkStatsManager != null) {
      NetworkStats networkStatsByApp = null;
      try {
        networkStatsByApp = networkStatsManager.querySummary(networkType, subscriberId, startTime, endTime);
        do {
          NetworkStats.Bucket bucket = new NetworkStats.Bucket();
          networkStatsByApp.getNextBucket(bucket);
          if (bucket.getUid() == packageUid) {
            currentDataUsage += bucket.getRxBytes() + bucket.getTxBytes();
          }
        } while (networkStatsByApp.hasNextBucket());
      } catch (RemoteException e) {
        e.printStackTrace();
      }
    }
    return currentDataUsage;
  }

  @ReactMethod
  public void getAppDataUsage(String packageName, int networkType, double startTime, double endTime, Promise promise) {
    int uid = getAppUid(packageName);

    double mobileDataUsage = 0.0;
    double wifiDataUsage = 0.0;

    if (networkType == ConnectivityManager.TYPE_MOBILE) {
      mobileDataUsage = getDataUsage(ConnectivityManager.TYPE_MOBILE, null, uid, (long) startTime, (long) endTime);
    } else if (networkType == ConnectivityManager.TYPE_WIFI) {
      wifiDataUsage = getDataUsage(ConnectivityManager.TYPE_WIFI, "", uid, (long) startTime, (long) endTime);
    } else {
      mobileDataUsage = getDataUsage(ConnectivityManager.TYPE_MOBILE, "", uid, (long) startTime, (long) endTime);
      wifiDataUsage = getDataUsage(ConnectivityManager.TYPE_WIFI, "", uid, (long) startTime, (long) endTime);
    }

    double totalDataUsage = mobileDataUsage + wifiDataUsage;
    promise.resolve(totalDataUsage);
  }

  private int getAppUid(String packageName) {
    // get app uid
    PackageManager packageManager = reactContext.getPackageManager();
    ApplicationInfo info = null;
    try {
      info = packageManager.getApplicationInfo(packageName, 0);
    } catch (PackageManager.NameNotFoundException e) {
      e.printStackTrace();
    }
    int uid = 0;
    if (info != null) {
      uid = info.uid;
    }
    return uid;
  }

}
