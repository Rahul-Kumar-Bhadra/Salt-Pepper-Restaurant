from flask import Blueprint, request, jsonify
from models import db, MenuItem, MenuCategory, Order, Reservation, ContactMessage
from routes.auth import token_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard-stats', methods=['GET'])
@token_required
def get_stats(current_user):
    total_orders = Order.query.count()
    total_reservations = Reservation.query.count()
    total_revenue = db.session.query(db.func.sum(Order.total_amount)).filter(Order.payment_status=='Paid').scalar() or 0.0
    pending_orders = Order.query.filter_by(status='Pending').count()
    
    return jsonify({
        'total_orders': total_orders,
        'total_reservations': total_reservations,
        'total_revenue': total_revenue,
        'pending_orders': pending_orders
    })

# Menu Management
@admin_bp.route('/menu', methods=['POST'])
@token_required
def add_menu_item(current_user):
    data = request.json
    try:
        new_item = MenuItem(
            category_id=data['category_id'],
            name=data['name'],
            description=data.get('description', ''),
            price=float(data['price']),
            image_url=data.get('image_url', ''),
            is_veg=data.get('is_veg', False),
            is_available=data.get('is_available', True)
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify({'success': True, 'item': new_item.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@admin_bp.route('/menu/<int:item_id>', methods=['PUT', 'DELETE'])
@token_required
def manage_menu_item(current_user, item_id):
    item = MenuItem.query.get_or_404(item_id)
    
    if request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Item deleted'})
        
    if request.method == 'PUT':
        data = request.json
        item.name = data.get('name', item.name)
        item.category_id = data.get('category_id', item.category_id)
        item.description = data.get('description', item.description)
        item.price = float(data.get('price', item.price))
        item.image_url = data.get('image_url', item.image_url)
        item.is_veg = data.get('is_veg', item.is_veg)
        item.is_available = data.get('is_available', item.is_available)
        
        db.session.commit()
        return jsonify({'success': True, 'item': item.to_dict()})

# Orders Management
@admin_bp.route('/orders', methods=['GET'])
@token_required
def get_orders(current_user):
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])

@admin_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
@token_required
def update_order_status(current_user, order_id):
    order = Order.query.get_or_404(order_id)
    data = request.json
    status = data.get('status')
    if status in ['Pending', 'Preparing', 'Out for Delivery', 'Completed']:
        order.status = status
        db.session.commit()
        return jsonify({'success': True, 'order': order.to_dict()})
    return jsonify({'error': 'Invalid status'}), 400

# Reservations Management
@admin_bp.route('/reservations', methods=['GET'])
@token_required
def get_reservations(current_user):
    reservations = Reservation.query.order_by(Reservation.date.desc(), Reservation.time.desc()).all()
    return jsonify([r.to_dict() for r in reservations])

# Messages Management
@admin_bp.route('/messages', methods=['GET'])
@token_required
def get_messages(current_user):
    messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify([m.to_dict() for m in messages])
