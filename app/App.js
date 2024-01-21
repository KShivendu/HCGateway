import React from "react";
import { StyleSheet, ToastAndroid } from "react-native";
import {
  ApplicationProvider,
  Button,
  Icon,
  IconRegistry,
  Layout,
  Text,
  Input,
  Modal,
  Card,
} from "@ui-kitten/components";
import { EvaIconsPack } from "@ui-kitten/eva-icons";
import * as eva from "@eva-design/eva";
import {
  initialize,
  requestPermission,
  readRecords,
  readRecord,
  getSdkStatus,
  SdkAvailabilityStatus,
} from "react-native-health-connect";
import axios from "axios";
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import AsyncStorage from "@react-native-async-storage/async-storage";


import { queryEvents, checkForPermission, showUsageAccessSettings, getAppDataUsage, getCurrentPosition, openGpsSettings } from './native.js';

// import { queryEvents, checkForPermission, showUsageAccessSettings } from "@brighthustle/react-native-usage-stats-manager";

ReactNativeForegroundService.register();

// const LOCAL_GATEWAY_URL = 'http://192.168.193.227:6644';
const LOCAL_GATEWAY_URL = 'http://192.168.29.248:6644';
const GET_LAST_N_DAYS = 30;

const GET_LAST_N_HOURS = 0.1; // 0.1; // 6m //30 * 24; // 0.5;
const SYNC_EVERY_N_HOURS = 0.02; // 0.02; // 1m // 0.25; // Sync every 15 minutes

const setObj = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.log(e);
  }
};
const setPlain = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.log(e);
  }
};
const get = async key => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
  } catch (e) {
    console.log(e);
  }
};
const delkey = async (key, value) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log(e);
  }
};
const getAll = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys;
  } catch (error) {
    console.error(error);
  };
};

const askForPermission = () => {
  getSdkStatus().then(status => {
    console.log("status", status);
    console.log(
      SdkAvailabilityStatus.SDK_AVAILABLE,
      SdkAvailabilityStatus.SDK_UNAVAILABLE,
      SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED,
    );
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
      console.log("SDK is available");
    }

    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
      console.log("SDK is not available");
    }

    if (
      status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
    ) {
      console.log("SDK is not available, provider update required");
    }
  });

  initialize().then(isInitialized => {
    console.log("isInitialized", isInitialized);
    requestPermission([
      { accessType: "read", recordType: "BasalMetabolicRate" },
      { accessType: "read", recordType: "BloodGlucose" },
      { accessType: "read", recordType: "BloodPressure" },
      { accessType: "read", recordType: "BodyFat" },
      { accessType: "read", recordType: "Distance" },
      { accessType: "read", recordType: "ExerciseSession" },
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "Height" },
      { accessType: "read", recordType: "Nutrition" },
      { accessType: "read", recordType: "OxygenSaturation" },
      { accessType: "read", recordType: "Power" },
      { accessType: "read", recordType: "SleepSession" },
      { accessType: "read", recordType: "Speed" },
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "TotalCaloriesBurned" },
      { accessType: "read", recordType: "Weight" },
      { accessType: "read", recordType: "Vo2Max" },
    ]).then(grantedPermissions => {
      console.log("grantedPermissions", grantedPermissions);
    });
  });
};

const RecordTypes = [
  "BasalMetabolicRate",
  "BloodGlucose",
  "BloodPressure",
  "BodyFat",
  "Distance",
  "ExerciseSession",
  "HeartRate",
  "Height",
  "Nutrition",
  "OxygenSaturation",
  "Power",
  "SleepSession",
  "Speed",
  "Steps",
  "TotalCaloriesBurned",
  "Weight",
  "Vo2Max",
];

// Cross check if HeartRate, Steps, and SleepSession are batched
const BatchedRecordTypes = ['SleepSession', 'Speed', 'HeartRate', 'Steps', 'SleepSession'];

const pushEventsToServer = async (events) => {

  // const gatewayUrl = await get('gatewayUrl');
  const userid = await get('session');

  const UrlToPush = `${LOCAL_GATEWAY_URL}/api/sync/androidEvent`;

  console.log("Pushing usage events to", UrlToPush);

  console.log("Looping through usage events");

  Object.keys(events).forEach(pkgName => {
    const event = events[pkgName];

    console.log('Setting timeout for', event);
    setTimeout(() => {
      console.log('Pushing event:', event);
      const startTimestamp = new Date(parseInt(event.timestamp)).toISOString();
      const endTimestamp = new Date(parseInt(event.timestamp) + 1000).toISOString();

      axios.post(UrlToPush, {
        userid: userid,
        data: {
          metadata: {
            id: startTimestamp,
            dataOrigin: 'android.usage.events',
          },
          package: event.packageName,
          startTime: startTimestamp,
          endTime: endTimestamp, // dummy value
        },
      });
    }, 1000);
  });
}

const pushLocationToServer = async () => {

  // const gatewayUrl = await get('gatewayUrl');
  const userid = await get('session');

  const UrlToPush = `${LOCAL_GATEWAY_URL}/api/sync/androidLocation`;

  console.log("Pushing location to", UrlToPush);

  const location = await getCurrentPosition();

  console.log("Pushing location", location);

  axios.post(UrlToPush, {
    userid: userid,
    data: {
      metadata: {
        id: location.time,
        dataOrigin: 'android.location',
      },
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      bearing: location.bearing,
      provider: location.provider,
      speed: location.speed,
      timestamp: location.time,
    },
  }).then(res => {
    console.log("Pushed location", res);
  }).catch(err => {
    console.log("Error pushing location", err);
  });
}

const syncUsageData = async () => {

  // console.log("Syncing usage data", UsageStatsManager);

  checkForPermission().then((res) => {
    if (!res) {
      showUsageAccessSettings('');
    }
  });

  const startTimeMs = new Date().getTime() - GET_LAST_N_HOURS * 60 * 60 * 1000;
  const endTimeMs = new Date().getTime();

  // Android isn't giving me permission to access location data in background.
  // So this completely blocks the tracking. Hence commented for now.
  // will figure out a solution
  // await openGpsSettings();
  // console.log("Querying loc data");
  // const location = await getCurrentPosition();
  // console.log("Location", location);
  //
  // await pushLocationToServer(location);
  // const events = await queryEvents(startTimeMs, endTimeMs);
  // const youtubePkgName = 'com.google.android.youtube';
  // const dataUsage = await getAppDataUsage(youtubePkgName, 0, startTimeMs, endTimeMs);
  // console.log('Queried data:', dataUsage);

  // await pushEventsToServer(events);

  // res is a dictionary like { "<appName>": {"package": "<appName>", "timestamp": "<timestamp>" }, "..." }
  // Push it to /api/sync/android-events

}

const syncData = async (lastNHours) => {
  // ToastAndroid.show('Syncing data', ToastAndroid.SHORT);
  console.log('a');

  // const lastSynced = await get(`lastSynced-{}`);
  // console.log(`Last synced on ${lastSynced}`);

  await syncUsageData();

  get('gatewayUrl').then(url => {
    get('session').then(userid => {
      console.log(userid, url);

      initialize().then(isInitialized => {
        console.log("isInitialized", isInitialized);
        RecordTypes.forEach(async recordType => {
          const recordLastSynced = await get(`lastSynced-${recordType}`);
          console.log(`Last synced on ${recordLastSynced}`);

          let startTime = recordLastSynced
            ? recordLastSynced
            : String(
              new Date(
                // new Date().setDate(new Date().getDate() - GET_LAST_N_DAYS),
                new Date() * 1 - (lastNHours ?? GET_LAST_N_HOURS) * 60 * 60 * 1000,
              ).toISOString()
            );

          let currentLastSynced = new Date();

          readRecords(recordType, {
            timeRangeFilter: {
              operator: "between",
              startTime: startTime,
              endTime: String(new Date().toISOString()),
            },
          }).then(records => {
            console.log(recordType, records.length, '\n\n');
            if (records.length > 0) {
              ToastAndroid.show(`Syncing ${records.length} ${recordType} entries`, ToastAndroid.SHORT);
            }
            if (BatchedRecordTypes.includes(recordType)) {
              for (let i = 0; i < records.length; i++) {
                setTimeout(
                  () =>
                    readRecord(recordType, records[i].metadata.id).then(
                      result => {
                        // console.log('Retrieved record: ', result );
                        axios.post(
                          `${LOCAL_GATEWAY_URL}/api/sync/${recordType}`,
                          {
                            userid: userid,
                            data: result,
                          },
                        );
                      },
                    ),
                  i * 500,
                );
              }
            } else {
              setTimeout(
                () =>
                  axios.post(`${LOCAL_GATEWAY_URL}/api/sync/${recordType}`, {
                    userid: userid,
                    data: records,
                  }),
                1000,
              );
            }
          });

          // setPlain(`lastSynced-${recordType}`, currentLastSynced);
        });
      });
    });
  });
};

ReactNativeForegroundService.add_task(async () => await syncData(), {
  delay: SYNC_EVERY_N_HOURS * 60 * 60 * 1000,
  onLoop: true,
  taskId: 'hccloudsync',
  onError: e => console.log('Error logging:', e),
});

ReactNativeForegroundService.start({
  id: 1244,
  title: 'Sync Service',
  message: 'HCGateway is syncing Health Connect to the cloud.',
  setOnlyAlertOnce: true,
  color: '#000000',
});

let userLoggedIn = false;
let session = null;
let visible = false;
let modalText = "";

export default App = () => {
  const [gatewayUrl, setGatewayUrl] = React.useState(LOCAL_GATEWAY_URL);
  const [pushDuration, setPushDuration] = React.useState(1);
  const [uname, setUname] = React.useState("");
  const [passw, setPassw] = React.useState("");
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  get('session').then(res => {
    if (res) { userLoggedIn = true; }
    session = res;
    forceUpdate();
  });

  const login = (gatewayUrl, uname, passw) => {
    axios
      .post(`${gatewayUrl}/api/login`, {
        username: uname,
        password: passw,
      })
      .then(res => {
        if ('sessid' in res.data) {
          console.log(res.data.sessid);
          AsyncStorage.setItem('session', res.data.sessid).then(() => {
            userLoggedIn = true;
            session = res.data.sessid;
            forceUpdate();
            askForPermission();
          });
          AsyncStorage.setItem('gatewayUrl', gatewayUrl).then(() => {
            console.log(`Configured gateway URL: ${gatewayUrl}`);
          });
        } else {
          modalText = res.data.error;
          visibile = true;
          forceUpdate();
        }
      })
      .catch(err => {
        console.log(err.response.data);
        modalText = err.response.data.error;
        visible = true;
        forceUpdate();
      });
  };

  return (
    <>
      <ApplicationProvider {...eva} theme={eva.dark}>
        <Layout style={styles.container}>
          <Modal
            visible={visible}
            backdropStyle={styles.backdrop}
            onBackdropPress={() => {
              visible = false;
              forceUpdate();
            }}>
            <Card disabled={true}>
              <Text>{modalText}</Text>
              <Button
                onPress={() => {
                  visible = false;
                  forceUpdate();
                }}
                style={styles.margin}>
                DISMISS
              </Button>
            </Card>
          </Modal>

          {!userLoggedIn ? (
            <Layout style={styles.container}>
              <Text style={styles.text} category="h1">
                Welcome to HCGateway
              </Text>
              <Text style={styles.text}>
                Please login or signup for an account. If you don't have an
                account, it will be created for you.
              </Text>
              <Input
                placeholder="Enter Gateway URL"
                value={gatewayUrl}
                onChangeText={nextValue => setGatewayUrl(nextValue)}
                style={styles.margin}
              />
              <Input
                placeholder="Enter a username"
                value={uname}
                onChangeText={nextValue => setUname(nextValue)}
                style={styles.margin}
              />
              <Input
                placeholder="Enter a password"
                value={passw}
                onChangeText={nextValue => setPassw(nextValue)}
                style={styles.margin}
              />
              <Button
                onPress={() => login(gatewayUrl, uname, passw)}
                style={styles.margin}>
                Login
              </Button>
            </Layout>
          ) : (
            <Layout style={styles.container}>
              <Text style={styles.text} category="h1">
                Welcome to HCGateway
              </Text>
              <Text>
                Your user ID is {session} and is at {gatewayUrl}. DO NOT share
                it with anyone. It will push data for last {GET_LAST_N_DAYS} days. It also pushes usage data.
                new code
              </Text>
              <Input
                placeholder="Push data of last N hours"
                value={pushDuration}
                onChangeText={nextValue => setPushDuration(nextValue)}
                style={styles.margin}
              />
              <Button
                onPress={() => syncData(pushDuration)}
                style={styles.margin}>
                Push!
              </Button>
            </Layout>
          )}
        </Layout>
      </ApplicationProvider>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 192,
    paddingHorizontal: 16,
  },
  text: {
    textAlign: "center",
    marginVertical: 16,
  },
  margin: {
    marginVertical: 4,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
