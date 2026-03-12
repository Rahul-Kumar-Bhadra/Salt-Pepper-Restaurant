import os
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

# Initialize Flask app
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Database Configuration
basedir = os.path.abspath(os.path.dirname(__name__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'instance', 'restaurant.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'subject': self.subject,
            'message': self.message,
            'created_at': self.created_at.isoformat()
        }

class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    time = db.Column(db.String(10), nullable=False)
    guests = db.Column(db.Integer, nullable=False)
    special_requests = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'date': self.date,
            'time': self.time,
            'guests': self.guests,
            'special_requests': self.special_requests,
            'created_at': self.created_at.isoformat()
        }

# Create tables if they don't exist
with app.app_context():
    os.makedirs('instance', exist_ok=True)
    db.create_all()

# Routes to serve frontend files
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# API Routes
@app.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.json
    
    if not all(k in data for k in ('name', 'email', 'subject', 'message')):
        return jsonify({'error': 'Missing required fields'}), 400
        
    try:
        new_message = ContactMessage(
            name=data['name'],
            email=data['email'],
            subject=data['subject'],
            message=data['message']
        )
        db.session.add(new_message)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Message sent successfully!', 'data': new_message.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/reserve', methods=['POST'])
def submit_reservation():
    data = request.json
    
    required_fields = ('name', 'email', 'phone', 'date', 'time', 'guests')
    if not all(k in data for k in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
        
    try:
        new_reservation = Reservation(
            name=data['name'],
            email=data['email'],
            phone=data['phone'],
            date=data['date'],
            time=data['time'],
            guests=int(data['guests']),
            special_requests=data.get('special_requests', '')
        )
        db.session.add(new_reservation)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Reservation confirmed!', 'data': new_reservation.to_dict()}), 201
    except ValueError:
         return jsonify({'error': 'Invalid guest number'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/data', methods=['GET'])
def get_admin_data():
    try:
        reservations = Reservation.query.order_by(Reservation.created_at.desc()).all()
        messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'reservations': [r.to_dict() for r in reservations],
            'messages': [m.to_dict() for m in messages]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
