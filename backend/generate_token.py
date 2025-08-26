# generate_token.py
import secrets

# This generates a 32-byte (256-bit) cryptographically secure random string in hexadecimal format.
# It's the perfect length and security for a JWT secret key.
print(secrets.token_hex(32))