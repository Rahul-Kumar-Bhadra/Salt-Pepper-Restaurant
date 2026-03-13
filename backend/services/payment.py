import razorpay
import os

key_id = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
key_secret = os.environ.get('RAZORPAY_KEY_SECRET', 'placeholder_secret')

try:
    client = razorpay.Client(auth=(key_id, key_secret))
except:
    client = None

def create_razorpay_order(amount, receipt_id):
    if not client:
        return {'error': 'Razorpay not configured'}
    
    data = {
        'amount': int(amount * 100), # Amount in paise
        'currency': 'INR',
        'receipt': str(receipt_id),
        'payment_capture': 1
    }
    try:
        razorpay_order = client.order.create(data=data)
        return razorpay_order
    except Exception as e:
        return {'error': str(e)}

def verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    if not client:
        return False
        
    params_dict = {
        'razorpay_order_id': razorpay_order_id,
        'razorpay_payment_id': razorpay_payment_id,
        'razorpay_signature': razorpay_signature
    }
    try:
        client.utility.verify_payment_signature(params_dict)
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
