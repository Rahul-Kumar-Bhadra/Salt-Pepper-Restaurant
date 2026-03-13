from flask import Blueprint, request, jsonify
from models import db, MenuItem, MenuCategory, ContactMessage, Reservation, Order, OrderItem, Customer

public_bp = Blueprint('public', __name__)

@public_bp.route('/menu', methods=['GET'])
def get_menu():
    categories = MenuCategory.query.all()
    menu_data = []
    
    for category in categories:
        items = MenuItem.query.filter_by(category_id=category.id, is_available=True).all()
        if items:
            menu_data.append({
                'category_id': category.id,
                'category_name': category.name,
                'description': category.description,
                'items': [item.to_dict() for item in items]
            })
            
    return jsonify({'success': True, 'menu': menu_data})

@public_bp.route('/contact', methods=['POST'])
def submit_contact():
    data = request.json
    try:
        new_msg = ContactMessage(
            name=data['name'],
            email=data['email'],
            subject=data['subject'],
            message=data['message']
        )
        db.session.add(new_msg)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Message sent successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@public_bp.route('/reserve', methods=['POST'])
def submit_reservation():
    data = request.json
    try:
        new_res = Reservation(
            name=data['name'],
            email=data['email'],
            phone=data['phone'],
            date=data['date'],
            time=data['time'],
            guests=int(data['guests']),
            special_requests=data.get('special_requests', '')
        )
        db.session.add(new_res)
        # Mock Notification Sent
        print(f"--- NOTIFICATION: Email and WhatsApp sent to Admin and {new_res.name} for Reservation ---")
        
        return jsonify({'success': True, 'message': 'Reservation confirmed!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@public_bp.route('/order', methods=['POST'])
def create_order():
    data = request.json
    try:
        # Create or find customer
        customer = Customer.query.filter_by(email=data['customer']['email']).first()
        if not customer:
            customer = Customer(
                name=data['customer']['name'],
                email=data['customer']['email'],
                phone=data['customer']['phone'],
                address=data['customer']['address']
            )
            db.session.add(customer)
            db.session.flush() # get customer id

        # Create Order
        new_order = Order(
            customer_id=customer.id,
            total_amount=float(data['total_amount']),
            payment_status='Unpaid' # Will be updated by razorpay webhook/verify
        )
        db.session.add(new_order)
        db.session.flush()

        # Add Order Items
        for item in data['items']:
            db.session.add(OrderItem(
                order_id=new_order.id,
                menu_item_id=item['menu_item_id'],
                quantity=item['quantity'],
                price_at_time_of_order=float(item['price'])
            ))

        db.session.commit()
        # Mock Notification Sent
        print(f"--- NOTIFICATION: Email and WhatsApp sent to Admin for New Order #{new_order.id} ---")

        return jsonify({'success': True, 'order_id': new_order.id, 'message': 'Order placed pending payment'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
