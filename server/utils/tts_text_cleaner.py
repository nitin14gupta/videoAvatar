"""
Text cleaning utility for TTS (Text-to-Speech)
Removes markdown, code blocks, and formats text to be TTS-friendly
"""
import re
from typing import Optional


def clean_text_for_tts(text: str) -> str:
    """
    Clean and format text to be suitable for TTS generation.
    
    Removes:
    - Markdown formatting (**, __, `, etc.)
    - Code blocks
    - URLs (replaces with "link" or similar)
    - Excessive whitespace
    - Special characters that don't make sense in speech
    
    Converts:
    - Numbers to spoken form where appropriate
    - Multiple spaces to single space
    - Multiple punctuation to single
    
    Args:
        text: Raw text from LLM
        
    Returns:
        Cleaned text suitable for TTS
    """
    if not text or not text.strip():
        return ""
    
    cleaned = text.strip()
    
    # Remove markdown code blocks (```code```)
    cleaned = re.sub(r'```[\s\S]*?```', '', cleaned)
    
    # Remove inline code (`code`)
    cleaned = re.sub(r'`([^`]+)`', r'\1', cleaned)
    
    # Remove markdown bold/italic (**text**, __text__, *text*)
    cleaned = re.sub(r'\*\*([^\*]+)\*\*', r'\1', cleaned)
    cleaned = re.sub(r'__([^_]+)__', r'\1', cleaned)
    cleaned = re.sub(r'\*([^\*]+)\*', r'\1', cleaned)
    cleaned = re.sub(r'_([^_]+)_', r'\1', cleaned)
    
    # Remove markdown headers (# Header)
    cleaned = re.sub(r'^#{1,6}\s+', '', cleaned, flags=re.MULTILINE)
    
    # Remove markdown links but keep the text [text](url) -> text
    cleaned = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', cleaned)
    
    # Remove URLs (http://, https://, www.)
    cleaned = re.sub(r'https?://[^\s]+', 'link', cleaned)
    cleaned = re.sub(r'www\.[^\s]+', 'link', cleaned)
    
    # Remove email addresses
    cleaned = re.sub(r'\S+@\S+\.\S+', 'email address', cleaned)
    
    # Remove excessive punctuation (keep only one)
    cleaned = re.sub(r'[!]{2,}', '!', cleaned)
    cleaned = re.sub(r'[?]{2,}', '?', cleaned)
    cleaned = re.sub(r'[.]{3,}', '...', cleaned)
    cleaned = re.sub(r'[,]{2,}', ',', cleaned)
    
    # Remove special characters that don't make sense in speech
    # Keep: . , ! ? : ; - ' " ( ) [ ] { }
    # Remove: @ # $ % ^ & * | \ / < > ~ ` = +
    cleaned = re.sub(r'[@#$%^&*|\\/<>~`=+]+', ' ', cleaned)
    
    # Normalize whitespace (multiple spaces/tabs/newlines to single space)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    # Remove leading/trailing punctuation from words (but keep sentence punctuation)
    # This handles cases like "word." or "word," at the end of phrases
    # We want to keep sentence-ending punctuation
    
    # Clean up common TTS issues
    # Remove standalone punctuation marks (except at end of text)
    cleaned = re.sub(r'\s+([.,;:!?])\s+', r'\1 ', cleaned)
    
    # Ensure proper spacing around punctuation
    cleaned = re.sub(r'([.,;:!?])([^\s])', r'\1 \2', cleaned)
    cleaned = re.sub(r'([^\s])([.,;:!?])', r'\1\2', cleaned)
    
    # Remove empty parentheses or brackets
    cleaned = re.sub(r'[\(\[\{]\s*[\)\]\}]', '', cleaned)
    
    # Remove content in parentheses if it's just symbols/numbers (like "(1)", "(2)")
    cleaned = re.sub(r'\([0-9\s]+\)', '', cleaned)
    
    # Normalize quotes
    cleaned = cleaned.replace('"', '"').replace('"', '"')
    cleaned = cleaned.replace("'", "'").replace("'", "'")
    
    # Remove excessive dashes (keep single dash for hyphenation)
    cleaned = re.sub(r'[-]{2,}', ' ', cleaned)
    
    # Final whitespace normalization
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = cleaned.strip()
    
    # Remove text that's only punctuation or whitespace
    if not cleaned or cleaned.strip() in ['.', ',', '!', '?', ';', ':']:
        return ""
    
    # Ensure text ends with proper punctuation if it's a complete thought
    # (but don't add if it already has punctuation)
    if cleaned and cleaned[-1] not in ['.', '!', '?', ',', ';', ':']:
        # Only add period if it looks like a complete sentence (has multiple words)
        if len(cleaned.split()) > 3:
            cleaned += '.'
    
    return cleaned


def is_tts_worthy(text: str, min_length: int = 3) -> bool:
    """
    Check if text is suitable for TTS generation.
    
    Args:
        text: Text to check
        min_length: Minimum word count
        
    Returns:
        True if text is suitable for TTS
    """
    if not text or not text.strip():
        return False
    
    cleaned = clean_text_for_tts(text)
    
    # Check minimum word count
    words = cleaned.split()
    if len(words) < min_length:
        return False
    
    # Check if it's mostly punctuation or special characters
    alpha_chars = sum(1 for c in cleaned if c.isalpha())
    if len(cleaned) > 0 and alpha_chars / len(cleaned) < 0.3:
        return False
    
    return True


def clean_and_validate_phrase(text: str, min_words: int = 3) -> Optional[str]:
    """
    Clean text and validate it's suitable for TTS.
    Returns None if text is not TTS-worthy.
    
    Args:
        text: Raw text phrase
        min_words: Minimum word count
        
    Returns:
        Cleaned text or None if not suitable
    """
    if not text or not text.strip():
        return None
    
    cleaned = clean_text_for_tts(text)
    
    if not is_tts_worthy(cleaned, min_words):
        return None
    
    return cleaned

