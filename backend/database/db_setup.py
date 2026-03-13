from models import db, AdminUser, MenuCategory, MenuItem
from werkzeug.security import generate_password_hash

def init_db(app):
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        
        # Create default admin user if it doesn't exist
        admin = AdminUser.query.filter_by(username='admin').first()
        if not admin:
            hashed_pw = generate_password_hash('admin123')
            new_admin = AdminUser(username='admin', password_hash=hashed_pw)
            db.session.add(new_admin)
            
        # Create default menu categories if they don't exist
        if not MenuCategory.query.first():
            categories = ['Starters', 'Main Course', 'Rice & Noodles', 'Desserts', 'Beverages']
            for cat_name in categories:
                db.session.add(MenuCategory(name=cat_name))
                
        db.session.commit()
