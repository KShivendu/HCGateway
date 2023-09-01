from flask import Flask, abort, request, jsonify
from flask_cors import CORS
import os, json, requests
from dotenv import load_dotenv
from iso8601 import parse_date

load_dotenv()

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

token = "AgMz1OhmvJfGEjh-L93uCbye7Xvc-9O6mQxYSrgBAHMD6RiHQnVnV1FSYNHwosVUiJObPv8S204j88BY_H-eDQ=="
org = "Test"
INFLUXDB_URL = "http://localhost:8086"

BUCKET_PREFIX = "hcgateway"

client = InfluxDBClient(url=INFLUXDB_URL, token=token, org=org)
write_api = client.write_api(write_options=SYNCHRONOUS)
read_api = client.query_api()
buckets_api = client.buckets_api()

assert client.ping()

methods = [
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
]

for method in methods:
    bucket_name = BUCKET_PREFIX + "-" + method.lower()
    if buckets_api.find_bucket_by_name(bucket_name) is not None:
        continue

    buckets_api.create_bucket(bucket_name=bucket_name)

app = Flask(__name__)
CORS(app)


@app.get("/hello")
def hello():
    return jsonify({"message": "Hello world!"})


@app.route("/api/login", methods=["POST"])
def login():
    return jsonify({"sessid": "dummy-user"}), 201


@app.route("/api/sync/<method>", methods=["POST"])
def sync(method):
    method = method[0].lower() + method[1:]
    if not "userid" in request.json:
        return jsonify({"error": "no user id provided"}), 400
    if not method:
        return jsonify({"error": "no method provided"}), 400
    if not "data" in request.json:
        return jsonify({"error": "no data provided"}), 400

    userid = request.json["userid"]
    data = request.json["data"]
    bucket_name = BUCKET_PREFIX + "-" + method.lower()

    if type(data) != list:
        data = [data]

    for item in data:
        itemid = item["metadata"]["id"]
        dataObj = {}
        for k, v in item.items():
            if k not in ("metadata", "time", "startTime", "endTime"):
                dataObj[k] = v

        if "time" in item:
            starttime = item["time"]
            endtime = None
        else:
            starttime = item["startTime"]
            endtime = item["endTime"]

        metric = None
        if method == "speed":
            metric = dataObj["samples"][0]["speed"]["inMetersPerSecond"]
        elif method == "heartRate":
            metric = dataObj["samples"][0]["beatsPerMinute"]
        elif method == "distance":
            metric = dataObj["distance"]["inMeters"]
        elif method == "steps":
            metric = dataObj["count"]
        elif method == "totalCaloriesBurned":
            # This float might not be required. But i got error from influxdb
            # so adding it.
            metric = float(dataObj["energy"]["inKilocalories"])
        elif method == "sleepSession":
            # Need to find entries with stages
            _stages = dataObj["stages"] # []
            _notes = dataObj["notes"] # None
            _title = dataObj["title"] # None

            _duration = parse_date(endtime) - parse_date(starttime)
            metric = _duration.total_seconds()
        elif method == "basalMetabolicRate":
            metric = dataObj["basalMetabolicRate"]["inKilocaloriesPerDay"]
        elif method == "oxygenSaturation":
            metric = dataObj["percentage"]
        elif method == "weight":
            metric = dataObj["weight"]["inKilograms"]
        elif method == "height":
            metric = dataObj["height"]["inFeet"]
        elif method == "exerciseSession":
            _laps = dataObj["laps"] # []
            _exercise_route = dataObj["exerciseRoute"] # None
            _exercise_type = dataObj["exerciseType"] # None
            _title = dataObj["title"] # None
            _segments = dataObj["segments"] # []
            _notes = dataObj["notes"] # None

            duration = parse_date(endtime) - parse_date(starttime)
            metric = duration.total_seconds()
        elif method == "bodyFat":
            metric = dataObj["percentage"]
        else:
            logging.debug("Unknown method %s %s %s", method, "data", data)

        print("Syncing", method, "for", userid, "to bucket", bucket_name, "time", starttime, "value", metric)

        point = (
            Point(method)
            .tag("id", itemid)
            .tag("app", item["metadata"]["dataOrigin"])
            .tag("userid", userid)
            .field("starttime", starttime)
            .field("endtime", endtime)
            .field("metric", metric)
            .field("data", json.dumps(dataObj))
            .time(parse_date(starttime), WritePrecision.NS)
        )
        write_api.write(bucket_name, org, point)

    return jsonify({"message": "success"}), 201

import logging
logging.basicConfig(filename='error.log',level=logging.DEBUG)


app.run(
    host=os.environ.get("HOST", "0.0.0.0"),
    port=os.environ.get("PORT", 6644),
    debug=os.environ.get("DEBUG", False),
)
