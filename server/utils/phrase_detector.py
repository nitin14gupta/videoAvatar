"""
Phrase boundary detector for optimizing TTS chunking
Detects natural phrase boundaries to trigger TTS earlier
"""
import re
from typing import List, Tuple


def detect_phrase_boundary(text: str, min_words: int = 3, max_words: int = 8) -> Tuple[bool, int]:
    """
    Detect if we've reached a natural phrase boundary
    
    Args:
        text: Text to check
        min_words: Minimum words before considering a boundary
        max_words: Maximum words before forcing a boundary
        
    Returns:
        Tuple of (is_boundary, boundary_position)
    """
    words = text.split()
    
    # If we have too many words, force a boundary
    if len(words) >= max_words:
        # Try to find a good break point
        # Look for punctuation or natural pauses
        for i in range(max_words - 1, min_words - 1, -1):
            # Check if there's punctuation before this word
            word_boundary = len(' '.join(words[:i]))
            # Look for punctuation near this boundary
            search_start = max(0, word_boundary - 10)
            search_text = text[search_start:word_boundary + 10]
            
            # Check for punctuation marks that indicate phrase boundaries
            if re.search(r'[.,;:!?]\s*$', search_text[:word_boundary - search_start]):
                return True, word_boundary + 1
    
    # Check for sentence-ending punctuation (strong boundary)
    sentence_end = max(
        text.rfind('.'),
        text.rfind('!'),
        text.rfind('?')
    )
    if sentence_end > 0 and len(text[:sentence_end].split()) >= min_words:
        return True, sentence_end + 1
    
    # Check for comma or semicolon (weaker boundary, but still good for TTS)
    comma_pos = text.rfind(',')
    semicolon_pos = text.rfind(';')
    colon_pos = text.rfind(':')
    
    # Use the latest punctuation mark
    pause_pos = max(comma_pos, semicolon_pos, colon_pos)
    if pause_pos > 0 and len(text[:pause_pos].split()) >= min_words:
        return True, pause_pos + 1
    
    # Check for natural word boundaries (after certain words that often end phrases)
    phrase_end_words = ['and', 'or', 'but', 'so', 'then', 'also', 'however', 'therefore']
    for i in range(len(words) - 1, min_words - 1, -1):
        if i < len(words) and words[i].lower() in phrase_end_words:
            boundary = len(' '.join(words[:i + 1]))
            if boundary > 0:
                return True, boundary
    
    # If we have enough words but no punctuation, use word boundary
    if len(words) >= min_words:
        # Find a good word boundary (prefer after 4-6 words)
        preferred_length = min(6, len(words))
        boundary = len(' '.join(words[:preferred_length]))
        return True, boundary
    
    return False, 0


def extract_phrase(text: str, min_words: int = 3, max_words: int = 8) -> Tuple[str, str]:
    """
    Extract the next phrase from text
    
    Args:
        text: Full text
        min_words: Minimum words in phrase
        max_words: Maximum words in phrase
        
    Returns:
        Tuple of (phrase, remaining_text)
    """
    if not text or not text.strip():
        return "", ""
    
    is_boundary, boundary_pos = detect_phrase_boundary(text, min_words, max_words)
    
    if is_boundary and boundary_pos > 0:
        phrase = text[:boundary_pos].strip()
        remaining = text[boundary_pos:].strip()
        # Ensure we have at least min_words
        if len(phrase.split()) >= min_words:
            return phrase, remaining
    
    # If no boundary found but text is long enough, take first max_words
    words = text.split()
    if len(words) >= min_words:
        phrase = ' '.join(words[:max_words])
        remaining = ' '.join(words[max_words:])
        return phrase, remaining
    
    # Not enough text yet
    return "", text

