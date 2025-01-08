from flask import Flask, render_template

app = Flask(__name__)
# this is a flask app just to serve the index.html for dev 
@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
