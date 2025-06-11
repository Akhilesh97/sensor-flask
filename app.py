from flask import Flask, render_template, request, jsonify
import os
import csv
from datetime import datetime

app = Flask(__name__)

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# Temporary storage
current_data = []

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/collect", methods=["POST"])
def collect():
    global current_data
    data = request.json
    print(f"Received data: {data}")  # 👈 ADD THIS
    if data:
        current_data.append(data)
        return jsonify({"status": "received"})
    return jsonify({"status": "no data"}), 400

@app.route("/stop", methods=["POST"])
def stop():
    global current_data
    if current_data:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"data/sensor_{timestamp}.csv"
        keys = current_data[0].keys()
        with open(filename, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(current_data)
        current_data = []  # Clear for next session
        return jsonify({"status": "saved", "filename": filename})
    return jsonify({"status": "no data to save"}), 400

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))  # 5000 for local testing
    app.run(host="0.0.0.0", port=port)