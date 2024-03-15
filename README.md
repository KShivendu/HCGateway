# HealthMonitor
HealthMonitor stores Health Connect API on Android to InfluxDB for further [visualization with Grafana](https://www.kshivendu.dev/blog/quantified-self#health-dashboard)

The platform consists of two parts:
- A REST API/server
- A mobile application that pings the server periodically

## How it Works
- The mobile application pings the server every 2 hours to send data. The following data types are supported-
    - Basal Metabolic Rate (`basalMetabolicRate`)
    - Blood Glucose (`bloodGlucose`)
    - Blood Pressure (`bloodPressure`)
    - Body Fat (`bodyFat`)
    - Distance (`distance`)
    - Exercise (`exerciseSession`)
    - Heart Rate (`heartRate`)
    - Height (`height`)
    - Nutrition (`nutrition`)
    - Oxygen Saturation (`oxygenSaturation`)
    - Power (`power`)
    - Sleep (`sleepSession`)
    - Speed (`speed`)
    - Steps (`steps`)
    - Total Calories Burned (`totalCaloriesBurned`)
    - VO2 Max (`vo2Max`)
    - Weight (`weight`)

Support for more types is planned for the future.

- Each sync takes approximatly 15 minutes
- The server encrypts the data using Fernet encryption, then stores it in a database hosted on a custom instance of Appwrite.
- The server exposes an API to let developers login and get the data for their users.

The platform is currently a **one way sync**. Any changes made to health connect data by other apps will not be synced. The ability to add/edit/delete data through the api is planned for the future.

## Get Started
- You can install the mobile application through the APK file. You can find the latest APK file in the releases section of this repository, or by downloading the `app-release.apk` file from the root of this repository.
- The minimum requirement for the APK file is Android Oreo (8.0)
- Once you install the Android APK file, signup by entering a username and password
- Once you see a screen showing your user id, you have successfully signed up. Your data will sync in 2 hours. You can also force it to start now by going to Settings > Apps > HCGateway > Force Stop, then re-opening the app. This can be done for any time you want to force a sync.

## Self Hosting
You can self host the server and database. To do this, follow the steps below:
- You need Python 3 and NodeJS 16+ installed on your machine
- Install InfluxDB and make sure your instance is accessible from the machine running the server.
- Clone this repository
- `cd` into the api/ folder
- run `pip install -r requirements.txt`
- rename `.env.example` to `.env` and fill in the values
- run `python3 main.py` to start the server
- in another window/tab, `cd` into the app/ folder
- Change lines 104, 112, and 154 of `app/App.js` to point to your HCGateway server
- run `npm install`
- run `npm run android` to start the application, or follow the instructions at https://medium.com/geekculture/react-native-generate-apk-debug-and-release-apk-4e9981a2ea51 to build an APK file.

## Credits

The [original repo](https://github.com/CoolCoderSJ/HCGateway) was created by [shuchir.dev](shuchir.dev). I made lots of changes afterwards but I'm grateful that they gave me a starter point for this =)
