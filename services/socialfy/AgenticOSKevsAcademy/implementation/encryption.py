#!/usr/bin/env python3
"""
🔐 ENCRYPTION MODULE
====================
Secure encryption/decryption for sensitive data using Fernet (AES-128-CBC).

Used for:
- Instagram session IDs
- API keys
- Any sensitive credential

Security:
- Uses Fernet symmetric encryption (cryptography library)
- Key from ENCRYPTION_KEY environment variable
- Base64-encoded ciphertext for safe storage

Usage:
    from encryption import encrypt_value, decrypt_value, get_encryption_service
    
    # Simple usage
    encrypted = encrypt_value("my_secret_session_id")
    decrypted = decrypt_value(encrypted)
    
    # With service instance
    service = get_encryption_service()
    encrypted = service.encrypt("my_secret")
    decrypted = service.decrypt(encrypted)
"""

import os
import base64
import logging
from typing import Optional
from datetime import datetime

# Try to import cryptography, provide helpful error if not installed
try:
    from cryptography.fernet import Fernet, InvalidToken
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    CRYPTOGRAPHY_AVAILABLE = False
    Fernet = None
    InvalidToken = Exception
    PBKDF2HMAC = None
    hashes = None

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class EncryptionError(Exception):
    """Base exception for encryption errors"""
    pass


class KeyNotConfiguredError(EncryptionError):
    """Raised when ENCRYPTION_KEY is not set"""
    pass


class DecryptionError(EncryptionError):
    """Raised when decryption fails (wrong key or corrupted data)"""
    pass


class EncryptionService:
    """
    Secure encryption service using Fernet (AES-128-CBC + HMAC).
    
    Features:
    - Automatic key derivation from password
    - Fallback to direct Fernet key if properly formatted
    - Timestamps in encrypted data (auto-handled by Fernet)
    """
    
    # Salt for PBKDF2 key derivation (static for consistency)
    # In production, consider using a unique salt per tenant stored separately
    SALT = b'AgenticOS_Instagram_Sessions_v1'
    
    def __init__(self, encryption_key: str = None):
        """
        Initialize encryption service.
        
        Args:
            encryption_key: Encryption key/password. If not provided, uses ENCRYPTION_KEY env var.
        """
        if not CRYPTOGRAPHY_AVAILABLE:
            raise ImportError(
                "cryptography library not installed. "
                "Install with: pip install cryptography"
            )
        
        self.key_source = encryption_key or os.getenv("ENCRYPTION_KEY")
        
        if not self.key_source:
            raise KeyNotConfiguredError(
                "ENCRYPTION_KEY not configured. "
                "Set ENCRYPTION_KEY environment variable or pass encryption_key parameter. "
                "Generate a key with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        
        self.fernet = self._create_fernet()
        logger.info("EncryptionService initialized")
    
    def _create_fernet(self) -> Fernet:
        """Create Fernet instance from key source."""
        key_bytes = self.key_source.encode() if isinstance(self.key_source, str) else self.key_source
        
        # Check if it's already a valid Fernet key (44 chars, base64)
        if len(key_bytes) == 44:
            try:
                # Try to use directly as Fernet key
                return Fernet(key_bytes)
            except Exception:
                pass
        
        # Derive key from password using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.SALT,
            iterations=480000,  # OWASP recommended minimum
        )
        
        derived_key = base64.urlsafe_b64encode(kdf.derive(key_bytes))
        return Fernet(derived_key)
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a string value.
        
        Args:
            plaintext: The string to encrypt
            
        Returns:
            Base64-encoded encrypted string (safe for database storage)
        """
        if not plaintext:
            raise EncryptionError("Cannot encrypt empty value")
        
        try:
            plaintext_bytes = plaintext.encode('utf-8')
            encrypted_bytes = self.fernet.encrypt(plaintext_bytes)
            return encrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise EncryptionError(f"Encryption failed: {e}")
    
    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt an encrypted string.
        
        Args:
            ciphertext: The encrypted string (from encrypt())
            
        Returns:
            Original plaintext string
            
        Raises:
            DecryptionError: If decryption fails (wrong key or corrupted data)
        """
        if not ciphertext:
            raise DecryptionError("Cannot decrypt empty value")
        
        try:
            ciphertext_bytes = ciphertext.encode('utf-8')
            decrypted_bytes = self.fernet.decrypt(ciphertext_bytes)
            return decrypted_bytes.decode('utf-8')
        except InvalidToken:
            logger.error("Decryption failed: Invalid token (wrong key or corrupted data)")
            raise DecryptionError(
                "Decryption failed: Invalid token. "
                "This usually means the ENCRYPTION_KEY has changed or the data is corrupted."
            )
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise DecryptionError(f"Decryption failed: {e}")
    
    def rotate_key(self, new_key: str) -> 'EncryptionService':
        """
        Create a new EncryptionService with a different key.
        Useful for key rotation scenarios.
        
        Args:
            new_key: The new encryption key
            
        Returns:
            New EncryptionService instance with the new key
        """
        return EncryptionService(encryption_key=new_key)
    
    def can_decrypt(self, ciphertext: str) -> bool:
        """
        Check if a ciphertext can be decrypted with current key.
        Useful for validating data or detecting key mismatch.
        
        Args:
            ciphertext: The encrypted string to test
            
        Returns:
            True if decryption succeeds, False otherwise
        """
        try:
            self.decrypt(ciphertext)
            return True
        except:
            return False
    
    def get_encryption_timestamp(self, ciphertext: str) -> Optional[datetime]:
        """
        Extract the timestamp from Fernet-encrypted data.
        Fernet includes a timestamp in every encrypted message.
        
        Args:
            ciphertext: The encrypted string
            
        Returns:
            datetime when the data was encrypted, or None if extraction fails
        """
        try:
            ciphertext_bytes = ciphertext.encode('utf-8')
            # Fernet token format: version (1) + timestamp (8) + iv (16) + ciphertext + tag
            decoded = base64.urlsafe_b64decode(ciphertext_bytes)
            if len(decoded) < 9:
                return None
            
            # Timestamp is bytes 1-9 (big-endian unsigned long long)
            import struct
            timestamp = struct.unpack('>Q', decoded[1:9])[0]
            return datetime.fromtimestamp(timestamp)
        except:
            return None


# ============================================
# SINGLETON & CONVENIENCE FUNCTIONS
# ============================================

_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """
    Get the singleton EncryptionService instance.
    Creates one if it doesn't exist.
    
    Returns:
        EncryptionService instance
        
    Raises:
        KeyNotConfiguredError: If ENCRYPTION_KEY is not set
    """
    global _encryption_service
    
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    
    return _encryption_service


def encrypt_value(plaintext: str) -> str:
    """
    Convenience function to encrypt a value.
    
    Args:
        plaintext: String to encrypt
        
    Returns:
        Encrypted string
    """
    return get_encryption_service().encrypt(plaintext)


def decrypt_value(ciphertext: str) -> str:
    """
    Convenience function to decrypt a value.
    
    Args:
        ciphertext: Encrypted string
        
    Returns:
        Decrypted plaintext string
    """
    return get_encryption_service().decrypt(ciphertext)


def is_encryption_configured() -> bool:
    """
    Check if encryption is properly configured.
    
    Returns:
        True if ENCRYPTION_KEY is set and cryptography is available
    """
    if not CRYPTOGRAPHY_AVAILABLE:
        return False
    
    if not os.getenv("ENCRYPTION_KEY"):
        return False
    
    return True


def generate_encryption_key() -> str:
    """
    Generate a new Fernet encryption key.
    
    Returns:
        Base64-encoded Fernet key (44 characters)
    """
    if not CRYPTOGRAPHY_AVAILABLE:
        raise ImportError("cryptography library not installed")
    
    return Fernet.generate_key().decode()


# ============================================
# CLI
# ============================================

def main():
    """CLI for testing encryption"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Encryption utility for AgenticOS")
    parser.add_argument("action", choices=["generate-key", "encrypt", "decrypt", "test"])
    parser.add_argument("--value", "-v", help="Value to encrypt/decrypt")
    parser.add_argument("--key", "-k", help="Encryption key (overrides ENCRYPTION_KEY env)")
    
    args = parser.parse_args()
    
    if args.action == "generate-key":
        print("\n🔑 Generated Fernet Key:")
        print("-" * 50)
        print(generate_encryption_key())
        print("-" * 50)
        print("\nAdd this to your .env file:")
        print(f"ENCRYPTION_KEY={generate_encryption_key()}")
        return
    
    if args.action == "encrypt":
        if not args.value:
            print("❌ Error: --value is required for encrypt")
            return
        
        try:
            service = EncryptionService(encryption_key=args.key) if args.key else get_encryption_service()
            encrypted = service.encrypt(args.value)
            print(f"\n🔐 Encrypted value:")
            print("-" * 50)
            print(encrypted)
            print("-" * 50)
        except Exception as e:
            print(f"❌ Error: {e}")
        return
    
    if args.action == "decrypt":
        if not args.value:
            print("❌ Error: --value is required for decrypt")
            return
        
        try:
            service = EncryptionService(encryption_key=args.key) if args.key else get_encryption_service()
            decrypted = service.decrypt(args.value)
            print(f"\n🔓 Decrypted value:")
            print("-" * 50)
            print(decrypted)
            print("-" * 50)
        except Exception as e:
            print(f"❌ Error: {e}")
        return
    
    if args.action == "test":
        print("\n🧪 Testing encryption service...")
        print("-" * 50)
        
        # Check configuration
        if not is_encryption_configured():
            print("❌ Encryption not configured!")
            print("   Set ENCRYPTION_KEY environment variable")
            return
        
        print("✅ Encryption is configured")
        
        # Test encrypt/decrypt
        test_value = "test_session_id_12345"
        try:
            service = get_encryption_service()
            encrypted = service.encrypt(test_value)
            decrypted = service.decrypt(encrypted)
            
            print(f"✅ Encryption works!")
            print(f"   Original:  {test_value}")
            print(f"   Encrypted: {encrypted[:50]}...")
            print(f"   Decrypted: {decrypted}")
            print(f"   Match: {test_value == decrypted}")
            
            # Check timestamp
            ts = service.get_encryption_timestamp(encrypted)
            if ts:
                print(f"   Encrypted at: {ts}")
                
        except Exception as e:
            print(f"❌ Test failed: {e}")
        
        print("-" * 50)


if __name__ == "__main__":
    main()
