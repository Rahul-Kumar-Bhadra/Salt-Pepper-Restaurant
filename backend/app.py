import os
import sys

# Ensure the backend directory is in the Python path for Vercel
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from database.db_setup import init_db

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-super-secret-key-123')
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database', 'restaurant.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
init_db(app)

# Import and register blueprints
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.public import public_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(public_bp, url_prefix='/api/public')

# Serve Frontend static files
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# Serve Admin static files
@app.route('/admin')
def admin_index():
    return send_from_directory('../admin', 'admin.html')

@app.route('/admin/<path:path>')
def serve_admin_static(path):
    return send_from_directory('../admin', path)

if __name__ == '__main__':
    # Ensure database folder exists
    os.makedirs(os.path.join(basedir, 'database'), exist_ok=True)
    app.run(debug=True, port=5000)
